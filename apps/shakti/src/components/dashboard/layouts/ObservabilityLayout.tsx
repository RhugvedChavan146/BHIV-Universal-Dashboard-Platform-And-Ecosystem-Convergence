import { memo, useMemo } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { TelemetryCard } from "@/components/dashboard/primitives/TelemetryCard";

import { useTelemetryDashboard } from "@/hooks/useQueries";
import { useMetricsScaleStatus, useMetricsQueryPerformance } from "@/hooks/useBucketQueries";
import { usePranaPropagationLog } from "@/hooks/usePranaQueries";

import { useInsightFlowStageMetrics } from "@/hooks/useInsightFlowQueries";
import { formatTime } from "@/utils/format";

export default memo(function ObservabilityLayout() {
  const telemetry = useTelemetryDashboard();
  const scaleStatus = useMetricsScaleStatus();
  const queryPerf = useMetricsQueryPerformance();
  const pranaLog = usePranaPropagationLog();

  const stageMetrics = useInsightFlowStageMetrics();

  const data = telemetry.data;
  const pranaLogs = pranaLog.data?.logs ?? [];

  // Map telemetry data points, PRANA propagation logs, or scale status to chart series
  const chartData = useMemo(() => {
    if (pranaLogs.length > 0) {
      return pranaLogs.map((log) => ({
        time: formatTime(log.logged_at),
        response: log.http_status != null ? log.http_status : (log.status === "success" ? 200 : 500),
        rate: log.attempt != null ? log.attempt : 1,
      }));
    }
    if (data?.metrics?.response_times && data.metrics.response_times.length > 0) {
      return data.metrics.response_times.map((rt, i) => ({
        time: rt ? formatTime(rt.timestamp) : "",
        response: rt && rt.value != null ? +rt.value.toFixed(1) : 0,
        rate: data.metrics?.event_rates?.[i]?.value != null ? +(data.metrics.event_rates[i].value).toFixed(1) : 0,
      }));
    }
    const hasMeaningfulBucketTelemetry = Boolean(
      (queryPerf.data && (
        (queryPerf.data.p50_ms ?? 0) > 0 ||
        (queryPerf.data.p99_ms ?? 0) > 0 ||
        (queryPerf.data.p999_ms ?? 0) > 0 ||
        (queryPerf.data.queries_per_sec ?? 0) > 0
      )) ||
      (scaleStatus.data && (
        (scaleStatus.data.concurrent_writes?.current ?? 0) > 0 ||
        (scaleStatus.data.write_throughput?.current_writes_per_sec ?? 0) > 0
      ))
    );

    if (hasMeaningfulBucketTelemetry) {
      const now = formatTime(new Date().toISOString());
      return [
        { time: now, response: queryPerf.data?.p50_ms ?? 0, rate: scaleStatus.data?.concurrent_writes?.current ?? 0 },
        { time: now, response: queryPerf.data?.p99_ms ?? 0, rate: scaleStatus.data?.write_throughput?.current_writes_per_sec ?? 0 },
      ];
    }
    if (stageMetrics.data && stageMetrics.data.length > 0) {
      return stageMetrics.data.map((m) => ({
        time: m.stage.toUpperCase(),
        response: m.p50_latency_ms,
        rate: m.events_per_sec,
      }));
    }
    return [];
  }, [pranaLogs, data, scaleStatus.data, queryPerf.data, stageMetrics.data]);

  const series = useMemo(() => [
    { name: "HTTP / Response Status", dataKey: "response", color: "#6366f1" },
    { name: "Attempts / Event Rate", dataKey: "rate", color: "#10b981" },
  ], []);

  const summaryMetrics = useMemo(() => {
    const list = [];
    if (pranaLogs.length > 0) {
      const latest = pranaLogs[0];
      list.push({ label: "Propagation Events", value: pranaLogs.length });
      list.push({ label: "Latest Target", value: latest.destination });
      list.push({ label: "Log Status", value: latest.status });
      if (latest.http_status != null) {
        list.push({ label: "HTTP Code", value: latest.http_status });
      }
    } else {
      if (queryPerf.data) {
        list.push({ label: "p50 / p99 Latency", value: `${queryPerf.data.p50_ms}ms / ${queryPerf.data.p99_ms}ms` });
        list.push({ label: "p999 Latency", value: queryPerf.data.p999_ms, unit: "ms" });
        list.push({ label: "Queries / Sec", value: queryPerf.data.queries_per_sec });
      } else if (data?.summary) {
        list.push({ label: "Avg Response", value: (data.summary.avg_response_time ?? 0).toFixed(0), unit: "ms" });
        list.push({ label: "Total Events", value: (data.summary.total_events ?? 0).toLocaleString() });
        list.push({ label: "Error Rate", value: ((data.summary.error_rate ?? 0) * 100).toFixed(2), unit: "%" });
      }
      if (scaleStatus.data) {
        list.push({ label: "Concurrent Writes", value: `${scaleStatus.data.concurrent_writes.current}/${scaleStatus.data.concurrent_writes.limit}` });
        list.push({ label: "Storage Used", value: `${scaleStatus.data.storage.usage_percent.toFixed(1)}%` });
      }
      if (stageMetrics.data && stageMetrics.data.length > 0) {
        const activeStages = stageMetrics.data.filter(s => s.status === "live").length;
        list.push({ label: "InsightFlow Stages", value: `${activeStages}/${stageMetrics.data.length} live` });
        const totalPipelineEvents = stageMetrics.data.reduce((acc, curr) => acc + curr.total_events, 0);
        list.push({ label: "Pipeline Events", value: totalPipelineEvents.toLocaleString() });
      }
    }
    return list;
  }, [pranaLogs, data, queryPerf.data, scaleStatus.data, stageMetrics.data]);

  const isLoading = telemetry.isLoading && scaleStatus.isLoading && queryPerf.isLoading && pranaLog.isLoading && stageMetrics.isLoading;
  const isError = !isLoading && (telemetry.isError && scaleStatus.isError && queryPerf.isError && pranaLog.isError && stageMetrics.isError);
  const hasData = pranaLogs.length > 0 || data !== undefined || scaleStatus.data !== undefined || queryPerf.data !== undefined || (stageMetrics.data !== undefined && stageMetrics.data.length > 0);

  const timestamp = pranaLogs.length > 0 ? pranaLogs[0].logged_at : (scaleStatus.data?.timestamp || data?.timestamp || (stageMetrics.data ? new Date().toISOString() : undefined) || new Date().toISOString());

  return (
    <DashboardCard
      title="Observability & Telemetry"
      ariaLabel="Observability Layout"
      isLoading={isLoading}
      isError={isError}
      hasData={hasData}
      onRetry={() => { telemetry.refetch(); scaleStatus.refetch(); queryPerf.refetch(); pranaLog.refetch(); }}
      errorMessage="Failed to load telemetry"
      skeletonCount={1}
      skeletonHeight="h-48"
      isEmpty={!isLoading && !hasData}
      emptyMessage="No Runtime Data Available"
      timestamp={timestamp}
      isFetching={telemetry.isFetching || scaleStatus.isFetching || queryPerf.isFetching || pranaLog.isFetching || stageMetrics.isFetching}
      isStale={telemetry.isStale || scaleStatus.isStale || queryPerf.isStale || pranaLog.isStale || stageMetrics.isStale}
      traceId={pranaLogs.length > 0 ? pranaLogs[0].trace_id : ((data as any)?.trace_id || (stageMetrics.data as any)?.trace_id)}
      dataSource="PRANA Log & Bucket Metrics"
      headerRight={
        pranaLogs.length > 0 ? (
          <span className="text-xs text-slate-500">
            PRANA Logged: <span className="text-emerald-400 font-medium">{pranaLogs.length} events</span>
          </span>
        ) : scaleStatus.data ? (
          <span className="text-xs text-slate-500">
            Storage:{" "}
            <span className="text-emerald-400 font-medium">
              {scaleStatus.data.storage.used_gb} GB / {scaleStatus.data.storage.total_gb} GB
            </span>
          </span>
        ) : data ? (
          <span className="text-xs text-slate-500">
            Uptime:{" "}
            <span className="text-emerald-400 font-medium">
              {(data.summary?.uptime_percentage ?? 100).toFixed(1)}%
            </span>
          </span>
        ) : stageMetrics.data && stageMetrics.data.length > 0 ? (
          <span className="text-xs text-slate-500">
            Pipeline:{" "}
            <span className="text-emerald-400 font-medium">
              {stageMetrics.data.length} stages
            </span>
          </span>
        ) : undefined
      }
    >
      {hasData && (
        <div className="flex flex-col flex-1 min-h-0">
          <TelemetryCard
            data={chartData}
            xAxisKey="time"
            series={series}
            summaryMetrics={summaryMetrics}
            traceId={pranaLogs.length > 0 ? pranaLogs[0].trace_id : (data as any)?.trace_id}
          />
        </div>
      )}
    </DashboardCard>
  );
});
