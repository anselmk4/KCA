import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-8">
          <Image src="/logo.png" alt="ANSELLA" width={64} height={64} className="object-contain dark:hidden" />
          <Image src="/logo-dark.png" alt="ANSELLA" width={64} height={64} className="object-contain hidden dark:block" />
        </div>
        <h1 className="text-7xl font-extrabold text-zinc-900 dark:text-white mb-4">404</h1>
        <p className="text-xl text-zinc-500 dark:text-zinc-400 mb-8">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/30"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
