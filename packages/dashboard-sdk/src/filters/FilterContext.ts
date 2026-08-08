import { createContext } from "react";
import { FilterEngine } from "./FilterEngine";
import type { FilterState } from "./types";

export interface FilterContextValue {
  engine: FilterEngine;
  state: FilterState;
}

export const FilterContext = createContext<FilterContextValue | null>(null);
