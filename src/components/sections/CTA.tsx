import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="relative py-24 overflow-hidden bg-black text-white border-t border-white/10">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10 text-center">
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight max-w-4xl mx-auto leading-tight">
          N’attendez plus pour créer votre formation en ligne simplement.
        </h2>
        <p className="text-xl md:text-2xl text-zinc-400 mb-10 max-w-2xl mx-auto">
          Partagez & valorisez votre expertise auprès de ceux qui en ont besoin !
        </p>
        <div>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg text-base font-semibold transition-all bg-blue-600 text-white hover:bg-blue-500 h-14 px-8 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
          >
            Commencer maintenant
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
