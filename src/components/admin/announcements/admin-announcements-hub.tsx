"use client";

import React, { useState } from "react";
import {
  Megaphone,
  Sparkles,
  Sliders,
  BarChart3,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AnnouncementsClient } from "./announcements-client";
import { TemplatesManager } from "./templates-manager";
import { AutomationRulesManager } from "./automation-rules-manager";
import { AutomationDashboard } from "./automation-dashboard";
import { FallbackAnnouncement } from "@/lib/admin/fallback-store";
import {
  NotificationTemplateRow,
  NotificationAutomationRuleRow,
  NotificationAutomationRunRow,
  NotificationDeliveryLogRow,
  AutomationDashboardStats,
} from "@/repositories/admin/notification-template.repository";

interface AdminAnnouncementsHubProps {
  announcements: FallbackAnnouncement[];
  isDatabaseLive: boolean;
  templates: NotificationTemplateRow[];
  rules: Array<
    NotificationAutomationRuleRow & { template_name?: string; template_title?: string }
  >;
  stats: AutomationDashboardStats;
  runs: Array<NotificationAutomationRunRow & { rule_name?: string }>;
  logs: Array<
    NotificationDeliveryLogRow & {
      user_name?: string;
      user_email?: string;
      rule_name?: string;
    }
  >;
}

export function AdminAnnouncementsHub({
  announcements,
  isDatabaseLive,
  templates,
  rules,
  stats,
  runs,
  logs,
}: AdminAnnouncementsHubProps) {
  const [activeTab, setActiveTab] = useState<string>("templates");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="border-b border-border/80 pb-1">
          <TabsList className="h-auto p-1 bg-muted/65 rounded-xl border border-border inline-flex flex-wrap gap-1">
            <TabsTrigger
              value="templates"
              className="rounded-lg gap-2 py-2 px-3.5 text-xs font-bold cursor-pointer transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Mẫu thông báo động</span>
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-bold">
                {templates.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger
              value="rules"
              className="rounded-lg gap-2 py-2 px-3.5 text-xs font-bold cursor-pointer transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
            >
              <Sliders className="h-4 w-4 text-amber-500" />
              <span>Quy tắc tự động</span>
              <Badge
                variant="secondary"
                className="text-[10px] py-0 px-1.5 font-bold bg-[#f9971d]/20 text-[#f9971d]"
              >
                {stats.activeRules} active
              </Badge>
            </TabsTrigger>

            <TabsTrigger
              value="announcements"
              className="rounded-lg gap-2 py-2 px-3.5 text-xs font-bold cursor-pointer transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
            >
              <Megaphone className="h-4 w-4 text-blue-500" />
              <span>Bản tin hệ thống (In-App)</span>
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-bold">
                {announcements.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger
              value="dashboard"
              className="rounded-lg gap-2 py-2 px-3.5 text-xs font-bold cursor-pointer transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs"
            >
              <BarChart3 className="h-4 w-4 text-emerald-500" />
              <span>Nhật ký & Báo cáo</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Templates Manager */}
        <TabsContent value="templates" className="focus-visible:outline-none">
          <TemplatesManager initialTemplates={templates} />
        </TabsContent>

        {/* Tab 2: Automation Rules */}
        <TabsContent value="rules" className="focus-visible:outline-none">
          <AutomationRulesManager initialRules={rules} templates={templates} />
        </TabsContent>

        {/* Tab 3: Broadcast Announcements */}
        <TabsContent value="announcements" className="focus-visible:outline-none">
          <AnnouncementsClient
            initialAnnouncements={announcements}
            isDatabaseLive={isDatabaseLive}
          />
        </TabsContent>

        {/* Tab 4: Automation Dashboard */}
        <TabsContent value="dashboard" className="focus-visible:outline-none">
          <AutomationDashboard stats={stats} runs={runs} logs={logs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
