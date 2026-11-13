export default function Loading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse p-4 sm:p-6">
      <div className="h-7 w-56 rounded-md bg-muted" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-card border border-border" />
        ))}
      </div>
      <div className="h-10 w-80 rounded-lg bg-muted" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-32 rounded-lg bg-card border border-border" />
      ))}
    </div>
  );
}
