import React from "react";
import { UserStatsWidget } from "@/components/admin/dashboard/widgets/user-stats";
import { VocabStatsWidget } from "@/components/admin/dashboard/widgets/vocab-stats";
import { AiStatsWidget } from "@/components/admin/dashboard/widgets/ai-stats";
import { DictStatsWidget } from "@/components/admin/dashboard/widgets/dict-stats";
import { RecentErrorsWidget } from "@/components/admin/dashboard/widgets/recent-errors";
import { ActivityCenterWidget } from "@/components/admin/dashboard/widgets/activity-center";
import { SystemHealthWidget } from "@/components/admin/dashboard/widgets/system-health";

export interface DashboardWidget {
  id: string;
  component: React.ComponentType;
  span?: number;
  mobileSpan?: number;
}

const registry: DashboardWidget[] = [
  { id: "user-stats", component: UserStatsWidget, span: 1 },
  { id: "vocab-stats", component: VocabStatsWidget, span: 1 },
  { id: "ai-stats", component: AiStatsWidget, span: 1 },
  { id: "dict-stats", component: DictStatsWidget, span: 1 },
  { id: "recent-errors", component: RecentErrorsWidget, span: 4 },
  { id: "activity-center", component: ActivityCenterWidget, span: 3 }, // 2/3 width
  { id: "system-health", component: SystemHealthWidget, span: 1 }, // 1/3 width
];

export function registerWidget(widget: DashboardWidget) {
  registry.push(widget);
}

export function getWidgets() {
  return registry;
}
