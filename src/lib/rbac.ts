// src/lib/rbac.ts
// Centralized Role-Based Access Control (RBAC) definitions and helpers

export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "MODERATOR"
  | "FINANCE_ADMIN"
  | "ACADEMIC_ADMIN"
  | "SUPPORT_AGENT"
  | "INSTRUCTOR"
  | "TEACHING_ASSISTANT"
  | "STUDENT";

export type Permission =
  | "course:create" | "course:edit" | "course:delete" | "course:publish"
  | "course:read" | "course:moderate" | "course:manageContent" | "course:preview"
  | "user:read" | "user:write" | "user:ban" | "user:assignRole"
  | "payment:refund" | "payment:validate" | "payment:chooseProvider"
  | "finance:read" | "finance:write"
  | "payout:trigger" | "payout:manage"
  | "support:create" | "support:reply" | "support:manage"
  | "certificate:issue" | "certificate:revoke" | "certificate:download"
  | "quiz:manage" | "quiz:attempt"
  | "admin:manageTeam" | "admin:settings"
  | "platform:settings:read" | "platform:settings:write";

export const RolePermissions: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    "course:create", "course:edit", "course:delete", "course:publish",
    "course:read", "course:moderate", "course:manageContent", "course:preview",
    "user:read", "user:write", "user:ban", "user:assignRole",
    "payment:refund", "payment:validate", "payment:chooseProvider",
    "finance:read", "finance:write",
    "payout:trigger", "payout:manage",
    "support:create", "support:reply", "support:manage",
    "certificate:issue", "certificate:revoke", "certificate:download",
    "quiz:manage", "quiz:attempt",
    "admin:manageTeam", "admin:settings",
    "platform:settings:read", "platform:settings:write",
  ],
  ADMIN: [
    "course:create", "course:edit", "course:publish", "course:read", "course:moderate",
    "user:read", "user:write",
    "payment:validate", "finance:read",
    "payout:manage",
    "support:reply", "support:manage",
    "certificate:issue", "certificate:download",
    "quiz:attempt",
    "platform:settings:read",
  ],
  MODERATOR: [
    "course:read", "course:edit", "course:publish", "course:moderate",
    "certificate:issue", "certificate:revoke",
    "user:read",
    "platform:settings:read",
  ],
  ACADEMIC_ADMIN: [
    "course:create", "course:edit", "course:publish", "course:read", "course:moderate",
    "certificate:issue", "certificate:revoke",
    "user:read",
    "platform:settings:read",
  ],
  FINANCE_ADMIN: [
    "user:read",
    "payment:refund", "payment:validate",
    "finance:read", "finance:write",
    "payout:trigger", "payout:manage",
    "platform:settings:read",
  ],
  SUPPORT_AGENT: [
    "user:read",
    "support:create", "support:reply", "support:manage",
  ],
  INSTRUCTOR: [
    "course:create", "course:edit", "course:publish", "course:read", "course:delete",
    "course:manageContent", "course:preview",
    "payout:trigger",
    "support:create",
    "payment:chooseProvider",
    "quiz:manage",
  ],
  TEACHING_ASSISTANT: [
    "course:read",
    "support:create", "support:reply",
  ],
  STUDENT: [
    "course:read",
    "support:create",
    "certificate:download",
    "quiz:attempt",
  ],
};

export interface AdminSidebarItem {
  key: string;
  label: string;
  href: string;
  icon: string;
  requiredPermission: Permission;
}

export const ALL_ADMIN_SIDEBAR_ITEMS: AdminSidebarItem[] = [
  { key: "overview",     label: "Vue d'ensemble",       href: "/admin",                 icon: "LayoutDashboard",  requiredPermission: "platform:settings:read" },
  { key: "team",         label: "Équipe Admin",          href: "/admin/team",            icon: "Users2",           requiredPermission: "admin:manageTeam" },
  { key: "users",        label: "Utilisateurs",          href: "/admin/users",           icon: "Users",            requiredPermission: "user:read" },
  { key: "courses",      label: "Validation Cours",      href: "/admin/courses",         icon: "BookOpen",         requiredPermission: "course:moderate" },
  { key: "transactions", label: "Transactions",          href: "/admin/transactions",    icon: "CreditCard",       requiredPermission: "finance:read" },
  { key: "payouts",      label: "Commissions & Payouts", href: "/admin/payouts",         icon: "Coins",            requiredPermission: "payout:manage" },
  { key: "coupons",      label: "Coupons",               href: "/admin/coupons",         icon: "Ticket",           requiredPermission: "finance:write" },
  { key: "support",      label: "Tickets Support",       href: "/admin/support",         icon: "LifeBuoy",         requiredPermission: "support:manage" },
  { key: "messages",     label: "Messages du Site",      href: "/admin/messages",        icon: "Mail",             requiredPermission: "support:manage" },
  { key: "live",         label: "Surveillance Live",     href: "/admin/connected-users", icon: "Activity",         requiredPermission: "support:manage" },
  { key: "settings",     label: "Configuration",         href: "/admin/settings",        icon: "Settings",         requiredPermission: "admin:settings" },
];

