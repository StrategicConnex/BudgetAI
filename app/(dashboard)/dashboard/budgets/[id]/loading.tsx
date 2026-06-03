import { Skeleton } from '@/components/ui/Skeleton';

export default function BudgetDetailLoading() {
  return (
    <div className="p-8 max-w-6xl mx-auto animate-pulse space-y-6">
      {/* Header back + buttons */}
      <div className="flex items-center justify-between">
        <Skeleton className="w-40 h-4" />
        <div className="flex items-center gap-3">
          <Skeleton variant="rectangular" className="w-28 h-9" />
          <Skeleton variant="rectangular" className="w-24 h-9" />
          <Skeleton variant="rectangular" className="w-24 h-9" />
          <Skeleton variant="rectangular" className="w-20 h-9" />
        </div>
      </div>

      {/* Main card */}
      <div className="rounded-2xl border border-white/5 bg-card/80 backdrop-blur-sm overflow-hidden shadow-lg">
        {/* Card header */}
        <div
          className="px-8 py-6 border-b border-border"
          style={{ background: 'linear-gradient(135deg, hsl(239 84% 67% / 0.08), hsl(262 80% 65% / 0.08))' }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-12 space-y-3">
              <Skeleton className="w-16 h-5" />
              <Skeleton className="w-72 h-7" />
              <Skeleton className="w-96 h-4" />
            </div>
            <div className="text-right space-y-2">
              <Skeleton className="w-24 h-6 ml-auto" />
              <Skeleton className="w-16 h-3 ml-auto" />
              <Skeleton className="w-14 h-5 ml-auto" />
            </div>
          </div>
        </div>

        {/* Client + Conditions grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-b border-border">
          <div className="px-8 py-5 border-b md:border-b-0 md:border-r border-border space-y-3">
            <Skeleton className="w-16 h-3" />
            <Skeleton className="w-44 h-5" />
            <Skeleton className="w-36 h-4" />
            <Skeleton className="w-52 h-3" />
          </div>
          <div className="px-8 py-5 space-y-3">
            <Skeleton className="w-20 h-3" />
            <Skeleton className="w-28 h-4" />
            <Skeleton className="w-40 h-4" />
            <Skeleton className="w-64 h-3" />
          </div>
        </div>

        {/* Items section */}
        <div className="px-8 py-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-16 h-3" />
          </div>

          {/* Column headers */}
          <div
            className="grid grid-cols-12 gap-2 px-4 py-2 rounded-lg"
            style={{ background: 'linear-gradient(135deg, hsl(239 84% 67% / 0.7), hsl(262 80% 65% / 0.7))' }}
          >
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className={`h-3 ${i <= 1 ? 'col-span-5' : i <= 2 ? 'col-span-2' : i <= 3 ? 'col-span-1' : 'col-span-2'}`} />
            ))}
          </div>

          {/* Category rows */}
          {[1, 2, 3].map(cat => (
            <div key={cat} className="space-y-1">
              <div className="px-4 py-1.5 rounded-md" style={{ background: 'hsl(239 84% 67% / 0.07)' }}>
                <Skeleton className="w-24 h-3" />
              </div>
              {[1, 2].map(item => (
                <div key={item} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border/50">
                  <div className="col-span-5 space-y-1.5">
                    <Skeleton className="w-48 h-4" />
                    <Skeleton className="w-64 h-3" />
                  </div>
                  <div className="col-span-2"><Skeleton className="w-10 h-3" /></div>
                  <div className="col-span-1"><Skeleton className="w-8 h-3 ml-auto" /></div>
                  <div className="col-span-2"><Skeleton className="w-14 h-3 ml-auto" /></div>
                  <div className="col-span-2"><Skeleton className="w-14 h-3 ml-auto" /></div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="px-8 py-6 border-t border-border flex justify-end">
          <div className="w-72 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="w-16 h-4" />
              <Skeleton className="w-20 h-4" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="w-20 h-4" />
              <Skeleton className="w-20 h-4" />
            </div>
            <div
              className="flex justify-between items-center px-4 py-3 rounded-xl mt-3"
              style={{ background: 'linear-gradient(135deg, hsl(239 84% 67% / 0.7), hsl(262 80% 65% / 0.7))' }}
            >
              <Skeleton className="w-12 h-4" />
              <Skeleton className="w-20 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-4">
        <Skeleton variant="rectangular" className="w-24 h-10" />
        <Skeleton variant="rectangular" className="w-28 h-10" />
      </div>
    </div>
  );
}
