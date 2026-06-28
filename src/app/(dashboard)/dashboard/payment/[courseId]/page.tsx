"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CreditCard, Smartphone, ShieldCheck, QrCode } from "lucide-react";
import { getDB, saveDB, Course, Enrollment, Transaction, generateUUID } from "@/lib/db";
import { supabase } from "@/lib/supabase/client";

type PaymentMethod = "momo" | "paypal" | "crypto";

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("momo");
  const [payInstallment, setPayInstallment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // MOMO state
  const [momoProvider, setMomoProvider] = useState("mpesa");
  const [momoPhone, setMomoPhone] = useState("");

  // PayPal state
  const [paypalEmail, setPaypalEmail] = useState("");

  // Crypto state
  const [cryptoNetwork, setCryptoNetwork] = useState("trc20");

  useEffect(() => {
    async function loadCourse() {
      setLoading(true);
      try {
        const { data: currentCourse, error } = await supabase
          .from('courses')
          .select('id, title, slug, description, price, status, instructor_id, category_id, level, short_description')
          .eq('id', courseId)
          .maybeSingle();

        if (error || !currentCourse) {
          console.error('[payment] Error fetching course from Supabase:', error?.message);
          setLoading(false);
          return;
        }

        // Récupérer le nom de l'instructeur
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', currentCourse.instructor_id)
          .maybeSingle();

        // Récupérer le nom de la catégorie
        let categoryName = 'Formation';
        if (currentCourse.category_id) {
          const { data: category } = await supabase
            .from('categories')
            .select('name')
            .eq('id', currentCourse.category_id)
            .maybeSingle();
          if (category) categoryName = category.name;
        }

        let level = 'Débutant';
        if (currentCourse.level === 'INTERMEDIATE') level = 'Intermédiaire';
        else if (currentCourse.level === 'ADVANCED') level = 'Avancé';
        else if (currentCourse.level === 'EXPERT') level = 'Expert';

        let allowInstallments = false;
        let installmentsCount = 1;
        if (currentCourse.short_description) {
          try {
            const parsed = JSON.parse(currentCourse.short_description);
            if (parsed && typeof parsed === 'object') {
              allowInstallments = !!parsed.allowInstallments;
              installmentsCount = Number(parsed.installmentsCount) || 1;
            }
          } catch {
            // Ignore
          }
        }

        setCourse({
          id: currentCourse.id,
          title: currentCourse.title,
          slug: currentCourse.slug,
          description: currentCourse.description || '',
          price: currentCourse.price,
          status: currentCourse.status as any,
          instructorId: currentCourse.instructor_id,
          instructorName: profile?.full_name || 'Prof. Kuettu',
          createdAt: new Date().toISOString(),
          rating: 0,
          category: categoryName,
          level,
          allowInstallments,
          installmentsCount
        });
      } catch (err) {
        console.error('[payment] Unexpected error loading course from Supabase:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCourse();

    // Pré-remplir l'email utilisateur si connecté
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setPaypalEmail(user.email);
      }
    });
  }, [courseId]);

  const finalAmount = course && payInstallment && course.allowInstallments
    ? Math.round(course.price / (course.installmentsCount || 1))
    : course ? course.price : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;

    setSubmitting(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        alert("Session introuvable. Veuillez vous connecter.");
        setSubmitting(false);
        return;
      }

      // 1. Écrire l'enrollment dans Supabase en tant qu'ACTIVE
      const { error: enrollError } = await supabase
        .from('enrollments')
        .upsert({
          student_id: user.id,
          course_id: course.id,
          progress_percent: 0,
          status: 'ACTIVE',
          enrolled_at: new Date().toISOString()
        }, { onConflict: 'student_id,course_id' });

      if (enrollError) {
        console.error('[payment] Error writing enrollment to Supabase:', enrollError.message);
        throw new Error("Impossible d'activer votre inscription dans la base de données. Veuillez réessayer.");
      }

      // 2. Écrire la transaction dans Supabase (non bloquant en cas d'erreur de politiques RLS sur les tables de commande)
      try {
        const orderId = generateUUID();
        await supabase.from('orders').insert({
          id: orderId,
          user_id: user.id,
          status: 'COMPLETED',
          total_price: finalAmount,
          created_at: new Date().toISOString()
        } as any);

        await supabase.from('order_items').insert({
          id: generateUUID(),
          order_id: orderId,
          course_id: course.id,
          unit_price: finalAmount,
          final_price: finalAmount
        } as any);

        let payProvider: 'STRIPE' | 'PAYPAL' | 'MOBILE_MONEY' | 'CRYPTO' | 'MANUAL' = 'STRIPE';
        if (method === 'momo') payProvider = 'MOBILE_MONEY';
        else if (method === 'paypal') payProvider = 'PAYPAL';
        else if (method === 'crypto') payProvider = 'CRYPTO';

        await supabase.from('payments').insert({
          id: generateUUID(),
          order_id: orderId,
          user_id: user.id,
          amount: finalAmount,
          status: 'PAID',
          provider: payProvider,
          paid_at: new Date().toISOString()
        } as any);
      } catch (receiptErr) {
        console.warn('[payment] Order/Payment receipt insert warning (non-blocking):', receiptErr);
      }

      // 3. Mettre à jour la base locale pour compatibilité synchrone
      const db = getDB();
      const existingEnrollmentIdx = db.enrollments.findIndex(
        e => e.studentId === user.id && e.courseId === course.id
      );

      const newEnrollment: Enrollment = {
        id: existingEnrollmentIdx !== -1 ? db.enrollments[existingEnrollmentIdx].id : `e_${Date.now()}`,
        studentId: user.id,
        courseId: course.id,
        progressPercent: existingEnrollmentIdx !== -1 ? db.enrollments[existingEnrollmentIdx].progressPercent : 0,
        joinedAt: existingEnrollmentIdx !== -1 ? db.enrollments[existingEnrollmentIdx].joinedAt : new Date().toISOString(),
        status: "ACTIVE"
      };

      if (existingEnrollmentIdx !== -1) {
        db.enrollments[existingEnrollmentIdx] = newEnrollment;
      } else {
        db.enrollments.push(newEnrollment);
      }

      let payMethodLabel: Transaction["method"] = "Carte";
      if (method === "momo") payMethodLabel = "Mobile Money";
      else if (method === "paypal") payMethodLabel = "PayPal";

      const newTransaction: Transaction = {
        id: `tx_${Date.now()}`,
        userId: user.id,
        userName: user.email?.split('@')[0] || 'Étudiant',
        amount: finalAmount,
        courseId: course.id,
        instructorId: course.instructorId,
        instructorName: course.instructorName,
        date: new Date().toISOString(),
        status: "PAID",
        method: payMethodLabel
      };

      db.transactions.push(newTransaction);
      saveDB(db);

      // Déclencher la synchronisation en arrière-plan
      const { syncFromSupabase } = await import("@/lib/supabase/sync");
      await syncFromSupabase();


      setSubmitting(false);
      alert(`Paiement de $${finalAmount} validé avec succès ! Votre formation est débloquée.`);
      router.push("/dashboard/courses");
    } catch (err: any) {
      console.error('[payment] Unexpected error during checkout:', err);
      alert(err.message || "Une erreur est survenue lors de la validation de votre paiement.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border">
        <h2 className="text-2xl font-bold mb-2">Cours introuvable</h2>
        <p className="text-zinc-500 mb-6">Impossible d'initier le paiement.</p>
        <Link href="/dashboard/discover" className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl">
          Retour au catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      
      {/* Back link */}
      <Link href={`/dashboard/discover/${course.id}`} className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-950 dark:hover:text-white text-sm font-semibold transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Retour à l'aperçu
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Payment options & form (Left) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Main card */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md overflow-hidden">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/10">
              <h2 className="font-extrabold text-lg text-zinc-900 dark:text-white">Sélectionner un moyen de paiement</h2>
              <p className="text-xs text-zinc-500 mt-1">Transaction 100% sécurisée et cryptée</p>
            </div>

            {/* Selection tabs */}
            <div className="grid grid-cols-3 border-b border-zinc-200 dark:border-zinc-800 p-2 gap-1 bg-zinc-50/20">
              <button
                type="button"
                onClick={() => setMethod("momo")}
                className={`flex flex-col items-center gap-2 py-3 rounded-xl transition-all cursor-pointer ${
                  method === "momo"
                    ? "bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-bold"
                    : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-700"
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <span className="text-xs">Mobile Money</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod("paypal")}
                className={`flex flex-col items-center gap-2 py-3 rounded-xl transition-all cursor-pointer ${
                  method === "paypal"
                    ? "bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-bold"
                    : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-700"
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-xs">PayPal</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod("crypto")}
                className={`flex flex-col items-center gap-2 py-3 rounded-xl transition-all cursor-pointer ${
                  method === "crypto"
                    ? "bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-bold"
                    : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:text-zinc-700"
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span className="text-xs">Crypto (USDT)</span>
              </button>
            </div>

            {/* Input Forms */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* MOMO Form */}
              {method === "momo" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Opérateur</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "mpesa", label: "M-Pesa (Vodacom)" },
                        { id: "orange", label: "Orange Money" },
                        { id: "airtel", label: "Airtel Money" }
                      ].map(provider => (
                        <button
                          key={provider.id}
                          type="button"
                          onClick={() => setMomoProvider(provider.id)}
                          className={`px-3 py-3 border rounded-xl text-xs font-semibold text-center transition-all cursor-pointer ${
                            momoProvider === provider.id
                              ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                              : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
                          }`}
                        >
                          {provider.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Numéro de téléphone</label>
                    <input
                      type="tel"
                      required
                      placeholder="Ex: +243990000000"
                      value={momoPhone}
                      onChange={(e) => setMomoPhone(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                    <p className="text-xxs text-zinc-400 mt-1">Vous recevrez une demande de confirmation de code PIN sur votre téléphone.</p>
                  </div>
                </div>
              )}

              {/* PayPal Form */}
              {method === "paypal" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Adresse email PayPal</label>
                    <input
                      type="email"
                      required
                      placeholder="votre-email@exemple.com"
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>
                </div>
              )}

              {/* Crypto Form */}
              {method === "crypto" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Réseau de transfert</label>
                    <div className="flex gap-4">
                      {[
                        { id: "trc20", label: "Tron (TRC20)" },
                        { id: "erc20", label: "Ethereum (ERC20)" }
                      ].map(net => (
                        <button
                          key={net.id}
                          type="button"
                          onClick={() => setCryptoNetwork(net.id)}
                          className={`px-4 py-2.5 border rounded-xl text-xs font-semibold cursor-pointer ${
                            cryptoNetwork === net.id
                              ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                              : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
                          }`}
                        >
                          {net.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/50 dark:border-zinc-800 space-y-3">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Veuillez envoyer exactement <span className="font-bold text-zinc-900 dark:text-white">${finalAmount} USDT</span> à l'adresse ci-dessous :</p>
                    <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-300 dark:border-zinc-700 select-all font-mono text-xs text-center break-all text-zinc-900 dark:text-white">
                      {cryptoNetwork === "trc20"
                        ? "TY7aB4n8W3rWq9s9J2tA1kPz5X9c2v3b4n"
                        : "0x7aB4n8W3rWq9s9J2tA1kPz5X9c2v3b4n8W3rWq9s"}
                    </div>
                    <div className="flex items-center justify-center pt-2">
                      <svg className="w-32 h-32 text-zinc-800 dark:text-white border border-zinc-200 p-2 rounded bg-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M0 0h6v6H0zm2 2v2h2V2zm0 6h6v6H0zm2 2v2h2v-2zm0 6h6v6H0zm2 2v2h2v-2zm6-14h6v6H8zm2 2v2h2V2zm0 6h6v6H8zm2 2v2h2v-2zm6-10h6v6h-6zm2 2v2h2V2zm-4 8h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm4-4h2v2h-2zm0 4h2v2h-2zm-4 4h2v2h-2zm2 2h2v2h-2zm4-4h2v2h-2z" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Billing Options Selector (Installments vs Full) */}
              {course.allowInstallments && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Option de facturation</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPayInstallment(false)}
                      className={`p-3 border rounded-xl text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        !payInstallment
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          : "border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 hover:border-zinc-400"
                      }`}
                    >
                      <span>Paiement unique</span>
                      <span className="text-xxs opacity-80">${course.price} USD</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayInstallment(true)}
                      className={`p-3 border rounded-xl text-xs font-semibold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        payInstallment
                          ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          : "border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 hover:border-zinc-400"
                      }`}
                    >
                      <span>En {course.installmentsCount} mensualités</span>
                      <span className="text-xxs opacity-80">${finalAmount} USD / mois</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-500/20"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Validation de la transaction...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    <span>Valider le paiement de ${finalAmount}</span>
                  </>
                )}
              </button>

            </form>
          </div>
        </div>

        {/* Recapitulation (Right) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-md p-6 space-y-4">
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">Récapitulatif de commande</h3>
            
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-800">
                <CreditCard className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white leading-tight line-clamp-2">{course.title}</h4>
                <p className="text-xs text-zinc-400 mt-1">{course.category}</p>
              </div>
            </div>

            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Sous-total :</span>
                <span className="font-semibold text-zinc-900 dark:text-white">${course.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Frais d'inscription :</span>
                <span className="font-semibold text-green-500">Gratuit</span>
              </div>
              {payInstallment && course.allowInstallments && (
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Tranches restantes :</span>
                  <span>{(course.installmentsCount || 1) - 1} x ${finalAmount}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-zinc-100 dark:border-zinc-800 pt-2 text-base font-bold">
                <span className="text-zinc-950 dark:text-white">Aujourd'hui :</span>
                <span className="text-blue-600 dark:text-blue-400">${finalAmount}</span>
              </div>
            </div>

            <div className="text-xxs text-zinc-400 text-center pt-2">
              En validant, vous acceptez les conditions générales d'utilisation d'ANSELLA et autorisez la facturation immédiate.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
