
// src/components/SeminarCardSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function SeminarCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8 relative overflow-hidden border border-gray-200 flex flex-col">
      <Skeleton className="h-12 w-3/4 mb-6" />
      
      <div className="flex items-center gap-4 mb-5">
        <Skeleton className="w-16 h-16 rounded-xl" />
        <div className="flex justify-between items-start w-full">
          <div>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="w-6 h-6" />
        </div>
      </div>
      
      <div className="flex-grow">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      
      <div className="border-t border-gray-200 pt-5 mt-5">
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
