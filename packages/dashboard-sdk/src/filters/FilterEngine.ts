import type { FilterState } from "./types";

export const initialFilterState: FilterState = {
  searchQuery: "",
  statusFilter: [],
  severityFilter: [],
  dateRange: {},
  sortBy: "timestamp",
  sortOrder: "desc",
  page: 1,
  pageSize: 10,
  customFilters: {},
};

export class FilterEngine {
  private state: FilterState;
  private listeners: Set<(state: FilterState) => void> = new Set();

  constructor(initialState?: Partial<FilterState>) {
    this.state = { ...initialFilterState, ...initialState };
  }

  public getState(): FilterState {
    return this.state;
  }

  public setSearchQuery(query: string): void {
    this.state = { ...this.state, searchQuery: query, page: 1 };
    this.notify();
  }

  public toggleStatusFilter(status: string): void {
    const current = this.state.statusFilter;
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    this.state = { ...this.state, statusFilter: next, page: 1 };
    this.notify();
  }

  public toggleSeverityFilter(severity: string): void {
    const current = this.state.severityFilter;
    const next = current.includes(severity)
      ? current.filter((s) => s !== severity)
      : [...current, severity];
    this.state = { ...this.state, severityFilter: next, page: 1 };
    this.notify();
  }

  public setSort(sortBy: string, sortOrder?: "asc" | "desc"): void {
    const nextOrder =
      sortOrder ?? (this.state.sortBy === sortBy && this.state.sortOrder === "asc" ? "desc" : "asc");
    this.state = { ...this.state, sortBy, sortOrder: nextOrder };
    this.notify();
  }

  public reset(): void {
    this.state = { ...initialFilterState };
    this.notify();
  }

  public subscribe(listener: (state: FilterState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn(this.state));
  }
}
