import type { ComponentType } from "react";

export interface RegisteredTemplate {
  id: string;
  name: string;
  component: ComponentType<any>;
}

/**
 * Registry of full-page dashboard templates (e.g. "Executive Overview").
 * Nothing is pre-registered — call `registerBuiltInTemplates()` (or register
 * your own) explicitly. Keeping registration out of the constructor means an
 * app that never imports the built-in templates never pays for their code,
 * and apps that don't want them aren't stuck with them.
 */
export class TemplateRegistry {
  private templates: Map<string, RegisteredTemplate> = new Map();

  public register(template: RegisteredTemplate): void {
    this.templates.set(template.id, template);
  }

  public unregister(id: string): void {
    this.templates.delete(id);
  }

  public get(id: string): RegisteredTemplate | undefined {
    return this.templates.get(id);
  }

  public getAll(): RegisteredTemplate[] {
    return Array.from(this.templates.values());
  }
}

export const globalTemplateRegistry = new TemplateRegistry();
