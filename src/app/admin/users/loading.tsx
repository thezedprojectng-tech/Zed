export default function Loading() {
  return (
    <div className="space-y-4 max-w-[1400px] mx-auto animate-pulse">
      <div className="h-7 w-48 rounded-md bg-muted" />
      <div className="h-4 w-72 rounded bg-muted" />
      <div className="h-12 rounded-lg bg-card border border-border" />
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-14 rounded-lg bg-card border border-border" />
      ))}
    </div>
  );
}
