import { memo } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { useRepositoryRegistry } from "@/hooks/useQueries";
import { formatTime } from "@/utils/format";
import { GitBranch, FolderGit2 } from "lucide-react";

export default memo(function RepositoryRegistryLayout() {
  const { data, isLoading, isError, refetch, isFetching, isStale } = useRepositoryRegistry();

  const repositories = data?.repositories ?? [];
  const timestamp = data?.timestamp;

  return (
    <DashboardCard
      title="Repository Registry"
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
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {repositories.length} Repositories
          </span>
        ) : undefined
      }
    >
      <div className="flex flex-col h-full min-h-0">
        {repositories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 flex-1 border border-dashed border-slate-800 rounded-lg bg-slate-900/30">
            <FolderGit2 className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
            <p className="text-xs font-mono text-slate-400 font-medium">No repositories synchronized</p>
            <span className="text-[10px] text-slate-600 mt-1">No runtime records available</span>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 max-h-[320px] custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[960px]">
              <thead className="sticky top-0 bg-slate-900/95 backdrop-blur z-10">
                <tr className="border-b border-slate-700/60 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                  <th className="py-1.5 px-2">Repository</th>
                  <th className="py-1.5 px-2">Owner</th>
                  <th className="py-1.5 px-2">Layer</th>
                  <th className="py-1.5 px-2">Capability</th>
                  <th className="py-1.5 px-2">Branch</th>
                  <th className="py-1.5 px-2">Status</th>
                  <th className="py-1.5 px-2 text-right">Last Commit</th>
                  <th className="py-1.5 px-2 text-right">Last Activity</th>
                  <th className="py-1.5 px-2 text-center">Review</th>
                  <th className="py-1.5 px-2 text-center">Migration</th>
                  <th className="py-1.5 px-2 text-center">Docs</th>
                  <th className="py-1.5 px-2 text-center">Integration</th>
                </tr>
              </thead>
              <tbody>
                {repositories.map((repo, idx) => (
                  <tr
                    key={repo.repository || idx}
                    className="border-b border-slate-800/60 hover:bg-slate-800/30 text-[11px] text-slate-200 transition-colors"
                  >
                    <td className="py-1 px-2 font-mono font-medium text-cyan-400 truncate max-w-[140px]" title={repo.repository}>
                      {repo.repository}
                    </td>
                    <td className="py-1 px-2 text-slate-300 truncate max-w-[90px]" title={repo.owner}>
                      {repo.owner}
                    </td>
                    <td className="py-1 px-2 text-slate-400 font-mono text-[10px]">{repo.layer}</td>
                    <td className="py-1 px-2 text-slate-400 truncate max-w-[100px]" title={repo.capability}>
                      {repo.capability}
                    </td>
                    <td className="py-1 px-2">
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-300 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700/50">
                        <GitBranch size={10} className="text-slate-400" />
                        {repo.branch}
                      </span>
                    </td>
                    <td className="py-1 px-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {repo.status}
                      </span>
                    </td>
                    <td className="py-1 px-2 text-right font-mono text-[10px] text-slate-400">{repo.last_commit}</td>
                    <td className="py-1 px-2 text-right font-mono text-[10px] text-slate-400">{repo.last_activity}</td>
                    <td className="py-1 px-2 text-center font-mono text-[10px] text-slate-300">{repo.review_status}</td>
                    <td className="py-1 px-2 text-center font-mono text-[10px] text-slate-300">{repo.migration_status}</td>
                    <td className="py-1 px-2 text-center font-mono text-[10px] text-slate-300">{repo.documentation_status}</td>
                    <td className="py-1 px-2 text-center font-mono text-[10px] text-slate-300">{repo.integration_status}</td>
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
