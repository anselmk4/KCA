"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Users2, Plus, Shield, Mail, Trash2, Edit3, Check, X,
  Loader2, Search, RefreshCcw, ChevronDown, ShieldCheck,
  ShieldOff, Key, Clock, UserCheck, AlertTriangle,
} from "lucide-react";
import { getSimulatedSession, ROLE_META, Permission, Role, ALL_ADMIN_SIDEBAR_ITEMS, RolePermissions } from "@/lib/rbac";

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  lastSignIn: string | null;
  emailConfirmed: boolean;
  grantedPermissions: Permission[];
  revokedPermissions: Permission[];
  notes: string;
}

const ASSIGNABLE_ROLES: { value: string; label: string; color: string }[] = [
  { value: "ADMIN",          label: "Admin",            color: "bg-orange-100 text-orange-700" },
  { value: "MODERATOR",      label: "Modérateur",       color: "bg-violet-100 text-violet-700" },
  { value: "FINANCE_ADMIN",  label: "Admin Finance",    color: "bg-emerald-100 text-emerald-700" },
  { value: "SUPPORT_AGENT",  label: "Support",          color: "bg-sky-100 text-sky-700" },
];

// All possible permissions that can be custom-granted/revoked
const ALL_PERMISSIONS: { key: Permission; label: string; group: string }[] = [
  { key: "course:moderate",       label: "Valider/rejeter des cours",    group: "Cours" },
  { key: "course:create",         label: "Créer des cours",              group: "Cours" },
  { key: "course:delete",         label: "Supprimer des cours",          group: "Cours" },
  { key: "user:write",            label: "Modifier les utilisateurs",    group: "Utilisateurs" },
  { key: "user:ban",              label: "Suspendre des utilisateurs",   group: "Utilisateurs" },
  { key: "user:assignRole",       label: "Assigner des rôles",           group: "Utilisateurs" },
  { key: "finance:read",          label: "Voir les finances",            group: "Finances" },
  { key: "finance:write",         label: "Modifier les paramètres financiers", group: "Finances" },
  { key: "payout:manage",         label: "Gérer les versements",         group: "Finances" },
  { key: "payment:refund",        label: "Effectuer des remboursements", group: "Finances" },
  { key: "support:manage",        label: "Gérer le support",             group: "Support" },
  { key: "certificate:issue",     label: "Émettre des certificats",      group: "Certificats" },
  { key: "certificate:revoke",    label: "Révoquer des certificats",     group: "Certificats" },
  { key: "admin:settings",        label: "Accès aux Paramètres",         group: "Admin" },
  { key: "admin:manageTeam",      label: "Gérer l'équipe admin",         group: "Admin" },
  { key: "platform:settings:write", label: "Modifier les paramètres plateforme", group: "Admin" },
];

const PERMISSION_GROUPS = [...new Set(ALL_PERMISSIONS.map(p => p.group))];

