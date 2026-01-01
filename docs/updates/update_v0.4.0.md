# Update v0.4.0: Cognitive Telemetry & Core Engine Refinement

**Date:** January 1, 2026
**Focus:** Observability, Metric Integrity, and UX "Tightening"

## Overview
This update introduces a "Glass-Box" observability layer ("Telemetry V2"). I moved critical metric calculations from the frontend to the Core Engine (`sceCore.ts`) to ensure mathematical truthfulness and enabling deeper system monitoring. The UI was polished to match the application's premium aesthetic.

## 🌟 Key Features

### 1. Telemetry V2 (Engine-Side Metrics)
I shifted from "vibe-based" counters to rigorous statistical measures:
- **Normalized Entropy (Focus Score)**: `1.0 - (Entropy / ln(N))`. Provides a scale-invariant measure of attention.
- **Stability Score**: `1 / (1 + Variance)`. High stability means energy is evenly distributed or clearly clustered, low stability implies chaotic diffusion.
- **Plasticity Burst Detection**: Separated plasticity into `meanWeightDelta` (background learning) and `maxWeightDelta` (shock/burst learning).
- **Hyperedge Activation**: New metric tracking the utilization of higher-order (multi-node) connections.

### 2. Core Engine Refinements
- **Internalized Math**: The engine now returns `activationPct` and `focusScore` directly in the `TelemetryPoint`, preventing frontend calculation drift.
- **Graph Traversal Monitoring**: Added `maxActivationDepth` to detect runaway reasoning chains or shallow diffusion.

### 3. Visual Polish ("Glass Dashboard")
- **Glassmorphism**: HUD cards now use `backdrop-blur` and translucent backgrounds.
- **Explainer Mode**: Interactive "Click-to-Explain" overlays for all metrics, detailing the Math, Meaning, and Signal for each value.
- **Collapsible Context Banner**: reduced visual noise in the chat view.

## 🛠 Technical Details

### `lib/sceCore.ts`
- **Refactor**: Overhauled `calculateMetrics` to perform full statistical analysis (Mean, Variance, Shannon Entropy) on every cycle.
- **Optimization**: Added safeguard to Entropy calculation for $N=1$ edge cases.

### `PerformanceView.tsx`
- **Architecture**: Converted to a "dumb" view that strictly renders Engine outputs. Custom derived logic was removed.
- **UX**: Added `MetricDetailOverlay` component system.

## 🐛 Bug Fixes
- Fixed "Ghost Node" deletion logic (Lazy Deletion safety).
- Fixed Type mismatches in `AuditLog`.
- Addressed duplicates in `AppHeader`.
