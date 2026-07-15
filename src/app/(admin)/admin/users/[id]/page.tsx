import { AdminUserRepository } from "@/repositories/admin/user.repository";
import { requirePermission } from "@/lib/auth/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock, Key, Shield, User } from "lucide-react";

export default async function AdminUserDetailPage(props: { params: Promise<{ id: string }> }) {
  await requirePermission("manageUsers");

  const params = await props.params;
  const user = await AdminUserRepository.getUserById(params.id);

  if (!user) {
    return <div>User not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Details</h1>
        <p className="text-muted-foreground">{user.email}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">ID</span>
              <span className="font-mono text-sm">{user.id}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Display Name</span>
              <span className="font-medium">{user.display_name || "Not provided"}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Email</span>
              <span>{user.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Role</span>
              <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                {user.role}
              </Badge>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Joined</span>
              <span>{format(new Date(user.created_at), "PPP")}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              Security & Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Account Status</span>
              <Badge variant="outline" className="text-green-500 border-green-500 bg-green-500/10">Active</Badge>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Last Sign In</span>
              <span>Unknown</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Recent Activity Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {/* Mock Timeline Items */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-background bg-primary text-primary-foreground shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                  <Key className="w-4 h-4" />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border bg-card shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold">Password Reset</div>
                    <time className="text-xs text-muted-foreground font-mono">1 day ago</time>
                  </div>
                  <div className="text-sm text-muted-foreground">User requested a password reset.</div>
                </div>
              </div>
              
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-background bg-secondary text-secondary-foreground shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                  <User className="w-4 h-4" />
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border bg-card shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-bold">Profile Updated</div>
                    <time className="text-xs text-muted-foreground font-mono">2 weeks ago</time>
                  </div>
                  <div className="text-sm text-muted-foreground">Updated avatar and display name.</div>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
