import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-200 dark:border-white/10 p-8">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center space-x-2 mb-6">
            <GraduationCap className="h-10 w-10 text-blue-600" />
            <span className="font-bold text-2xl text-zinc-900 dark:text-white">Kuettu</span>
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Bienvenue</h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-center text-sm">
            Connectez-vous pour accéder à votre espace d'apprentissage.
          </p>
        </div>

        <form className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Adresse Email
            </label>
            <input 
              type="email" 
              placeholder="vous@exemple.com"
              className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
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
              type="password" 
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border-transparent focus:bg-white dark:focus:bg-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          
          <button 
            type="button"
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/30"
          >
            Se connecter
          </button>
        </form>

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
