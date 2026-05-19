"use client";

import { useEffect, useState } from "react";
import { User, Mail, Shield, Bell } from "lucide-react";

export default function StudentSettingsPage() {
  const [userName, setUserName] = useState("Ansel");
  const [userLevel, setUserLevel] = useState("Débutant");

  useEffect(() => {
    const savedName = localStorage.getItem("kuettu_user_name");
    const savedLevel = localStorage.getItem("kuettu_user_level");
    if (savedName) setUserName(savedName);
    if (savedLevel) setUserLevel(savedLevel);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Paramètres du compte</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Gérez vos informations personnelles et vos préférences.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-2xl">
            {userName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{userName}</h2>
            <p className="text-zinc-500 dark:text-zinc-400">Niveau : {userLevel}</p>
          </div>
          <button className="ml-auto px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            Changer d'avatar
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-2">
                <User className="w-4 h-4" /> Nom complet
              </label>
              <input type="text" defaultValue={userName} className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Adresse Email
              </label>
              <input type="email" defaultValue="ansel@example.com" disabled className="w-full px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 cursor-not-allowed outline-none" />
            </div>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" /> Sécurité
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Nouveau mot de passe</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Confirmer le mot de passe</label>
                <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
          </div>

          <hr className="border-zinc-200 dark:border-zinc-800" />

          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-500" /> Préférences
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-zinc-900 dark:text-white">Notifications par Email</p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Recevoir des rappels pour continuer vos cours.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

        </div>
        
        <div className="p-6 bg-zinc-50 dark:bg-zinc-800/30 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/30">
            Enregistrer les modifications
          </button>
        </div>
      </div>
    </div>
  );
}
