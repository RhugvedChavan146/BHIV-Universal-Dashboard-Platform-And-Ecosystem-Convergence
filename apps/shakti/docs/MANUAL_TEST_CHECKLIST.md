# SHAKTI Command Center — Manual Test Checklist

> **Tester Instructions:** Execute each test case in order. Mark PASS/FAIL in the Result column. Record any observations in the Notes column. All tests assume the backend is running at `http://127.0.0.1:8009` unless otherwise stated.

---

## 1. Application Startup

| # | Test Case | Steps | Expected Result | Result | Notes |
|---|---|---|---|---|---|
| 1.1 | Cold start | Run `npm run dev`, open `http://localhost:5173` | Dashboard loads with skeleton states, then populates with live data | | |
| 1.2 | TypeScript compilation | Run `npx tsc --noEmit` | Zero compilation errors | | |
| 1.3 | Production build | Run `npm run build` | Build completes successfully in < 500ms | | |
| 1.4 | Production preview | Run `npm run preview` after build | Dashboard renders identically to dev mode | | |

---

## 2. Executive Summary (Row 1)

| # | Test Case | Steps | Expected Result | Result | Notes |
|---|---|---|---|---|---|
| 2.1 | KPI cards render | Inspect the Executive Summary row | 6 KPI cards visible: Active Services, Pending, Alerts, Latency, Throughput, System Status | | |
| 2.2 | KPI value prominence | Visually inspect primary metric values | Values render at 30px font-extrabold with clear contrast against labels | | |
| 2.3 | Trend indicators | Check each KPI card trend arrow | Trend arrows display with correct color (green=up, red=down, gray=stable) | | |
| 2.4 | Unit labels | Check for %, ms, req, evt suffixes | Units appear as secondary text (12px) next to the primary value | | |

---

## 3. Operations & Compute (Row 2, Left)

| # | Test Case | Steps | Expected Result | Result | Notes |
|---|---|---|---|---|---|
| 3.1 | API health cards | Inspect the top section | 2 API health cards showing endpoint, uptime, errors, latency, RPM | | |
| 3.2 | Active operations list | Scroll the operations section | Operations display with severity dots, progress bars, "+N more" indicator | | |
| 3.3 | Section header | Check "Active Operations" header | Renders at 14px semibold text-slate-300 | | |
| 3.4 | Operations limited to 4 | Count visible operations before "+N more" | Maximum 4 operations visible, remaining shown as "+N more" link | | |

---

## 4. Integrations & Alerts (Row 2, Right)

| # | Test Case | Steps | Expected Result | Result | Notes |
|---|---|---|---|---|---|
| 4.1 | Integration tiles | Inspect the tile grid | Integration tiles render in 3-column grid on desktop | | |
| 4.2 | Responsive grid | Resize browser to < 1280px | Tiles reflow to 2-column grid | | |
| 4.3 | Mobile grid | Resize browser to < 768px | Tiles reflow to 1-column grid | | |
| 4.4 | Alert feed | Inspect the "Live Alert Feed" section | Alerts render with severity icons, source badges, and timestamps | | |
| 4.5 | Text truncation | Resize to narrow width | Long secondary text truncates without overlapping | | |

---

## 5. Decision Intelligence (Row 3, Left)

| # | Test Case | Steps | Expected Result | Result | Notes |
|---|---|---|---|---|---|
| 5.1 | Capability cards | Inspect the capabilities section | 2 capability cards with status indicators and engaged/idle states | | |
| 5.2 | Recent decisions | Inspect "Recent Decisions" section | Decision cards show action, actor, reason, and status (executed/pending/rejected) | | |
| 5.3 | Latest decision only | Count visible decisions | Only the most recent decision is visible (condensed view) | | |

---

## 6. Observability & Telemetry (Row 3, Right)

| # | Test Case | Steps | Expected Result | Result | Notes |
|---|---|---|---|---|---|
| 6.1 | Telemetry chart | Inspect the area chart | Chart renders with gradient fills and smooth curves | | |
| 6.2 | Axis labels | Check X and Y axis text | Labels render at 11px in slate-500 color | | |
| 6.3 | Tooltip hover | Hover over chart data points | Tooltip appears at 12.5px with series name, color dot, and value | | |
| 6.4 | Legend | Check chart legend below chart | Legend renders at 12px with color swatches | | |
| 6.5 | Summary metrics | Inspect the top metric tiles | Summary metrics show label (12px) and value (14px bold) | | |

---

## 7. Active Workflows (Row 4, Left)

