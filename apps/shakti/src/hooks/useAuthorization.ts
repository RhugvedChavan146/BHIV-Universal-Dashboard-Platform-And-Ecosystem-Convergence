/**
 * Mock Authorization Hook (RBAC).
 */
import { useAuth } from "./useAuth";

export type Role = "admin" | "operator" | "viewer";

export function useAuthorization() {
  const { user, isAuthenticated } = useAuth();

  const hasRole = (role: Role) => {
    if (!isAuthenticated || !user) return false;
    // Mock logic: admin has all roles, operator has operator+viewer
    if (user.role === "admin") return true;
    if (user.role === "operator" && (role === "operator" || role === "viewer")) return true;
    return user.role === role;
  };

  const hasPermission = (action: string) => {
    if (!isAuthenticated) return false;
    // Add granular permissions here
    if (action === "execute_workflow") return hasRole("operator");
    if (action === "configure_system") return hasRole("admin");
    return true; // Default
  };

  return { hasRole, hasPermission };
}
