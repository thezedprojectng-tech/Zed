export default function AdminCareerNewLoading() {
  return (
    <div className="max-w-[1120px] mx-auto space-y-6 animate-pulse" aria-busy="true">
      {/* Header skeleton */}
      <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="h-6 w-48 rounded-md bg-muted/60" />
      </div>

      {/* 2-column skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div className="space-y-8">
          <div className="h-64 rounded-lg bg-card border border-border p-5 space-y-4">
            <div className="h-5 w-24 rounded-md bg-muted/60" />
            <div className="h-10 rounded-md bg-muted/40" />
            <div className="h-10 rounded-md bg-muted/40" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 rounded-md bg-muted/40" />
              <div className="h-10 rounded-md bg-muted/40" />
            </div>
          </div>
          <div className="h-36 rounded-lg bg-card border border-border p-5 space-y-3">
            <div className="h-5 w-20 rounded-md bg-muted/60" />
            <div className="h-16 rounded-md bg-muted/40" />
          </div>
          <div className="h-48 rounded-lg bg-card border border-border p-5 space-y-3">
            <div className="h-5 w-32 rounded-md bg-muted/60" />
            <div className="h-28 rounded-md bg-muted/40" />
          </div>
        </div>

        <div className="h-80 rounded-lg bg-card border border-border p-5 space-y-4">
          <div className="h-5 w-32 rounded-md bg-muted/60" />
          <div className="h-9 rounded-md bg-muted/40" />
          <div className="h-9 rounded-md bg-muted/40" />
          <div className="h-10 rounded-md bg-muted/60 mt-6" />
        </div>
      </div>
    </div>
  );
}
