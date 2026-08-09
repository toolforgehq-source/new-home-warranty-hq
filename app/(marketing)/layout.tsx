import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { MobileStickyCTA } from "@/components/marketing/MobileStickyCTA";

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
    </>
  );
}
