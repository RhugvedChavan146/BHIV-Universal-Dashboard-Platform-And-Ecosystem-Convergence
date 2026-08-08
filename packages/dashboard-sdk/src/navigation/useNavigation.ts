import { useEffect, useState } from "react";
import { globalNavigationEngine, NavigationEngine } from "./NavigationEngine";
import type { NavigationState } from "./types";

export function useNavigation(engine: NavigationEngine = globalNavigationEngine) {
  const [state, setState] = useState<NavigationState>(engine.getState());

  useEffect(() => {
    return engine.subscribe((newState) => setState(newState));
  }, [engine]);

  return {
    activeRoute: state.activeRoute,
    items: state.items,
    navigate: (path: string) => engine.setActiveRoute(path),
  };
}
