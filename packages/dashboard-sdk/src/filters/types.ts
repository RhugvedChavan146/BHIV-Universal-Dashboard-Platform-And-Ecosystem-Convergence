export interface FilterState {
  searchQuery: string;
  statusFilter: string[];
  severityFilter: string[];
  dateRange: {
    start?: string;
    end?: string;
  };
  sortBy: string;
  sortOrder: "asc" | "desc";
  page: number;
  pageSize: number;
  customFilters: Record<string, unknown>;
}

export interface FilterOption {
  label: string;
  value: string;
  color?: string;
}
