import Image from "next/image";
import { Play } from "lucide-react";

export function InfoRDC() {
  return (
    <section className="py-24 bg-gradient-to-b from-black to-blue-950 text-white relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Optimisé pour la RDC et l'Afrique</h2>
          <p className="text-lg md:text-xl text-blue-200">
            Découvrez comment ANSELLA résout les défis de paiement et de monétisation pour les créateurs de contenu éducatif en Afrique.
          </p>
        </div>
        
        <div className="max-w-5xl mx-auto aspect-video w-full rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(37,99,235,0.2)] relative group cursor-pointer">
          <Image 
            src="/images/video-thumb.png" 
            alt="Présentation Vidéo ANSELLA" 
            fill 
            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
          />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors duration-500">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-blue-600/90 backdrop-blur-md flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-500 transition-all mb-4 shadow-[0_0_30px_rgba(37,99,235,0.6)]">
              <Play className="h-8 w-8 md:h-10 md:w-10 text-white fill-white ml-2" />
            </div>
            <span className="font-semibold text-lg md:text-xl tracking-wide">Découvrir la solution en vidéo</span>
          </div>
        </div>
      </div>
      
      {/* Decorative patterns */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full bg-blue-600 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full bg-purple-600 blur-[120px]"></div>
      </div>
    </section>
  );
}
