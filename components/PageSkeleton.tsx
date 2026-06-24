import { Skeleton } from "@/components/ui/skeleton";

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Club selector */}
      <div className="flex gap-1"><Skeleton className="h-7 w-12" /><Skeleton className="h-7 w-16" /><Skeleton className="h-7 w-14" /><Skeleton className="h-7 w-12" /></div>
      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      {/* 2-col charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
      {/* 3-col charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-44 rounded-xl" />
      </div>
      {/* Table */}
      <Skeleton className="h-32 rounded-xl" />
    </div>
  );
}

function ShotsSkeleton() {
  return (
    <div className="p-6 space-y-3">
      {/* Controls row */}
      <div className="flex gap-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-8 w-24 ml-auto" /></div>
      {/* Table header */}
      <Skeleton className="h-9 rounded-t-lg" />
      {/* Table rows */}
      {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
    </div>
  );
}

function BagSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex gap-2"><Skeleton className="h-8 w-32 ml-auto" /></div>
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 space-y-2 w-full">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
        </div>
        <Skeleton className="w-full lg:w-72 h-96 rounded-xl shrink-0" />
      </div>
    </div>
  );
}

function CompareSkeleton() {
  return (
    <div className="p-6 space-y-8">
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

export const PAGE_SKELETONS = {
  dashboard: DashboardSkeleton,
  shots:     ShotsSkeleton,
  bag:       BagSkeleton,
  compare:   CompareSkeleton,
} as const;

export type SkeletonPage = keyof typeof PAGE_SKELETONS;
