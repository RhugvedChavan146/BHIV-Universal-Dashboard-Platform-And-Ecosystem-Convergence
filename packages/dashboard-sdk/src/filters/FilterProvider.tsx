import { useEffect, useState, useMemo, type ReactNode } from "react";
import { FilterEngine } from "./FilterEngine";
import type { FilterState } from "./types";
import { FilterContext } from "./FilterContext";

export function FilterProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: Partial<FilterState>;
}) {
  const engine = useMemo(() => new FilterEngine(initialState), [initialState]);
  const [state, setState] = useState<FilterState>(engine.getState());

  useEffect(() => {
    return engine.subscribe((newState) => {
      setState(newState);
    });
  }, [engine]);

  const value = useMemo(() => ({ engine, state }), [engine, state]);

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}