export function getAdminSidebarItems(
  role: Role,
  customGranted: Permission[] = [],
  customRevoked: Permission[] = []
): AdminSidebarItem[] {
  const base = RolePermissions[role] || [];
  const effective = new Set([...base, ...customGranted].filter(p => !customRevoked.includes(p)));
  return ALL_ADMIN_SIDEBAR_ITEMS.filter(item => effective.has(item.requiredPermission));
}

export interface RoleMeta {
  label: string;
  color: string;
  description: string;
  isAdminRole: boolean;
}

export const ROLE_META: Record<string, RoleMeta> = {
  SUPER_ADMIN:      { label: "Super Admin",      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",           description: "Accès total à toutes les fonctionnalités",         isAdminRole: true },
  ADMIN:            { label: "Admin",            color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",description: "Administration générale de la plateforme",           isAdminRole: true },
  MODERATOR:        { label: "Modérateur",       color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",description: "Validation des cours et contenu académique",         isAdminRole: true },
  ACADEMIC_ADMIN:   { label: "Admin Académique", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",description: "Validation des cours et contenu académique",         isAdminRole: true },
  FINANCE_ADMIN:    { label: "Admin Finance",    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",description: "Gestion des transactions, payouts et finances",  isAdminRole: true },
  SUPPORT_AGENT:    { label: "Support",          color: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",           description: "Traitement des tickets et messages du site",        isAdminRole: true },
  INSTRUCTOR:       { label: "Formateur",        color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",   description: "Création et gestion de cours",                      isAdminRole: false },
  TEACHING_ASSISTANT:{ label: "Ass. Pédagogique",color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",description: "Assistance pédagogique",                           isAdminRole: false },
  STUDENT:          { label: "Étudiant",         color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",          description: "Apprenant",                                         isAdminRole: false },
};

export const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "ACADEMIC_ADMIN", "FINANCE_ADMIN", "SUPPORT_AGENT"];

export type CourseStatus = "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
export type PaymentStatus = "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED" | "CANCELLED";
export type StudentStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "COMPLETED" | "AT_RISK";
export type CertificateStatus = "ELIGIBLE" | "ISSUED" | "REVOKED" | "EXPIRED";

export function hasRole(userRole: Role, requiredRole: Role | Role[]): boolean {
  if (userRole === "SUPER_ADMIN") return true;
  if (Array.isArray(requiredRole)) return requiredRole.includes(userRole);
  return userRole === requiredRole;
}

export function hasPermission(
  userRole: Role,
  permission: Permission,
  customGranted: Permission[] = [],
  customRevoked: Permission[] = []
): boolean {
  if (userRole === "SUPER_ADMIN") return true;
  const base = RolePermissions[userRole] || [];
  const effective = new Set([...base, ...customGranted].filter(p => !customRevoked.includes(p)));
  return effective.has(permission);
}

export function canAccessRoute(userRole: Role, route: string): boolean {
  if (userRole === "SUPER_ADMIN") return true;
  if (route.startsWith("/admin")) return hasRole(userRole, ADMIN_ROLES);
  if (route.startsWith("/instructor")) return hasRole(userRole, ["INSTRUCTOR", "TEACHING_ASSISTANT"]);
  return true;
}

export function canSeeMenuItem(userRole: Role, requiredPermission?: Permission): boolean {
  if (!requiredPermission) return true;
  return hasPermission(userRole, requiredPermission);
}

export type CurrentSession = {
  userId: string;
  name: string;
  email: string;
  role: Role;
  status: StudentStatus;
  plan?: "FREE" | "BASE" | "PRO" | "MAX";
  grantedPermissions?: Permission[];
  revokedPermissions?: Permission[];
};

export function getSimulatedSession(): CurrentSession | null {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem("kuettu_session");
  if (saved) {
    if (saved === "logged_out") return null;
    try { return JSON.parse(saved); } catch { /* ignore */ }
  }
  return null;
}

export function setSimulatedSession(session: CurrentSession) {
  if (typeof window !== "undefined") {
    localStorage.setItem("kuettu_session", JSON.stringify(session));
    localStorage.setItem("kuettu_user_name", session.name);
    localStorage.setItem("kuettu_active_role", session.role);
    window.dispatchEvent(new Event("storage"));
  }
}

export function clearSimulatedSession() {
  if (typeof window !== "undefined") {
    localStorage.setItem("kuettu_session", "logged_out");
    localStorage.removeItem("kuettu_user_name");
    localStorage.removeItem("kuettu_active_role");
    localStorage.removeItem("kuettu_academy_name");
    localStorage.removeItem("kuettu_academy_thematic");
    localStorage.removeItem("kuettu_user_level");
    localStorage.removeItem("kuettu_active_module");
    window.dispatchEvent(new Event("storage"));
  }
}
