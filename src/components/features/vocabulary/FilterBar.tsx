"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Search, Plus } from "lucide-react";

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

  // State declaration
  const [searchVal, setSearchVal] = useState(currentSearch);
  const [prevSearch, setPrevSearch] = useState(currentSearch);

  // Sync state with URL search parameters changes (e.g. browser navigation back/forward)
  if (currentSearch !== prevSearch) {
    setSearchVal(currentSearch);
    setPrevSearch(currentSearch);
  }

  // Declared at the top to satisfy declaration order
  const updateParams = React.useCallback((key: string, value: string) => {
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
  }, [searchParams, router]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchVal !== currentSearch) {
        updateParams("search", searchVal);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchVal, currentSearch, updateParams]);

  return (
    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center py-2">
      {/* Left side: Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1 max-w-2xl">
        {/* Search Input */}
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground animate-pulse" />
          <Input
            placeholder="Tìm kiếm bộ từ vựng theo tên hoặc mô tả..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="pl-9 h-9.5 text-xs rounded-lg w-full"
          />
        </div>

        {/* Visibility Filter */}
        <div className="w-full sm:w-[160px] shrink-0">
          <Select defaultValue={currentVisibility} onValueChange={(val) => updateParams("visibility", val || "all")}>
            <SelectTrigger className="h-9.5 text-xs rounded-lg w-full">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="private">Riêng tư</SelectItem>
              <SelectItem value="unlisted">Không công khai</SelectItem>
              <SelectItem value="public">Công khai</SelectItem>
              <SelectItem value="deleted">Đã xóa tạm thời</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort select */}
        <div className="w-full sm:w-[180px] shrink-0">
          <Select defaultValue={currentSort} onValueChange={(val) => updateParams("sort", val || "updated_at_desc")}>
            <SelectTrigger className="h-9.5 text-xs rounded-lg w-full">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_at_desc">Mới cập nhật</SelectItem>
              <SelectItem value="updated_at_asc">Cũ cập nhật</SelectItem>
              <SelectItem value="title_asc">Tên bộ từ (A-Z)</SelectItem>
              <SelectItem value="title_desc">Tên bộ từ (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Right side: View Toggle & Add Button */}
      <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
        {/* Grid/List Toggle */}
        <div className="flex border rounded-lg overflow-hidden shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => updateParams("view", "grid")}
            className={`h-9 w-9 rounded-none border-r ${currentView === "grid" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => updateParams("view", "list")}
            className={`h-9 w-9 rounded-none ${currentView === "list" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>

        {/* Add new button */}
        <Button onClick={onAddClick} className="gap-1.5 font-semibold text-xs py-2.5 h-9.5 shadow-sm rounded-lg sm:w-auto w-full">
          <Plus className="h-4 w-4" />
          Thêm bộ từ
        </Button>
      </div>
    </div>
  );
}
