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
    <div className="min-h-screen bg-gradient-to-br from-[#f7f7f2] via-[#f4f7f0] to-[#eef4f7] text-foreground">
      <Navbar />
      <main>
        <Hero />
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
        <RecognitionStrip />
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
  );
}


