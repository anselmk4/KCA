import Image from "next/image";

export function LogoBanner() {
  return (
    <section className="py-12 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-white/5">
      <div className="container mx-auto px-4 md:px-8 flex flex-col items-center justify-center gap-4">
        <div className="relative w-20 h-20 md:w-28 md:h-28">
          <Image
            src="/logo.png"
            alt="Logo ANSELLA"
            fill
            className="object-contain drop-shadow-lg"
          />
        </div>
        <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
          ANSELLA
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
          Plateforme 100% Congolaise • Formation • Certification • Monétisation
        </p>
      </div>
    </section>
  );
}
