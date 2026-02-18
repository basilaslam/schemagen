export function FormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="space-y-2" />
      <div className="space-y-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-32 bg-slate-100 rounded" />
            <div className="h-10 w-full bg-slate-100 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
