import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAuditLogLoading() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border/70">
        <div className="flex items-start gap-3.5">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      {/* Toolbar skeleton */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-56" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="border-b border-border bg-secondary/20 px-4 py-3 flex gap-6">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 flex-1" />
        </div>
        <div className="divide-y divide-border/60">
          {Array.from({ length: 10 }).map((_, i) => (
            <React.Fragment key={i}>
              {i === 3 && (
                <div className="px-4 pt-4 pb-1">
                  <Skeleton className="h-3 w-20" />
                </div>
              )}
              <div className="px-4 py-3 flex items-center gap-6">
                <Skeleton className="h-4 w-20 shrink-0" />
                <div className="flex items-center gap-2 shrink-0">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-5 w-24 rounded-full shrink-0" />
                <Skeleton className="h-4 w-28 shrink-0" />
                <Skeleton className="h-4 flex-1" />
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
