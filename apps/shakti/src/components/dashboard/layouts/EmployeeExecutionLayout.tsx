import { memo, useMemo } from "react";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { useEmployeeExecution } from "@/hooks/useQueries";
import { useNiyantranAttendanceSummary } from "@/hooks/useNiyantranQueries";
import { formatTime } from "@/utils/format";
import { UserCheck, ShieldAlert } from "lucide-react";

export default memo(function EmployeeExecutionLayout() {
  const cpExecution = useEmployeeExecution();
  const niyantranAttendance = useNiyantranAttendanceSummary();

  const engineers = useMemo(() => {
    if (cpExecution.data?.engineers && cpExecution.data.engineers.length > 0) {
      return cpExecution.data.engineers;
    }
    const nRecords = niyantranAttendance.data?.records ?? [];
    if (nRecords.length > 0) {
      return nRecords.map((r) => ({
        engineer: r.employee?.name || "Employee",
        current_task: r.merge?.case !== "UNKNOWN" ? `Merge: ${r.merge.case}` : "Active Work Session",
        current_product: `Biometric: ${r.employee?.biometricCode || "N/A"}`,
        progress: r.attendance?.workedHours > 0 ? Math.min(100, Math.round((r.attendance.workedHours / 8) * 100)) : 0,
        blocked: r.merge?.hasAlert ? (r.merge.alertType || "Mismatch Alert") : false,
        last_activity: r.times?.clockOut || r.times?.clockIn || "Recorded Today",
        todays_contribution: `${r.attendance?.workedHours || 0} hrs (${r.salary?.formattedEarnings || "₹0"})`,
      }));
    }
    return [];
  }, [cpExecution.data?.engineers, niyantranAttendance.data?.records]);

  const isLoading = cpExecution.isLoading && niyantranAttendance.isLoading;
  const isError = !isLoading && cpExecution.isError && niyantranAttendance.isError;
  const timestamp = cpExecution.data?.timestamp || (niyantranAttendance.data ? new Date().toISOString() : undefined);
  const isFetching = cpExecution.isFetching || niyantranAttendance.isFetching;
  const isStale = cpExecution.isStale || niyantranAttendance.isStale;
  const dataSource = cpExecution.data?.engineers?.length ? "Control Plane" : "NIYANTRAN";


  return (
    <DashboardCard
      title="Employee Execution"
      isLoading={isLoading}
      isError={isError}
      hasData={engineers.length > 0 || cpExecution.data !== undefined || niyantranAttendance.data !== undefined}
      onRetry={() => { cpExecution.refetch(); niyantranAttendance.refetch(); }}
      errorTitle="Awaiting Employee Runtime"
      errorMessage="Waiting for runtime source"
      skeletonCount={6}
      skeletonHeight="h-7"
      timestamp={timestamp}
      isFetching={isFetching}
      isStale={isStale}
      dataSource={dataSource}
      headerRight={
        engineers.length > 0 ? (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {engineers.length} Active Engineers
          </span>
        ) : undefined
      }
    >
      <div className="flex flex-col h-full min-h-0">
        {engineers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 flex-1 border border-dashed border-slate-800 rounded-lg bg-slate-900/30">
            <UserCheck className="w-8 h-8 text-slate-600 mb-2 opacity-50" />
            <p className="text-xs font-mono text-slate-400 font-medium">No Active Engineers</p>
            <span className="text-[10px] text-slate-600 mt-1">Awaiting engineering runtime</span>
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto flex-1 min-h-0 max-h-[320px] custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[780px]">
              <thead className="sticky top-0 bg-slate-900/95 backdrop-blur z-10">
                <tr className="border-b border-slate-700/60 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                  <th className="py-1.5 px-2">Engineer</th>
                  <th className="py-1.5 px-2">Current Task</th>
                  <th className="py-1.5 px-2">Current Product</th>
                  <th className="py-1.5 px-2">Progress</th>
                  <th className="py-1.5 px-2">Blocked</th>
                  <th className="py-1.5 px-2 text-right">Last Activity</th>
                  <th className="py-1.5 px-2 text-right">Today's Contribution</th>
                </tr>
              </thead>
              <tbody>
                {engineers.map((item, idx) => (
                  <tr
                    key={item.engineer || idx}
                    className="border-b border-slate-800/60 hover:bg-slate-800/30 text-[11px] text-slate-200 transition-colors"
                  >
                    <td className="py-1 px-2 font-mono font-medium text-cyan-400 truncate max-w-[120px]" title={item.engineer}>
                      {item.engineer}
                    </td>
                    <td className="py-1 px-2 text-slate-300 truncate max-w-[160px]" title={item.current_task}>
                      {item.current_task}
                    </td>
                    <td className="py-1 px-2 font-mono text-[10px] text-slate-400 truncate max-w-[110px]" title={item.current_product}>
                      {item.current_product}
                    </td>
                    <td className="py-1 px-2 min-w-[90px]">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{item.progress}%</span>
                      </div>
                    </td>
                    <td className="py-1 px-2">
                      {item.blocked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 truncate max-w-[110px]" title={String(item.blocked)}>
                          <ShieldAlert size={10} className="shrink-0" />
                          {typeof item.blocked === "boolean" ? "Blocked" : item.blocked}
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-mono">No</span>
                      )}
                    </td>
                    <td className="py-1 px-2 text-right font-mono text-[10px] text-slate-400">{item.last_activity}</td>
                    <td className="py-1 px-2 text-right font-mono text-[10px] text-slate-300">{item.todays_contribution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {timestamp && (
          <div className="flex justify-between items-center text-[10px] text-slate-500 shrink-0 pt-1.5 border-t border-slate-800">
            <span>BHEX Engineering Operations</span>
            <span>Updated {formatTime(timestamp)}</span>
          </div>
        )}
      </div>
    </DashboardCard>
  );
});
