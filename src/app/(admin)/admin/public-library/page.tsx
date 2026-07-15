import { requirePermission } from "@/lib/auth/admin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Pin } from "lucide-react";

export default async function AdminPublicLibraryPage() {
  await requirePermission("manageVocabulary");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Public Library</h1>
        <p className="text-muted-foreground">Manage the public Explore page content.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pin className="h-5 w-5 text-muted-foreground" />
              Pinned Sets (Hero Section)
            </CardTitle>
            <CardDescription>
              Sets featured at the top of the Explore page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="border rounded-md p-4 flex items-center justify-between bg-muted/30">
                <div>
                  <h3 className="font-semibold">Essential IELTS Vocabulary</h3>
                  <p className="text-sm text-muted-foreground">By admin@vocabee.com</p>
                </div>
                <Button variant="outline" size="sm">Unpin</Button>
              </div>
              <Button variant="outline" className="w-full h-20 text-muted-foreground border-dashed">
                + Pin another set
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-muted-foreground" />
              Explore Page Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Public Library Status</span>
              <span className="font-medium text-green-500">Enabled</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Default Sort</span>
              <span className="font-medium">Most Popular</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
