import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { ValueProposition } from "@/components/sections/ValueProposition";
import { WhyChooseUs } from "@/components/sections/WhyChooseUs";
import { FeaturesGrid } from "@/components/sections/FeaturesGrid";
import { Courses } from "@/components/sections/Courses";
import { Testimonials } from "@/components/sections/Testimonials";
import { InfoRDC } from "@/components/sections/InfoRDC";
import { Pricing } from "@/components/sections/Pricing";
import { FAQ } from "@/components/sections/FAQ";
import { CTA } from "@/components/sections/CTA";
import { LogoBanner } from "@/components/sections/LogoBanner";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col font-sans">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <LogoBanner />
        <ValueProposition />
        <WhyChooseUs />
        <FeaturesGrid />
        <Courses />
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
