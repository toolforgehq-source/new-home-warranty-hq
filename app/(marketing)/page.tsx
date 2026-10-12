import { Hero } from "@/components/marketing/Hero";
import { ProblemCards } from "@/components/marketing/ProblemCards";
import { ProductTour } from "@/components/marketing/ProductTour";
import { Features } from "@/components/marketing/Features";
import { Pricing } from "@/components/marketing/Pricing";
import { PartnerTeaser } from "@/components/marketing/PartnerTeaser";
import { Trust } from "@/components/marketing/Trust";
import { FAQ } from "@/components/marketing/FAQ";
import { StructuredData } from "@/components/marketing/StructuredData";

export const metadata = {
  description:
    "Document new-home defects with photos, send builder warranty requests you approve, keep builder replies and appointments in one place, and get reminders before your confirmed coverage ends. $189 one time.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <StructuredData />
      <Hero />
      <ProblemCards />
      <ProductTour />
      <Features />
      <Pricing />
      <PartnerTeaser />
      <Trust />
      <FAQ />
    </>
  );
}
