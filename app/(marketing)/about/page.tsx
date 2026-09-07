import { LegalPage } from "@/components/marketing/LegalPage";
import { LegalSection, LegalList } from "@/components/marketing/LegalSection";

export const metadata = {
  title: "About — New Home Warranty HQ",
};

export default function AboutPage() {
  return (
    <LegalPage title="About New Home Warranty HQ">
      <p>
        New Home Warranty HQ was built to solve a simple, expensive problem:
        new homes come with builder warranties, but the deadlines, documents,
        and follow-up work are easy to lose track of. Our software gives
        homeowners a structured system to document issues, create professional
        warranty requests, track repair progress, and keep a complete record.
      </p>

      <LegalSection title="What We Are">
        <p>
          We are a software company. We provide tools that help homeowners stay
          organized during the builder-warranty period. We do not replace your
          builder, warranty provider, or insurance. We do not make coverage
          decisions, perform repairs, or act as legal counsel.
        </p>
      </LegalSection>

      <LegalSection title="What We Are Not">
        <p>New Home Warranty HQ:</p>
        <LegalList>
          <li>Is not a home warranty company.</li>
          <li>Does not provide insurance or pay for repairs.</li>
          <li>Does not provide legal advice.</li>
          <li>Does not communicate with builders on your behalf unless you choose to use your own email or copy our generated information.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Our Commitment">
        <p>
          We believe homeowners deserve a clear, private, and mobile-friendly
          record of their warranty items. We also believe realtors, lenders, and
          title professionals should be able to give new-construction buyers a
          practical closing gift without needing access to private homeowner
          details.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
