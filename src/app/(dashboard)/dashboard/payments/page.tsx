"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { CreditCard, Download, ArrowRight, Calendar, Receipt, User, Loader2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────
interface CourseData {
  id: string;
  title: string;
  instructor_id: string;
}

interface ProfileData {
  id: string;
  full_name: string;
}

interface PaymentRow {
  id: string;
  order_id: string;
  amount: number;
  status: string;
  provider: string;
  paid_at: string;
}

interface OrderItemRow {
  order_id: string;
  course_id: string;
}

interface DisplayTransaction {
  id: string;
  courseId: string;
  courseTitle: string;
  instructorName: string;
  amount: number;
  method: string;
  date: string;
}

const PROVIDER_MAP: Record<string, string> = {
  STRIPE: "Stripe / Carte",
  PAYPAL: "PayPal",
  MOBILE_MONEY: "Mobile Money",
  CRYPTO: "Cryptomonnaie",
  MANUAL: "Validation manuelle",
};

export default function StudentPaymentsPage() {
  const [transactions, setTransactions] = useState<DisplayTransaction[]>([]);
  const [userName, setUserName] = useState<string>("Apprenant");
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const loadPaymentsData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get current logged in user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      // 2. Load User Profile to get their full name
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.full_name) {
        setUserName(profile.full_name);
      }

      // 3. Load user's PAID payments from API route to bypass RLS issues
      const res = await fetch("/api/payments");
      const data = await res.json();
      if (res.ok && data.transactions) {
        setTransactions(data.transactions);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error("[StudentPaymentsPage] Error loading data from API:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPaymentsData();
  }, [loadPaymentsData]);

  const cumulativePaid = useMemo(() => {
    return transactions.reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  const downloadInvoice = (tx: DisplayTransaction) => {
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Facture ${tx.id}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 40px; }
          .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); font-size: 16px; line-height: 24px; color: #555; }
          .invoice-box table { width: 100%; line-height: inherit; text-align: left; }
          .invoice-box table td { padding: 5px; vertical-align: top; }
          .invoice-box table tr td:nth-child(2) { text-align: right; }
          .invoice-box table tr.top table td { padding-bottom: 20px; }
          .invoice-box table tr.top table td.title { font-size: 32px; line-height: 32px; color: #0d9488; font-weight: bold; }
          .invoice-box table tr.information table td { padding-bottom: 40px; }
          .invoice-box table tr.heading td { background: #f4f4f5; border-bottom: 1px solid #e4e4e7; font-weight: bold; padding: 8px; }
          .invoice-box table tr.details td { padding-bottom: 20px; }
          .invoice-box table tr.item td { border-bottom: 1px solid #f4f4f5; padding: 10px 8px; }
          .invoice-box table tr.item.last td { border-bottom: none; }
          .invoice-box table tr.total td:nth-child(2) { border-top: 2px solid #e4e4e7; font-weight: bold; padding-top: 10px; font-size: 18px; color: #0d9488; }
          .badge { display: inline-block; padding: 4px 8px; background-color: #10b981; color: white; border-radius: 9999px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <table cellpadding="0" cellspacing="0">
            <tr class="top">
              <td colspan="2">
                <table>
                  <tr>
                    <td class="title">ANSELLA</td>
                    <td>
                      Facture #: ${tx.id}<br>
                      Date: ${new Date(tx.date).toLocaleDateString('fr-FR')}<br>
                      Statut: <span class="badge">PAYÉ</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr class="information">
              <td colspan="2">
                <table>
                  <tr>
                    <td>
                      ANSELLA Academy Inc.<br>
                      Bureau de facturation international<br>
                      support@ansella.app
                    </td>
                    <td>
                      Client: ${userName}<br>
                      ID Client: ${userId}<br>
                      Formateur: ${tx.instructorName}<br>
                      Moyen de paiement: ${tx.method}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr class="heading">
              <td>Description du produit</td>
              <td>Prix</td>
            </tr>
            <tr class="item last">
              <td>Accès complet à la formation : <strong>${tx.courseTitle}</strong><br><small>Formateur : ${tx.instructorName}</small></td>
              <td>$${tx.amount} USD</td>
            </tr>
            <tr class="total">
              <td></td>
              <td>Total payé: $${tx.amount} USD</td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;
    const blob = new Blob([invoiceHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `facture-${tx.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Historique des Paiements</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Suivez vos factures et l&apos;ensemble de vos investissements sur la plateforme.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Payments Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/10">
              <h2 className="font-bold text-sm text-zinc-900 dark:text-white">Transactions validées</h2>
            </div>
            
            {transactions.length === 0 ? (
              <div className="text-center py-16 text-zinc-500 dark:text-zinc-400 space-y-3">
                <Receipt className="w-12 h-12 text-zinc-300 mx-auto" />
                <p className="text-sm font-medium">Aucun paiement trouvé dans votre historique.</p>
                <Link href="/dashboard/discover" className="inline-flex items-center gap-1.5 text-xs text-teal-600 font-bold hover:underline">
                  Acheter un cours <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/30 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider border-b border-zinc-150 dark:border-zinc-800">
                    <tr>
                      <th className="px-5 py-3.5">Formation</th>
                      <th className="px-5 py-3.5">Formateur</th>
                      <th className="px-5 py-3.5">Moyen</th>
                      <th className="px-5 py-3.5">Date</th>
                      <th className="px-5 py-3.5 text-right">Montant</th>
                      <th className="px-5 py-3.5 text-center">Facture</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 text-sm text-zinc-700 dark:text-zinc-300">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                        <td className="px-5 py-4 font-semibold text-zinc-900 dark:text-white max-w-[200px]">
                          <p className="truncate" title={tx.courseTitle}>{tx.courseTitle}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                              <User className="w-3 h-3 text-teal-600" />
                            </div>
                            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[120px]" title={tx.instructorName}>
                              {tx.instructorName}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-zinc-500">
                          {tx.method}
                        </td>
                        <td className="px-5 py-4 text-xs text-zinc-500 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                            {new Date(tx.date).toLocaleDateString("fr-FR")}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-extrabold text-zinc-900 dark:text-white">
                          ${tx.amount}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <a
                            href={`/api/payments/invoice/${tx.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors cursor-pointer"
                            title="Télécharger la facture HTML"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Explore other courses banner */}
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col sm:flex-row items-center justify-between">
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-white mb-1">Envie d&apos;aller plus loin ?</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Découvrez nos autres modules spécialisés.</p>
            </div>
            <Link href="/dashboard/discover" className="mt-4 sm:mt-0 px-5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2 text-xs">
              Voir le catalogue <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Right Column: Cumulative Summary Card */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 space-y-6">
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">Cumul des paiements</h3>
            
            <div className="py-6 border-y border-zinc-100 dark:border-zinc-800 text-center space-y-2">
              <p className="text-sm font-semibold text-zinc-500">Montant total investi</p>
              <p className="text-4xl font-black text-teal-600 dark:text-teal-400">${cumulativePaid} USD</p>
              <p className="text-xxs text-zinc-400">Cumul de tous vos règlements validés sur ANSELLA</p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between text-zinc-500">
                <span>Compte étudiant :</span>
                <span className="font-bold text-zinc-700 dark:text-zinc-300">{userName}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Transactions :</span>
                <span className="font-bold text-zinc-700 dark:text-zinc-300">{transactions.length}</span>
              </div>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-150 dark:border-zinc-800 flex items-start gap-2.5">
              <CreditCard className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
              <p className="text-xxs text-zinc-400 leading-normal">
                Vos transactions sont conformes aux régulations financières régionales de paiement mobile et cryptographique.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
