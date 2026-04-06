import { Navbar } from "@/components/landing/homepage/Navbar";
import { Hero } from "@/components/landing/homepage/Hero";
import { EidGreeting } from "@/components/landing/homepage/EidGreeting";
import { Introduction } from "@/components/landing/homepage/Introduction";
import { PurposeRationale } from "@/components/landing/homepage/PurposeRationale";
import { Features } from "@/components/landing/homepage/Features";
import { ProjectDescription } from "@/components/landing/homepage/ProjectDescription";
import { HowItWorks } from "@/components/landing/homepage/HowItWorks";
import { Benefits } from "@/components/landing/homepage/Benefits";
import { Testimonials } from "@/components/landing/homepage/Testimonials";
import { ImpactSnapshot } from "@/components/landing/homepage/ImpactSnapshot";
import { RecognitionStrip } from "@/components/landing/homepage/RecognitionStrip";
import { Partners } from "@/components/landing/homepage/Partners";
import { Pricing } from "@/components/landing/homepage/Pricing";
import { Donate } from "@/components/landing/homepage/Donate";
import { Careers } from "@/components/landing/homepage/Careers";
import { WorkWithUs } from "@/components/landing/homepage/WorkWithUs";
import { ExplainerMedia } from "@/components/landing/homepage/ExplainerMedia";
import { FarmerJourney } from "@/components/landing/homepage/FarmerJourney";
import { TrustSecurity } from "@/components/landing/homepage/TrustSecurity";
import { Team } from "@/components/landing/homepage/Team";
import { CTA } from "@/components/landing/homepage/CTA";
import { LocationContact } from "@/components/landing/homepage/LocationContact";
import { ChatbotAssistant } from "@/components/landing/homepage/ChatbotAssistant";
import { Footer } from "@/components/landing/homepage/Footer";

export default function Homepage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#f8faf9] via-[#f1f7f2] to-[#eef6f0] text-foreground">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute bottom-1/3 -left-32 h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="absolute top-1/2 -right-40 h-96 w-96 rounded-full bg-lime-300/10 blur-3xl" />
      </div>
      <div className="relative z-10">
        <Navbar />
      <main>
        <Hero />
        <RecognitionStrip />
        <EidGreeting />
        <Introduction />
        <PurposeRationale />
        <Features />
        <ProjectDescription />
        <HowItWorks />
        <Benefits />
        <ImpactSnapshot />
        <ExplainerMedia />
        <Testimonials />
        <FarmerJourney />
        <Partners />
        <Pricing />
        <TrustSecurity />
        <WorkWithUs />
        <Donate />
        <Careers />
        <Team />
        <CTA />
        <LocationContact />
      </main>
      <ChatbotAssistant />
      <Footer />
      </div>
    </div>
  );
}



