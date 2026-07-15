import { AdminVocabularyRepository } from "@/repositories/admin/vocabulary.repository";
import { requirePermission } from "@/lib/auth/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Eye, Copy, Users, BookOpenCheck, Target, Layers } from "lucide-react";
import { StatCard } from "@/components/admin/cards/stat-card";

export default async function AdminVocabularySetDetailPage(props: { params: Promise<{ id: string }> }) {
  await requirePermission("manageVocabulary");

  const params = await props.params;
  const set = await AdminVocabularyRepository.getSetById(params.id);

  if (!set) {
    return <div>Vocabulary Set not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{set.title}</h1>
          <Badge variant={set.visibility === "public" ? "default" : "secondary"}>
            {set.visibility === "public" ? "Public" : "Private"}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-1">ID: {set.id}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Views" icon={Eye} value="1,245" />
        <StatCard title="Copies Created" icon={Copy} value="342" />
        <StatCard title="Active Learners" icon={Users} value="89" />
        <StatCard title="Total Reviews" icon={BookOpenCheck} value="12.5K" />
        <StatCard title="Completion Rate" icon={Target} value="68%" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-muted-foreground" />
              Set Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Author</span>
              <span className="font-medium">{(set.profiles as { email?: string })?.email || "Unknown"}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Description</span>
              <span className="text-right max-w-[60%]">{set.description || "No description"}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Created</span>
              <span>{format(new Date(set.created_at), "PPP")}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Language</span>
              <span>Unknown</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
