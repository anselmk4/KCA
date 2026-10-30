// src/lib/analytics-store.ts
// Server-side telemetry buffer & funnel event aggregator for Admin Analytics

export type AnalyticsEventType =
  | "pageview"
  | "page_exit"
  | "cta_click"
  | "onboarding_step"
  | "checkout_view"
  | "payment_attempt"
  | "payment_success"
  | "payment_error";

export interface TelemetryEvent {
  id: string;
  visitorId: string;
  sessionId: string;
  userId?: string | null;
  type: AnalyticsEventType;
  path: string;
  referrer?: string;
  device: "Mobile" | "Desktop" | "Tablet";
  country?: string;
  durationSec?: number;
  step?: string;
  paymentMethod?: string;
  errorReason?: string;
  courseId?: string;
  timestamp: string;
}

const MAX_BUFFER_EVENTS = 1500;

declare global {
  // eslint-disable-next-line no-var
  var __ansellaAnalyticsBuffer: TelemetryEvent[] | undefined;
}

export function getTelemetryBuffer(): TelemetryEvent[] {
  if (!globalThis.__ansellaAnalyticsBuffer) {
    globalThis.__ansellaAnalyticsBuffer = [];
  }
  return globalThis.__ansellaAnalyticsBuffer;
}

export function pushTelemetryEvent(event: Omit<TelemetryEvent, "id" | "timestamp"> & { timestamp?: string }): TelemetryEvent {
  const buffer = getTelemetryBuffer();
  const fullEvent: TelemetryEvent = {
    ...event,
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: event.timestamp || new Date().toISOString(),
  };

  buffer.push(fullEvent);
  if (buffer.length > MAX_BUFFER_EVENTS) {
    buffer.splice(0, buffer.length - MAX_BUFFER_EVENTS);
  }
  return fullEvent;
}

