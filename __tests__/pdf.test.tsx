import { describe, it, expect } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { WarrantyRequestPDF } from "@/lib/pdf/warranty-request";

describe("WarrantyRequestPDF", () => {
  it("renders a non-empty PDF buffer", async () => {
    const buffer = await renderToBuffer(
      <WarrantyRequestPDF
        request={{
          generatedContent: "Please confirm the applicable warranty process.",
          requestedNextStep: "Inspect and advise",
          home: { address: "123 Main St", builderName: "Builder Inc" },
          issue: { title: "Leaky faucet", location: "Kitchen", dateNoticed: new Date(), description: "Drips" },
        }}
      />
    );

    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.toString("binary").startsWith("%PDF")).toBe(true);
  });
});
