import Image from "next/image";

export function LogoBanner() {
  return (
    <section className="py-12 bg-white/60 dark:bg-zinc-950 border-b border-zinc-200 dark:border-white/5 backdrop-blur-sm">
      <div className="container mx-auto px-4 md:px-8 flex flex-col items-center justify-center gap-4">
        <div className="relative w-72 h-24 md:w-96 md:h-32">
          <Image
            src="/logo.png"
            alt="Logo ANSELLA"
            fill
            className="object-contain drop-shadow-lg"
            priority
          />
        </div>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium text-center">
          Plateforme LMS Mondiale &bull; Formation &bull; Certification &bull; Monétisation
        </p>
      </div>
    </section>
  );
}
