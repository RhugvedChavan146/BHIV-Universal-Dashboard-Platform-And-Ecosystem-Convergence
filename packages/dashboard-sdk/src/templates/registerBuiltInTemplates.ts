import { ExecutiveTemplate } from "./ExecutiveTemplate";
import { OperationsTemplate } from "./OperationsTemplate";
import { TemplateRegistry, globalTemplateRegistry } from "./TemplateRegistry";

/**
 * Opt-in registration for the SDK's built-in page templates. Not called
 * automatically — an app that wants them calls this once (e.g. at startup);
 * an app with its own templates can ignore it entirely.
 */
export function registerBuiltInTemplates(registry: TemplateRegistry = globalTemplateRegistry): void {
  if (!registry.get("executive")) {
    registry.register({ id: "executive", name: "Executive Overview", component: ExecutiveTemplate });
  }
  if (!registry.get("operations")) {
    registry.register({ id: "operations", name: "Operations Command", component: OperationsTemplate });
  }
}
