import { Client } from "pg";
import { Database } from "@/types/database";

export type NotificationTemplateRow = Database["public"]["Tables"]["notification_templates"]["Row"];
export type NotificationAutomationRuleRow = Database["public"]["Tables"]["notification_automation_rules"]["Row"];
export type NotificationAutomationRunRow = Database["public"]["Tables"]["notification_automation_runs"]["Row"];
export type NotificationDeliveryLogRow = Database["public"]["Tables"]["notification_delivery_logs"]["Row"];

export interface CreateTemplateInput {
  name: string;
  description?: string | null;
  title_template: string;
  body_template: string;
  type?: "info" | "warning" | "success" | "broadcast";
  delivery_channels?: "in_app" | "push" | "both";
  priority?: "low" | "normal" | "high" | "urgent";
  action_url?: string | null;
  status?: "draft" | "active" | "paused" | "archived";
  variables_used?: string[];
  created_by?: string | null;
}

export interface CreateRuleInput {
  template_id: string;
  name: string;
  description?: string | null;
  trigger_type: "scheduled" | "activity" | "inactivity" | "custom_condition";
  trigger_config?: Record<string, unknown>;
  target_audience?: "all" | "learners" | "has_due_reviews" | "inactive" | "goal_not_completed" | "custom";
  conditions?: Array<{ field: string; operator: string; value: unknown }>;
  cooldown_hours?: number;
  max_per_user_per_day?: number;
  is_active?: boolean;
  created_by?: string | null;
}

export interface AutomationDashboardStats {
  totalTemplates: number;
  activeTemplates: number;
  totalRules: number;
  activeRules: number;
  totalSent: number;
  totalFailed: number;
  lastRunAt: string | null;
  totalSubscribers: number;
}

