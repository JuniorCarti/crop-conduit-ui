export function BuyerProfileSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-20 animate-pulse rounded-xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-44 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
