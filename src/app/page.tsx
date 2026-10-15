import { LandingNav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { CtaBlock, HowItWorks, LandingFooter, Ticker, TwoModes, WhyMuse } from "@/components/landing/sections";

export default function LandingPage() {
  return (
    <div id="main">
      <LandingNav />
      <main>
        <Hero />
        <Ticker />
        <TwoModes />
        <HowItWorks />
        <WhyMuse />
        <CtaBlock />
      </main>
      <LandingFooter />
    </div>
  );
}