export default function AdminTeamPage() {
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("SUPPORT_AGENT");
  const [inviteGranted, setInviteGranted] = useState<Permission[]>([]);
  const [inviteRevoked, setInviteRevoked] = useState<Permission[]>([]);
  const [inviteNotes, setInviteNotes] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Edit modal
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [editRole, setEditRole] = useState("SUPPORT_AGENT");
  const [editGranted, setEditGranted] = useState<Permission[]>([]);
  const [editRevoked, setEditRevoked] = useState<Permission[]>([]);
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/team");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setMembers(data.members || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const session = getSimulatedSession();
    if (!session || session.role !== "SUPER_ADMIN") {
      router.replace("/admin");
      return;
    }
    fetchMembers();
  }, [fetchMembers, router]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    setInviteError(null);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "invite",
          email: inviteEmail,
          name: inviteName,
          role: inviteRole,
          grantedPermissions: inviteGranted,
          revokedPermissions: inviteRevoked,
          notes: inviteNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setInviteSuccess(true);
      setTimeout(() => {
        setInviteSuccess(false);
        setShowInviteModal(false);
        setInviteEmail(""); setInviteName(""); setInviteRole("SUPPORT_AGENT");
        setInviteGranted([]); setInviteRevoked([]); setInviteNotes("");
        fetchMembers();
      }, 1500);
    } catch (e: any) {
      setInviteError(e.message);
    } finally {
      setInviting(false);
    }
  };

  const openEdit = (m: TeamMember) => {
    setEditMember(m);
    setEditRole(m.role);
    setEditGranted(m.grantedPermissions);
    setEditRevoked(m.revokedPermissions);
    setEditNotes(m.notes);
    setSaveError(null);
  };

  const handleSaveEdit = async () => {
    if (!editMember) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: editMember.id,
          role: editRole,
          grantedPermissions: editGranted,
          revokedPermissions: editRevoked,
          notes: editNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setEditMember(null);
      fetchMembers();
    } catch (e: any) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (member: TeamMember) => {
    if (!confirm(`Révoquer l'accès admin de ${member.name} (${member.email}) ? Cette personne deviendra un étudiant standard.`)) return;
    try {
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: member.id, action: "revoke" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      fetchMembers();
    } catch (e: any) {
      alert("Erreur : " + e.message);
    }
  };

  const togglePermission = (
    perm: Permission,
    list: Permission[],
    setList: (v: Permission[]) => void
  ) => {
    setList(list.includes(perm) ? list.filter(p => p !== perm) : [...list, perm]);
  };

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.role.toLowerCase().includes(search.toLowerCase())
  );

  const roleBadge = (role: string) => {
    const meta = ROLE_META[role];
    if (!meta) return null;
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.color}`}>
        <Shield className="w-2.5 h-2.5" />
        {meta.label}
      </span>
    );
  };

  // Permission toggle UI for modals
  const PermissionGrid = ({
    granted, revoked, baseRole,
    onToggleGrant, onToggleRevoke,
  }: {
    granted: Permission[]; revoked: Permission[]; baseRole: string;
    onToggleGrant: (p: Permission) => void; onToggleRevoke: (p: Permission) => void;
  }) => {
    const basePerms = new Set(RolePermissions[baseRole as Role] || []);
    return (
      <div className="space-y-4">
        {PERMISSION_GROUPS.map(group => (
          <div key={group}>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">{group}</p>
            <div className="grid grid-cols-1 gap-1">
              {ALL_PERMISSIONS.filter(p => p.group === group).map(({ key, label }) => {
                const hasBase = basePerms.has(key);
                const isGranted = granted.includes(key);
                const isRevoked = revoked.includes(key);
                return (
                  <div key={key} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${hasBase ? "bg-emerald-400" : "bg-zinc-300"}`} />
                      <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate">{label}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        title="Accorder en plus"
                        onClick={() => onToggleGrant(key)}
                        className={`p-1 rounded transition-colors ${isGranted ? "bg-emerald-100 text-emerald-600" : "text-zinc-300 hover:text-emerald-500"}`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      {hasBase && (
                        <button
                          type="button"
                          title="Révoquer"
                          onClick={() => onToggleRevoke(key)}
                          className={`p-1 rounded transition-colors ${isRevoked ? "bg-red-100 text-red-600" : "text-zinc-300 hover:text-red-500"}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <p className="text-[10px] text-zinc-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1" />Base = inclus par défaut dans ce rôle
        </p>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Users2 className="w-6 h-6 text-red-500" />
            Équipe Admin
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Gérez les membres de l'équipe d'administration, leurs rôles et permissions.
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Ajouter un Admin
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {ASSIGNABLE_ROLES.map(r => {
          const count = members.filter(m => m.role === r.value).length;
          return (
            <div key={r.value} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{r.label}</p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Search + refresh */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, rôle..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white placeholder:text-zinc-400"
          />
        </div>
        <button onClick={fetchMembers} className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500 transition-colors">
          <RefreshCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-zinc-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Chargement de l'équipe...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
            <Users2 className="w-10 h-10" />
            <p className="text-sm font-medium">Aucun administrateur trouvé</p>
            <button onClick={() => setShowInviteModal(true)} className="text-xs text-red-500 hover:underline">
              Ajouter un premier admin
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">Membre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">Rôle</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden md:table-cell">Ajouté le</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide hidden lg:table-cell">Dernière connexion</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">Statut</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filtered.map(m => (
                  <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-400 to-zinc-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {m.name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase()).join("")}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-900 dark:text-white truncate">{m.name}</p>
                          <p className="text-xs text-zinc-400 truncate">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">{roleBadge(m.role)}</td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className="text-xs text-zinc-500">
                        {new Date(m.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="text-xs text-zinc-500">
                        {m.lastSignIn ? new Date(m.lastSignIn).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "Jamais"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {m.emailConfirmed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                          <Check className="w-3 h-3" /> Actif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                          <Clock className="w-3 h-3" /> En attente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {m.grantedPermissions.length > 0 && (
                          <span title={`${m.grantedPermissions.length} permissions supplémentaires`} className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded font-medium">
                            +{m.grantedPermissions.length}
                          </span>
                        )}
                        {m.revokedPermissions.length > 0 && (
                          <span title={`${m.revokedPermissions.length} permissions révoquées`} className="text-[10px] text-red-600 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded font-medium">
                            -{m.revokedPermissions.length}
                          </span>
                        )}
                        <button
                          onClick={() => openEdit(m)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                          title="Modifier les permissions"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRevoke(m)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors"
                          title="Révoquer l'accès admin"
                        >
                          <ShieldOff className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Invite Modal ── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg border border-zinc-200 dark:border-zinc-800 mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-red-500" />
                Ajouter un Administrateur
              </h2>
              <button onClick={() => { setShowInviteModal(false); setInviteError(null); }} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleInvite} className="p-6 space-y-5">
              {inviteSuccess ? (
                <div className="flex flex-col items-center py-8 gap-3 text-emerald-600">
                  <ShieldCheck className="w-12 h-12" />
                  <p className="font-semibold text-lg">Administrateur ajouté !</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 block">Email *</label>
                      <input
                        type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                        placeholder="admin@example.com"
                        className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 block">Nom complet</label>
                      <input
                        value={inviteName} onChange={e => setInviteName(e.target.value)}
                        placeholder="Prénom Nom"
                        className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 block">Rôle *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {ASSIGNABLE_ROLES.map(r => (
                        <button
                          key={r.value} type="button" onClick={() => { setInviteRole(r.value); setInviteGranted([]); setInviteRevoked([]); }}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                            inviteRole === r.value
                              ? "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
                              : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                          }`}
                        >
                          <Shield className="w-3.5 h-3.5" />
                          {r.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1.5">{ROLE_META[inviteRole]?.description}</p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 block">Permissions personnalisées</label>
                    <div className="max-h-52 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-xl p-3">
                      <PermissionGrid
                        granted={inviteGranted} revoked={inviteRevoked} baseRole={inviteRole}
                        onToggleGrant={p => togglePermission(p, inviteGranted, setInviteGranted)}
                        onToggleRevoke={p => togglePermission(p, inviteRevoked, setInviteRevoked)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 block">Notes internes</label>
                    <textarea
                      value={inviteNotes} onChange={e => setInviteNotes(e.target.value)} rows={2}
                      placeholder="Ex: Responsable support Afrique centrale..."
                      className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white resize-none"
                    />
                  </div>

                  {inviteError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 text-sm">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {inviteError}
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setShowInviteModal(false)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium">
                      Annuler
                    </button>
                    <button type="submit" disabled={inviting}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                      {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                      {inviting ? "Ajout en cours..." : "Ajouter l'Administrateur"}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editMember && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-lg border border-zinc-200 dark:border-zinc-800 mb-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Key className="w-5 h-5 text-violet-500" />
                Modifier — {editMember.name}
              </h2>
              <button onClick={() => setEditMember(null)} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 block">Rôle</label>
                <div className="grid grid-cols-2 gap-2">
                  {ASSIGNABLE_ROLES.map(r => (
                    <button key={r.value} type="button" onClick={() => { setEditRole(r.value); setEditGranted([]); setEditRevoked([]); }}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        editRole === r.value
                          ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                      }`}>
                      <Shield className="w-3.5 h-3.5" />
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 block">Permissions personnalisées</label>
                <div className="max-h-52 overflow-y-auto border border-zinc-200 dark:border-zinc-700 rounded-xl p-3">
                  <PermissionGrid
                    granted={editGranted} revoked={editRevoked} baseRole={editRole}
                    onToggleGrant={p => togglePermission(p, editGranted, setEditGranted)}
                    onToggleRevoke={p => togglePermission(p, editRevoked, setEditRevoked)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5 block">Notes internes</label>
                <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={2}
                  className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 dark:text-white resize-none" />
              </div>

              {saveError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 text-sm">
                  {saveError}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setEditMember(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors font-medium">
                  Annuler
                </button>
                <button onClick={handleSaveEdit} disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {saving ? "Enregistrement..." : "Sauvegarder"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
