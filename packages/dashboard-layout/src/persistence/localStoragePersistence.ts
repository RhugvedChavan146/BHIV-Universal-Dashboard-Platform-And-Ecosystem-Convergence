import type { PersistedLayout, PersistenceAdapter } from "../types";
import { logger } from "@bhiv/utils";

const STORAGE_PREFIX = "bhiv:dashboard-layout:";

function hasLocalStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

function storageKey(layoutId: string): string {
  return `${STORAGE_PREFIX}${layoutId}`;
}

/**
 * Default `PersistenceAdapter` — stores each layout as JSON under
 * `localStorage`. Safe to import in non-browser contexts (SSR, tests): all
 * methods become no-ops when `window.localStorage` isn't available.
 */
export const localStoragePersistence: PersistenceAdapter = {
  load(layoutId) {
    if (!hasLocalStorage()) return null;
    try {
      const raw = window.localStorage.getItem(storageKey(layoutId));
      if (!raw) return null;
      return JSON.parse(raw) as PersistedLayout;
    } catch (error) {
      logger.warn("dashboard-layout: failed to load persisted layout", { layoutId, error });
      return null;
    }
  },

  save(layoutId, layout) {
    if (!hasLocalStorage()) return;
    try {
      window.localStorage.setItem(storageKey(layoutId), JSON.stringify(layout));
    } catch (error) {
      logger.warn("dashboard-layout: failed to persist layout", { layoutId, error });
    }
  },

  clear(layoutId) {
    if (!hasLocalStorage()) return;
    try {
      window.localStorage.removeItem(storageKey(layoutId));
    } catch (error) {
      logger.warn("dashboard-layout: failed to clear persisted layout", { layoutId, error });
    }
  },
};
