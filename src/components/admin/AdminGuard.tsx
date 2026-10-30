"use client";

import React, { useEffect, useState } from "react";
import { ShieldOff } from "lucide-react";
import {
  getSimulatedSession,
  setSimulatedSession,
  hasPermission,
  Permission,
  Role,
} from "@/lib/rbac";

interface AdminGuardProps {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AdminGuard({ permission, children, fallback }: AdminGuardProps) {
  const [session, setSession] = useState(() => getSimulatedSession());

  useEffect(() => {
    let active = true;
    fetch("/api/admin/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data?.role) return;
        const current = getSimulatedSession();
        const synced = {
          userId: data.id || current?.userId || "",
          name: data.full_name || current?.name || "Admin",
          email: data.email || current?.email || "",
          role: data.role as Role,
          status: "ACTIVE" as const,
          plan: current?.plan || "FREE",
          grantedPermissions: data.grantedPermissions || [],
          revokedPermissions: data.revokedPermissions || [],
        };
        setSimulatedSession(synced);
        setSession(synced);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  if (!session) return null;

  const granted = hasPermission(
    session.role as Role,
    permission,
    session.grantedPermissions || [],
    session.revokedPermissions || []
  );

  if (!granted) {
    if (fallback !== undefined) return <>{fallback}</>;
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
          <ShieldOff className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-white text-lg">Accès Restreint</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
            Vous n&apos;avez pas les permissions nécessaires pour accéder à cette section.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Inline hook for permission check in pages
export function useAdminPermission(permission: Permission): boolean {
  const session = getSimulatedSession();
  if (!session) return false;
  return hasPermission(
    session.role as Role,
    permission,
    session.grantedPermissions || [],
    session.revokedPermissions || []
  );
}
