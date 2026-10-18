import { Client } from "pg";
import { UserContextProvider } from "./user-context-provider";
import { renderTemplate } from "./template-renderer";
import { AutomationEvaluator, ConditionRule, UserPreferencesConfig } from "./automation-evaluator";
import { WebPushService } from "@/lib/push/web-push-service";

export interface AutomationRunSummary {
  runId: string;
  ruleId: string;
  ruleName: string;
  triggerType: string;
  status: "completed" | "failed" | "partial";
  eligibleRecipients: number;
  processedCount: number;
  inAppSentCount: number;
  pushSentCount: number;
  skippedCount: number;
  failedCount: number;
  errors: Array<{ userId?: string; error: string }>;
  startedAt: string;
  completedAt: string;
}

export interface PreviewRecipientsResult {
  ruleId: string;
  ruleName: string;
  totalEligible: number;
  samples: Array<{
    userId: string;
    name: string;
    email: string;
    renderedTitle: string;
    renderedBody: string;
    actionUrl: string | null;
  }>;
}

export class AutomationEngine {
  private static getDatabaseClient(): InstanceType<typeof Client> | null {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return null;
    return new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
    });
  }

  /**
   * Previews eligible recipients and rendered notification content for a rule without sending.
   */
  static async previewRecipients(ruleId: string, limit = 5): Promise<PreviewRecipientsResult> {
    const client = this.getDatabaseClient();
    if (!client) throw new Error("Database connection not configured");

    try {
      await client.connect();

      // Fetch rule and template
      const ruleSql = `
        SELECT 
          r.id, r.name, r.target_audience, r.conditions, r.trigger_type, r.trigger_config,
          t.id AS template_id, t.title_template, t.body_template, t.action_url
        FROM public.notification_automation_rules r
        JOIN public.notification_templates t ON t.id = r.template_id
        WHERE r.id = $1
      `;
      const ruleRes = await client.query(ruleSql, [ruleId]);
      if (ruleRes.rows.length === 0) {
        throw new Error("Không tìm thấy quy tắc tự động");
      }
      const rule = ruleRes.rows[0];

      // Fetch all candidate user IDs
      const usersRes = await client.query("SELECT id FROM public.profiles LIMIT 200");
      const userIds = usersRes.rows.map((r: { id: string }) => r.id);

      // Get batch user contexts
      const contextsMap = await UserContextProvider.getUserContextsBatch(userIds);

      // Fetch user preferences
      const prefSql = "SELECT * FROM public.notification_user_preferences WHERE user_id = ANY($1::uuid[])";
      const prefRes = await client.query(prefSql, [userIds]);
      const prefMap = new Map<string, UserPreferencesConfig>();
      for (const p of prefRes.rows) {
        prefMap.set(p.user_id, p);
      }

      const conditions: ConditionRule[] = Array.isArray(rule.conditions) ? rule.conditions : [];
      const samples: PreviewRecipientsResult["samples"] = [];
      let totalEligible = 0;

      for (const [uId, ctx] of contextsMap.entries()) {
        const pref = prefMap.get(uId);

        // Preference check
        if (!AutomationEvaluator.isAllowedByPreferences(rule.trigger_type, rule.name, pref)) {
          continue;
        }

        // Audience check
        if (!AutomationEvaluator.matchesAudience(ctx, rule.target_audience)) {
          continue;
        }

        // Conditions check
        if (!AutomationEvaluator.evaluateConditions(ctx, conditions)) {
          continue;
        }

        totalEligible++;

        if (samples.length < limit) {
          const rendered = renderTemplate(
            {
              title: rule.title_template,
              body: rule.body_template,
              action_url: rule.action_url,
            },
            (ctx as unknown) as Record<string, unknown>
          );

          samples.push({
            userId: uId,
            name: ctx.name,
            email: ctx.email,
            renderedTitle: rendered.title,
            renderedBody: rendered.body,
            actionUrl: rendered.actionUrl,
          });
        }
      }

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        totalEligible,
        samples,
      };
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  /**
   * Executes an automation rule: evaluates recipients, personalizes templates,
   * enforces idempotency and cooldown, and dispatches via In-app and Web Push.
   */
  static async executeRule(
    ruleId: string,
    options?: { forceUserIds?: string[]; dryRun?: boolean }
  ): Promise<AutomationRunSummary> {
    const startedAt = new Date().toISOString();
    const client = this.getDatabaseClient();
    if (!client) throw new Error("Database connection not configured");

    try {
      await client.connect();

      // 1. Fetch Rule & Associated Template
      const ruleSql = `
        SELECT 
          r.id, r.template_id, r.name, r.description, r.trigger_type, r.trigger_config,
          r.target_audience, r.conditions, r.cooldown_hours, r.max_per_user_per_day, r.is_active,
          t.title_template, t.body_template, t.type, t.delivery_channels, t.priority, t.action_url
        FROM public.notification_automation_rules r
        JOIN public.notification_templates t ON t.id = r.template_id
        WHERE r.id = $1
      `;
      const ruleRes = await client.query(ruleSql, [ruleId]);
      if (ruleRes.rows.length === 0) {
        throw new Error("Không tìm thấy quy tắc tự động");
      }
      const rule = ruleRes.rows[0];

      // 2. Insert Run Record into notification_automation_runs
      let runId = "dry-run-" + Date.now();
      if (!options?.dryRun) {
        const runInsert = await client.query(
          `INSERT INTO public.notification_automation_runs 
           (rule_id, trigger_type, status, started_at) 
           VALUES ($1, $2, 'running', $3) 
           RETURNING id`,
          [rule.id, rule.trigger_type, startedAt]
        );
        runId = runInsert.rows[0].id;
      }

      // 3. Determine candidate user IDs
      let candidateIds: string[] = [];
      if (options?.forceUserIds && options.forceUserIds.length > 0) {
        candidateIds = options.forceUserIds;
      } else {
        const userRows = await client.query("SELECT id FROM public.profiles");
        candidateIds = userRows.rows.map((r: { id: string }) => r.id);
      }

      // 4. Batch query contexts & preferences
      const contextsMap = await UserContextProvider.getUserContextsBatch(candidateIds);
      const prefRows = await client.query(
        "SELECT * FROM public.notification_user_preferences WHERE user_id = ANY($1::uuid[])",
        [candidateIds]
      );
      const prefMap = new Map<string, UserPreferencesConfig>();
      for (const p of prefRows.rows) {
        prefMap.set(p.user_id, p);
      }

      // 5. Evaluate and Dispatch
      const conditions: ConditionRule[] = Array.isArray(rule.conditions) ? rule.conditions : [];
      const cooldownHours = Number(rule.cooldown_hours) || 24;

      let eligibleCount = 0;
      let inAppSent = 0;
      let pushSent = 0;
      let skippedCount = 0;
      let failedCount = 0;
      const errors: Array<{ userId?: string; error: string }> = [];

      const now = new Date();
      // Date key formatted as YYYY-MM-DD
      const dateKey = now.toISOString().split("T")[0];

      for (const [uId, ctx] of contextsMap.entries()) {
        const pref = prefMap.get(uId);

        // Check user preferences toggle
        if (!AutomationEvaluator.isAllowedByPreferences(rule.trigger_type, rule.name, pref)) {
          skippedCount++;
          continue;
        }

        // Check quiet hours
        if (AutomationEvaluator.isQuietHours(pref, now)) {
          skippedCount++;
          continue;
        }

        // Check audience
        if (!AutomationEvaluator.matchesAudience(ctx, rule.target_audience)) {
          continue;
        }

        // Check conditions
        if (!AutomationEvaluator.evaluateConditions(ctx, conditions)) {
          continue;
        }

        eligibleCount++;

        // Idempotency Key computation
        // Format: rule_{ruleId}_user_{userId}_time_{bucket}
        // Bucket is based on cooldownHours (or daily dateKey if >= 24h)
        const timeBucket =
          cooldownHours >= 24
            ? dateKey
            : Math.floor(now.getTime() / (cooldownHours * 3600 * 1000));
        const idempotencyKey = `rule_${rule.id}_user_${uId}_b_${timeBucket}`;

        // Check cooldown / existing delivery in database
        const logCheck = await client.query(
          "SELECT id FROM public.notification_delivery_logs WHERE idempotency_key = $1 LIMIT 1",
          [idempotencyKey]
        );
        if (logCheck.rows.length > 0) {
          skippedCount++;
          continue;
        }

        // Render template with user context
        const renderResult = renderTemplate(
          {
            title: rule.title_template,
            body: rule.body_template,
            action_url: rule.action_url,
          },
          (ctx as unknown) as Record<string, unknown>
        );

        if (!renderResult.success) {
          failedCount++;
          errors.push({
            userId: uId,
            error: `Thiếu biến dữ liệu: ${renderResult.missingVariables.join(", ")}`,
          });
          continue;
        }

        if (options?.dryRun) {
          inAppSent++;
          continue;
        }

        // Real Dispatch
        let inAppStatus: "sent" | "failed" | "none" = "none";
        let pushStatus: "sent" | "failed" | "none" | "expired" = "none";
        let deliveryError: string | null = null;

        // 1. In-App Dispatch
        if (rule.delivery_channels === "in_app" || rule.delivery_channels === "both") {
          try {
            await client.query(
              `INSERT INTO public.user_in_app_notifications 
               (user_id, template_id, rule_id, title, content, summary, type, priority, action_url) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [
                uId,
                rule.template_id,
                rule.id,
                renderResult.title,
                renderResult.body,
                renderResult.body.slice(0, 150),
                rule.type || "info",
                rule.priority || "normal",
                renderResult.actionUrl || "/notifications",
              ]
            );
            inAppStatus = "sent";
            inAppSent++;
          } catch (err: unknown) {
            inAppStatus = "failed";
            const errMsg = err instanceof Error ? err.message : String(err);
            deliveryError = `In-app failed: ${errMsg}`;
          }
        }

        // 2. Web Push Dispatch
        if (rule.delivery_channels === "push" || rule.delivery_channels === "both") {
          try {
            const subsRes = await client.query(
              "SELECT * FROM public.push_subscriptions WHERE user_id = $1 AND is_active = true",
              [uId]
            );

            if (subsRes.rows.length > 0) {
              const payloadStr = WebPushService.preparePayload({
                id: rule.id,
                title: renderResult.title,
                body: renderResult.body,
                url: renderResult.actionUrl || "/notifications",
                priority: rule.priority,
              });

              let pushAnyAccepted = false;
              for (const sub of subsRes.rows) {
                const pResult = await WebPushService.sendToSubscription(
                  sub,
                  payloadStr,
                  rule.priority
                );
                if (pResult.status === "accepted") {
                  pushAnyAccepted = true;
                } else if (pResult.status === "expired") {
                  pushStatus = "expired";
                }
              }

              if (pushAnyAccepted) {
                pushStatus = "sent";
                pushSent++;
              } else if (pushStatus !== "expired") {
                pushStatus = "failed";
              }
            } else {
              pushStatus = "none"; // No active push subscription for user
            }
          } catch (err: unknown) {
            pushStatus = "failed";
            const errMsg = err instanceof Error ? err.message : String(err);
            deliveryError = deliveryError
              ? `${deliveryError}; Push failed: ${errMsg}`
              : `Push failed: ${errMsg}`;
          }
        }

        // 3. Record in notification_delivery_logs for idempotency & audit trail
        try {
          await client.query(
            `INSERT INTO public.notification_delivery_logs 
             (run_id, rule_id, template_id, user_id, idempotency_key, channel, in_app_status, push_status, rendered_title, rendered_body, variables_snapshot, error_message)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              runId,
              rule.id,
              rule.template_id,
              uId,
              idempotencyKey,
              rule.delivery_channels,
              inAppStatus,
              pushStatus,
              renderResult.title,
              renderResult.body,
              JSON.stringify(renderResult.resolvedVariables),
              deliveryError,
            ]
          );
        } catch (logErr: unknown) {
          console.error("Failed to write delivery log:", logErr);
        }
      }

      const completedAt = new Date().toISOString();
      const runStatus =
        failedCount > 0 && inAppSent + pushSent > 0
          ? "partial"
          : failedCount > 0 && inAppSent + pushSent === 0
          ? "failed"
          : "completed";

      // Update Run Record & Rule Statistics
      if (!options?.dryRun) {
        await client.query(
          `UPDATE public.notification_automation_runs 
           SET status = $1, eligible_recipients = $2, processed_count = $3, 
               in_app_sent_count = $4, push_sent_count = $5, skipped_count = $6, 
               failed_count = $7, error_details = $8, completed_at = $9 
           WHERE id = $10`,
          [
            runStatus,
            eligibleCount,
            eligibleCount,
            inAppSent,
            pushSent,
            skippedCount,
            failedCount,
            JSON.stringify(errors.slice(0, 50)),
            completedAt,
            runId,
          ]
        );

        await client.query(
          `UPDATE public.notification_automation_rules 
           SET total_runs = total_runs + 1,
               total_sent = total_sent + $1,
               total_failed = total_failed + $2,
               last_run_at = $3,
               updated_at = now()
           WHERE id = $4`,
          [inAppSent + pushSent, failedCount, completedAt, rule.id]
        );
      }

      return {
        runId,
        ruleId: rule.id,
        ruleName: rule.name,
        triggerType: rule.trigger_type,
        status: runStatus,
        eligibleRecipients: eligibleCount,
        processedCount: eligibleCount,
        inAppSentCount: inAppSent,
        pushSentCount: pushSent,
        skippedCount,
        failedCount,
        errors,
        startedAt,
        completedAt,
      };
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  /**
   * Sends a targeted test notification of a template to a single specific user (Admin or tester).
   * Safe for validation: Never broadcasts or sends to other users.
   */
  static async sendTestNotification(
    templateId: string,
    targetUserId: string,
    channel: "in_app" | "push" | "both" = "in_app"
  ): Promise<{ ok: boolean; inAppSent: boolean; pushSent: boolean; error?: string }> {
    const client = this.getDatabaseClient();
    if (!client) return { ok: false, inAppSent: false, pushSent: false, error: "Database not configured" };

    try {
      await client.connect();

      // Fetch template
      const tRes = await client.query("SELECT * FROM public.notification_templates WHERE id = $1", [
        templateId,
      ]);
      if (tRes.rows.length === 0) {
        return { ok: false, inAppSent: false, pushSent: false, error: "Không tìm thấy mẫu thông báo" };
      }
      const template = tRes.rows[0];

      // Fetch target user context
      const userContext = await UserContextProvider.getUserContext(targetUserId);
      if (!userContext) {
        return { ok: false, inAppSent: false, pushSent: false, error: "Không thể lấy thông tin người dùng thử nghiệm" };
      }

      // Render
      const rendered = renderTemplate(
        {
          title: `[TEST] ${template.title_template}`,
          body: template.body_template,
          action_url: template.action_url,
        },
        (userContext as unknown) as Record<string, unknown>
      );

      if (!rendered.success) {
        return {
          ok: false,
          inAppSent: false,
          pushSent: false,
          error: `Thiếu biến dữ liệu: ${rendered.missingVariables.join(", ")}`,
        };
      }

      let inAppSent = false;
      let pushSent = false;

      // 1. In-App
      if (channel === "in_app" || channel === "both") {
        await client.query(
          `INSERT INTO public.user_in_app_notifications 
           (user_id, template_id, title, content, summary, type, priority, action_url) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            targetUserId,
            template.id,
            rendered.title,
            rendered.body,
            rendered.body.slice(0, 150),
            template.type || "info",
            template.priority || "normal",
            rendered.actionUrl || "/notifications",
          ]
        );
        inAppSent = true;
      }

      // 2. Web Push
      if (channel === "push" || channel === "both") {
        const subsRes = await client.query(
          "SELECT * FROM public.push_subscriptions WHERE user_id = $1 AND is_active = true",
          [targetUserId]
        );

        if (subsRes.rows.length > 0) {
          const payloadStr = WebPushService.preparePayload({
            id: template.id,
            title: rendered.title,
            body: rendered.body,
            url: rendered.actionUrl || "/notifications",
            priority: template.priority,
          });

          for (const sub of subsRes.rows) {
            const pResult = await WebPushService.sendToSubscription(sub, payloadStr, template.priority);
            if (pResult.status === "accepted") {
              pushSent = true;
            }
          }
        }
      }

      return {
        ok: true,
        inAppSent,
        pushSent,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return { ok: false, inAppSent: false, pushSent: false, error: errMsg };
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  /**
   * Runs all currently active automation rules whose schedule or triggers are met.
   * Can be triggered by background cron or API endpoint.
   */
  static async runAllActiveRules(): Promise<AutomationRunSummary[]> {
    const client = this.getDatabaseClient();
    if (!client) return [];

    try {
      await client.connect();

      const rulesRes = await client.query(
        "SELECT id FROM public.notification_automation_rules WHERE is_active = true"
      );

      const summaries: AutomationRunSummary[] = [];
      for (const row of rulesRes.rows) {
        try {
          const summary = await this.executeRule(row.id);
          summaries.push(summary);
        } catch (err) {
          console.error(`Error running rule ${row.id}:`, err);
        }
      }

      return summaries;
    } finally {
      await client.end().catch(() => undefined);
    }
  }
}
