"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Trash2,
  ArrowUpDown,
  Globe,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  onAddClick: () => void;
}

export function FilterBar({ onAddClick }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") || "";
  const currentVisibility = searchParams.get("visibility") || "all";
  const currentSort = searchParams.get("sort") || "updated_at_desc";
  const currentView = searchParams.get("view") || "grid";
  const isTrashView = currentVisibility === "deleted";

  const visibilityLabelMap: Record<string, string> = {
    all: "Tất cả trạng thái",
    private: "Riêng tư",
    unlisted: "Không công khai",
    public: "Công khai",
    deleted: "Thùng rác",
  };

  const sortLabelMap: Record<string, string> = {
    updated_at_desc: "Cập nhật mới nhất",
    updated_at_asc: "Cập nhật cũ nhất",
    title_asc: "Tên bộ từ A → Z",
    title_desc: "Tên bộ từ Z → A",
  };

  const [searchVal, setSearchVal] = useState(currentSearch);
  const [prevSearch, setPrevSearch] = useState(currentSearch);

  if (currentSearch !== prevSearch) {
    setSearchVal(currentSearch);
    setPrevSearch(currentSearch);
  }

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
      router.push(`/vocabulary?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
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

        <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 sm:flex sm:flex-wrap">
          {/* Visibility Filter */}
          <Select
            value={currentVisibility}
            onValueChange={(val) => updateParams("visibility", val || "all")}
          >
            <SelectTrigger className="h-9 w-full sm:w-[155px] rounded-lg text-xs font-medium">
              <span className="flex items-center gap-1.5 truncate">
                <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">
                  {visibilityLabelMap[currentVisibility] ?? "Tất cả trạng thái"}
                </span>
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="private">Riêng tư</SelectItem>
              <SelectItem value="unlisted">Không công khai</SelectItem>
              <SelectItem value="public">Công khai</SelectItem>
              <SelectItem value="deleted">Thùng rác</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Select */}
          <Select
            value={currentSort}
            onValueChange={(val) =>
              updateParams("sort", val || "updated_at_desc")
            }
          >
            <SelectTrigger className="h-9 w-full sm:w-[170px] rounded-lg text-xs font-medium">
              <span className="flex items-center gap-1.5 truncate">
                <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">
                  {sortLabelMap[currentSort] ?? "Cập nhật mới nhất"}
                </span>
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_at_desc">Cập nhật mới nhất</SelectItem>
              <SelectItem value="updated_at_asc">Cập nhật cũ nhất</SelectItem>
              <SelectItem value="title_asc">Tên bộ từ A → Z</SelectItem>
              <SelectItem value="title_desc">Tên bộ từ Z → A</SelectItem>
            </SelectContent>
          </Select>

          {/* Trash / Archive Quick Toggle */}
          <Button
            type="button"
            variant={isTrashView ? "secondary" : "outline"}
            size="sm"
            onClick={() =>
              updateParams("visibility", isTrashView ? "all" : "deleted")
            }
            className={cn(
              "h-9 gap-1.5 rounded-lg px-3 text-xs font-medium",
              isTrashView &&
                "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15"
            )}
            title={isTrashView ? "Quay lại bộ từ đang học" : "Xem thùng rác"}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Thùng rác</span>
          </Button>
        </div>
      </div>

      {/* Right: View Toggle & Primary Create Action */}
      <div className="flex items-center justify-between gap-2.5 border-t border-border/60 pt-2.5 sm:justify-end lg:border-t-0 lg:pt-0">
        {/* Segmented Grid/List Toggle */}
        <div
          className="inline-flex items-center rounded-lg border border-border/80 bg-muted/50 p-0.5"
          role="group"
          aria-label="Chế độ hiển thị"
        >
          <button
            type="button"
            onClick={() => updateParams("view", "grid")}
            aria-label="Dạng lưới"
            title="Dạng lưới"
            className={cn(
              "inline-flex h-7.5 w-8 items-center justify-center rounded-md transition-all cursor-pointer",
              currentView === "grid"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => updateParams("view", "list")}
            aria-label="Dạng danh sách"
            title="Dạng danh sách"
            className={cn(
              "inline-flex h-7.5 w-8 items-center justify-center rounded-md transition-all cursor-pointer",
              currentView === "list"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Primary Add Button */}
        <Button
          onClick={onAddClick}
          className="h-9 gap-1.5 rounded-lg px-3.5 text-xs sm:text-sm font-semibold shadow-xs flex-1 sm:flex-initial"
        >
          <Plus className="h-4 w-4" />
          <span>Tạo bộ từ mới</span>
        </Button>
      </div>
    </div>
  );
}
