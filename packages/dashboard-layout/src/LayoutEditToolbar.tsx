import type { UseLayoutEngineResult } from "./useLayoutEngine";
import type { LayoutTemplate } from "./types";

export interface LayoutEditToolbarProps {
  engine: UseLayoutEngineResult;
  /** Templates available to apply — combine built-in templates with `listSavedTemplates(layoutId)` as needed. */
  templates?: LayoutTemplate[];
  className?: string;
}

/**
 * Toolbar for edit mode / reset / templates.
 * The "Done Customizing", "Reset to Default", and "Save as Template" controls
 * have been removed. Kept as a no-op component so existing imports of
 * `LayoutEditToolbar` in the app continue to work without changes.
 */
export function LayoutEditToolbar(_props: LayoutEditToolbarProps) {
  return null;
}
