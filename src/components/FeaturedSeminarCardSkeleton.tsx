
// src/components/FeaturedSeminarCardSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function FeaturedSeminarCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg w-full p-8 relative overflow-hidden border border-gray-200 flex flex-col md:flex-row items-center gap-8">
      <div className="md:w-1/3 w-full">
        <Skeleton className="w-full h-64 rounded-xl" />
      </div>
      <div className="md:w-2/3 w-full">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="w-16 h-16 rounded-full" />
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
        <div className="border-t border-gray-200 pt-5 mt-5">
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  );
}
