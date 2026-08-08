import { useNavigation } from "@bhiv/dashboard-sdk";
import { shaktiNavigationEngine } from "@/config/navigation";

/**
 * Renders SHAKTI's section nav from `dashboard.config.ts#navigation.items`
 * — a new zone just needs one more entry there; nothing here hardcodes a
 * section list. Each item's `path` is a zone id, resolved to the `id="zone-<id>"`
 * anchor `LayoutZone` renders for every zone.
 */
export default function SectionNav() {
  const { items, activeRoute, navigate } = useNavigation(shaktiNavigationEngine);

  if (items.length === 0) return null;

  const handleNavigate = (path: string) => {
    navigate(path);
    document.getElementById(`zone-${path}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      aria-label="Dashboard sections"
      className="flex items-center gap-1 px-4 py-1.5 bg-slate-900/60 border-b border-slate-800/60 overflow-x-auto"
    >
      {items.map((item) => {
        const isActive = activeRoute === item.path;
        return (
          <button
            key={item.id}
            onClick={() => handleNavigate(item.path)}
            className={
              isActive
                ? "px-2.5 py-1 text-[11px] font-mono rounded whitespace-nowrap bg-slate-800 text-indigo-400 font-semibold border border-slate-700/60"
                : "px-2.5 py-1 text-[11px] font-mono rounded whitespace-nowrap text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
