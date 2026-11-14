export default function AdminCareersLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading careers">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-2">
          <div className="h-8 w-36 rounded-md bg-muted/60" />
          <div className="h-4 w-64 rounded-md bg-muted/40" />
        </div>
        <div className="h-9 w-28 rounded-md bg-muted/60" />
      </div>

      {/* Toolbar skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="h-9 w-80 rounded-lg bg-muted/50" />
        <div className="flex items-center gap-2">
          <div className="h-9 w-44 rounded-lg bg-muted/50" />
          <div className="h-9 w-32 rounded-lg bg-muted/50" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="h-10 bg-muted/30 border-b border-border/60" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 border-b border-border/40 last:border-b-0 gap-4"
          >
            <div className="space-y-2 flex-1">
              <div className="h-4 w-48 rounded-md bg-muted/60" />
              <div className="h-3 w-28 rounded-md bg-muted/40" />
            </div>
            <div className="h-5 w-20 rounded-md bg-muted/50" />
            <div className="h-5 w-20 rounded-md bg-muted/50" />
            <div className="h-4 w-24 rounded-md bg-muted/40" />
            <div className="h-8 w-16 rounded-md bg-muted/40" />
          </div>
        ))}
      </div>
    </div>
  );
}
