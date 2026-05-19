"use client";

import { useEffect, useState } from "react";
import { getDB, Database } from "@/lib/db";
import { MoreHorizontal, Mail, Ban } from "lucide-react";

export default function AdminUsersPage() {
  const [db, setDb] = useState<Database | null>(null);

  useEffect(() => {
    setDb(getDB());
  }, []);

  if (!db) return <div className="p-8">Chargement...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Gestion des Utilisateurs</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Liste complète de tous les étudiants de la Kuettu Academy.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">ID Utilisateur</th>
                <th className="px-6 py-4 font-medium">Nom Complet</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Formation</th>
                <th className="px-6 py-4 font-medium">Date d'inscription</th>
                <th className="px-6 py-4 font-medium">Statut</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {db.users.map((user) => (
                <tr key={user.id} className="text-zinc-900 dark:text-zinc-100 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-zinc-500">{user.id}</td>
                  <td className="px-6 py-4 font-semibold">{user.name}</td>
                  <td className="px-6 py-4">{user.email}</td>
                  <td className="px-6 py-4 capitalize">{user.activeCourse}</td>
                  <td className="px-6 py-4 text-zinc-500">{new Date(user.joinedAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold">
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 text-zinc-400">
                      <button className="p-1 hover:text-blue-600 transition-colors" title="Contacter">
                        <Mail className="w-4 h-4" />
                      </button>
                      <button className="p-1 hover:text-red-600 transition-colors" title="Suspendre">
                        <Ban className="w-4 h-4" />
                      </button>
                      <button className="p-1 hover:text-zinc-900 dark:hover:text-white transition-colors" title="Plus d'options">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
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
