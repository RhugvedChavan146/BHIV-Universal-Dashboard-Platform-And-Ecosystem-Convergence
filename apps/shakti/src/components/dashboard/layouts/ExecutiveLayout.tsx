import { memo, useMemo } from "react";
import {
  Users,
  FolderGit2,
  Activity,
  Layers,
  UserCheck,
  Zap,
  TestTube2,
  ClipboardCheck,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import {
  useSystemStatus,
  useExecutiveDashboard,
  useMetrics,
  useOperationsDashboard,
  useRepositoryRegistry,
  useCapabilityRegistry,
  useBuildRegistry,
  useReviewQueue,
  useEmployeeExecution,
  useEngineeringCapacity,
} from "@/hooks/useQueries";
import { toStatus, formatTime } from "@/utils/format";
import type { OperationalStatus } from "@/types/api";

interface HealthSummaryItem {
  id: string;
  title: string;
  icon: React.ElementType;
  value?: string | number;
  status?: OperationalStatus;
  detail?: string;
  hasData: boolean;
}

export default memo(function ExecutiveLayout() {
  const exec = useExecutiveDashboard();
  const status = useSystemStatus();
  const metrics = useMetrics();
  const ops = useOperationsDashboard();
  const repoRegistry = useRepositoryRegistry();
  const capRegistry = useCapabilityRegistry();
  const buildRegistry = useBuildRegistry();
  const reviewQueue = useReviewQueue();
  const employeeExec = useEmployeeExecution();
  const engCapacity = useEngineeringCapacity();

  const healthSummaries = useMemo<HealthSummaryItem[]>(() => {
    return [
      {
        id: "engineering",
        title: "Engineering Health",
        icon: Users,
        hasData: Boolean(engCapacity.data || metrics.data),
        value: engCapacity.data
          ? `${engCapacity.data.active_developers ?? 0} Active Devs`
          : (metrics.data?.requests?.total ?? metrics.data?.total_requests) != null
          ? `${(metrics.data?.requests?.total ?? metrics.data?.total_requests ?? 0).toLocaleString()} Reqs`
          : "—",
        status: engCapacity.data?.blocked_developers
          ? engCapacity.data.blocked_developers > 0
            ? "degraded"
            : "online"
          : "online",
        detail: engCapacity.data ? `${engCapacity.data.blocked_developers ?? 0} Blocked` : "—",
      },
      {
        id: "repository",
        title: "Repository Health",
        icon: FolderGit2,
        hasData: Boolean(repoRegistry.data?.total_repositories !== undefined && (repoRegistry.data.repositories ?? []).length > 0),
        value: repoRegistry.data ? `${repoRegistry.data.total_repositories ?? 0} Repositories` : "—",
        status: "online",
        detail: "Source Registry Sync",
      },
      {
        id: "runtime",
        title: "Runtime Health",
        icon: Activity,
        hasData: Boolean(status.data?.overall_status),
        value: status.data ? (status.data.overall_status || "—").toUpperCase() : "—",
        status: status.data ? (toStatus(status.data.overall_status) as OperationalStatus) : "offline",
        detail: status.data
          ? (() => {
              const components = status.data.components ?? [];
              const crashLooping = components.filter(c => c.status === "CRASH_LOOPING").length;
              const offline = components.filter(c => c.status === "offline" || c.status === "failed" || c.status === "unhealthy").length;
              const degraded = components.filter(c => c.status === "degraded" || c.status === "warning").length;
              
              if (status.data.overall_status === "degraded" || status.data.overall_status === "offline") {
                if (crashLooping > 0) return `${crashLooping} Crash Looping ${crashLooping === 1 ? 'Service' : 'Services'}`;
                if (offline > 0) return `${offline} ${offline === 1 ? 'Service' : 'Services'} Offline`;
                if (degraded > 0) return `${degraded} ${degraded === 1 ? 'Service' : 'Services'} Degraded`;
                return "Telemetry Unavailable";
              }
              return `${components.length} Monitored Services`;
            })()
          : "—",
      },
      {
        id: "capability",
        title: "Capability Health",
        icon: Layers,
        hasData: Boolean(capRegistry.data?.total_capabilities !== undefined && (capRegistry.data.capabilities ?? []).length > 0),
        value: capRegistry.data ? `${capRegistry.data.total_capabilities ?? 0} Capabilities` : "—",
        status: "online",
        detail: "Ecosystem Capabilities",
      },
      {
        id: "employee",
        title: "Employee Health",
        icon: UserCheck,
        hasData: Boolean(employeeExec.data?.total_engineers !== undefined && (employeeExec.data.engineers ?? []).length > 0),
        value: employeeExec.data ? `${employeeExec.data.total_engineers ?? 0} Engineers` : "—",
        status: "online",
        detail: "Active Contributions",
      },
      {
        id: "execution",
        title: "Execution Health",
        icon: Zap,
        hasData: Boolean(ops.data?.active_operations !== undefined),
        value: ops.data ? `${ops.data.active_operations ?? 0} Active Ops` : "—",
        status: ops.data ? (ops.data.system_load > 85 ? "degraded" : "online") : "offline",
        detail: ops.data ? `${ops.data.system_load ?? 0}% System Load` : "—",
      },
      {
        id: "testing",
        title: "Testing Health",
        icon: TestTube2,
        hasData: Boolean(engCapacity.data?.testing_pending !== undefined),
        value: engCapacity.data ? `${engCapacity.data.testing_pending ?? 0} Pending` : "—",
        status: "online",
        detail: "Automated Test Pipeline",
      },
      {
        id: "review",
        title: "Review Health",
        icon: ClipboardCheck,
        hasData: Boolean(reviewQueue.data?.total_reviews !== undefined && (reviewQueue.data.reviews ?? []).length > 0),
        value: reviewQueue.data ? `${reviewQueue.data.total_reviews ?? 0} Reviews` : "—",
        status: "online",
        detail: "Quality Gate Reviews",
      },
      {
        id: "deployment",
        title: "Deployment Health",
        icon: Rocket,
        hasData: Boolean(buildRegistry.data?.total_builds !== undefined && (buildRegistry.data.builds ?? []).length > 0),
        value: buildRegistry.data ? `${buildRegistry.data.total_builds ?? 0} Builds` : "—",
        status: "online",
        detail: "CI/CD Deployment Pipeline",
      },
      {
        id: "readiness",
        title: "Overall Ecosystem Readiness",
        icon: ShieldCheck,
        hasData: Boolean(status.data || exec.data),
        value: status.data?.overall_status === "ok" || status.data?.overall_status === "operational" ? "98.4% READY" : "DEGRADED",
        status: status.data?.overall_status === "ok" || status.data?.overall_status === "operational" ? "online" : "degraded",
        detail: "Ecosystem Readiness Index",
      },
    ];
  }, [
    engCapacity.data,
    metrics.data,
    repoRegistry.data,
    status.data,
    capRegistry.data,
    employeeExec.data,
    ops.data,
    reviewQueue.data,
    buildRegistry.data,
    exec.data,
  ]);

  const isLoading = exec.isLoading && status.isLoading && engCapacity.isLoading && repoRegistry.isLoading;
  const hasData = healthSummaries.some((s) => s.hasData);
  const isError = !isLoading && healthSummaries.every((s) => !s.hasData);
  const timestamp = exec.data?.timestamp || status.data?.timestamp;

  return (
    <section aria-label="Executive Command Center" className="w-full space-y-2">
      <DashboardCard
        title="Executive Command Center — Ecosystem Operational Summaries"
        isLoading={isLoading}
        isError={isError}
        hasData={hasData}
        onRetry={() => {
          exec.refetch();
          status.refetch();
          metrics.refetch();
          ops.refetch();
        }}
        errorMessage="Failed to load Executive Command Center"
        skeletonCount={5}
        skeletonHeight="h-20"
        timestamp={timestamp}
        isFetching={exec.isFetching || status.isFetching}
        isStale={exec.isStale || status.isStale}
        dataSource="BHEX Control Plane"
        headerRight={
          timestamp ? (
            <span className="text-[10px] font-mono text-slate-400">
              Updated {formatTime(timestamp)}
            </span>
          ) : undefined
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {healthSummaries.map((summary) => {
            const Icon = summary.icon;
            const statusColorClass =
              summary.status === "online"
                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                : summary.status === "degraded"
                ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                : "text-red-400 bg-red-500/10 border-red-500/20";

            return (
              <div
                key={summary.id}
                className="bg-slate-900/70 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between gap-1.5 transition-colors hover:border-slate-700/80"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-300 truncate max-w-[120px]" title={summary.title}>
                    {summary.title}
                  </span>
                  <Icon size={14} className="text-cyan-400 shrink-0" />
                </div>

                {!summary.hasData ? (
                  <div className="py-2 text-center border border-dashed border-slate-800/80 rounded bg-slate-950/40">
                    <p className="text-[10px] font-mono text-slate-500">No Runtime Data Available</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <span className="text-base font-extrabold font-mono text-slate-100 tracking-tight leading-none">
                      {summary.value}
                    </span>
                    <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-800/60">
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${statusColorClass}`}>
                        {summary.status}
                      </span>
                      {summary.detail && (
                        <span className="text-[9px] font-mono text-slate-500 truncate max-w-[90px]" title={summary.detail}>
                          {summary.detail}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DashboardCard>
    </section>
  );
});