| # | Test Case | Steps | Expected Result | Result | Notes |
|---|---|---|---|---|---|
| 7.1 | Table headers | Inspect table header row | Headers render at 12px semibold text-slate-400 | | |
| 7.2 | Visible rows | Count rows before scrolling | 8 workflow rows visible by default | | |
| 7.3 | View All toggle | Click "View All (10)" link | Table expands to show all 10 workflows; link changes to "Show Less" | | |
| 7.4 | Show Less | Click "Show Less" after expanding | Table collapses back to 8 rows | | |
| 7.5 | Progress indicators | Inspect the progress column | 4-step pipeline dots render (green=done, blue=active, red=failed, gray=pending) | | |
| 7.6 | Priority column | Inspect priority values | Priority text is color-coded (red=high, yellow=medium, blue=low) | | |

---

## 8. Operator Console (Row 4, Right)

| # | Test Case | Steps | Expected Result | Result | Notes |
|---|---|---|---|---|---|
| 8.1 | Operator cards | Inspect the top section | 2 operator cards showing name, role, status dot, and task count | | |
| 8.2 | Activity log | Inspect the timeline feed | At least 8 activity items visible (mix of real alerts and synthetic placeholders) | | |
| 8.3 | Placeholder events | Check for synthetic entries | Entries include: Last command, Last acknowledgment, Last deployment, Last alert cleared | | |
| 8.4 | Equal height | Compare card height with Active Workflows | Operator Console matches Active Workflows card height | | |

---

## 9. Runtime Health (Row 5, Left)

| # | Test Case | Steps | Expected Result | Result | Notes |
|---|---|---|---|---|---|
| 9.1 | Health progress bar | Inspect the top progress bar | Green bar showing health score percentage | | |
| 9.2 | Summary KPIs | Inspect the 4-column KPI bar | Uptime, Errors, Latency, RPM values visible | | |
| 9.3 | Component rows | Count visible component rows | 6 components visible by default | | |
| 9.4 | View All toggle | Click "View All (9)" link | Table expands to show all 9 components; link changes to "Show Less" | | |
| 9.5 | Status colors | Check status column | Operational=green, warning=yellow, degraded=orange, offline=red | | |

---

## 10. Simulation & Replay (Row 5, Right)

| # | Test Case | Steps | Expected Result | Result | Notes |
|---|---|---|---|---|---|
| 10.1 | Session rows | Count visible sessions | 6 sessions visible by default | | |
| 10.2 | Progress bars | Inspect progress column | Each row shows a mini progress bar with percentage | | |
| 10.3 | View All toggle | Click "View All (8)" link | Table expands to show all 8 sessions | | |
| 10.4 | Status icons | Check session ID column | Running=blue pulse, completed=green check, failed=red octagon | | |

---

## 11. Evidence & Intelligence (Row 6)

| # | Test Case | Steps | Expected Result | Result | Notes |
|---|---|---|---|---|---|
| 11.1 | Evidence cards | Inspect the evidence section | Evidence entries render with category icons and confidence scores | | |
| 11.2 | Full width | Check grid span | Evidence section spans the full 12-column width | | |

---

## 12. Error States

| # | Test Case | Steps | Expected Result | Result | Notes |
|---|---|---|---|---|---|
| 12.1 | Network offline | Toggle DevTools offline mode | Red "System Offline" banner appears at top; cards retain last data | | |
| 12.2 | API error | Block API requests in DevTools | Affected cards show red error panel with "Retry" button | | |
| 12.3 | Retry recovery | Click "Retry" button after restoring network | Card re-fetches and displays fresh data | | |
| 12.4 | Zone crash | Inject `throw new Error()` in a layout | Only the affected zone shows ErrorBoundary; other zones unaffected | | |
| 12.5 | Reload zone | Click "Reload Zone" button on crashed zone | Zone re-renders successfully | | |

---

## 13. Typography & Visual Hierarchy

| # | Test Case | Steps | Expected Result | Result | Notes |
|---|---|---|---|---|---|
| 13.1 | Dashboard title | Inspect header title | "SHAKTI" renders at 21px font-bold | | |
| 13.2 | Subtitle | Inspect header subtitle | "Operational Command Center" renders at 13px text-slate-400 | | |
| 13.3 | Card titles | Inspect any DashboardCard title | All card titles render at 13.5px font-semibold text-slate-200 | | |
| 13.4 | Section headers | Inspect sub-headers (e.g., "Activity Log") | Section headers render at 14px font-semibold text-slate-300 | | |
| 13.5 | Table consistency | Compare table headers across cards | All table headers consistently use 12px font-semibold text-slate-400 | | |

---

## 14. Responsive Breakpoints

| # | Test Case | Resolution | Expected Result | Result | Notes |
|---|---|---|---|---|---|
| 14.1 | Desktop XL | 1920×1080 | Full grid, ~90-95% visible without scrolling | | |
| 14.2 | Desktop | 1440×900 | Full grid with minimal vertical scrolling | | |
| 14.3 | Laptop | 1366×768 | Zones use internal scroll, layout intact | | |
| 14.4 | Tablet | 768×1024 | Operations/Integrations stack; integration tiles 2-col | | |
| 14.5 | Mobile | 375×667 | All zones single-column stack | | |
