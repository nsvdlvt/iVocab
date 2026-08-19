"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

export function ReadingHeader({
  title,
  topic,
  difficulty,
  readingTime,
  isFavorite,
  onToggleFavorite,
}: {
  title: string;
  topic: string;
  difficulty: string;
  readingTime: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  return (
    <Card className="border-border/60 bg-card shadow-sm">
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h1>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={onToggleFavorite}
              aria-label={isFavorite ? "Bỏ yêu thích" : "Đánh dấu yêu thích"}
              className={isFavorite ? "border-amber-300 bg-amber-50 text-amber-600" : ""}
            >
              <Star className={isFavorite ? "h-4 w-4 fill-current" : "h-4 w-4"} />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Chủ đề: {topic}</Badge>
            <Badge variant="secondary">Độ khó: {difficulty}</Badge>
            <Badge variant="secondary">~ {readingTime}</Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
