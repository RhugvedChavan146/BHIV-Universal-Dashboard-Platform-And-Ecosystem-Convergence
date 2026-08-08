import type { NavItem } from "@bhiv/ui";

export type { NavItem };

export interface NavigationState {
  activeRoute: string;
  items: NavItem[];
}
