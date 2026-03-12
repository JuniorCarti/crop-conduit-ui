import { Navbar } from "@/components/landing/homepage/Navbar";
import { Hero } from "@/components/landing/homepage/Hero";
import { Introduction } from "@/components/landing/homepage/Introduction";
import { PurposeRationale } from "@/components/landing/homepage/PurposeRationale";
import { Features } from "@/components/landing/homepage/Features";
import { ProjectDescription } from "@/components/landing/homepage/ProjectDescription";
import { HowItWorks } from "@/components/landing/homepage/HowItWorks";
import { Benefits } from "@/components/landing/homepage/Benefits";
import { Testimonials } from "@/components/landing/homepage/Testimonials";
import { Partners } from "@/components/landing/homepage/Partners";
import { Pricing } from "@/components/landing/homepage/Pricing";
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
        <Introduction />
        <PurposeRationale />
        <Features />
        <ProjectDescription />
        <HowItWorks />
        <Benefits />
        <Testimonials />
        <Partners />
        <Pricing />
        <Team />
        <CTA />
        <LocationContact />
      </main>
      <ChatbotAssistant />
      <Footer />
    </div>
  );
}
