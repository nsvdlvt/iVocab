"use server";

import { revalidatePath } from "next/cache";
import { assertAdmin } from "@/lib/auth/admin";
import {
  NotificationTemplateRepository,
  CreateTemplateInput,
  CreateRuleInput,
} from "@/repositories/admin/notification-template.repository";
import { AdminAuditRepository } from "@/repositories/admin/audit.repository";
import {
  validateTemplate,
  renderTemplate,
} from "@/lib/notifications/template-renderer";
import {
  getAllTemplateVariables,
  getSampleUserContext,
} from "@/lib/notifications/template-variables";
import { AutomationEngine } from "@/lib/notifications/automation-engine";
import { UserContextProvider } from "@/lib/notifications/user-context-provider";

// 1. Template Variables
export async function getRegisteredVariablesAction() {
  await assertAdmin();
  return getAllTemplateVariables();
}

export async function getSampleContextAction() {
  await assertAdmin();
  return getSampleUserContext();
}

// 2. Real Users for Preview
export async function getRealUsersForPreviewAction() {
  try {
    const { supabase } = await assertAdmin();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, email, streak, last_activity_at")
      .order("last_activity_at", { ascending: false, nullsFirst: false })
      .limit(20);

    if (!error && data) {
      return data.map((r) => ({
        id: r.id,
        name: r.display_name?.trim() || "Học viên",
        email: r.email || "",
        streak: r.streak || 0,
      }));
    }
  } catch (err) {
    console.error("[getRealUsersForPreviewAction] Error:", err);
  }
  return [];
}

// 3. Render Real User Preview
export async function renderRealUserPreviewAction(
  userId: string,
  titleTemplate: string,
  bodyTemplate: string,
  actionUrl?: string | null
) {
  await assertAdmin();
  const userContext = await UserContextProvider.getUserContext(userId);
  if (!userContext) {
    return { ok: false, error: "Không tìm thấy hồ sơ người dùng" };
  }

  const rendered = renderTemplate(
    {
      title: titleTemplate,
      body: bodyTemplate,
      action_url: actionUrl,
    },
    (userContext as unknown) as Record<string, unknown>
  );

  return {
    ok: true,
    userContext,
    rendered,
  };
}

// 4. Validate Template
export async function validateTemplateAction(payload: {
  title: string;
  body: string;
}) {
  await assertAdmin();
  const res = validateTemplate(payload);
  return res;
}

// 5. Template CRUD
export async function createTemplateAction(payload: CreateTemplateInput) {
  try {
    const { user } = await assertAdmin();

    const validation = validateTemplate({
      title: payload.title_template,
      body: payload.body_template,
    });

    if (!validation.isValid) {
      return { ok: false, error: validation.errors.join("; ") };
    }

    const template = await NotificationTemplateRepository.createTemplate({
      ...payload,
      variables_used: validation.variables,
      created_by: user.id,
    });

    try {
      await AdminAuditRepository.logAction(
        "create_notification_template",
        "notification_template",
        template.id,
        { name: template.name, title: template.title_template }
      );
    } catch {}

    revalidatePath("/admin/announcements");
    return { ok: true, data: template };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg || "Lỗi khi tạo mẫu thông báo" };
  }
}

export async function updateTemplateAction(
  id: string,
  payload: Partial<CreateTemplateInput>
) {
  try {
    await assertAdmin();

    if (payload.title_template || payload.body_template) {
      const existing = await NotificationTemplateRepository.getTemplateById(id);
      if (!existing) return { ok: false, error: "Không tìm thấy mẫu thông báo" };

      const validation = validateTemplate({
        title: payload.title_template || existing.title_template,
        body: payload.body_template || existing.body_template,
      });

      if (!validation.isValid) {
        return { ok: false, error: validation.errors.join("; ") };
      }
      payload.variables_used = validation.variables;
    }

    const updated = await NotificationTemplateRepository.updateTemplate(id, payload);

    try {
      await AdminAuditRepository.logAction(
        "update_notification_template",
        "notification_template",
        id,
        { updates: payload }
      );
    } catch {}

    revalidatePath("/admin/announcements");
    return { ok: true, data: updated };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg || "Lỗi khi cập nhật mẫu thông báo" };
  }
}

