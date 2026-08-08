import { useCallback, useEffect, useRef, useState } from "react";
import type { DragEvent } from "react";

export interface DragProps {
  draggable: boolean;
  onDragStart?: (e: DragEvent<HTMLElement>) => void;
  onDragOver?: (e: DragEvent<HTMLElement>) => void;
  onDrop?: (e: DragEvent<HTMLElement>) => void;
  onDragEnd?: (e: DragEvent<HTMLElement>) => void;
}

export interface UseDragToReorderResult {
  /** Key of the zone currently being dragged, or null. */
  draggingKey: string | null;
  /** Key of the zone currently being dragged over (drop target preview), or null. */
  dragOverKey: string | null;
  /** Spread the returned props onto a zone's draggable container. */
  getDragProps: (key: string) => DragProps;
}

/**
 * Native HTML5 drag-and-drop reordering for a flat, ordered list of zone
 * keys. No external dependency — works in every evergreen browser. When
 * `enabled` is false, `getDragProps` returns `{ draggable: false }` so
 * dragging is fully inert (used to keep the default, non-edit-mode rendering
 * byte-for-byte identical to a plain static grid).
 */
export function useDragToReorder(
  orderedKeys: string[],
  onReorder: (nextOrderedKeys: string[]) => void,
  enabled: boolean
): UseDragToReorderResult {
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);
  const orderRef = useRef(orderedKeys);
  useEffect(() => {
    orderRef.current = orderedKeys;
  }, [orderedKeys]);

  const getDragProps = useCallback(
    (key: string): DragProps => {
      if (!enabled) return { draggable: false };

      return {
        draggable: true,
        onDragStart: (e) => {
          setDraggingKey(key);
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", key);
        },
        onDragOver: (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          setDragOverKey((prev) => (prev === key ? prev : key));
        },
        onDrop: (e) => {
          e.preventDefault();
          const sourceKey = e.dataTransfer.getData("text/plain") || draggingKey;
          setDragOverKey(null);
          setDraggingKey(null);
          if (!sourceKey || sourceKey === key) return;

          const current = [...orderRef.current];
          const from = current.indexOf(sourceKey);
          const to = current.indexOf(key);
          if (from === -1 || to === -1) return;

          current.splice(from, 1);
          current.splice(to, 0, sourceKey);
          onReorder(current);
        },
        onDragEnd: () => {
          setDraggingKey(null);
          setDragOverKey(null);
        },
      };
    },
    [enabled, draggingKey, onReorder]
  );

  return { draggingKey, dragOverKey, getDragProps };
}
