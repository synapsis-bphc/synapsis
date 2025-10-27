// src/components/EventCardSkeleton.tsx
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function EventCardSkeleton() {
  return (
    <Card className={cn(
        "overflow-hidden rounded-2xl shadow-lg border border-white/20 dark:border-slate-700/50",
        "bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg",
        "flex flex-col md:flex-row h-full min-h-[300px]" // Ensure minimum height
      )}>
        {/* Image Skeleton */}
        <div className="w-full md:w-1/3 lg:w-2/5 flex-shrink-0 aspect-[9/16] md:aspect-auto relative">
          <Skeleton className="absolute inset-0 w-full h-full md:rounded-l-2xl md:rounded-r-none rounded-t-2xl" />
        </div>

        {/* Content Skeleton */}
        <div className="flex flex-col flex-grow p-6 md:w-2/3 lg:w-3/5">
          <CardHeader className="p-0 mb-4">
            <Skeleton className="h-5 w-1/4 mb-2 rounded" />
            <Skeleton className="h-7 w-3/4 rounded" />
          </CardHeader>
          <CardContent className="p-0 flex-grow mb-4">
            <Skeleton className="h-4 w-full mb-2 rounded" />
            <Skeleton className="h-4 w-full mb-2 rounded" />
            <Skeleton className="h-4 w-5/6 rounded" />
          </CardContent>
          <CardFooter className="p-0 mt-auto flex flex-col items-start gap-2 border-t border-border/50 pt-4">
            <div className="flex items-center w-full">
                <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                <Skeleton className="h-4 w-1/2 rounded" />
            </div>
            <div className="flex items-center w-full">
                <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                <Skeleton className="h-4 w-1/2 rounded" />
            </div>
            <div className="flex items-center w-full">
                <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                <Skeleton className="h-4 w-2/3 rounded" />
            </div>
          </CardFooter>
        </div>
      </Card>
  );
}