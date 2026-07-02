import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { ValueProposition } from "@/components/sections/ValueProposition";
import { WhyChooseUs } from "@/components/sections/WhyChooseUs";
import { FeaturesGrid } from "@/components/sections/FeaturesGrid";
import { Testimonials } from "@/components/sections/Testimonials";
import { InfoRDC } from "@/components/sections/InfoRDC";
import { Pricing } from "@/components/sections/Pricing";
import { FAQ } from "@/components/sections/FAQ";
import { CTA } from "@/components/sections/CTA";
import { LogoBanner } from "@/components/sections/LogoBanner";
import { PartnersMarquee } from "@/components/sections/PartnersMarquee";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col font-sans bg-gradient-to-br from-slate-100 via-teal-50/50 to-blue-50/70 dark:from-zinc-900 dark:via-zinc-950 dark:to-black text-zinc-900 dark:text-white selection:bg-teal-500/30">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <LogoBanner />
        <PartnersMarquee />
        <ValueProposition />
        <WhyChooseUs />
        <FeaturesGrid />
        <Testimonials />
        <InfoRDC />
        <Pricing />
        <CTA />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
