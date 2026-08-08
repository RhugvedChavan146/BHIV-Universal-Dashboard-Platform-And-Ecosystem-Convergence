import React from "react";
import { LayoutEngine } from "../layout/LayoutEngine";

export function OperationsTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 p-3 bg-slate-950 min-h-screen text-slate-100">
      <LayoutEngine density="standard">{children}</LayoutEngine>
    </div>
  );
}
