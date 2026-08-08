# Component Library

The SHAKTI Dashboard Capability relies on a strict library of standardized UI primitives. These primitives are stateless and highly reusable.

## 1. Executive Primitives
- **`ExecutiveMetricCard`**: Displays top-level KPIs with a large value, trend indicator (up/down/stable), and an icon. Supports `primary` and `compact` variants.
- **`StatusCard`**: Displays system health statuses with pulsing indicator dots.

## 2. Operational Primitives
- **`RuntimeCard`**: Shows infrastructure node health, load, and geographic region.
- **`AlertCard`**: Renders high-priority, actionable alerts with severity-based color coding (Critical, High, Medium, Low).
- **`TimelineCard`**: A chronological list item for the Operator Console activity log.
- **`OperatorCard`**: Displays personnel status, role, and current active assignment.

## 3. Intelligence Primitives
- **`DecisionCard`**: Showcases automated AI decisions, the actor, the rationale, and the current execution status.
- **`CapabilityCard`**: Toggles displaying high-level system capabilities like "Predictive Scaling" and whether they are currently engaged.
- **`EvidenceCard`**: Used for compliance and security auditing, showing confidence scores and source metrics.

## 4. Workflow Primitives
- **`WorkflowCard`**: Renders active CI/CD or data pipeline workflows with an integrated progress bar and step indicators.
- **`IntegrationCard`**: Shows third-party integrations (e.g. Datadog, AWS, SAP) with their current sync status and latency.

## 5. Telemetry Primitives
- **`TelemetryCard`**: A reusable chart container utilizing Apache ECharts (or Recharts) for rendering time-series metrics.
- **`HealthIndicator`**: A micro-primitive used inline to show a colored dot based on status.

## Rules of Engagement
- **Never fetch data inside a primitive.**
- **Never define margins inside a primitive** (they should fill their container).
- **Always support Dark Mode** (the app is Dark Mode by default, rely on Tailwind `slate-800/900` tokens).
