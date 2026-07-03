import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { SectionCard } from "@/components/common/SectionCard";
import { SectionHeader } from "@/components/common/SectionHeader";
import { Database } from "@/types/database";
import { ROUTES } from "@/constants/routes";

type VocabSetRow = Database["public"]["Tables"]["vocab_sets"]["Row"];

interface RecentVocabularySetsProps {
  sets: VocabSetRow[];
}

export function RecentVocabularySets({ sets }: RecentVocabularySetsProps) {
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

      {sets.length === 0 ? (
        <SectionCard className="flex flex-col items-center justify-center py-10 text-center gap-3">
          <div className="rounded-2xl bg-muted/60 p-3">
            <BookOpen className="h-7 w-7 text-muted-foreground/60" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Chưa có bộ từ vựng nào</p>
            <p className="text-xs text-muted-foreground mt-1">
              Hãy tạo bộ từ vựng đầu tiên của bạn để bắt đầu học.
            </p>
          </div>
          <Link
            href={ROUTES.VOCABULARY}
            className={buttonVariants({
              size: "sm",
              className: "rounded-xl mt-1 cursor-pointer",
            })}
          >
            Tạo bộ từ vựng
          </Link>
        </SectionCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sets.map((set) => (
            <SectionCard key={set.id} hoverable className="p-5 flex flex-col justify-between h-40 group">
              <Link href={ROUTES.VOCABULARY_DETAIL(set.id)} className="h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                      {set.title}
                    </h4>
                    {set.visibility && (
                      <span className="text-[10px] font-bold uppercase shrink-0 px-2 py-0.5 rounded-lg bg-muted/60 text-muted-foreground border">
                        {set.visibility === "private"
                          ? "Riêng tư"
                          : set.visibility === "unlisted"
                          ? "Không công khai"
                          : "Công khai"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                    {set.description ?? "Chưa có mô tả."}
                  </p>
                </div>

                <div className="text-[10px] text-muted-foreground mt-3">
                  {set.source_language && set.target_language
                    ? `${set.source_language.toUpperCase()} → ${set.target_language.toUpperCase()}`
                    : ""}
                </div>
              </Link>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
