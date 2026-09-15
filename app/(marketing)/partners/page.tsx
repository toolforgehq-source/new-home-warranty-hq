import { ForPartners } from "@/components/marketing/ForPartners";

export const metadata = {
  title: "For Partners — New Home Warranty HQ",
  description:
    "Give new-construction buyers a closing gift they will actually use. Title companies, lenders, realtors, and inspectors can gift New Home Warranty HQ in one step.",
};

export default function PartnersPage() {
  return (
    <>
      <section className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-green">
            For Title Companies, Lenders, Realtors &amp; Inspectors
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight lg:text-5xl">
            A closing gift your buyers will use for a year.
          </h1>
          <p className="mt-6 text-lg text-white/70">
            Most closing gifts are forgotten in a week. New Home Warranty HQ helps
            your buyers protect their new home through the entire builder-warranty
            period&mdash;and keeps your name in front of them the whole time.
          </p>
        </div>
      </section>
      <ForPartners />
    </>
  );
}
