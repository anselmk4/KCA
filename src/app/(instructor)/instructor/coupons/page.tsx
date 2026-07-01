"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getSimulatedSession } from "@/lib/rbac";
import { Ticket, Plus, Trash2, ToggleLeft, ToggleRight, Calendar, Users, Loader2, DollarSign, Percent } from "lucide-react";

interface Course {
  id: string;
  title: string;
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
  created_at: string;
}

export default function InstructorCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch courses owned by the instructor
      const { data: coursesData } = await supabase
        .from("courses")
        .select("id, title")
        .eq("instructor_id", user.id);

      const instructorCourses = coursesData || [];
      setCourses(instructorCourses);

      // 2. Fetch coupons created by this instructor
      const { data: couponsData } = await supabase
        .from("coupons")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      setCoupons(couponsData || []);
    } catch (err) {
      console.error("Error loading coupons data:", err);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newCoupon = {
        code: form.code.trim().toUpperCase(),
        description: form.description.trim() || null,
        discount_type: form.discountType,
        discount_value: parseFloat(form.discountValue),
        applicable_course_id: form.applicableCourseId === "all" ? null : form.applicableCourseId,
        max_uses: form.maxUses ? parseInt(form.maxUses) : null,
        current_uses: 0,
        expires_at: form.expiryDate ? new Date(form.expiryDate).toISOString() : null,
        is_active: true,
        created_by: user.id
      };

      const { error } = await supabase
        .from("coupons")
        .insert(newCoupon);

      if (error) {
        throw error;
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
      alert("Erreur lors de la création du coupon : " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean | null) => {
    const nextStatus = currentStatus === null ? false : !currentStatus;
    try {
      const { error } = await supabase
        .from("coupons")
        .update({ is_active: nextStatus })
        .eq("id", id);

      if (error) throw error;
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: nextStatus } : c));
    } catch (err: any) {
      console.error("Error toggling coupon status:", err.message);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce coupon de réduction ?")) return;

    try {
      const { error } = await supabase
        .from("coupons")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setCoupons(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert("Erreur lors de la suppression : " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  const courseMap = new Map(courses.map(c => [c.id, c.title]));

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Coupons de réduction</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Créez et gérez des codes de réduction pour vos formations.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-sm text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nouveau coupon
        </button>
      </div>

      {/* Coupons grid */}
      {coupons.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
          <Ticket className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
          <h3 className="font-bold text-zinc-700 dark:text-zinc-300 text-sm">Aucun coupon disponible</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">Vous n'avez pas encore configuré de code promotionnel. Proposez des réductions pour booster vos ventes !</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coupons.map((c) => {
            const courseTitle = c.applicable_course_id ? courseMap.get(c.applicable_course_id) || "Formation" : "Toutes les formations";
            const expired = c.expires_at ? new Date(c.expires_at) < new Date() : false;

            return (
              <div
                key={c.id}
                className={`bg-white dark:bg-zinc-900 rounded-2xl border p-6 flex flex-col justify-between gap-4 transition-all relative overflow-hidden group hover:shadow-md ${
                  c.is_active && !expired
                    ? "border-teal-200 dark:border-teal-800/40"
                    : "border-zinc-200 dark:border-zinc-800 opacity-75"
                }`}
              >
                {/* Border line */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                  c.is_active && !expired ? "bg-teal-500" : "bg-zinc-400"
                }`} />

                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-lg font-black text-teal-600 bg-teal-50 dark:bg-teal-900/10 px-3 py-1 rounded-lg">
                        {c.code}
                      </span>
                      <p className="text-xs text-zinc-400 mt-2 font-medium">{c.description || "Aucune description"}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleActive(c.id, c.is_active)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                        title={c.is_active ? "Désactiver" : "Activer"}
                      >
                        {c.is_active ? <ToggleRight className="w-6 h-6 text-teal-500" /> : <ToggleLeft className="w-6 h-6" />}
                      </button>
                      <button
                        onClick={() => handleDeleteCoupon(c.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-500 cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-zinc-400">Réduction</p>
                      <p className="font-bold text-zinc-900 dark:text-white mt-0.5 flex items-center gap-1">
                        {c.discount_type === "PERCENTAGE" ? (
                          <>
                            <Percent className="w-3.5 h-3.5 text-teal-500" />
                            {c.discount_value}%
                          </>
                        ) : (
                          <>
                            <DollarSign className="w-3.5 h-3.5 text-teal-500" />
                            {c.discount_value}$
                          </>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-400">Applicable sur</p>
                      <p className="font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5 truncate" title={courseTitle}>
                        {courseTitle}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex items-center justify-between text-xxs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    Utilisations : {c.current_uses || 0} / {c.max_uses || "∞"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {c.expires_at ? `Expire le ${new Date(c.expires_at).toLocaleDateString("fr-FR")}` : "Sans expiration"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-850 p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-150">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Nouveau Coupon de Réduction</h2>
            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Code promotionnel</label>
                <input
                  type="text"
                  required
                  placeholder="EX: SOLDE20"
                  value={form.code}
                  onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-teal-500/40 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Description (Optionnel)</label>
                <input
                  type="text"
                  placeholder="Ex: Réduction estivale"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Type de réduction</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm(prev => ({ ...prev, discountType: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
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
                    placeholder="Ex: 20"
                    value={form.discountValue}
                    onChange={(e) => setForm(prev => ({ ...prev, discountValue: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Cours applicable</label>
                <select
                  value={form.applicableCourseId}
                  onChange={(e) => setForm(prev => ({ ...prev, applicableCourseId: e.target.value }))}
                  className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
                >
                  <option value="all">Toutes mes formations</option>
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
                    placeholder="Ex: 100"
                    value={form.maxUses}
                    onChange={(e) => setForm(prev => ({ ...prev, maxUses: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1.5">Date d'expiration (Optionnel)</label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
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
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-400 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer text-center"
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
