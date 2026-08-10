"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { Ticket, Plus, Trash2, ToggleLeft, ToggleRight, Calendar, Users, Loader2, DollarSign, Percent, User } from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  role: string;
}

interface Course {
  id: string;
  title: string;
  instructor_id: string;
}

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  applicable_course_id: string | null;
  current_uses: number | null;
  max_uses: number | null;
  expires_at: string | null;
  is_active: boolean | null;
  created_by: string | null;
  created_at: string;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [form, setForm] = useState({
    code: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: "",
    applicableCourseId: "all",
    maxUses: "",
    expiryDate: ""
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch all courses
      const { data: coursesData } = await supabase
        .from("courses")
        .select("id, title, instructor_id");
      setCourses(coursesData || []);

      // 2. Fetch all profiles (to map who created the coupons)
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name");

      const { data: userRolesData } = await supabase
        .from("user_roles")
        .select("user_id, roles(name)");

      const roleMap = new Map<string, string>();
      userRolesData?.forEach((ur: any) => {
        const name = ur.roles?.name;
        if (name) {
          const current = roleMap.get(ur.user_id);
          const priority = ["SUPER_ADMIN", "ADMIN", "FINANCE_ADMIN", "ACADEMIC_ADMIN", "SUPPORT_AGENT", "INSTRUCTOR", "TEACHING_ASSISTANT", "STUDENT"];
          if (!current || priority.indexOf(name) < priority.indexOf(current)) {
            roleMap.set(ur.user_id, name);
          }
        }
      });

      const mappedProfiles = (profilesData || []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        role: roleMap.get(p.id) || "STUDENT"
      }));

      setProfiles(mappedProfiles);

      // 3. Fetch all coupons in the system
      const { data: couponsData } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      setCoupons(couponsData || []);
    } catch (err) {
      console.error("Error loading admin coupons data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.discountValue) return;

    setSaving(true);
    try {
      const response = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          description: form.description.trim() || null,
          discount_type: form.discountType,
          discount_value: parseFloat(form.discountValue),
          applicable_course_id: form.applicableCourseId === "all" ? null : form.applicableCourseId,
          max_uses: form.maxUses ? parseInt(form.maxUses) : null,
          expires_at: form.expiryDate ? new Date(form.expiryDate).toISOString() : null
        })
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.error || "Une erreur est survenue lors de la création.");
      }

      setShowCreateModal(false);
      // Reset form
      setForm({
        code: "",
        description: "",
        discountType: "PERCENTAGE",
        discountValue: "",
        applicableCourseId: "all",
        maxUses: "",
        expiryDate: ""
      });

      loadData();
    } catch (err: any) {
      alert("Erreur lors de la création : " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean | null) => {
    const nextStatus = currentStatus === null ? false : !currentStatus;
    try {
      const response = await fetch("/api/coupons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: nextStatus })
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.error || "Impossible de mettre à jour le statut.");
      }
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: nextStatus } : c));
    } catch (err: any) {
      console.error("Error toggling coupon:", err.message);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce coupon ?")) return;

    try {
      const response = await fetch(`/api/coupons?id=${id}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        const resData = await response.json();
        throw new Error(resData.error || "Impossible de supprimer le coupon.");
      }
      setCoupons(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert("Erreur de suppression : " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
      </div>
    );
  }

  const courseMap = new Map(courses.map(c => [c.id, c.title]));
  const profileMap = new Map(profiles.map(p => [p.id, p]));

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Gestion des Coupons</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Gérez tous les codes promo créés par vous et les formateurs de l'académie.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-650 hover:bg-red-500 text-white font-bold rounded-xl shadow-sm text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nouveau coupon global
        </button>
      </div>

      {/* Coupons List Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md overflow-hidden">
        {coupons.length === 0 ? (
          <div className="p-12 text-center">
            <Ticket className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
            <h3 className="font-bold text-zinc-700 dark:text-zinc-300 text-sm">Aucun coupon configuré</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-800/30 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase border-b border-zinc-100 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Créateur</th>
                  <th className="px-6 py-3">Réduction</th>
                  <th className="px-6 py-3">Cours applicable</th>
                  <th className="px-6 py-3 text-center">Utilisations</th>
                  <th className="px-6 py-3">Expiration</th>
                  <th className="px-6 py-3 text-center">Statut</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-sm text-zinc-900 dark:text-zinc-100">
                {coupons.map((c) => {
                  const creator = c.created_by ? profileMap.get(c.created_by) : null;
                  const courseTitle = c.applicable_course_id ? courseMap.get(c.applicable_course_id) || "Formation" : "Toutes les formations";
                  const expired = c.expires_at ? new Date(c.expires_at) < new Date() : false;

                  return (
                    <tr key={c.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-black text-teal-650 bg-teal-50 dark:bg-teal-900/20 px-2.5 py-1 rounded">
                          {c.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {creator ? (
                          <div>
                            <p className="font-semibold">{creator.full_name}</p>
                            <p className="text-xxs text-zinc-400 uppercase tracking-wider">{creator.role === "SUPER_ADMIN" || creator.role === "ADMIN" ? "Admin" : "Formateur"}</p>
                          </div>
                        ) : "—"}
                      </td>
                      <td className="px-6 py-4 font-bold text-teal-650">
                        {c.discount_type === "PERCENTAGE" ? `${c.discount_value}%` : `${c.discount_value}$`}
                      </td>
                      <td className="px-6 py-4 max-w-[180px] truncate" title={courseTitle}>
                        {courseTitle}
                      </td>
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        {c.current_uses || 0} / {c.max_uses || "∞"}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {c.expires_at ? new Date(c.expires_at).toLocaleDateString("fr-FR") : "Sans expiration"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xxs font-bold ${
                          expired 
                            ? "bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                            : (c.is_active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400" : "bg-zinc-100 text-zinc-500")
                        }`}>
                          {expired ? "Expiré" : (c.is_active ? "Actif" : "Désactivé")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleActive(c.id, c.is_active)}
                          className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                        >
                          {c.is_active ? <ToggleRight className="w-5 h-5 text-teal-500" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(c.id)}
                          className="p-1 text-zinc-400 hover:text-red-500 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-850 p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-150">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Nouveau Coupon Global Admin</h2>
            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Code promo</label>
                <input
                  type="text"
                  required
                  placeholder="EX: KCAAD50"
                  value={form.code}
                  onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-red-500/40 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Description (Optionnel)</label>
                <input
                  type="text"
                  placeholder="Ex: Réduction globale de l'académie"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-red-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Type de réduction</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm(prev => ({ ...prev, discountType: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-red-500/40"
                  >
                    <option value="PERCENTAGE">Pourcentage (%)</option>
                    <option value="FIXED">Montant fixe ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Valeur</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Ex: 50"
                    value={form.discountValue}
                    onChange={(e) => setForm(prev => ({ ...prev, discountValue: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-red-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Cours applicable</label>
                <select
                  value={form.applicableCourseId}
                  onChange={(e) => setForm(prev => ({ ...prev, applicableCourseId: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-red-500/40"
                >
                  <option value="all">Toutes les formations (Global)</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Utilisations max (Optionnel)</label>
                  <input
                    type="number"
                    placeholder="Ex: 500"
                    value={form.maxUses}
                    onChange={(e) => setForm(prev => ({ ...prev, maxUses: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-red-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Date d'expiration (Optionnel)</label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-red-500/40"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-center"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-red-650 hover:bg-red-500 disabled:bg-red-400 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer text-center"
                >
                  {saving ? "Création..." : "Créer le coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
