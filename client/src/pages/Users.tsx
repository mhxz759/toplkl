import { Sidebar } from "@/components/layout/Sidebar";
import { UsersTable } from "@/components/users/UsersTable";
import { useUsers } from "@/hooks/use-dashboard";

export default function UsersPage() {
  const { data: users, isLoading } = useUsers();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 lg:p-12 max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">User Management</h1>
            <p className="mt-2 text-muted-foreground">View, approve, and manage bot users.</p>
          </div>
          
          <div className="bg-card rounded-2xl border border-border p-1 shadow-sm">
            <div className="p-4 md:p-6">
              <UsersTable users={users || []} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
