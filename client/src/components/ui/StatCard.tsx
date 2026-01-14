import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
  variant?: "default" | "primary" | "warning";
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendUp, 
  className,
  variant = "default"
}: StatCardProps) {
  
  const variants = {
    default: "bg-card border-border",
    primary: "bg-gradient-to-br from-primary to-primary/80 text-white border-transparent",
    warning: "bg-gradient-to-br from-amber-500 to-orange-500 text-white border-transparent"
  };

  const iconStyles = {
    default: "bg-primary/10 text-primary",
    primary: "bg-white/20 text-white",
    warning: "bg-white/20 text-white"
  };

  return (
    <div className={cn(
      "rounded-2xl p-6 border shadow-sm transition-all duration-300 hover:shadow-md",
      variants[variant],
      className
    )}>
      <div className="flex justify-between items-start">
        <div>
          <p className={cn(
            "text-sm font-medium mb-1",
            variant === "default" ? "text-muted-foreground" : "text-white/80"
          )}>
            {title}
          </p>
          <h3 className={cn(
            "text-3xl font-bold tracking-tight",
            variant === "default" ? "text-foreground" : "text-white"
          )}>
            {value}
          </h3>
        </div>
        <div className={cn(
          "p-3 rounded-xl",
          iconStyles[variant]
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span className={cn(
            "font-medium",
            trendUp 
              ? (variant === "default" ? "text-green-600" : "text-white") 
              : (variant === "default" ? "text-red-600" : "text-white/80")
          )}>
            {trend}
          </span>
          <span className={cn(
            "ml-2",
            variant === "default" ? "text-muted-foreground" : "text-white/60"
          )}>
            vs last month
          </span>
        </div>
      )}
    </div>
  );
}