export class NotificationTemplateRepository {
  private static getClient(): InstanceType<typeof Client> | null {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) return null;
    return new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
    });
  }

  // ==========================================
  // TEMPLATES
  // ==========================================

  static async getTemplates(): Promise<NotificationTemplateRow[]> {
    const client = this.getClient();
    if (!client) return [];
    try {
      await client.connect();
      const res = await client.query(
        "SELECT * FROM public.notification_templates ORDER BY created_at DESC"
      );
      return res.rows;
    } catch (err) {
      console.error("[NotificationTemplateRepository.getTemplates] Error:", err);
      return [];
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  static async getTemplateById(id: string): Promise<NotificationTemplateRow | null> {
    const client = this.getClient();
    if (!client) return null;
    try {
      await client.connect();
      const res = await client.query(
        "SELECT * FROM public.notification_templates WHERE id = $1",
        [id]
      );
      return res.rows[0] || null;
    } catch (err) {
      console.error("[NotificationTemplateRepository.getTemplateById] Error:", err);
      return null;
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  static async createTemplate(input: CreateTemplateInput): Promise<NotificationTemplateRow> {
    const client = this.getClient();
    if (!client) throw new Error("Database not connected");
    try {
      await client.connect();
      const res = await client.query(
        `INSERT INTO public.notification_templates 
         (name, description, title_template, body_template, type, delivery_channels, priority, action_url, status, variables_used, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          input.name,
          input.description || null,
          input.title_template,
          input.body_template,
          input.type || "info",
          input.delivery_channels || "both",
          input.priority || "normal",
          input.action_url || "/notifications",
          input.status || "draft",
          input.variables_used || [],
          input.created_by || null,
        ]
      );
      return res.rows[0];
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  static async updateTemplate(
    id: string,
    updates: Partial<CreateTemplateInput>
  ): Promise<NotificationTemplateRow> {
    const client = this.getClient();
    if (!client) throw new Error("Database not connected");
    try {
      await client.connect();

      const fields: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      if (updates.name !== undefined) {
        fields.push(`name = $${idx++}`);
        values.push(updates.name);
      }
      if (updates.description !== undefined) {
        fields.push(`description = $${idx++}`);
        values.push(updates.description);
      }
      if (updates.title_template !== undefined) {
        fields.push(`title_template = $${idx++}`);
        values.push(updates.title_template);
      }
      if (updates.body_template !== undefined) {
        fields.push(`body_template = $${idx++}`);
        values.push(updates.body_template);
      }
      if (updates.type !== undefined) {
        fields.push(`type = $${idx++}`);
        values.push(updates.type);
      }
      if (updates.delivery_channels !== undefined) {
        fields.push(`delivery_channels = $${idx++}`);
        values.push(updates.delivery_channels);
      }
      if (updates.priority !== undefined) {
        fields.push(`priority = $${idx++}`);
        values.push(updates.priority);
      }
      if (updates.action_url !== undefined) {
        fields.push(`action_url = $${idx++}`);
        values.push(updates.action_url);
      }
      if (updates.status !== undefined) {
        fields.push(`status = $${idx++}`);
        values.push(updates.status);
      }
      if (updates.variables_used !== undefined) {
        fields.push(`variables_used = $${idx++}`);
        values.push(updates.variables_used);
      }

      fields.push(`updated_at = now()`);
      values.push(id);

      const sql = `UPDATE public.notification_templates SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`;
      const res = await client.query(sql, values);
      return res.rows[0];
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  static async deleteTemplate(id: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;
    try {
      await client.connect();
      await client.query("DELETE FROM public.notification_templates WHERE id = $1", [id]);
      return true;
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  static async duplicateTemplate(id: string): Promise<NotificationTemplateRow> {
    const original = await this.getTemplateById(id);
    if (!original) throw new Error("Template not found");

    return this.createTemplate({
      name: `${original.name} (Bản sao)`,
      description: original.description,
      title_template: original.title_template,
      body_template: original.body_template,
      type: original.type,
      delivery_channels: original.delivery_channels,
      priority: original.priority,
      action_url: original.action_url,
      status: "draft",
      variables_used: original.variables_used,
      created_by: original.created_by,
    });
  }

  // ==========================================
  // AUTOMATION RULES
  // ==========================================

  static async getRules(): Promise<
    Array<NotificationAutomationRuleRow & { template_name?: string; template_title?: string }>
  > {
    const client = this.getClient();
    if (!client) return [];
    try {
      await client.connect();
      const sql = `
        SELECT r.*, t.name AS template_name, t.title_template AS template_title
        FROM public.notification_automation_rules r
        LEFT JOIN public.notification_templates t ON t.id = r.template_id
        ORDER BY r.created_at DESC
      `;
      const res = await client.query(sql);
      return res.rows;
    } catch (err) {
      console.error("[NotificationTemplateRepository.getRules] Error:", err);
      return [];
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  static async getRuleById(id: string): Promise<NotificationAutomationRuleRow | null> {
    const client = this.getClient();
    if (!client) return null;
    try {
      await client.connect();
      const res = await client.query(
        "SELECT * FROM public.notification_automation_rules WHERE id = $1",
        [id]
      );
      return res.rows[0] || null;
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  static async createRule(input: CreateRuleInput): Promise<NotificationAutomationRuleRow> {
    const client = this.getClient();
    if (!client) throw new Error("Database not connected");
    try {
      await client.connect();
      const res = await client.query(
        `INSERT INTO public.notification_automation_rules 
         (template_id, name, description, trigger_type, trigger_config, target_audience, conditions, cooldown_hours, max_per_user_per_day, is_active, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          input.template_id,
          input.name,
          input.description || null,
          input.trigger_type,
          JSON.stringify(input.trigger_config || {}),
          input.target_audience || "all",
          JSON.stringify(input.conditions || []),
          input.cooldown_hours || 24,
          input.max_per_user_per_day || 1,
          input.is_active || false,
          input.created_by || null,
        ]
      );
      return res.rows[0];
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  static async updateRule(
    id: string,
    updates: Partial<CreateRuleInput>
  ): Promise<NotificationAutomationRuleRow> {
    const client = this.getClient();
    if (!client) throw new Error("Database not connected");
    try {
      await client.connect();

      const fields: string[] = [];
      const values: unknown[] = [];
      let idx = 1;

      if (updates.template_id !== undefined) {
        fields.push(`template_id = $${idx++}`);
        values.push(updates.template_id);
      }
      if (updates.name !== undefined) {
        fields.push(`name = $${idx++}`);
        values.push(updates.name);
      }
      if (updates.description !== undefined) {
        fields.push(`description = $${idx++}`);
        values.push(updates.description);
      }
      if (updates.trigger_type !== undefined) {
        fields.push(`trigger_type = $${idx++}`);
        values.push(updates.trigger_type);
      }
      if (updates.trigger_config !== undefined) {
        fields.push(`trigger_config = $${idx++}`);
        values.push(JSON.stringify(updates.trigger_config));
      }
      if (updates.target_audience !== undefined) {
        fields.push(`target_audience = $${idx++}`);
        values.push(updates.target_audience);
      }
      if (updates.conditions !== undefined) {
        fields.push(`conditions = $${idx++}`);
        values.push(JSON.stringify(updates.conditions));
      }
      if (updates.cooldown_hours !== undefined) {
        fields.push(`cooldown_hours = $${idx++}`);
        values.push(updates.cooldown_hours);
      }
      if (updates.max_per_user_per_day !== undefined) {
        fields.push(`max_per_user_per_day = $${idx++}`);
        values.push(updates.max_per_user_per_day);
      }
      if (updates.is_active !== undefined) {
        fields.push(`is_active = $${idx++}`);
        values.push(updates.is_active);
      }

      fields.push(`updated_at = now()`);
      values.push(id);

      const sql = `UPDATE public.notification_automation_rules SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`;
      const res = await client.query(sql, values);
      return res.rows[0];
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  static async toggleRuleActive(id: string, isActive: boolean): Promise<NotificationAutomationRuleRow> {
    return this.updateRule(id, { is_active: isActive });
  }

  static async deleteRule(id: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) return false;
    try {
      await client.connect();
      await client.query("DELETE FROM public.notification_automation_rules WHERE id = $1", [id]);
      return true;
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  // ==========================================
  // RUNS & DELIVERY LOGS
  // ==========================================

  static async getAutomationRuns(limit = 20): Promise<
    Array<NotificationAutomationRunRow & { rule_name?: string }>
  > {
    const client = this.getClient();
    if (!client) return [];
    try {
      await client.connect();
      const sql = `
        SELECT r.*, rule.name AS rule_name
        FROM public.notification_automation_runs r
        LEFT JOIN public.notification_automation_rules rule ON rule.id = r.rule_id
        ORDER BY r.started_at DESC
        LIMIT $1
      `;
      const res = await client.query(sql, [limit]);
      return res.rows;
    } catch (err) {
      console.error("[NotificationTemplateRepository.getAutomationRuns] Error:", err);
      return [];
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  static async getDeliveryLogs(limit = 50): Promise<
    Array<NotificationDeliveryLogRow & { user_name?: string; user_email?: string; rule_name?: string }>
  > {
    const client = this.getClient();
    if (!client) return [];
    try {
      await client.connect();
      const sql = `
        SELECT l.*, p.display_name AS user_name, p.email AS user_email, r.name AS rule_name
        FROM public.notification_delivery_logs l
        LEFT JOIN public.profiles p ON p.id = l.user_id
        LEFT JOIN public.notification_automation_rules r ON r.id = l.rule_id
        ORDER BY l.created_at DESC
        LIMIT $1
      `;
      const res = await client.query(sql, [limit]);
      return res.rows;
    } catch (err) {
      console.error("[NotificationTemplateRepository.getDeliveryLogs] Error:", err);
      return [];
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  // ==========================================
  // DASHBOARD AGGREGATED STATS
  // ==========================================

  static async getDashboardStats(): Promise<AutomationDashboardStats> {
    const defaults: AutomationDashboardStats = {
      totalTemplates: 0,
      activeTemplates: 0,
      totalRules: 0,
      activeRules: 0,
      totalSent: 0,
      totalFailed: 0,
      lastRunAt: null,
      totalSubscribers: 0,
    };

    const client = this.getClient();
    if (!client) {
      return defaults;
    }

    try {
      await client.connect();

      const templatesRes = await client.query(`
        SELECT 
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'active')::int AS active
        FROM public.notification_templates
      `);

      const rulesRes = await client.query(`
        SELECT 
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE is_active = true)::int AS active,
          COALESCE(SUM(total_sent), 0)::int AS total_sent,
          COALESCE(SUM(total_failed), 0)::int AS total_failed,
          MAX(last_run_at) AS last_run_at
        FROM public.notification_automation_rules
      `);

      const pushRes = await client.query(`
        SELECT COUNT(*)::int AS active_subs
        FROM public.push_subscriptions
        WHERE is_active = true
      `);

      const t = templatesRes.rows[0];
      const r = rulesRes.rows[0];
      const p = pushRes.rows[0];

      return {
        totalTemplates: Number(t?.total || 0),
        activeTemplates: Number(t?.active || 0),
        totalRules: Number(r?.total || 0),
        activeRules: Number(r?.active || 0),
        totalSent: Number(r?.total_sent || 0),
        totalFailed: Number(r?.total_failed || 0),
        lastRunAt: r?.last_run_at || null,
        totalSubscribers: Number(p?.active_subs || 0),
      };
    } catch (err) {
      console.error("[NotificationTemplateRepository.getDashboardStats] Error:", err);
      return defaults;
    } finally {
      await client.end().catch(() => undefined);
    }
  }
}
