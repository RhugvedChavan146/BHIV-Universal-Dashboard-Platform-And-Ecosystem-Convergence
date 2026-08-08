import { memo } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { useReviewQueue } from "@/hooks/useQueries";
import { formatTime } from "@/utils/format";
import { ClipboardCheck } from "lucide-react";

export default memo(function ReviewQueueLayout() {
  const { data, isLoading, isError, refetch, isFetching, isStale } = useReviewQueue();

  const reviews = data?.reviews ?? [];
  const timestamp = data?.timestamp;

  return (
    <DashboardCard
      title="Review Queue"
      isLoading={isLoading}
      isError={isError}
      hasData={data !== undefined}
      onRetry={() => refetch()}
      errorTitle="Integration Pending"
      errorMessage="Waiting for runtime source"
      skeletonCount={6}
      skeletonHeight="h-7"
      timestamp={timestamp}
      isFetching={isFetching}
      isStale={isStale}
      dataSource="BHEX Control Plane"
      headerRight={
        data ? (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {reviews.length} Pending Reviews
          </span>
        ) : undefined
      }
    >
      <div className="flex flex-col h-full min-h-0">
        {reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 flex-1 border border-dashed border-slate-800 rounded-lg bg-slate-900/30">
            <ClipboardCheck className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
            <p className="text-xs font-mono text-slate-400 font-medium">No reviews in queue</p>
            <span className="text-[10px] text-slate-600 mt-1">No runtime records available</span>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 max-h-[320px] custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead className="sticky top-0 bg-slate-900/95 backdrop-blur z-10">
                <tr className="border-b border-slate-700/60 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                  <th className="py-1.5 px-2">Submission</th>
                  <th className="py-1.5 px-2">Engineer</th>
                  <th className="py-1.5 px-2">Reviewer</th>
                  <th className="py-1.5 px-2">Review Status</th>
                  <th className="py-1.5 px-2">Testing Status</th>
                  <th className="py-1.5 px-2 text-right">Required Fixes</th>
                  <th className="py-1.5 px-2 text-center">Priority</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((item, idx) => (
                  <tr
                    key={item.submission || idx}
                    className="border-b border-slate-800/60 hover:bg-slate-800/30 text-[11px] text-slate-200 transition-colors"
                  >
                    <td className="py-1 px-2 font-mono font-medium text-indigo-400 truncate max-w-[130px]" title={item.submission}>
                      {item.submission}
                    </td>
                    <td className="py-1 px-2 text-slate-300 truncate max-w-[100px]" title={item.engineer}>
                      {item.engineer}
                    </td>
                    <td className="py-1 px-2 text-slate-300 truncate max-w-[100px]" title={item.reviewer}>
                      {item.reviewer}
                    </td>
                    <td className="py-1 px-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {item.review_status}
                      </span>
                    </td>
                    <td className="py-1 px-2 font-mono text-[10px] text-slate-300">{item.testing_status}</td>
                    <td className="py-1 px-2 text-right font-mono text-[10px] text-slate-400">
                      {item.required_fixes}
                    </td>
                    <td className="py-1 px-2 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {item.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && (
          <div className="flex justify-between items-center text-[10px] text-slate-500 shrink-0 pt-1.5 border-t border-slate-800">
            <span>BHEX Quality Gate</span>
            <span>Updated {formatTime(data.timestamp)}</span>
          </div>
        )}
      </div>
    </DashboardCard>
  );
});
