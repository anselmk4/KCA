"use client";

import { useEffect, useState } from "react";
import { getDB, Database } from "@/lib/db";
import { Users, CreditCard, TrendingUp, BookOpen } from "lucide-react";

export default function AdminDashboardPage() {
  const [db, setDb] = useState<Database | null>(null);

  useEffect(() => {
    setDb(getDB());
  }, []);

  if (!db) return <div className="p-8">Chargement des données...</div>;

  const totalRevenue = db.transactions.reduce((acc, curr) => acc + curr.amount, 0);
  const totalUsers = db.users.length;
  
  // Count popular courses
  const courseCounts = db.users.reduce((acc, user) => {
    acc[user.activeCourse] = (acc[user.activeCourse] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mostPopular = Object.keys(courseCounts).sort((a, b) => courseCounts[b] - courseCounts[a])[0] || "Aucun";

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Vue d'ensemble Admin</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Suivez les performances de la plateforme ANSELLA.</p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600">
            <CreditCard className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Chiffre d'affaires</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{totalRevenue}$</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Étudiants</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{totalUsers}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Croissance</p>
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">+15%</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Top Formation</p>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white capitalize">{mostPopular}</h3>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Inscriptions Récentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Nom</th>
                <th className="px-6 py-4 font-medium">Niveau</th>
                <th className="px-6 py-4 font-medium">Module</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {db.users.slice(-5).reverse().map((user) => (
                <tr key={user.id} className="text-zinc-900 dark:text-zinc-100 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium">{user.name}</td>
                  <td className="px-6 py-4">{user.level}</td>
                  <td className="px-6 py-4 capitalize">{user.activeCourse}</td>
                  <td className="px-6 py-4 text-zinc-500">{new Date(user.joinedAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {db.users.length === 0 && (
            <div className="p-8 text-center text-zinc-500">Aucun utilisateur enregistré.</div>
          )}
        </div>
      </div>
    </div>
  );
}
