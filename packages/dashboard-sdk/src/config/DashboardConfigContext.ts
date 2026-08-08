import { createContext } from "react";
import type { DashboardConfig } from "./types";

export const DashboardConfigContext = createContext<DashboardConfig<unknown> | null>(null);
