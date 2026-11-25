export default function AdminTrackDetailLoading() {
  return (
    <div
      className="max-w-[1120px] mx-auto space-y-6 animate-pulse motion-reduce:animate-none"
      aria-busy="true"
    >
      {/* Header skeleton */}
      <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="h-6 w-48 rounded-md bg-muted/60" />
        <div className="h-8 w-36 rounded-lg bg-muted/40" />
      </div>

      {/* 2-column skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
        <div className="space-y-8">
          {/* Track details card skeleton */}
          <div className="h-56 rounded-lg bg-card border border-border/70 p-5 space-y-4">
            <div className="h-5 w-28 rounded-md bg-muted/60" />
            <div className="h-10 rounded-lg bg-muted/40" />
            <div className="h-20 rounded-lg bg-muted/40" />
          </div>

          {/* Pricing and rules skeleton */}
          <div className="h-52 rounded-lg bg-card border border-border/70 p-5 space-y-4">
            <div className="h-5 w-36 rounded-md bg-muted/60" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 rounded-lg bg-muted/40" />
              <div className="h-10 rounded-lg bg-muted/40" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 rounded-lg bg-muted/40" />
              <div className="h-10 rounded-lg bg-muted/40" />
            </div>
          </div>

          {/* Lessons list skeleton */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-24 rounded-md bg-muted/60" />
              <div className="flex gap-2">
                <div className="h-8 w-28 rounded-lg bg-muted/40" />
                <div className="h-8 w-28 rounded-lg bg-muted/40" />
              </div>
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-lg bg-card border border-border/70 p-4 flex items-center justify-between"
              >
                <div className="h-4 w-40 rounded-md bg-muted/50" />
                <div className="h-6 w-20 rounded-md bg-muted/40" />
              </div>
            ))}
          </div>
        </div>

        {/* Right card skeleton */}
        <div className="h-64 rounded-lg bg-card border border-border/70 p-5 space-y-4">
          <div className="h-5 w-28 rounded-md bg-muted/60" />
          <div className="h-8 rounded-lg bg-muted/40" />
          <div className="h-16 rounded-lg bg-muted/30" />
        </div>
      </div>
    </div>
  );
}
