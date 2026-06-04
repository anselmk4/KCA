"use client";

import { useEffect, useState } from "react";
import { getDB, Database } from "@/lib/db";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

export default function AdminTransactionsPage() {
  const [db, setDb] = useState<Database | null>(null);

  useEffect(() => {
    setDb(getDB());
  }, []);

  if (!db) return <div className="p-8">Chargement...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Suivi des Paiements</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Historique des transactions et abonnements sur la plateforme.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">ID Transaction</th>
                <th className="px-6 py-4 font-medium">Étudiant</th>
                <th className="px-6 py-4 font-medium">Module</th>
                <th className="px-6 py-4 font-medium">Montant</th>
                <th className="px-6 py-4 font-medium">Méthode</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {db.transactions.map((tx) => (
                <tr key={tx.id} className="text-zinc-900 dark:text-zinc-100 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-zinc-500">{tx.id}</td>
                  <td className="px-6 py-4 font-semibold">{tx.userName}</td>
                  <td className="px-6 py-4 capitalize">{tx.courseId}</td>
                  <td className="px-6 py-4 font-bold">{tx.amount}$</td>
                  <td className="px-6 py-4">{tx.method}</td>
                  <td className="px-6 py-4 text-zinc-500">{new Date(tx.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      {tx.status === "PAID" && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                      {tx.status === "FAILED" && <XCircle className="w-4 h-4 text-red-500" />}
                      {tx.status === "PENDING" && <Clock className="w-4 h-4 text-orange-500" />}
                      <span className={`font-semibold text-xs ${
                        tx.status === 'PAID' ? 'text-green-600 dark:text-green-400' :
                        tx.status === 'FAILED' ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
                      }`}>
                        {tx.status === 'PAID' ? 'Complété' : tx.status === 'FAILED' ? 'Échoué' : 'En attente'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
