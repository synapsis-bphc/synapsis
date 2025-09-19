
// src/components/DatabaseMemberCardSkeleton.tsx
import { Skeleton } from "@/components/ui/skeleton";

export function DatabaseMemberCardSkeleton() {
  return (
    <div className="relative w-full max-w-xs mx-auto bg-white rounded-xl overflow-hidden shadow-lg">
      <Skeleton className="w-full h-64 rounded-t-xl" />

      <div className="relative bg-white p-6 rounded-xl shadow-md -mt-6 mx-4 mb-4">
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
