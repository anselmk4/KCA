"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { 
  getSimulatedSession, 
  touchSession, 
  isSessionExpired, 
  clearSimulatedSession 
} from "@/lib/rbac";
import { supabase } from "@/lib/supabase/client";

/**
 * SessionTimeoutManager
 * Automatically disconnects user sessions after 24 hours of inactivity.
 * Refreshes activity timestamp on user interaction (throttled).
 * Runs background checks every 30s and on tab focus.
 */
export function SessionTimeoutManager() {
  const router = useRouter();
  const pathname = usePathname();
  const lastTouchRef = useRef<number>(Date.now());

  useEffect(() => {
    // Check if session is already expired
    const checkTimeout = async () => {
      const session = getSimulatedSession();
      if (!session) return;

      if (isSessionExpired()) {
        console.warn("[SessionTimeoutManager] Session expired after 24h of inactivity. Logging out.");
        clearSimulatedSession();
        try {
          await supabase.auth.signOut();
        } catch (err) {
          console.error("[SessionTimeoutManager] Error during Supabase signOut:", err);
        }

        // Only redirect if currently inside a protected zone
        const isProtected = 
          pathname.startsWith("/admin") || 
          pathname.startsWith("/instructor") || 
          pathname.startsWith("/dashboard");

        if (isProtected) {
          router.replace("/login?reason=inactivity_timeout");
        }
      }
    };

    // User activity handler with 60-second throttling
    const handleActivity = () => {
      const now = Date.now();
      // Throttle writes to localStorage: at most once every 60 seconds
      if (now - lastTouchRef.current > 60 * 1000) {
        lastTouchRef.current = now;
        touchSession();
      }
    };

    // Initialize activity on load if logged in
    if (getSimulatedSession()) {
      touchSession();
      checkTimeout();
    }

    // Interaction listeners
    const activityEvents = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleActivity, { passive: true });
    });

    // Check expiration on tab focus / wake-up
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkTimeout();
      }
    };

    window.addEventListener("focus", checkTimeout);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Periodic check every 30 seconds
    const interval = setInterval(checkTimeout, 30 * 1000);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleActivity);
      });
      window.removeEventListener("focus", checkTimeout);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [pathname, router]);

  return null;
}
