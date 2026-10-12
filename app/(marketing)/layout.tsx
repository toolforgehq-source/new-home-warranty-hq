import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { MobileStickyCTA } from "@/components/marketing/MobileStickyCTA";
import { VisitTracker } from "@/components/marketing/VisitTracker";

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileStickyCTA />
      <VisitTracker />
    </>
  );
}
