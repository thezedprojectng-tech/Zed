export default function Loading() {
  return (
    <div className="space-y-4 max-w-[1600px] mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-border/80 pb-3">
        <div className="space-y-1.5">
          <div className="h-6 w-40 rounded-md bg-muted" />
          <div className="h-4 w-56 rounded bg-muted/60" />
        </div>
      </div>

      {/* Master/detail skeleton */}
      <div className="rounded-lg border border-border/80 bg-card overflow-hidden flex flex-col lg:flex-row min-h-[680px]">
        {/* Left list skeleton */}
        <div className="w-full lg:w-[380px] lg:shrink-0 border-r border-border/80 p-3 space-y-3 bg-card">
          <div className="h-8 rounded-md bg-muted/60" />
          <div className="h-7 w-48 rounded bg-muted/50" />
          <div className="space-y-2 pt-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 rounded-md bg-secondary/40 p-2 space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3 w-24 bg-muted rounded" />
                  <div className="h-3 w-10 bg-muted/60 rounded" />
                </div>
                <div className="h-3 w-36 bg-muted/70 rounded" />
                <div className="h-3 w-48 bg-muted/40 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Right pane skeleton */}
        <div className="flex-1 p-6 space-y-4 hidden lg:block bg-card/30">
          <div className="h-6 w-64 bg-muted rounded" />
          <div className="h-20 rounded-lg bg-secondary/40 border border-border/70 p-3" />
          <div className="space-y-2 pt-4">
            <div className="h-4 w-full bg-muted/50 rounded" />
            <div className="h-4 w-5/6 bg-muted/50 rounded" />
            <div className="h-4 w-4/6 bg-muted/50 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
