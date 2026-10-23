"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  List,
  Search,
  Plus,
  ArrowUpDown,
  Globe,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ETeamVocabFilterBarProps {
  onAddClick?: () => void;
}

export function ETeamVocabFilterBar({ onAddClick }: ETeamVocabFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") || "";
  const currentVisibility = searchParams.get("visibility") || "all";
  const currentSort = searchParams.get("sort") || "updated_at_desc";
  const currentView = searchParams.get("view") || "grid";

  const visibilityLabelMap: Record<string, string> = {
    all: "Tất cả trạng thái",
    private: "Riêng tư",
    unlisted: "Không công khai",
    public: "Công khai",
  };

  const sortLabelMap: Record<string, string> = {
    updated_at_desc: "Cập nhật mới nhất",
    updated_at_asc: "Cập nhật cũ nhất",
    title_asc: "Tên bộ từ A → Z",
    title_desc: "Tên bộ từ Z → A",
  };

  const [searchVal, setSearchVal] = useState(currentSearch);

  useEffect(() => {
    setSearchVal(currentSearch);
  }, [currentSearch]);

  const updateParams = React.useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all" && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (key !== "page") {
        params.delete("page");
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchVal !== currentSearch) {
        updateParams("search", searchVal);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchVal, currentSearch, updateParams]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-2xs lg:flex-row lg:items-center lg:justify-between">
      {/* Left: Search & Filter Controls */}
      <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm bộ từ theo tên hoặc mô tả..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="h-9 w-full rounded-lg pl-9 pr-8 text-xs sm:text-sm"
          />
          {searchVal && (
            <button
              type="button"
              onClick={() => {
                setSearchVal("");
                updateParams("search", "");
              }}
              aria-label="Xóa tìm kiếm"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Visibility Filter */}
          <Select
            value={currentVisibility}
            onValueChange={(val) => updateParams("visibility", val ?? "all")}
          >
            <SelectTrigger
              className="h-9 w-auto min-w-[140px] gap-2 rounded-lg border-border/80 bg-background text-xs font-medium"
              aria-label="Lọc theo trạng thái"
            >
              <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">
                {visibilityLabelMap[currentVisibility] || "Trạng thái"}
              </span>
            </SelectTrigger>
            <SelectContent align="start" className="w-48 rounded-xl">
              <SelectItem value="all" className="text-xs">
                Tất cả trạng thái
              </SelectItem>
              <SelectItem value="public" className="text-xs">
                Công khai
              </SelectItem>
              <SelectItem value="private" className="text-xs">
                Riêng tư
              </SelectItem>
              <SelectItem value="unlisted" className="text-xs">
                Không công khai
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Filter */}
          <Select
            value={currentSort}
            onValueChange={(val) =>
              updateParams("sort", val ?? "updated_at_desc")
            }
          >
            <SelectTrigger
              className="h-9 w-auto min-w-[150px] gap-2 rounded-lg border-border/80 bg-background text-xs font-medium"
              aria-label="Sắp xếp danh sách"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">
                {sortLabelMap[currentSort] || "Sắp xếp"}
              </span>
            </SelectTrigger>
            <SelectContent align="start" className="w-48 rounded-xl">
              <SelectItem value="updated_at_desc" className="text-xs">
                Cập nhật mới nhất
              </SelectItem>
              <SelectItem value="updated_at_asc" className="text-xs">
                Cập nhật cũ nhất
              </SelectItem>
              <SelectItem value="title_asc" className="text-xs">
                Tên bộ từ A → Z
              </SelectItem>
              <SelectItem value="title_desc" className="text-xs">
                Tên bộ từ Z → A
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Right: View Toggle & Add Button */}
      <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-2.5 sm:border-0 sm:pt-0 sm:justify-end">
        {/* Grid / List View Toggle */}
        <div className="flex items-center rounded-lg border border-border/80 bg-muted/40 p-0.5">
          <button
            type="button"
            onClick={() => updateParams("view", "grid")}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors",
              currentView === "grid"
                ? "bg-background text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Dạng lưới"
            aria-label="Chuyển sang dạng lưới"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => updateParams("view", "list")}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors",
              currentView === "list"
                ? "bg-background text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
            title="Dạng danh sách"
            aria-label="Chuyển sang dạng danh sách"
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Create Set CTA */}
        {onAddClick && (
          <Button
            onClick={onAddClick}
            size="sm"
            className="h-9 gap-1.5 rounded-lg px-3.5 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tạo bộ từ mới</span>
          </Button>
        )}
      </div>
    </div>
  );
}
