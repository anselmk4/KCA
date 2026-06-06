"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { initDB } from "@/lib/db";
import { loginWithEmail } from "@/lib/supabase/auth-helpers";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initDB();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { redirectTo } = await loginWithEmail(email, password);
      router.push(redirectTo);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (testEmail: string, testPassword: string) => {
    setError(null);
    setLoading(true);
    setEmail(testEmail);
    setPassword(testPassword);
    try {
      const { redirectTo } = await loginWithEmail(testEmail, testPassword);
      router.push(redirectTo);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-white/10 p-8">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center space-x-2 mb-6">
            <GraduationCap className="h-10 w-10 text-blue-600" />
            <span className="font-bold text-2xl text-zinc-900 dark:text-white">ANSELLA</span>
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
              <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-500 font-medium">
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
            disabled={loading}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Connexion...</>
            ) : (
              <>Se connecter <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        {/* Quick Logins */}
        <div className="mt-8 pt-6 border-t border-zinc-150 dark:border-zinc-800">
          <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3 text-center">
            Comptes de test
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => quickLogin("instructor@kuettu.com", "password123")}
              className="py-2.5 px-3 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-all text-left disabled:opacity-50"
            >
              <p className="font-bold text-zinc-900 dark:text-white">Prof. Kuettu</p>
              <p className="text-[10px] text-zinc-500 truncate">instructor@kuettu.com</p>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => quickLogin("jean@example.com", "password123")}
              className="py-2.5 px-3 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-all text-left disabled:opacity-50"
            >
              <p className="font-bold text-zinc-900 dark:text-white">Jean Dupont</p>
              <p className="text-[10px] text-zinc-500 truncate">jean@example.com</p>
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
