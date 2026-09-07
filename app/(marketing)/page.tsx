import { Hero } from "@/components/marketing/Hero";
import { ProblemCards } from "@/components/marketing/ProblemCards";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Features } from "@/components/marketing/Features";
import { Pricing } from "@/components/marketing/Pricing";
import { ForPartners } from "@/components/marketing/ForPartners";
import { Trust } from "@/components/marketing/Trust";
import { FAQ } from "@/components/marketing/FAQ";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProblemCards />
      <HowItWorks />
      <Features />
      <Pricing />
      <ForPartners />
      <Trust />
      <FAQ />
    </>
  );
}
