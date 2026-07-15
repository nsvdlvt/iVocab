import { AdminVocabularyRepository } from "@/repositories/admin/vocabulary.repository";
import { AdminDataTable } from "@/components/admin/tables/data-table";
import { columns } from "./columns";
import { requirePermission } from "@/lib/auth/admin";
import { Button } from "@/components/ui/button";
import { VocabWordRow } from "./columns";

export default async function AdminVocabularyWordsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  await requirePermission("manageVocabulary");

  const params = await searchParams;
  const page = parseInt(params?.page as string) || 1;
  const search = params?.search as string || "";

  const { data: words } = await AdminVocabularyRepository.getWords(page, 10, search);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vocabulary Words</h1>
        <p className="text-muted-foreground">Global vocabulary browser.</p>
      </div>
      
      <AdminDataTable
        columns={columns}
        data={words as unknown as VocabWordRow[]}
        searchKey="word"
        bulkActions={
          <div className="space-x-2 flex">
             <Button variant="destructive" size="sm" className="h-8">Delete Selected</Button>
          </div>
        }
      />
    </div>
  );
}
