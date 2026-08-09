"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "What is New Home Warranty HQ?",
    a: "A homeowner-controlled software platform for documenting, reporting, and tracking builder-warranty issues.",
  },
  {
    q: "Is this a home warranty?",
    a: "No. New Home Warranty HQ does not provide warranty coverage or pay for repairs.",
  },
  {
    q: "Does this replace my builder’s warranty?",
    a: "No. It helps you organize and track issues under your builder’s own warranty process.",
  },
  {
    q: "What if my builder did not give me warranty documents?",
    a: "The system can help you request them, and you can still document and track issues without them.",
  },
  {
    q: "What if my builder requires its own portal?",
    a: "The system creates organized copy-ready information and lets you store confirmation of your portal submission.",
  },
  {
    q: "Does New Home Warranty HQ determine whether my issue is covered?",
    a: "No. Coverage is determined by the applicable builder or warranty provider.",
  },
  {
    q: "Do you communicate with my builder for me?",
    a: "The software helps prepare and organize communication, but the homeowner reviews and controls submissions.",
  },
  {
    q: "Can my realtor or lender see my issues?",
    a: "No. Partners cannot see homeowner warranty issues.",
  },
  {
    q: "Is this legal advice?",
    a: "No.",
  },
  {
    q: "Is there a subscription?",
    a: "No. The launch product is a one-time payment.",
  },
  {
    q: "Can someone gift this to me?",
    a: "Yes.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-gray-50 py-20">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-navy">Frequently asked questions</h2>
        </div>
        <div className="mt-12 space-y-4">
          {faqs.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={item.q}
                className="rounded-2xl border bg-white shadow-sm"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between p-6 text-left"
                >
                  <span className="font-semibold text-navy">{item.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-500 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-gray-600">{item.a}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
