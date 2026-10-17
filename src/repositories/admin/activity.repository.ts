import { AdminDashboardRepository, RecentActivityItem } from "./dashboard.repository";
import { AdminAuditRepository } from "./audit.repository";

export type ActivityCategory =
  | "Users"
  | "AI"
  | "Vocabulary"
  | "Dictionary"
  | "Reviews"
  | "System";

export type ActivityLog = {
  id: string;
  type: string;
  category: ActivityCategory;
  user_id: string | null;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export class AdminActivityRepository {
  static async getLatestActivities(
    limit: number = 10,
    category?: ActivityCategory
  ): Promise<ActivityLog[]> {
    const rawActivities = await AdminDashboardRepository.getRecentActivities(limit);
    const { data: auditLogs } = await AdminAuditRepository.getLogs(1, limit);

    const mappedDashboard: ActivityLog[] = rawActivities.map((a: RecentActivityItem) => {
      let cat: ActivityCategory = "System";
      if (a.type === "user") cat = "Users";
      else if (a.type === "vocab_set" || a.type === "community") cat = "Vocabulary";
      else if (a.type === "reading") cat = "Reviews";

      return {
        id: a.id,
        type: a.type,
        category: cat,
        user_id: null,
        title: a.title,
        description: a.description,
        metadata: { badge: a.badge },
        created_at: a.timestamp,
      };
    });

    const mappedAudit: ActivityLog[] = auditLogs.map((log) => ({
      id: log.id,
      type: log.action,
      category: "System" as ActivityCategory,
      user_id: log.actor_id,
      title: `Admin Action: ${log.action}`,
      description: `${log.actor_email} (${log.entity_type} ${log.entity_id || ""})`,
      metadata: log.details,
      created_at: log.created_at,
    }));

    const combined = [...mappedDashboard, ...mappedAudit].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    if (category) {
      return combined.filter((c) => c.category === category).slice(0, limit);
    }

    return combined.slice(0, limit);
  }
}
