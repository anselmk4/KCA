import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-slate-50 dark:bg-zinc-950">
      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <GraduationCap className="h-6 w-6 text-blue-600" />
              <span className="font-bold text-lg">Kuettu Crypto Academy</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              L'académie de référence pour maîtriser le Web3, la Blockchain et l'IA en Afrique.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-blue-600">
                FB
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-blue-400">
                X
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-pink-600">
                IG
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-blue-700">
                IN
              </Link>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Liens Rapides</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#features" className="hover:text-foreground">Pourquoi nous ?</Link></li>
              <li><Link href="#courses" className="hover:text-foreground">Nos formations</Link></li>
              <li><Link href="#pricing" className="hover:text-foreground">Tarifs</Link></li>
              <li><Link href="/about" className="hover:text-foreground">À propos</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Légal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/terms" className="hover:text-foreground">Conditions d'utilisation</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground">Politique de confidentialité</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Email: contact@kuettu.com</li>
              <li>Téléphone: +243 000 000 000</li>
              <li>Kinshasa, RDC</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Kuettu Crypto Academy. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
