import type { Metadata } from "next";
import { DictionaryCenterClient } from "@/components/admin/dictionary/dictionary-center-client";
import { requireAdmin } from "@/lib/auth/admin";

export const metadata: Metadata = {
  title: "Từ điển & Bộ nhớ đệm | Vocabee Admin",
  description: "Quản lý tích hợp từ điển, kiểm tra âm thanh, phiên âm và làm sạch cache.",
};

export default async function AdminDictionaryPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Trung tâm Từ điển & Bộ nhớ đệm (Dictionary Center)
          </h1>
          <p className="text-sm text-muted-foreground">
            Kiểm tra nguồn dữ liệu từ điển tiếng Anh, định dạng phát âm IPA và quản lý LRU cache.
          </p>
        </div>
      </div>

      <DictionaryCenterClient />
    </div>
  );
}
