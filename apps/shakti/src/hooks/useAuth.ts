/**
 * Mock Authentication Hook.
 * Replace with actual Auth provider (e.g. NextAuth, MSAL, Auth0) in production.
 */
export function useAuth() {
  // Mocked state
  return {
    isAuthenticated: true,
    user: {
      id: "usr_123",
      name: "P. Bhuwad",
      role: "operator"
    },
    login: () => {},
    logout: () => {},
  };
}
