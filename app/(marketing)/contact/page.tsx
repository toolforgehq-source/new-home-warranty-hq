import { LegalPage } from "@/components/marketing/LegalPage";
import { ContactForm } from "@/components/marketing/ContactForm";

export const metadata = {
  title: "Contact — New Home Warranty HQ",
};

export default function ContactPage() {
  return (
    <LegalPage title="Contact Us">
      <p>
        Questions, feedback, or support requests? We&apos;re here to help. Email us
        directly or fill out the form below.
      </p>

      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <p className="font-medium text-navy">Email</p>
        <a
          href="mailto:support@newhomewarrantyhq.com"
          className="text-green hover:underline"
        >
          support@newhomewarrantyhq.com
        </a>
      </div>

      <ContactForm />
    </LegalPage>
  );
}
