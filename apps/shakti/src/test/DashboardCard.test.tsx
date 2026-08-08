import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DashboardCard } from "../components/dashboard/DashboardCard";
import React from "react";

describe("DashboardCard Component", () => {
  test("renders title and children on success state", () => {
    render(
      <DashboardCard title="Test Widget" hasData={true}>
        <div>Active Content</div>
      </DashboardCard>
    );

    expect(screen.getByText("Test Widget")).toBeInTheDocument();
    expect(screen.getByText("Active Content")).toBeInTheDocument();
  });

  test("renders skeleton indicators in loading state", () => {
    const { container } = render(
      <DashboardCard title="Test Widget" isLoading={true} skeletonCount={3}>
        <div>Active Content</div>
      </DashboardCard>
    );

    expect(screen.queryByText("Active Content")).not.toBeInTheDocument();
    // Verify skeletons are rendered (skeletons have bg-slate-700/50 and rounded classes)
    const skeletons = container.querySelectorAll(".bg-slate-700\\/50");
    expect(skeletons.length).toBe(3);
  });

  test("renders error panel with retry callback in error state", () => {
    const handleRetry = vi.fn();
    render(
      <DashboardCard
        title="Test Widget"
        isError={true}
        hasData={false}
        errorMessage="Endpoint failed"
        onRetry={handleRetry}
      />
    );

    expect(screen.getByText("Endpoint failed")).toBeInTheDocument();
    const retryBtn = screen.getByText("Retry");
    expect(retryBtn).toBeInTheDocument();

    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  test("renders empty message in empty state", () => {
    render(
      <DashboardCard
        title="Test Widget"
        isEmpty={true}
        emptyMessage="No operations mapped"
      />
    );

    expect(screen.getByText("No operations mapped")).toBeInTheDocument();
  });

  test("renders cache banner in degraded error state", () => {
    const handleRetry = vi.fn();
    render(
      <DashboardCard
        title="Test Widget"
        isError={true}
        hasData={true}
        onRetry={handleRetry}
      >
        <div>Stale Local Copy</div>
      </DashboardCard>
    );

    expect(screen.getByText("Using cached data (Connection lost)")).toBeInTheDocument();
    expect(screen.getByText("Stale Local Copy")).toBeInTheDocument();

    const retryBtn = screen.getByText("Retry");
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  test("renders metadata panel correctly", () => {
    render(
      <DashboardCard
        title="Test Widget"
        hasData={true}
        timestamp="2026-07-15T16:53:18.000Z"
        traceId="trace_12345abcdef"
        dataSource="Control Plane"
        isStale={true}
      >
        <div>Content</div>
      </DashboardCard>
    );

    expect(screen.getByText("STALE")).toBeInTheDocument();
    expect(screen.getByText("Control Plane")).toBeInTheDocument();
    expect(screen.getByText("trace_12345abcdef")).toBeInTheDocument();
    // Match part of the timestamp (updated is formatted with Indian Standard Locale or direct)
    expect(screen.getByText(/Updated:/)).toBeInTheDocument();
  });
});
