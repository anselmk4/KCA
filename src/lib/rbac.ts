// src/lib/rbac.ts
// Centralized Role-Based Access Control (RBAC) definitions and helpers

export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "FINANCE_ADMIN"
  | "ACADEMIC_ADMIN"
  | "SUPPORT_AGENT"
  | "INSTRUCTOR"
  | "TEACHING_ASSISTANT"
  | "STUDENT";

export type Permission =
  | "course:create"
  | "course:edit"
  | "course:delete"
  | "course:publish"
  | "course:read"
  | "user:read"
  | "user:write"
  | "user:ban"
  | "payment:refund"
  | "payment:validate"
  | "payout:trigger"
  | "support:create"
  | "support:reply"
  | "certificate:issue"
  | "certificate:revoke"
  | "certificate:download"
  | "course:manageContent"
  | "course:preview"
  | "quiz:manage"
  | "payment:chooseProvider"
  | "quiz:attempt";


// Centralized permission assignments per role
export const RolePermissions: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    "course:create",
    "course:edit",
    "course:delete",
    "course:publish",
    "course:read",
    "user:read",
    "user:write",
    "user:ban",
    "payment:refund",
    "payment:validate",
    "payout:trigger",
    "support:create",
    "support:reply",
    "certificate:issue",
    "certificate:revoke",
    "certificate:download",
    "quiz:attempt",
  ],
  ADMIN: [
    "course:create",
    "course:edit",
    "course:publish",
    "course:read",
    "user:read",
    "user:write",
    "payment:validate",
    "support:reply",
    "certificate:issue",
    "certificate:download",
    "quiz:attempt",
  ],
  FINANCE_ADMIN: [
    "user:read",
    "payment:refund",
    "payment:validate",
    "payout:trigger",
    "support:reply",
  ],
  ACADEMIC_ADMIN: [
    "course:create",
    "course:edit",
    "course:publish",
    "course:read",
    "certificate:issue",
    "certificate:revoke",
  ],
  SUPPORT_AGENT: [
    "user:read",
    "support:reply",
  ],
  INSTRUCTOR: [
    "course:create",
    "course:edit",
    "course:publish",
    "course:read",
    "payout:trigger",
    "support:create",
    "course:delete",
    "payment:chooseProvider",
    "course:manageContent",
    "course:preview",
    "quiz:manage",
  ],
  TEACHING_ASSISTANT: [
    "course:read",
    "support:create",
    "support:reply",
  ],
  STUDENT: [
    "course:read",
    "support:create",
    "certificate:download",
    "quiz:attempt",
  ],
};

// Centralized statuses mapping
export type CourseStatus = "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
export type PaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"
  | "CANCELLED";
export type StudentStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "COMPLETED" | "AT_RISK";
export type CertificateStatus = "ELIGIBLE" | "ISSUED" | "REVOKED" | "EXPIRED";

// RBAC Helpers
export function hasRole(userRole: Role, requiredRole: Role | Role[]): boolean {
  if (userRole === "SUPER_ADMIN") return true;
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  return userRole === requiredRole;
}

export function hasPermission(userRole: Role, permission: Permission): boolean {
  if (userRole === "SUPER_ADMIN") return true;
  const permissions = RolePermissions[userRole] || [];
  return permissions.includes(permission);
}

export function canAccessRoute(userRole: Role, route: string): boolean {
  if (userRole === "SUPER_ADMIN") return true;

  if (route.startsWith("/admin")) {
    return hasRole(userRole, ["ADMIN", "FINANCE_ADMIN", "ACADEMIC_ADMIN", "SUPPORT_AGENT"]);
  }
  if (route.startsWith("/instructor")) {
    return hasRole(userRole, ["INSTRUCTOR", "TEACHING_ASSISTANT"]);
  }
  if (route.startsWith("/dashboard")) {
    return true; // All authenticated users can access the general dashboard workspace
  }
  return true;
}

export function canSeeMenuItem(userRole: Role, requiredPermission?: Permission): boolean {
  if (!requiredPermission) return true;
  return hasPermission(userRole, requiredPermission);
}

// Client-side authentication simulation state helper
export type CurrentSession = {
  userId: string;
  name: string;
  email: string;
  role: Role;
  status: StudentStatus;
  plan?: "FREE" | "BASE" | "PRO" | "MAX";
};

// Helper to retrieve the current simulated session
export function getSimulatedSession(): CurrentSession {
  if (typeof window === "undefined") {
    return {
      userId: "u_student_1",
      name: "Ansel Student",
      email: "student@kuettu.com",
      role: "STUDENT",
      status: "ACTIVE",
      plan: "FREE",
    };
  }

  const saved = localStorage.getItem("kuettu_session");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // Ignore parse error
    }
  }

  // Fallback default student session
  const defaultSession: CurrentSession = {
    userId: "u1", // Matches default student from db.ts
    name: "Jean Dupont",
    email: "jean@example.com",
    role: "STUDENT",
    status: "ACTIVE",
    plan: "FREE",
  };
  localStorage.setItem("kuettu_session", JSON.stringify(defaultSession));
  return defaultSession;
}

// Helper to update the simulated session (facilitating dashboard testing)
export function setSimulatedSession(session: CurrentSession) {
  if (typeof window !== "undefined") {
    localStorage.setItem("kuettu_session", JSON.stringify(session));
    // Synchronize older storage tags for existing code compatibility
    localStorage.setItem("kuettu_user_name", session.name);
    localStorage.setItem("kuettu_active_role", session.role);
    window.dispatchEvent(new Event("storage"));
  }
}
