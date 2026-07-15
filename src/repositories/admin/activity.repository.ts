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
  /**
   * Fetches the latest system activity logs.
   * Currently, the activity_logs table does not exist.
   * We return an empty array until the architecture is implemented.
   */
  static async getLatestActivities(
    _limit?: number,
    _category?: ActivityCategory
  ): Promise<ActivityLog[]> {
    // TODO: Connect to Supabase activity_logs table when implemented
    // const supabase = await createServerClient(...);
    // let query = supabase.from("activity_logs").select("*");
    // if (category) query = query.eq("category", category);
    // const { data } = await query.order("created_at", { ascending: false }).limit(limit);
    // return data || [];

    return [];
  }
}
