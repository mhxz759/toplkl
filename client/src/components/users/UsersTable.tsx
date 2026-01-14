import { useState } from "react";
import { format } from "date-fns";
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  MoreVertical,
  AlertCircle
} from "lucide-react";
import { User } from "@shared/schema";
import { useApproveUser } from "@/hooks/use-dashboard";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";

interface UsersTableProps {
  users: User[];
  isLoading: boolean;
}

export function UsersTable({ users, isLoading }: UsersTableProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  
  const { mutate: approveUser, isPending } = useApproveUser();
  const { toast } = useToast();

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username?.toLowerCase().includes(search.toLowerCase()) || 
      user.telegramId.includes(search);
    
    if (filter === "pending") return matchesSearch && !user.isApproved;
    if (filter === "approved") return matchesSearch && user.isApproved;
    return matchesSearch;
  });

  const handleAction = () => {
    if (!selectedUser || !actionType) return;
    
    // In this app, "rejecting" keeps them unapproved or could ban them.
    // Based on requirements, we'll implement approval flow.
    // Rejection is essentially setting approved=false.
    
    approveUser(
      { id: selectedUser.id, approved: actionType === "approve" },
      {
        onSuccess: () => {
          toast({
            title: actionType === "approve" ? "User Approved" : "User Rejected",
            description: `${selectedUser.username || "User"} has been ${actionType === "approve" ? "approved" : "rejected"}.`,
            variant: actionType === "approve" ? "default" : "destructive",
          });
          setActionType(null);
          setSelectedUser(null);
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to update user status",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            placeholder="Search by username or Telegram ID..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "all" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "pending" ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            Pending
          </button>
          <button 
            onClick={() => setFilter("approved")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === "approved" ? "bg-green-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            Approved
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-4 px-6 font-semibold text-sm text-muted-foreground">User</th>
                <th className="text-left py-4 px-6 font-semibold text-sm text-muted-foreground">Telegram ID</th>
                <th className="text-left py-4 px-6 font-semibold text-sm text-muted-foreground">Joined</th>
                <th className="text-left py-4 px-6 font-semibold text-sm text-muted-foreground">Balance</th>
                <th className="text-left py-4 px-6 font-semibold text-sm text-muted-foreground">Status</th>
                <th className="text-right py-4 px-6 font-semibold text-sm text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                // Loading Skeletons
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-4 px-6"><div className="h-10 w-32 bg-muted rounded-md animate-pulse" /></td>
                    <td className="py-4 px-6"><div className="h-5 w-24 bg-muted rounded animate-pulse" /></td>
                    <td className="py-4 px-6"><div className="h-5 w-24 bg-muted rounded animate-pulse" /></td>
                    <td className="py-4 px-6"><div className="h-5 w-20 bg-muted rounded animate-pulse" /></td>
                    <td className="py-4 px-6"><div className="h-6 w-20 bg-muted rounded-full animate-pulse" /></td>
                    <td className="py-4 px-6"><div className="h-8 w-8 ml-auto bg-muted rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Search className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <p>No users found matching your filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filteredUsers.map((user) => (
                    <motion.tr 
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                            {user.username?.substring(0, 2).toUpperCase() || "ID"}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{user.firstName || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground">@{user.username || "no-username"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono text-sm text-muted-foreground">
                        {user.telegramId}
                      </td>
                      <td className="py-4 px-6 text-sm text-muted-foreground">
                        {user.joinedAt ? format(new Date(user.joinedAt), "MMM d, yyyy") : "-"}
                      </td>
                      <td className="py-4 px-6 font-medium font-mono">
                        ${Number(user.balance).toFixed(2)}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                          user.isApproved 
                            ? "bg-green-500/10 text-green-700 border-green-500/20" 
                            : "bg-amber-500/10 text-amber-700 border-amber-500/20"
                        }`}>
                          {user.isApproved ? (
                            <><CheckCircle className="w-3 h-3" /> Approved</>
                          ) : (
                            <><AlertCircle className="w-3 h-3" /> Pending</>
                          )}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            {!user.isApproved && (
                              <DropdownMenuItem 
                                className="text-green-600 focus:text-green-700 cursor-pointer"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setActionType("approve");
                                }}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" /> Approve
                              </DropdownMenuItem>
                            )}
                            {user.isApproved && (
                              <DropdownMenuItem 
                                className="text-amber-600 focus:text-amber-700 cursor-pointer"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setActionType("reject");
                                }}
                              >
                                <XCircle className="w-4 h-4 mr-2" /> Revoke
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AlertDialog open={!!selectedUser && !!actionType} onOpenChange={(open) => !open && setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "approve" ? "Approve User Access" : "Revoke User Access"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {actionType} access for <strong>@{selectedUser?.username}</strong>?
              {actionType === "approve" 
                ? " They will be able to use the bot immediately." 
                : " They will lose access to the bot features."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleAction}
              className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-destructive hover:bg-destructive/90"}
              disabled={isPending}
            >
              {isPending ? "Processing..." : actionType === "approve" ? "Approve" : "Revoke"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
