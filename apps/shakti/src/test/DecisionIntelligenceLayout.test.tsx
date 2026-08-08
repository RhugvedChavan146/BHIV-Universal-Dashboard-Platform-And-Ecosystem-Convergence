import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import DecisionIntelligenceLayout from "../components/dashboard/layouts/DecisionIntelligenceLayout";

// Mock queries hook
const mockUseOperationsDashboard = vi.fn();

vi.mock("@/hooks/useQueries", () => ({
  useOperationsDashboard: () => mockUseOperationsDashboard(),
}));

describe("DecisionIntelligenceLayout Component", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("renders loading state (skeletons)", () => {
    mockUseOperationsDashboard.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
      isFetching: true,
      isStale: false,
    });

    render(<DecisionIntelligenceLayout />);

    expect(screen.getByRole("region", { name: "Decision Intelligence Layout" })).toBeInTheDocument();
  });

  test("renders empty state", () => {
    mockUseOperationsDashboard.mockReturnValue({
      data: {
        timestamp: "2026-07-15T16:53:18.000Z",
        operations: [],
        system_load: 10,
        active_operations: 0,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
      isStale: false,
    });

    render(<DecisionIntelligenceLayout />);

    expect(screen.getByText("No Runtime Data Available")).toBeInTheDocument();
  });

  test("renders up to 3 decisions, sorted by started_at descending, no toggle button", () => {
    mockUseOperationsDashboard.mockReturnValue({
      data: {
        timestamp: "2026-07-15T16:53:18.000Z",
        system_load: 50,
        active_operations: 2,
        operations: [
          {
            id: "op_01",
            type: "scale_out",
            status: "completed",
            priority: "high",
            started_at: "2026-07-15T16:50:00.000Z",
            description: "Scale Out Action",
            progress: 100,
            agent: "creator",
          },
          {
            id: "op_02",
            type: "load_shed",
            status: "running",
            priority: "critical",
            started_at: "2026-07-15T16:55:00.000Z",
            description: "Load Shedding Active",
            progress: 50,
            agent: "operator",
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
      isStale: false,
    });

    render(<DecisionIntelligenceLayout />);

    expect(screen.getByText("Scale Out Action")).toBeInTheDocument();
    expect(screen.getByText("Load Shedding Active")).toBeInTheDocument();

    // Verify ordering (newest started_at first, i.e., op_02 is at index 1 in raw data but should render first)
    const items = screen.getAllByText(/(Scale Out Action|Load Shedding Active)/);
    expect(items[0]).toHaveTextContent("Load Shedding Active"); // started_at 16:55
    expect(items[1]).toHaveTextContent("Scale Out Action");     // started_at 16:50

    // Toggle button should not be present
    expect(screen.queryByText(/View All/)).not.toBeInTheDocument();
  });

  test("renders all decisions directly without slicing or toggle button", () => {
    mockUseOperationsDashboard.mockReturnValue({
      data: {
        timestamp: "2026-07-15T16:53:18.000Z",
        system_load: 50,
        active_operations: 4,
        operations: [
          {
            id: "op_01",
            type: "scale_out",
            status: "completed",
            priority: "high",
            started_at: "2026-07-15T16:50:00.000Z",
            description: "Decision 1",
            progress: 100,
            agent: "creator",
          },
          {
            id: "op_02",
            type: "load_shed",
            status: "running",
            priority: "critical",
            started_at: "2026-07-15T16:55:00.000Z",
            description: "Decision 2",
            progress: 50,
            agent: "operator",
          },
          {
            id: "op_03",
            type: "scale_in",
            status: "completed",
            priority: "low",
            started_at: "2026-07-15T16:45:00.000Z",
            description: "Decision 3",
            progress: 100,
            agent: "auto",
          },
          {
            id: "op_04",
            type: "reboot",
            status: "running",
            priority: "medium",
            started_at: "2026-07-15T16:40:00.000Z",
            description: "Decision 4",
            progress: 10,
            agent: "system",
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      isFetching: false,
      isStale: false,
    });

    render(<DecisionIntelligenceLayout />);

    // All decisions should be visible immediately
    expect(screen.getByText("Decision 2")).toBeInTheDocument();
    expect(screen.getByText("Decision 1")).toBeInTheDocument();
    expect(screen.getByText("Decision 3")).toBeInTheDocument();
    expect(screen.getByText("Decision 4")).toBeInTheDocument();

    // Toggle button should not be present
    expect(screen.queryByRole("button", { name: /View All/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Show Less/ })).not.toBeInTheDocument();
  });
});
