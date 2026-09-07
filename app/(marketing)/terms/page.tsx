import { LegalPage } from "@/components/marketing/LegalPage";
import { LegalSection, LegalList } from "@/components/marketing/LegalSection";

export const metadata = {
  title: "Terms of Service — New Home Warranty HQ",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your use of the New Home
        Warranty HQ website and software (collectively, the &quot;Service&quot;).
        By accessing or using the Service, you agree to these Terms. If you do
        not agree, do not use the Service.
      </p>

      <LegalSection title="1. About the Service">
        <p>
          New Home Warranty HQ is a software tool that helps homeowners
          document, organize, and track new-home warranty issues. We do not
          provide warranty coverage, home warranty insurance, or legal services.
          We do not communicate with your builder on your behalf unless you
          choose to use your own email or copy information from the Service.
        </p>
      </LegalSection>

      <LegalSection title="2. Eligibility and Accounts">
        <p>
          You must be at least 18 years old and capable of forming a binding
          contract to use the Service. You are responsible for maintaining the
          confidentiality of your account credentials and for all activity that
          occurs under your account.
        </p>
      </LegalSection>

      <LegalSection title="3. Payments and Refunds">
        <p>
          The Service is offered as a one-time purchase for homeowners or as a
          one-time gift purchase from a partner. All payments are processed by
          Stripe. Pricing is displayed before checkout and may be updated at any
          time.
        </p>
        <p>
          We offer a 30-day satisfaction guarantee. If you are not satisfied,
          contact us within 30 days of purchase for a full refund. A full refund
          will revoke your paid entitlement and disable new warranty features;
          your records will remain available for viewing. Gift purchases may be
          refunded before the gift is redeemed; a redeemed gift is not eligible
          for refund.
        </p>
      </LegalSection>

      <LegalSection title="4. Acceptable Use">
        <LegalList>
          <li>Use the Service only for lawful, personal, or partner-gifting purposes.</li>
          <li>Do not upload illegal, infringing, or harmful content.</li>
          <li>Do not attempt to access another user&apos;s account or data.</li>
          <li>Do not resell, reverse-engineer, or abuse the Service.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="5. Content and Data">
        <p>
          You retain ownership of the photos, documents, and information you
          upload. You grant us the limited right to store, process, and display
          that data solely to provide the Service to you.
        </p>
      </LegalSection>

      <LegalSection title="6. Disclaimers">
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND,
          EITHER EXPRESS OR IMPLIED. WE DO NOT GUARANTEE THAT THE SERVICE WILL
          PREVENT WARRANTY CLAIMS FROM BEING DENIED, THAT YOUR BUILDER WILL
          RESPOND, OR THAT ANY SPECIFIC REPAIR WILL BE COVERED. WE ARE NOT A
          LAWYER, INSURER, WARRANTY PROVIDER, OR CONTRACTOR.
        </p>
      </LegalSection>

      <LegalSection title="7. Limitation of Liability">
        <p>
          TO THE FULLEST EXTENT PERMITTED BY LAW, NEW HOME WARRANTY HQ AND ITS
          AFFILIATES WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
          CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR
          USE OF THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
          DAMAGES. OUR TOTAL LIABILITY WILL NOT EXCEED THE AMOUNT YOU PAID FOR
          THE SERVICE IN THE TWELVE MONTHS PRECEDING THE CLAIM.
        </p>
      </LegalSection>

      <LegalSection title="8. Governing Law and Changes">
        <p>
          These Terms are governed by the laws of the State of Texas, without
          regard to conflict-of-law principles. We may update these Terms from
          time to time. Continued use of the Service after changes means you
          accept the updated Terms.
        </p>
      </LegalSection>

      <LegalSection title="9. Contact">
        <p>
          For questions about these Terms, contact us at{" "}
          <a href="mailto:support@newhomewarrantyhq.com" className="text-green hover:underline">
            support@newhomewarrantyhq.com
          </a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
