"use client";

import { useEffect, useState, useMemo } from "react";
import { CreditCard, Download, ArrowRight, ExternalLink, Calendar, Receipt, User } from "lucide-react";
import Link from "next/link";
import { getDB, Transaction, Course, User as DBUser } from "@/lib/db";
import { getSimulatedSession } from "@/lib/rbac";

export default function StudentPaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<DBUser[]>([]);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const db = getDB();
    const currentSession = getSimulatedSession();
    setSession(currentSession);
    setCourses(db.courses || []);
    setUsers(db.users || []);

    if (currentSession) {
      // Filter transactions for this student with status PAID
      const userTxs = (db.transactions || []).filter(
        t => t.userId === currentSession.userId && t.status === "PAID"
      );
      // Sort by date descending
      userTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTransactions(userTxs);
    }
    setLoading(false);
  }, []);

  const cumulativePaid = useMemo(() => {
    return transactions.reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  const getCourseTitle = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.title : "Formation Spécialisée";
  };

  const getInstructorName = (tx: Transaction) => {
    // 1. Try from the transaction itself
    if (tx.instructorName) return tx.instructorName;
    // 2. Fallback: resolve from course
    const course = courses.find(c => c.id === tx.courseId);
    if (course?.instructorName) return course.instructorName;
    // 3. Fallback: resolve user
    if (tx.instructorId) {
      const user = users.find(u => u.id === tx.instructorId);
      if (user) return user.name;
    }
    return "—";
  };

  const downloadInvoice = (tx: Transaction, courseTitle: string) => {
    const instructorName = getInstructorName(tx);
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
          .invoice-box table tr.top table td.title { font-size: 32px; line-height: 32px; color: #1d4ed8; font-weight: bold; }
          .invoice-box table tr.information table td { padding-bottom: 40px; }
          .invoice-box table tr.heading td { background: #f4f4f5; border-bottom: 1px solid #e4e4e7; font-weight: bold; padding: 8px; }
          .invoice-box table tr.details td { padding-bottom: 20px; }
          .invoice-box table tr.item td { border-bottom: 1px solid #f4f4f5; padding: 10px 8px; }
          .invoice-box table tr.item.last td { border-bottom: none; }
          .invoice-box table tr.total td:nth-child(2) { border-top: 2px solid #e4e4e7; font-weight: bold; padding-top: 10px; font-size: 18px; color: #1d4ed8; }
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
                      Kinshasa, RDC / Dakar, Sénégal<br>
                      support@ansella.app
                    </td>
                    <td>
                      Client: ${tx.userName}<br>
                      ID Client: ${tx.userId}<br>
                      Formateur: ${instructorName}<br>
                      Moyen de paiement: ${tx.method || 'Carte'}
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
              <td>Accès complet à la formation : <strong>${courseTitle}</strong><br><small>Formateur : ${instructorName}</small></td>
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
        
        {/* Left Column: Payments Table (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/10">
              <h2 className="font-bold text-sm text-zinc-900 dark:text-white">Transactions validées</h2>
            </div>
            
            {transactions.length === 0 ? (
              <div className="text-center py-16 text-zinc-500 dark:text-zinc-400 space-y-3">
                <Receipt className="w-12 h-12 text-zinc-300 mx-auto" />
                <p className="text-sm font-medium">Aucun paiement trouvé dans votre historique.</p>
                <Link href="/dashboard/discover" className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline">
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
                    {transactions.map((tx) => {
                      const courseTitle = getCourseTitle(tx.courseId);
                      const instructorName = getInstructorName(tx);
                      return (
                        <tr key={tx.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                          <td className="px-5 py-4 font-semibold text-zinc-900 dark:text-white max-w-[200px]">
                            <p className="truncate">{courseTitle}</p>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                                <User className="w-3 h-3 text-teal-600" />
                              </div>
                              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[120px]">{instructorName}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-xs text-zinc-500">
                            {tx.method || "Carte"}
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
                            <button
                              onClick={() => downloadInvoice(tx, courseTitle)}
                              className="inline-flex items-center justify-center p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors cursor-pointer"
                              title="Télécharger la facture HTML"
                            >
                              <Download className="w-4 h-4" />
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

        {/* Right Column: Cumulative Summary Card (1/3) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 space-y-6">
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">Cumul des paiements</h3>
            
            <div className="py-6 border-y border-zinc-100 dark:border-zinc-800 text-center space-y-2">
              <p className="text-sm font-semibold text-zinc-500">Montant total investi</p>
              <p className="text-4xl font-black text-blue-600 dark:text-blue-400">${cumulativePaid} USD</p>
              <p className="text-xxs text-zinc-400">Cumul de tous vos règlements validés sur ANSELLA</p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between text-zinc-500">
                <span>Compte étudiant :</span>
                <span className="font-bold text-zinc-700 dark:text-zinc-300">{session?.name || "Apprenant"}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Transactions :</span>
                <span className="font-bold text-zinc-700 dark:text-zinc-300">{transactions.length}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Plan actuel :</span>
                <span className="font-bold text-blue-600">{session?.plan || "FREE"}</span>
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
