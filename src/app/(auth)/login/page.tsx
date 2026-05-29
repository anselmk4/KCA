"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, AlertCircle, ArrowRight } from "lucide-react";
import { getDB, initDB } from "@/lib/db";
import { setSimulatedSession } from "@/lib/rbac";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initDB();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const db = getDB();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      setError("Adresse email introuvable. Veuillez vous inscrire ou essayer avec l'un des comptes de test.");
      return;
    }

    // Login successful
    setSimulatedSession({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status === "Actif" ? "ACTIVE" : "INACTIVE",
      plan: user.plan || "FREE"
    });

    // Redirect to the correct space based on role
    if (user.role === "INSTRUCTOR" || user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
      router.push("/instructor");
    } else {
      router.push("/dashboard");
    }
  };

  const quickLogin = (testEmail: string) => {
    setEmail(testEmail);
    setPassword("password123");
    // Trigger submit via next tick
    setTimeout(() => {
      const db = getDB();
      const user = db.users.find(u => u.email.toLowerCase() === testEmail.toLowerCase());
      if (user) {
        setSimulatedSession({
          userId: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status === "Actif" ? "ACTIVE" : "INACTIVE",
          plan: user.plan || "FREE"
        });
        if (user.role === "INSTRUCTOR" || user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
          router.push("/instructor");
        } else {
          router.push("/dashboard");
        }
      }
    }, 100);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-white/10 p-8">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center space-x-2 mb-6">
            <GraduationCap className="h-10 w-10 text-blue-600" />
            <span className="font-bold text-2xl text-zinc-900 dark:text-white">Kuettu Pro</span>
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Bienvenue</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-center text-sm">
            Connectez-vous à votre espace d'académie ou d'apprentissage.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl flex items-start gap-3 text-red-600 text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Adresse Email
            </label>
            <input 
              required
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-zinc-900 dark:text-white"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Mot de passe
              </label>
              <Link href="#" className="text-xs text-blue-600 hover:text-blue-500 font-medium">
                Oublié ?
              </Link>
            </div>
            <input 
              required
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-zinc-900 dark:text-white"
            />
          </div>
          
          <button 
            type="submit"
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
          >
            Se connecter
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Logins */}
        <div className="mt-8 pt-6 border-t border-zinc-150 dark:border-zinc-800">
          <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3 text-center">Comptes de test (Connexion rapide)</p>
          <div className="grid grid-cols-2 gap-2">
            <button 
              type="button" 
              onClick={() => quickLogin("instructor@kuettu.com")}
              className="py-2.5 px-3 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-all text-left"
            >
              <p className="font-bold text-zinc-900 dark:text-white">Prof. Kuettu</p>
              <p className="text-[10px] text-zinc-500 truncate">instructor@kuettu.com (Instructeur)</p>
            </button>
            <button 
              type="button" 
              onClick={() => quickLogin("jean@example.com")}
              className="py-2.5 px-3 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-all text-left"
            >
              <p className="font-bold text-zinc-900 dark:text-white">Jean Dupont</p>
              <p className="text-[10px] text-zinc-500 truncate">jean@example.com (Étudiant)</p>
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Vous n'avez pas de compte ?{" "}
          <Link href="/register" className="text-blue-600 hover:text-blue-500 font-semibold">
            S'inscrire
          </Link>
        </div>
      </div>
    </div>
  );
}
