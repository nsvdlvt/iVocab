import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Globe, Pin, Star, Sparkles, ExternalLink, Library, FolderOpen } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import { CommunityVocabularyRepository } from "@/repositories/admin/community-vocabulary.repository";
import { AdminVocabularyRepository } from "@/repositories/admin/vocabulary.repository";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Thư viện Khám phá Công khai | Vocabee Admin",
  description: "Quản lý nội dung công khai, các bộ từ vựng nổi bật và cấu hình trang Khám phá.",
};

export default async function AdminPublicLibraryPage() {
  await requireAdmin();

  const [communityOverview, publicSetsResult] = await Promise.all([
    CommunityVocabularyRepository.getCommunityOverview(),
    AdminVocabularyRepository.getSets(1, 20, undefined, "public"),
  ]);

  const { categories, sets: communitySets } = communityOverview;
  const featuredSets = communitySets.filter((s) => s.is_featured);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Thư viện Khám phá Công khai
          </h1>
          <p className="text-sm text-muted-foreground">
            Quản lý các bộ từ vựng hiển thị trên trang Khám phá (/share) và các bộ nổi bật.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/community-vocabulary"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <FolderOpen className="h-4 w-4 mr-1.5 text-[#f9971d]" />
            Quản lý Danh mục & Đăng bộ
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Bộ từ vựng Công khai</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{publicSetsResult.count}</p>
              <p className="text-xs text-muted-foreground">Chế độ visibility: public</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
              <Globe className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Bộ từ vựng Cộng đồng</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{communitySets.length}</p>
              <p className="text-xs text-muted-foreground">Đã kiểm duyệt & phân loại</p>
            </div>
            <div className="p-3 rounded-xl bg-[#f9971d]/10 text-[#f9971d]">
              <Library className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Bộ nổi bật (Featured)</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{featuredSets.length}</p>
              <p className="text-xs text-muted-foreground">Ghim đầu trang Khám phá</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
              <Sparkles className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Sets Section */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            Các Bộ từ vựng Ghim Nổi bật (Featured Banner)
          </CardTitle>
          <CardDescription className="text-xs">
            Hiển thị ưu tiên ở vị trí tâm điểm khi người học vào trang Khám phá
          </CardDescription>
        </CardHeader>
        <CardContent>
          {featuredSets.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
              <p className="text-sm">Hiện chưa có bộ từ nào được đánh dấu nổi bật.</p>
              <Link
                href="/admin/community-vocabulary"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-3")}
              >
                Vào trang Từ vựng Cộng đồng để gắn cờ
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredSets.map((f) => (
                <div key={f.id} className="p-4 rounded-xl border bg-muted/20 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground">{f.title_snapshot}</span>
                      <Badge className="bg-[#f9971d] text-[#030f31] font-semibold text-xs">
                        Nổi bật
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {f.description_snapshot || "Không có mô tả"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                    <span>Độ khó: <strong className="text-foreground capitalize">{f.difficulty}</strong></span>
                    <span>Thứ tự: {f.sort_order}</span>
                    <Link
                      href={`/share/${f.vocabulary_set_id}`}
                      target="_blank"
                      className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-7 text-xs")}
                    >
                      Xem thử <ExternalLink className="h-3 w-3 ml-1" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Community Categories Grid */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-[#f9971d]" />
              Danh mục Cộng đồng Hiện tại ({categories.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Các chủ đề phân loại được cấu hình trong hệ thống
            </CardDescription>
          </div>
          <Link
            href="/admin/community-vocabulary"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Quản lý chuyên sâu
          </Link>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Chưa có danh mục nào.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {categories.map((c) => (
                <div key={c.id} className="p-3 rounded-lg border bg-card flex flex-col gap-1 shadow-xs">
                  <span className="font-semibold text-sm text-foreground truncate">{c.name}</span>
                  <span className="text-xs text-muted-foreground font-mono truncate">{c.slug}</span>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <Badge variant={c.is_active ? "secondary" : "outline"} className="text-[10px]">
                      {c.is_active ? "Hoạt động" : "Tạm ẩn"}
                    </Badge>
                    <span className="text-muted-foreground">Thứ tự: {c.sort_order}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
