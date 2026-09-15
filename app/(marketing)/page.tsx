import { Hero } from "@/components/marketing/Hero";
import { ProblemCards } from "@/components/marketing/ProblemCards";
import { ProductTour } from "@/components/marketing/ProductTour";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Features } from "@/components/marketing/Features";
import { Pricing } from "@/components/marketing/Pricing";
import { PartnerTeaser } from "@/components/marketing/PartnerTeaser";
import { Trust } from "@/components/marketing/Trust";
import { FAQ } from "@/components/marketing/FAQ";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProblemCards />
      <ProductTour />
      <HowItWorks />
      <Features />
      <Pricing />
      <PartnerTeaser />
      <Trust />
      <FAQ />
    </>
  );
}
