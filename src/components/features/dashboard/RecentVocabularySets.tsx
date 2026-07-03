"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SectionCard } from "@/components/common/SectionCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { mockVocabularySets } from "@/mock/vocabulary";
import { ROUTES } from "@/constants/routes";

export function RecentVocabularySets() {
  const recentSets = mockVocabularySets.slice(0, 2);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Bộ từ vựng đang học"
        description="Tiếp tục học các bộ từ vựng gần đây"
        action={
          <Link
            href={ROUTES.VOCABULARY}
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "rounded-xl hover:bg-accent/50 cursor-pointer inline-flex items-center gap-1",
            })}
          >
            Xem tất cả
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {recentSets.map((set) => {
          const progressPercent = Math.round((set.learnedWords / set.totalWords) * 100);
          return (
            <SectionCard key={set.id} hoverable className="p-5 flex flex-col justify-between h-44 group">
              <Link href={ROUTES.VOCABULARY_DETAIL(set.id)} className="h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                      {set.title}
                    </h4>
                    <Badge variant="secondary" className="rounded-lg text-[10px] uppercase font-bold shrink-0 bg-muted/60">
                      {set.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                    {set.description}
                  </p>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Tiến độ: {progressPercent}%</span>
                    <span>
                      {set.learnedWords}/{set.totalWords} từ
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-1.5 rounded-full" />
                </div>
              </Link>
            </SectionCard>
          );
        })}
      </div>
    </div>
  );
}
