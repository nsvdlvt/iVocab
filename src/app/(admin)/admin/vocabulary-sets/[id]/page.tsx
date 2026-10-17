import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowLeft, Library, User, Calendar, BookA, Globe2, Lock } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminVocabularyRepository } from "@/repositories/admin/vocabulary.repository";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VocabSetDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: VocabSetDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const set = await AdminVocabularyRepository.getSetById(id);
    if (set?.title) {
      return { title: `Bộ từ: ${set.title} | Vocabee Admin` };
    }
  } catch {}
  return { title: "Chi tiết bộ từ vựng | Vocabee Admin" };
}

export default async function AdminVocabularySetDetailPage({ params }: VocabSetDetailPageProps) {
  await requireAdmin();
  const { id } = await params;

  let set;
  try {
    set = await AdminVocabularyRepository.getSetById(id);
  } catch {
    notFound();
  }

  if (!set) {
    notFound();
  }

  const owner = set.profiles as { id?: string; email?: string; display_name?: string } | null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/vocabulary-sets"
            className={cn(buttonVariants({ variant: "outline", size: "icon" }), "h-9 w-9")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {set.title}
              </h1>
              <Badge
                variant={set.visibility === "public" ? "default" : "secondary"}
                className={set.visibility === "public" ? "bg-emerald-600 text-white" : ""}
              >
                {set.visibility === "public" ? "Công khai" : "Riêng tư"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">ID: {set.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/share/${set.id}`}
            target="_blank"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Globe2 className="h-4 w-4 mr-1.5" />
            Xem trang chia sẻ
          </Link>
        </div>
      </div>

      {/* Info Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Library className="h-4 w-4 text-[#f9971d]" />
              Thông tin Bộ từ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-muted-foreground">Tiêu đề:</span>
              <span className="font-semibold">{set.title}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-muted-foreground">Mô tả:</span>
              <span className="font-medium text-right max-w-[60%]">{set.description || "Không có"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-muted-foreground">Tổng số từ vựng:</span>
              <Badge variant="secondary" className="font-bold">{set.word_count || 0} từ</Badge>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Ngày tạo:</span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(set.created_at), "dd/MM/yyyy HH:mm", { locale: vi })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <User className="h-4 w-4 text-blue-500" />
              Tác giả / Sở hữu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-muted-foreground">Tên tác giả:</span>
              <span className="font-medium">{owner?.display_name || "Chưa đặt tên"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium truncate max-w-[180px]">{owner?.email || set.user_id}</span>
            </div>
            {owner?.id && (
              <div className="pt-2">
                <Link
                  href={`/admin/users/${owner.id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full text-xs")}
                >
                  Xem hồ sơ người dùng
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-purple-500" />
              Cấu hình & Ngôn ngữ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-muted-foreground">Ngôn ngữ nguồn:</span>
              <span className="font-medium uppercase">{set.source_language || "en"}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b">
              <span className="text-muted-foreground">Ngôn ngữ đích:</span>
              <span className="font-medium uppercase">{set.target_language || "vi"}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted-foreground">Cập nhật lần cuối:</span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(set.updated_at), "dd/MM/yyyy HH:mm", { locale: vi })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Words in Set */}
      <Card className="shadow-xs border-border/80">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BookA className="h-4 w-4 text-emerald-500" />
              Danh sách từ vựng trong bộ ({set.words?.length || 0})
            </CardTitle>
            <CardDescription className="text-xs">
              Các từ tiếng Anh, phiên âm quốc tế, định nghĩa và câu ví dụ minh họa
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {!set.words || set.words.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Bộ từ vựng này hiện chưa có từ nào.
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-muted/50 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Từ vựng</th>
                    <th className="px-4 py-3">Phiên âm (IPA)</th>
                    <th className="px-4 py-3">Từ loại</th>
                    <th className="px-4 py-3">Định nghĩa & Nghĩa</th>
                    <th className="px-4 py-3">Câu ví dụ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {set.words.map((w: any) => (
                    <tr key={w.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-bold text-foreground">
                        {w.word}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {w.ipa || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <Badge variant="outline">{w.part_of_speech || "-"}</Badge>
                      </td>
                      <td className="px-4 py-3 text-foreground font-medium max-w-[220px] truncate">
                        {w.meaning}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[280px] truncate">
                        {w.example || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
