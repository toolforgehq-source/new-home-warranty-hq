import { LegalPage } from "@/components/marketing/LegalPage";
import { LegalSection, LegalList } from "@/components/marketing/LegalSection";

export const metadata = {
  title: "Refund & Satisfaction Guarantee — New Home Warranty HQ",
};

export default function RefundPage() {
  return (
    <LegalPage title="Refund & Satisfaction Guarantee">
      <p>
        We want you to be confident in your purchase. This policy explains how
        refunds work for the New Home Warranty HQ Service.
      </p>

      <LegalSection title="30-Day Satisfaction Guarantee">
        <p>
          If you are not satisfied with the Service for any reason, you may request
          a full refund within 30 days of your purchase. Refunds are issued to
          the original payment method and typically appear within 5–10 business
          days, depending on your bank or card issuer.
        </p>
      </LegalSection>

      <LegalSection title="What Happens When a Homeowner Purchase Is Refunded">
        <LegalList>
          <li>Your payment is fully refunded.</li>
          <li>Your paid entitlement is revoked and new warranty features are disabled.</li>
          <li>Your existing records remain available to view in read-only form.</li>
          <li>Document uploads, issue creation, PDF generation, exports, and other paid features are no longer available until a new purchase is made.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="Gift Refunds">
        <LegalList>
          <li>Gift purchases may be refunded before the gift is redeemed.</li>
          <li>Once a gift is redeemed and the recipient creates an account, the gift is not eligible for refund.</li>
          <li>Refunding a gift that has not been redeemed will invalidate the gift invitation and onboarding link.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="How to Request a Refund">
        <p>
          Contact us at{" "}
          <a href="mailto:support@newhomewarrantyhq.com" className="text-green hover:underline">
            support@newhomewarrantyhq.com
          </a>{" "}
          with your payment confirmation email or the email address used at
          checkout. We will process eligible refund requests within 2 business
          days.
        </p>
      </LegalSection>

      <LegalSection title="Exceptions">
        <p>
          Refunds are not available for accounts that violate our Terms of
          Service, commit fraud, or abuse the Service. We reserve the right to
          deny refund requests that appear fraudulent or abusive.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
