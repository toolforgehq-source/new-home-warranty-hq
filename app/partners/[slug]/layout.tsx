import { VisitTracker } from "@/components/marketing/VisitTracker";

export default function PartnerPublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <VisitTracker />
    </>
  );
}
