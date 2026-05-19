"use client";

import { useEffect, useState } from "react";
import { CreditCard, Download, ExternalLink, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function StudentPaymentsPage() {
  const [activeModule, setActiveModule] = useState("blockchain");

  useEffect(() => {
    const savedModule = localStorage.getItem("kuettu_active_module");
    if (savedModule) setActiveModule(savedModule);
  }, []);

  const priceMap: Record<string, string> = { blockchain: "300$", trading: "500$", ai: "1000$", web3: "1500$" };
  const moduleNames: Record<string, string> = { blockchain: "Fondamentaux de la Blockchain", trading: "Crypto-monnaie / Trading", ai: "Intelligence Artificielle", web3: "Développement Web3" };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Historique des Paiements</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Gérez vos factures et vos abonnements actuels.</p>
      </div>

      {/* Current Plan */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between shadow-xl shadow-blue-900/20">
        <div>
          <p className="text-blue-200 mb-1 uppercase tracking-wider text-sm font-semibold">Formation Active</p>
          <h2 className="text-3xl font-bold mb-2">{moduleNames[activeModule]}</h2>
          <p className="text-blue-100 opacity-90 flex items-center gap-2">
            <CreditCard className="w-5 h-5" /> Payé en une fois
          </p>
        </div>
        <div className="mt-6 md:mt-0 text-right">
          <p className="text-sm text-blue-200 mb-1">Montant total</p>
          <p className="text-4xl font-extrabold">{priceMap[activeModule]}</p>
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4">Transactions récentes</h3>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-sm">
                <tr>
                  <th className="px-6 py-4 font-medium">Description</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Montant</th>
                  <th className="px-6 py-4 font-medium">Statut</th>
                  <th className="px-6 py-4 font-medium text-right">Facture</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                <tr className="text-zinc-900 dark:text-zinc-100 text-sm">
                  <td className="px-6 py-4 font-medium">Achat : {moduleNames[activeModule]}</td>
                  <td className="px-6 py-4 text-zinc-500">{new Date().toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-bold">{priceMap[activeModule]}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                      Complété
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium transition-colors">
                      <Download className="w-4 h-4" /> PDF
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Explore other courses */}
      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col sm:flex-row items-center justify-between">
        <div>
          <h4 className="font-bold text-zinc-900 dark:text-white mb-1">Envie d'aller plus loin ?</h4>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Découvrez nos autres modules spécialisés.</p>
        </div>
        <Link href="/courses" className="mt-4 sm:mt-0 px-5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2">
          Voir le catalogue <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
