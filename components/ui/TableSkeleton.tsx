// Table skeleton while data loads.
export function TableSkeleton({ columns, rows = 5 }: { columns?: number; rows?: number }) {
  // `columns` is accepted for call-site clarity; the skeleton renders full-width rows.
  void columns;
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-10 rounded-lg bg-white/10" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 rounded-lg bg-white/5" />
      ))}
    </div>
  );
}
