import { AdminVocabularyRepository } from "@/repositories/admin/vocabulary.repository";
import { AdminDataTable } from "@/components/admin/tables/data-table";
import { columns } from "./columns";
import { requirePermission } from "@/lib/auth/admin";
import { Button } from "@/components/ui/button";
import { VocabSetRow } from "./columns";

export default async function AdminVocabularySetsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  await requirePermission("manageVocabulary");

  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams?.page as string) || 1;
  const search = resolvedSearchParams?.search as string || "";

  const { data: sets } = await AdminVocabularyRepository.getSets(page, 10, search);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vocabulary Sets</h1>
        <p className="text-muted-foreground">Manage all vocabulary sets.</p>
      </div>
      
      <AdminDataTable
        columns={columns}
        data={sets as unknown as VocabSetRow[]}
        searchKey="title"
        bulkActions={
          <div className="space-x-2 flex">
             <Button variant="outline" size="sm" className="h-8">Make Public</Button>
             <Button variant="destructive" size="sm" className="h-8">Delete Selected</Button>
          </div>
        }
      />
    </div>
  );
}
