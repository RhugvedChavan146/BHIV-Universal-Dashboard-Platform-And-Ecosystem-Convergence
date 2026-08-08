import type { LayoutTemplate, PersistedLayout } from "../types";
import { logger } from "@bhiv/utils";

const TEMPLATE_STORAGE_PREFIX = "bhiv:dashboard-layout:templates:";

function hasLocalStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

function templateStorageKey(layoutId: string): string {
  return `${TEMPLATE_STORAGE_PREFIX}${layoutId}`;
}

/** All user-saved templates for a given dashboard (built-in templates are supplied separately by the app). */
export function listSavedTemplates(layoutId: string): LayoutTemplate[] {
  if (!hasLocalStorage()) return [];
  try {
    const raw = window.localStorage.getItem(templateStorageKey(layoutId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LayoutTemplate[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    logger.warn("dashboard-layout: failed to read saved templates", { layoutId, error });
    return [];
  }
}

function persistTemplates(layoutId: string, templates: LayoutTemplate[]): void {
  if (!hasLocalStorage()) return;
  try {
    window.localStorage.setItem(templateStorageKey(layoutId), JSON.stringify(templates));
  } catch (error) {
    logger.warn("dashboard-layout: failed to save templates", { layoutId, error });
  }
}

export function saveTemplate(
  layoutId: string,
  name: string,
  layout: PersistedLayout,
  description?: string
): LayoutTemplate {
  const template: LayoutTemplate = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    description,
    builtIn: false,
    layout,
  };
  const existing = listSavedTemplates(layoutId);
  persistTemplates(layoutId, [...existing, template]);
  return template;
}

export function deleteTemplate(layoutId: string, templateId: string): void {
  const existing = listSavedTemplates(layoutId);
  persistTemplates(
    layoutId,
    existing.filter((t) => t.id !== templateId)
  );
}
