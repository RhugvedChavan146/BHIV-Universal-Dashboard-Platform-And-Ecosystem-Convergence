import { memo, useState, useMemo } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { useCapabilityRegistry } from "@/hooks/useQueries";
import { formatTime } from "@/utils/format";
import { Cpu, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { CapabilityRegistryItem } from "@/types/runtime";

type SortField = keyof CapabilityRegistryItem;
type SortDirection = "asc" | "desc";

export default memo(function CapabilityRegistryLayout() {
  const { data, isLoading, isError, refetch, isFetching, isStale } = useCapabilityRegistry();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("capability_name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const rawCapabilities = data?.capabilities ?? [];
  const timestamp = data?.timestamp;

  // Search filtering
  const filteredCapabilities = useMemo(() => {
    if (!searchTerm.trim()) return rawCapabilities;
    const term = searchTerm.toLowerCase();
    return rawCapabilities.filter((item) => {
      const nameMatch = item.capability_name?.toLowerCase().includes(term);
      const layerMatch = item.layer?.toLowerCase().includes(term);
      const ownerMatch = item.owner?.toLowerCase().includes(term);
      const repoMatch = item.repository?.toLowerCase().includes(term);
      const statusMatch = item.integration_status?.toLowerCase().includes(term);
      return nameMatch || layerMatch || ownerMatch || repoMatch || statusMatch;
    });
  }, [rawCapabilities, searchTerm]);

  // Column sorting
  const sortedCapabilities = useMemo(() => {
    return [...filteredCapabilities].sort((a, b) => {
      let valA: any = a[sortField] ?? "";
      let valB: any = b[sortField] ?? "";

      if (Array.isArray(valA)) valA = valA.length;
      if (Array.isArray(valB)) valB = valB.length;

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredCapabilities, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={10} className="text-slate-600 ml-1" />;
    return sortDirection === "asc" ? (
      <ArrowUp size={10} className="text-cyan-400 ml-1" />
    ) : (
      <ArrowDown size={10} className="text-cyan-400 ml-1" />
    );
  };

  const getHealthBadge = (health: string) => {
    const h = health?.toLowerCase() || "";
    if (h === "healthy" || h === "operational" || h === "ok") {
      return (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {health}
        </span>
      );
    }
    if (h === "degraded" || h === "warning") {
      return (
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          {health}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        {health || "unknown"}
      </span>
    );
  };

  return (
    <DashboardCard
      title="Capability Registry"
      isLoading={isLoading}
      isError={isError}
      hasData={data !== undefined}
      onRetry={() => refetch()}
      errorTitle="Capability Registry Unavailable"
      errorMessage="Waiting for runtime synchronization"
      skeletonCount={6}
      skeletonHeight="h-7"
      timestamp={timestamp}
      isFetching={isFetching}
      isStale={isStale}
      dataSource="BHEX Control Plane"
      headerRight={
        data ? (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {rawCapabilities.length} Capabilities
          </span>
        ) : undefined
      }
    >
      <div className="flex flex-col h-full min-h-0 gap-2">
        {/* Search Bar */}
        <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded border border-slate-800 shrink-0">
          <Search size={12} className="text-slate-500 ml-1" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search capability name, layer, owner, repository..."
            className="w-full bg-transparent text-[11px] font-mono text-slate-200 placeholder-slate-600 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-[10px] font-mono text-slate-500 hover:text-slate-300 px-1"
            >
              Clear
            </button>
          )}
        </div>
 
        {rawCapabilities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 flex-1 border border-dashed border-slate-800 rounded-lg bg-slate-900/30">
            <Cpu className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
            <p className="text-xs font-mono text-slate-400 font-medium">Capability synchronization pending</p>
            <span className="text-[10px] text-slate-600 mt-1">No runtime records available</span>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 max-h-[320px] custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="sticky top-0 bg-slate-900/95 backdrop-blur z-10">
                <tr className="border-b border-slate-700/60 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                  <th className="py-1.5 px-2 cursor-pointer hover:text-slate-200" onClick={() => handleSort("capability_name")}>
                    <div className="flex items-center">
                      Capability Name {renderSortIcon("capability_name")}
                    </div>
                  </th>
                  <th className="py-1.5 px-2 cursor-pointer hover:text-slate-200" onClick={() => handleSort("layer")}>
                    <div className="flex items-center">
                      Layer {renderSortIcon("layer")}
                    </div>
                  </th>
                  <th className="py-1.5 px-2 text-center">Consumers</th>
                  <th className="py-1.5 px-2 text-center">Providers</th>
                  <th className="py-1.5 px-2 cursor-pointer hover:text-slate-200" onClick={() => handleSort("owner")}>
                    <div className="flex items-center">
                      Owner {renderSortIcon("owner")}
                    </div>
                  </th>
                  <th className="py-1.5 px-2 cursor-pointer hover:text-slate-200" onClick={() => handleSort("repository")}>
                    <div className="flex items-center">
                      Repository {renderSortIcon("repository")}
                    </div>
                  </th>
                  <th className="py-1.5 px-2 text-center font-mono">Version</th>
                  <th className="py-1.5 px-2 text-center cursor-pointer hover:text-slate-200" onClick={() => handleSort("runtime_health")}>
                    <div className="flex items-center justify-center">
                      Runtime Health {renderSortIcon("runtime_health")}
                    </div>
                  </th>
                  <th className="py-1.5 px-2 text-center cursor-pointer hover:text-slate-200" onClick={() => handleSort("integration_status")}>
                    <div className="flex items-center justify-center">
                      Integration Status {renderSortIcon("integration_status")}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedCapabilities.map((cap, idx) => (
                  <tr
                    key={cap.capability_name || idx}
                    className="border-b border-slate-800/60 hover:bg-slate-800/30 text-[11px] text-slate-200 transition-colors"
                  >
                    <td className="py-1 px-2 font-mono font-medium text-cyan-400 truncate max-w-[140px]" title={cap.capability_name}>
                      {cap.capability_name}
                    </td>
                    <td className="py-1 px-2 text-slate-400 font-mono text-[10px]">{cap.layer}</td>
                    <td className="py-1 px-2 text-center font-mono text-[10px] text-slate-300">
                      {Array.isArray(cap.consumers) ? cap.consumers.join(", ") : cap.consumers}
                    </td>
                    <td className="py-1 px-2 text-center font-mono text-[10px] text-slate-300">
                      {Array.isArray(cap.providers) ? cap.providers.join(", ") : cap.providers}
                    </td>
                    <td className="py-1 px-2 text-slate-300 truncate max-w-[90px]" title={cap.owner}>
                      {cap.owner}
                    </td>
                    <td className="py-1 px-2 font-mono text-[10px] text-slate-400 truncate max-w-[120px]" title={cap.repository}>
                      {cap.repository}
                    </td>
                    <td className="py-1 px-2 text-center font-mono text-[10px] text-slate-300">{cap.version}</td>
                    <td className="py-1 px-2 text-center">{getHealthBadge(cap.runtime_health)}</td>
                    <td className="py-1 px-2 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {cap.integration_status}
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
            <span>BHEX Architecture Grid</span>
            <span>Updated {formatTime(data.timestamp)}</span>
          </div>
        )}
      </div>
    </DashboardCard>
  );
});
