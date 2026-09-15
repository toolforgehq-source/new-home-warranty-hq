import { LegalPage } from "@/components/marketing/LegalPage";
import { LegalSection, LegalList } from "@/components/marketing/LegalSection";

export const metadata = {
  title: "About — New Home Warranty HQ",
};

export default function AboutPage() {
  return (
    <LegalPage title="About New Home Warranty HQ">
      <p>
        New Home Warranty HQ was created by someone who spent years on the
        builder side of new construction&mdash;walking homes with buyers,
        collecting warranty lists, scheduling trades, and watching how quickly
        the follow-up became a mess of texts, emails, photos, and sticky notes.
      </p>
      <p>
        The pattern was always the same. Homeowners noticed things. Some got
        reported, some got forgotten. Builders meant well, but items slipped
        between trades and calendars. And when a deadline mattered, nobody
        could quickly answer the simple questions: <em>What was reported? When?
        What did the builder say? Was it actually fixed?</em>
      </p>
      <p>
        New Home Warranty HQ is the system we wished every homeowner had: one
        calm, private place to capture an issue with photos, send a
        professional request, keep the builder&apos;s replies in the same thread,
        track the repair, and walk away with a complete record.
      </p>

      <LegalSection title="What We Believe">
        <LegalList>
          <li>You shouldn&apos;t have to be an expert to protect your new home.</li>
          <li>The record belongs to you. Export it anytime; we never sell it.</li>
          <li>Good documentation makes conversations with your builder easier, not more adversarial.</li>
          <li>A closing gift should still be useful a year later.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="What We Are (and Are Not)">
        <p>
          We are a software company that helps you manage the builder warranty
          you already have. We are not a home warranty company or insurer, we
          do not pay for or perform repairs, and we do not provide legal advice.
          Every message to your builder is sent by you, from your account, with
          your approval.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
