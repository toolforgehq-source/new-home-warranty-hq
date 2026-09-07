import { LegalPage } from "@/components/marketing/LegalPage";
import { LegalSection, LegalList } from "@/components/marketing/LegalSection";

export const metadata = {
  title: "Privacy Policy — New Home Warranty HQ",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        New Home Warranty HQ (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy. This
        Privacy Policy explains what information we collect, how we use it, and
        your choices regarding your information.
      </p>

      <LegalSection title="1. Information We Collect">
        <LegalList>
          <li>
            <strong>Account information:</strong> name, email address, and password (stored securely via our authentication provider).
          </li>
          <li>
            <strong>Property and issue data:</strong> home address, closing date, builder information, issue descriptions, photos, documents, and repair notes.
          </li>
          <li>
            <strong>Payment information:</strong> we do not store credit card numbers. Payments are processed by Stripe, and we retain transaction IDs and status.
          </li>
          <li>
            <strong>Usage data:</strong> pages visited, features used, and IP address for analytics and security.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="2. How We Use Your Information">
        <LegalList>
          <li>Provide, maintain, and improve the Service.</li>
          <li>Process payments and refunds.</li>
          <li>Send transactional emails such as receipts, onboarding links, reminders, and partner notifications.</li>
          <li>Respond to support requests.</li>
          <li>Monitor fraud, abuse, and security.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="3. How We Share Information">
        <p>
          We do not sell your personal information. We share data only with
          service providers necessary to operate the Service:
        </p>
        <LegalList>
          <li>
            <strong>Stripe</strong> — payment processing.
          </li>
          <li>
            <strong>Resend</strong> — email delivery.
          </li>
          <li>
            <strong>Cloudflare R2</strong> — photo and document storage.
          </li>
          <li>
            <strong>Neon</strong> — database hosting.
          </li>
          <li>
            <strong>Vercel</strong> — application hosting and analytics.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="4. Cookies and Tracking">
        <p>
          We use essential cookies for authentication and session management.
          We may use analytics cookies to understand how the Service is used. You
          can disable non-essential cookies through your browser settings.
        </p>
      </LegalSection>

      <LegalSection title="5. Data Retention">
        <p>
          We retain your data for as long as your account is active or as needed
          to provide the Service. Refunded accounts retain read-only access to
          records. You may request deletion of your account and data by
          contacting support, subject to legal and payment-record retention
          requirements.
        </p>
      </LegalSection>

      <LegalSection title="6. Your Rights">
        <p>
          Depending on your location, you may have the right to access, correct,
          delete, or export your personal data. Contact us to exercise these
          rights.
        </p>
      </LegalSection>

      <LegalSection title="7. Children&apos;s Privacy">
        <p>
          The Service is not directed to children under 13. We do not knowingly
          collect personal information from children under 13.
        </p>
      </LegalSection>

      <LegalSection title="8. Security">
        <p>
          We use industry-standard measures to protect your data, including
          encryption in transit and at rest, access controls, and regular
          security reviews. No online service can guarantee 100% security.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. We will notify
          you of material changes by email or by posting a notice in the
          Service.
        </p>
      </LegalSection>

      <LegalSection title="10. Contact">
        <p>
          For privacy questions, contact us at{" "}
          <a href="mailto:support@newhomewarrantyhq.com" className="text-green hover:underline">
            support@newhomewarrantyhq.com
          </a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
