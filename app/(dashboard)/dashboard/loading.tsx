import { Skeleton } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <div className="p-8 max-w-6xl mx-auto animate-pulse space-y-8">
      {/* Header */}
      <div>
        <Skeleton className="w-72 h-9" />
        <Skeleton className="w-96 h-5 mt-2" />
      </div>

      {/* AI Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-white/5 bg-card/80 backdrop-blur-sm p-5 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Skeleton variant="rectangular" className="w-9 h-9" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="w-28 h-3" />
                <Skeleton className="w-36 h-2.5" />
              </div>
            </div>
            <div className="space-y-2.5">
              {[1, 2].map((j) => (
                <div key={j} className="flex items-center gap-2">
                  <Skeleton variant="circular" className="w-2 h-2" />
                  <Skeleton className="flex-1 h-3" />
                  <Skeleton className="w-14 h-3" />
                </div>
              ))}
            </div>
            <Skeleton className="w-full h-2" />
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-white/5 bg-card/80 backdrop-blur-sm p-5"
          >
            <Skeleton variant="rectangular" className="w-10 h-10 mb-4" />
            <Skeleton className="w-20 h-8 mb-1" />
            <Skeleton className="w-32 h-4" />
          </div>
        ))}
      </div>

      {/* CTA */}
      <div
        className="rounded-2xl p-8 mb-8"
        style={{
          background: 'linear-gradient(135deg, hsl(239 84% 67% / 0.12), hsl(262 80% 65% / 0.12))',
          border: '1px solid hsl(239 84% 67% / 0.2)',
        }}
      >
        <Skeleton className="w-28 h-5 mb-3" />
        <Skeleton className="w-80 h-7 mb-2" />
        <Skeleton className="w-96 h-4 mb-6" />
        <Skeleton variant="rectangular" className="w-56 h-12" />
      </div>

      {/* Recent budgets */}
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="w-44 h-5" />
          <Skeleton className="w-20 h-4" />
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-white/5 bg-card/80 backdrop-blur-sm p-4"
          >
            <div className="flex items-center gap-4">
              <Skeleton variant="rectangular" className="w-10 h-10" />
              <div className="flex-1 space-y-2">
                <Skeleton className="w-48 h-4" />
                <Skeleton className="w-32 h-3" />
              </div>
              <Skeleton className="w-16 h-6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
