/**
 * Performance and Web Vitals tracking.
 */
import { logger } from "./logger";

export function reportPerformanceMetric(name: string, value: number) {
  logger.info("Performance Metric", { name, value });
}

// Basic mocked tracking for React Profiler or Web Vitals
export function onRenderCallback(
  id: string, 
  phase: "mount" | "update", 
  actualDuration: number, 
  baseDuration: number, 
  _startTime: number, 
  _commitTime: number
) {
  if (actualDuration > 16) {
    // Log if rendering takes longer than a single frame (~16ms)
    logger.debug(`Slow Render: ${id} (${phase})`, { actualDuration, baseDuration });
  }
}
