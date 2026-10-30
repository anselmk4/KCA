"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getSimulatedSession } from "@/lib/rbac";

function getOrCreateVisitorId(): string {
  if (typeof window === "undefined") return "anon";
  let vid = localStorage.getItem("ansella_visitor_id");
  if (!vid) {
    vid = `vis_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem("ansella_visitor_id", vid);
  }
  return vid;
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "sess";
  let sid = sessionStorage.getItem("ansella_session_id");
  if (!sid) {
    sid = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem("ansella_session_id", sid);
  }
  return sid;
}

function detectDeviceType(): "Mobile" | "Tablet" | "Desktop" {
  if (typeof navigator === "undefined") return "Desktop";
  const ua = navigator.userAgent || "";
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "Tablet";
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated/i.test(ua)) return "Mobile";
  return "Desktop";
}

export function sendAnalyticsEvent(payload: {
  type:
    | "pageview"
    | "page_exit"
    | "cta_click"
    | "onboarding_step"
    | "checkout_view"
    | "payment_attempt"
    | "payment_success"
    | "payment_error";
  path?: string;
  durationSec?: number;
  step?: string;
  paymentMethod?: string;
  errorReason?: string;
  courseId?: string;
}) {
  if (typeof window === "undefined") return;
  try {
    const session = getSimulatedSession();
    const body = JSON.stringify({
      visitorId: getOrCreateVisitorId(),
      sessionId: getOrCreateSessionId(),
      userId: session?.userId || null,
      device: detectDeviceType(),
      referrer: document.referrer || "",
      path: payload.path || window.location.pathname,
      ...payload,
    });

    if (payload.type === "page_exit" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/track", blob);
    } else {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Non-blocking telemetry
  }
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const enterTimeRef = useRef<number>(Date.now());
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    // Record exit duration on previous path
    if (prevPathRef.current && prevPathRef.current !== pathname) {
      const durationSec = Math.round((Date.now() - enterTimeRef.current) / 1000);
      sendAnalyticsEvent({
        type: "page_exit",
        path: prevPathRef.current,
        durationSec,
      });
    }

    enterTimeRef.current = Date.now();
    prevPathRef.current = pathname;

    // Record pageview
    sendAnalyticsEvent({
      type: "pageview",
      path: pathname,
    });

    // Automatically classify high-intent checkout or onboarding views
    if (pathname.startsWith("/dashboard/payment") || pathname.startsWith("/instructor/billing/pay")) {
      const segments = pathname.split("/");
      const maybeCourseId = segments[segments.length - 1];
      sendAnalyticsEvent({
        type: "checkout_view",
        path: pathname,
        courseId: maybeCourseId !== "payment" && maybeCourseId !== "pay" ? maybeCourseId : undefined,
      });
    } else if (pathname === "/register") {
      sendAnalyticsEvent({
        type: "onboarding_step",
        path: pathname,
        step: "register_entry",
      });
    }
  }, [pathname]);

  useEffect(() => {
    const handleUnload = () => {
      if (!prevPathRef.current) return;
      const durationSec = Math.round((Date.now() - enterTimeRef.current) / 1000);
      sendAnalyticsEvent({
        type: "page_exit",
        path: prevPathRef.current,
        durationSec,
      });
    };

    window.addEventListener("pagehide", handleUnload);
    return () => window.removeEventListener("pagehide", handleUnload);
  }, []);

  return null;
}

