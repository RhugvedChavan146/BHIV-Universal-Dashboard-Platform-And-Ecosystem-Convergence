import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "@bhiv/ui";
import React from "react";

// Helper component that throws an error
const ThrowErrorComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test render crash");
  }
  return <div>Component Normal State</div>;
};

describe("ErrorBoundary Component", () => {
  test("renders children when no error occurs", () => {
    render(
      <ErrorBoundary>
        <div>Normal Child Content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText("Normal Child Content")).toBeInTheDocument();
  });

  test("catches error and displays fallback UI", () => {
    // Suppress console.error output for the intentional test crash
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ErrorBoundary fallbackTitle="Custom Fallback Zone">
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom Fallback Zone")).toBeInTheDocument();
    expect(screen.getByText("Test render crash")).toBeInTheDocument();
    expect(screen.getByText("Reload Zone")).toBeInTheDocument();

    spy.mockRestore();
  });

  test("allows reloading the zone to reset error boundary", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { rerender } = render(
      <ErrorBoundary fallbackTitle="Custom Fallback Zone">
        <ThrowErrorComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom Fallback Zone")).toBeInTheDocument();

    // Rerender with normal state and trigger reset click
    rerender(
      <ErrorBoundary fallbackTitle="Custom Fallback Zone">
        <ThrowErrorComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText("Reload Zone"));

    expect(screen.getByText("Component Normal State")).toBeInTheDocument();

    spy.mockRestore();
  });
});
