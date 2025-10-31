// src/components/DatabaseMemberCardSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function DatabaseMemberCardSkeleton() {
  return (
    // Main container: No hover effect
    <div className={cn(
      "relative w-full max-w-xs mx-auto rounded-xl overflow-hidden",
      "bg-secondary",
    )}>
      
      {/* Photo skeleton: Simple skeleton block */}
      <Skeleton className="w-full h-64 rounded-t-xl" />

      {/* Content box skeleton: ADDED hover effect */}
      <div className={cn(
        "relative p-6 rounded-xl shadow-lg -mt-6 mx-4 mb-4",
        "bg-white/70 dark:bg-slate-800/70 backdrop-blur-md", // Glassy classes
        "border border-white/30 dark:border-slate-700/60", // Subtle border
        "transition-all duration-300 ease-in-out hover:-translate-y-1" // ADDED THIS LINE
      )}>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-4" />
        <div className="flex justify-end mt-4 space-x-3">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
      </div>
    </div>
  );
}