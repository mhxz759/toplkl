import { 
  Users, 
  Wallet, 
  Clock, 
  TrendingUp,
  Activity
} from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatCard } from "@/components/ui/StatCard";
import { UsersTable } from "@/components/users/UsersTable";
import { useStats, useUsers } from "@/hooks/use-dashboard";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: users, isLoading: usersLoading } = useUsers();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 lg:p-12 max-w-7xl mx-auto space-y-10">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Dashboard</h1>
              <p className="mt-2 text-muted-foreground">Overview of bot performance and user approvals.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card border px-4 py-2 rounded-full shadow-sm">
              <Activity className="w-4 h-4 text-green-500 animate-pulse" />
              <span>System Operational</span>
            </div>
          </div>

          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <motion.div variants={item}>
              <StatCard 
                title="Total Fees Collected"
                value={statsLoading ? "..." : `$${Number(stats?.totalFees || 0).toLocaleString()}`}
                icon={Wallet}
                variant="primary"
                trend="+12.5%"
                trendUp={true}
              />
            </motion.div>
            
            <motion.div variants={item}>
              <StatCard 
                title="Total Users"
                value={statsLoading ? "..." : stats?.totalUsers || 0}
                icon={Users}
                trend="+8.2%"
                trendUp={true}
              />
            </motion.div>
            
            <motion.div variants={item}>
              <StatCard 
                title="Pending Approvals"
                value={statsLoading ? "..." : stats?.pendingUsers || 0}
                icon={Clock}
                variant={(stats?.pendingUsers || 0) > 0 ? "warning" : "default"}
              />
            </motion.div>
          </motion.div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Recent User Activity
              </h2>
            </div>
            
            <UsersTable users={users || []} isLoading={usersLoading} />
          </div>
        </div>
      </main>
    </div>
  );
}
