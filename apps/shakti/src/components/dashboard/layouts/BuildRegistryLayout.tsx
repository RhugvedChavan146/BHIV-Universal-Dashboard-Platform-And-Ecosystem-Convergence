import { memo } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { useBuildRegistry } from "@/hooks/useQueries";
import { formatTime } from "@/utils/format";
import { GitBranch, Box } from "lucide-react";

export default memo(function BuildRegistryLayout() {
  const { data, isLoading, isError, refetch, isFetching, isStale } = useBuildRegistry();

  const builds = data?.builds ?? [];
  const timestamp = data?.timestamp;

  return (
    <DashboardCard
      title="Build Registry"
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
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {builds.length} Builds
          </span>
        ) : undefined
      }
    >
      <div className="flex flex-col h-full min-h-0">
        {builds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 flex-1 border border-dashed border-slate-800 rounded-lg bg-slate-900/30">
            <Box className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
            <p className="text-xs font-mono text-slate-400 font-medium">No runtime records available</p>
            <span className="text-[10px] text-slate-600 mt-1">Build Registry endpoint has no active build pipeline data</span>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 max-h-[320px] custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead className="sticky top-0 bg-slate-900/95 backdrop-blur z-10">
                <tr className="border-b border-slate-700/60 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                  <th className="py-1.5 px-2">Build ID</th>
                  <th className="py-1.5 px-2">Repository</th>
                  <th className="py-1.5 px-2">Branch</th>
                  <th className="py-1.5 px-2">Pipeline Status</th>
                  <th className="py-1.5 px-2 text-right">Duration</th>
                  <th className="py-1.5 px-2">Deployment Status</th>
                  <th className="py-1.5 px-2 text-center">Evidence</th>
                  <th className="py-1.5 px-2 text-center">Release Readiness</th>
                </tr>
              </thead>
              <tbody>
                {builds.map((build, idx) => (
                  <tr
                    key={build.build_id || idx}
                    className="border-b border-slate-800/60 hover:bg-slate-800/30 text-[11px] text-slate-200 transition-colors"
                  >
                    <td className="py-1 px-2 font-mono font-medium text-amber-400 truncate max-w-[110px]" title={build.build_id}>
                      {build.build_id}
                    </td>
                    <td className="py-1 px-2 text-slate-300 font-mono text-[10px] truncate max-w-[130px]" title={build.repository}>
                      {build.repository}
                    </td>
                    <td className="py-1 px-2">
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-300 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">
                        <GitBranch size={10} className="text-slate-400" />
                        {build.branch}
                      </span>
                    </td>
                    <td className="py-1 px-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {build.pipeline_status}
                      </span>
                    </td>
                    <td className="py-1 px-2 text-right font-mono text-[10px] text-slate-400">
                      {typeof build.build_duration === "number" ? `${build.build_duration}s` : build.build_duration}
                    </td>
                    <td className="py-1 px-2 text-slate-300 font-mono text-[10px]">{build.deployment_status}</td>
                    <td className="py-1 px-2 text-center font-mono text-[10px] text-slate-300">{build.evidence}</td>
                    <td className="py-1 px-2 text-center font-mono text-[10px]">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {build.release_readiness}
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
            <span>BHEX Operational Surface</span>
            <span>Updated {formatTime(data.timestamp)}</span>
          </div>
        )}
      </div>
    </DashboardCard>
  );
});
