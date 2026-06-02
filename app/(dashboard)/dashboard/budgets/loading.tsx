import { Skeleton } from '@/components/ui/Skeleton';

export default function BudgetsLoading() {
  return (
    <div className="p-8 max-w-6xl mx-auto animate-pulse space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Skeleton className="w-48 h-8" />
          <Skeleton className="w-36 h-4 mt-1" />
        </div>
        <Skeleton variant="rectangular" className="w-40 h-10" />
      </div>

      {/* List items */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-white/5 bg-card/80 backdrop-blur-sm p-5"
          >
            <div className="flex items-center gap-5">
              <Skeleton variant="rectangular" className="w-12 h-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-52 h-5" />
                  <Skeleton className="w-14 h-5" />
                </div>
                <Skeleton className="w-64 h-3" />
              </div>
              <div className="text-right space-y-1">
                <Skeleton className="w-24 h-6" />
                <Skeleton className="w-10 h-3 ml-auto" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