export async function deleteTemplateAction(id: string) {
  try {
    await assertAdmin();
    const success = await NotificationTemplateRepository.deleteTemplate(id);

    try {
      await AdminAuditRepository.logAction(
        "delete_notification_template",
        "notification_template",
        id,
        {}
      );
    } catch {}

    revalidatePath("/admin/announcements");
    return { ok: success };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg || "Lỗi khi xóa mẫu thông báo" };
  }
}

export async function duplicateTemplateAction(id: string) {
  try {
    await assertAdmin();
    const duplicated = await NotificationTemplateRepository.duplicateTemplate(id);
    revalidatePath("/admin/announcements");
    return { ok: true, data: duplicated };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg || "Lỗi khi nhân bản mẫu thông báo" };
  }
}

// 6. Test Notification Dispatch
export async function sendTestNotificationAction(
  templateId: string,
  channel: "in_app" | "push" | "both",
  targetUserId?: string
) {
  try {
    const { user } = await assertAdmin();
    const recipientId = targetUserId || user.id;

    const res = await AutomationEngine.sendTestNotification(
      templateId,
      recipientId,
      channel
    );

    if (res.ok) {
      try {
        await AdminAuditRepository.logAction(
          "send_test_notification",
          "notification_template",
          templateId,
          { recipientId, channel, inAppSent: res.inAppSent, pushSent: res.pushSent }
        );
      } catch {}
    }

    revalidatePath("/notifications");
    return res;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, inAppSent: false, pushSent: false, error: msg };
  }
}

// 7. Automation Rule CRUD
export async function createRuleAction(payload: CreateRuleInput) {
  try {
    const { user } = await assertAdmin();
    const rule = await NotificationTemplateRepository.createRule({
      ...payload,
      created_by: user.id,
    });

    try {
      await AdminAuditRepository.logAction(
        "create_automation_rule",
        "automation_rule",
        rule.id,
        { name: rule.name, triggerType: rule.trigger_type }
      );
    } catch {}

    revalidatePath("/admin/announcements");
    return { ok: true, data: rule };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg || "Lỗi khi tạo quy tắc tự động" };
  }
}

export async function updateRuleAction(id: string, payload: Partial<CreateRuleInput>) {
  try {
    await assertAdmin();
    const rule = await NotificationTemplateRepository.updateRule(id, payload);
    revalidatePath("/admin/announcements");
    return { ok: true, data: rule };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg || "Lỗi khi cập nhật quy tắc tự động" };
  }
}

export async function toggleRuleActiveAction(id: string, isActive: boolean) {
  try {
    await assertAdmin();
    const rule = await NotificationTemplateRepository.toggleRuleActive(id, isActive);
    revalidatePath("/admin/announcements");
    return { ok: true, data: rule };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg || "Lỗi khi đổi trạng thái quy tắc" };
  }
}

export async function deleteRuleAction(id: string) {
  try {
    await assertAdmin();
    const success = await NotificationTemplateRepository.deleteRule(id);
    revalidatePath("/admin/announcements");
    return { ok: success };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg || "Lỗi khi xóa quy tắc tự động" };
  }
}

// 8. Preview & Run Automation
export async function previewRecipientsAction(ruleId: string) {
  try {
    await assertAdmin();
    const res = await AutomationEngine.previewRecipients(ruleId);
    return { ok: true, data: res };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg || "Lỗi khi ước tính đối tượng" };
  }
}

export async function runRuleAction(ruleId: string, dryRun = false) {
  try {
    await assertAdmin();
    const summary = await AutomationEngine.executeRule(ruleId, { dryRun });

    try {
      await AdminAuditRepository.logAction(
        "run_automation_rule",
        "automation_rule",
        ruleId,
        { dryRun, summary }
      );
    } catch {}

    revalidatePath("/admin/announcements");
    revalidatePath("/notifications");
    return { ok: true, summary };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg || "Lỗi khi thực thi quy tắc" };
  }
}

// 9. Dashboard & History
export async function getAutomationDashboardDataAction() {
  await assertAdmin();
  const [stats, templates, rules, runs, logs] = await Promise.all([
    NotificationTemplateRepository.getDashboardStats(),
    NotificationTemplateRepository.getTemplates(),
    NotificationTemplateRepository.getRules(),
    NotificationTemplateRepository.getAutomationRuns(15),
    NotificationTemplateRepository.getDeliveryLogs(30),
  ]);

  return {
    stats,
    templates,
    rules,
    runs,
    logs,
  };
}
