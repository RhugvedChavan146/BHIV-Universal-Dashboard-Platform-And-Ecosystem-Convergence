import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type {
  LayoutTemplate,
  LayoutZoneDefinition,
  PersistedLayout,
  PersistedZoneState,
  PersistenceAdapter,
} from "./types";
import { localStoragePersistence } from "./persistence/localStoragePersistence";
import {
  clampCols,
  colSpanStyle,
  DEFAULT_MAX_COLS,
  DEFAULT_MIN_COLS,
  parseDesktopColsFromClassName,
} from "./utils/grid";
import { saveTemplate as persistTemplate } from "./templates/templateStorage";

const DEFAULT_VERSION = 1;

export interface UseLayoutEngineOptions {
  /** Stable identifier for this dashboard — used as the persistence key. */
  layoutId: string;
  /** Zone definitions in their shipped/default order. Single source of truth for defaults. */
  zones: LayoutZoneDefinition[];
  /** Bump this to invalidate previously-persisted layouts when the shipped zone set changes shape. */
  version?: number;
  /** Custom persistence backend. Defaults to `localStoragePersistence`. */
  persistence?: PersistenceAdapter;
}

export interface UseLayoutEngineResult {
  editMode: boolean;
  setEditMode: (value: boolean) => void;
  /** True once any persisted customization has been loaded (or confirmed absent). */
  isReady: boolean;
  /** Visible zones in their effective order, each merged with any persisted customization. */
  orderedZones: LayoutZoneDefinition[];
  /** Whether a given zone's placement differs from its shipped default. */
  isCustomized: (key: string) => boolean;
  /** Inline style for a customized zone's desktop span; undefined means "use the zone's default colSpan class". */
  getSpanStyle: (key: string) => CSSProperties | undefined;
  /** Column span (grid units, 1-12) currently in effect for a zone. */
  getCols: (key: string) => number;
  reorder: (nextOrderedKeys: string[]) => void;
  resizeZone: (key: string, cols: number) => void;
  resetLayout: () => void;
  saveAsTemplate: (name: string, description?: string) => LayoutTemplate;
  applyTemplate: (template: LayoutTemplate) => void;
}

function buildDefaultLayout(zones: LayoutZoneDefinition[], version: number): PersistedLayout {
  const visible = [...zones.filter((z) => z.visible)].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const zonesState: Record<string, PersistedZoneState> = {};
  visible.forEach((zone, index) => {
    zonesState[zone.key] = { order: index };
  });
  return { version, zones: zonesState };
}

/**
 * Drives a full drag/resize/persist/template-capable dashboard layout from a
 * flat list of zone definitions. Until the user actually customizes anything
 * (drags or resizes a zone, or applies a template), `orderedZones` and
 * `getSpanStyle` reproduce the shipped defaults exactly — so mounting this
 * hook behind an existing static grid changes nothing visually until a user
 * opts in via edit mode.
 */
export function useLayoutEngine({
  layoutId,
  zones,
  version = DEFAULT_VERSION,
  persistence = localStoragePersistence,
}: UseLayoutEngineOptions): UseLayoutEngineResult {
  const [editMode, setEditMode] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [persisted, setPersisted] = useState<PersistedLayout | null>(null);

  const zonesRef = useRef(zones);
  useEffect(() => {
    zonesRef.current = zones;
  }, [zones]);

  // Load any previously-saved layout once on mount (or when layoutId/version changes).
  useEffect(() => {
    let cancelled = false;

    async function loadPersistedLayout() {
      setIsReady(false);
      const loaded = await Promise.resolve(persistence.load(layoutId));
      if (cancelled) return;
      setPersisted(loaded && loaded.version === version ? loaded : null);
      setIsReady(true);
    }

    void loadPersistedLayout();
    return () => {
      cancelled = true;
    };
  }, [layoutId, version, persistence]);

  const zoneMap = useMemo(() => {
    const map = new Map<string, LayoutZoneDefinition>();
    zones.forEach((z) => map.set(z.key, z));
    return map;
  }, [zones]);

  const orderedZones = useMemo(() => {
    const visible = zones.filter((z) => z.visible);
    if (!persisted) {
      return [...visible].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    // Zones with a saved position sort by it; any zone shipped after the
    // layout was last saved (no saved entry yet) falls back to its default
    // order and is appended, so newly-added zones always show up.
    const withState = visible.filter((z) => persisted.zones[z.key]);
    const withoutState = visible.filter((z) => !persisted.zones[z.key]);
    withState.sort((a, b) => persisted.zones[a.key].order - persisted.zones[b.key].order);
    withoutState.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return [...withState, ...withoutState];
  }, [zones, persisted]);

  const getCols = useCallback(
    (key: string): number => {
      const zone = zoneMap.get(key);
      const override = persisted?.zones[key]?.cols;
      if (override != null) {
        return clampCols(override, zone?.minCols ?? DEFAULT_MIN_COLS, zone?.maxCols ?? DEFAULT_MAX_COLS);
      }
      return parseDesktopColsFromClassName(zone?.colSpan);
    },
    [zoneMap, persisted]
  );

  const isCustomized = useCallback((key: string): boolean => persisted?.zones[key]?.cols != null, [persisted]);

  const getSpanStyle = useCallback(
    (key: string): CSSProperties | undefined => {
      if (!isCustomized(key)) return undefined;
      return colSpanStyle(getCols(key));
    },
    [isCustomized, getCols]
  );

  const persistNext = useCallback(
    (next: PersistedLayout) => {
      setPersisted(next);
      persistence.save(layoutId, next);
    },
    [persistence, layoutId]
  );

  const reorder = useCallback(
    (nextOrderedKeys: string[]) => {
      const base = persisted ?? buildDefaultLayout(zonesRef.current, version);
      const nextZones: Record<string, PersistedZoneState> = {};
      nextOrderedKeys.forEach((key, index) => {
        nextZones[key] = { ...base.zones[key], order: index };
      });
      persistNext({ version, zones: nextZones });
    },
    [persisted, version, persistNext]
  );

  const resizeZone = useCallback(
    (key: string, cols: number) => {
      const base = persisted ?? buildDefaultLayout(zonesRef.current, version);
      const zone = zoneMap.get(key);
      const clamped = clampCols(cols, zone?.minCols ?? DEFAULT_MIN_COLS, zone?.maxCols ?? DEFAULT_MAX_COLS);
      const existing = base.zones[key] ?? { order: orderedZones.findIndex((z) => z.key === key) };
      persistNext({
        version,
        zones: { ...base.zones, [key]: { ...existing, cols: clamped } },
      });
    },
    [persisted, version, persistNext, zoneMap, orderedZones]
  );

  const resetLayout = useCallback(() => {
    setPersisted(null);
    persistence.clear(layoutId);
  }, [persistence, layoutId]);

  const saveAsTemplate = useCallback(
    (name: string, description?: string): LayoutTemplate => {
      const snapshot = persisted ?? buildDefaultLayout(zonesRef.current, version);
      return persistTemplate(layoutId, name, snapshot, description);
    },
    [persisted, version, layoutId]
  );

  const applyTemplate = useCallback(
    (template: LayoutTemplate) => {
      persistNext({ ...template.layout, version });
    },
    [persistNext, version]
  );

  return {
    editMode,
    setEditMode,
    isReady,
    orderedZones,
    isCustomized,
    getSpanStyle,
    getCols,
    reorder,
    resizeZone,
    resetLayout,
    saveAsTemplate,
    applyTemplate,
  };
}
