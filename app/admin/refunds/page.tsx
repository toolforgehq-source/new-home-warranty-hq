import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { RefundButton } from "./RefundButton";

export default async function AdminRefundsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const purchases = await prisma.purchase.findMany({
    include: { user: true, giftPurchase: { include: { partner: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-navy">Refunds</h1>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          {purchases.length === 0 ? (
            <p className="text-sm text-gray-600">No purchases yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-gray-100">
              {purchases.map((purchase) => (
                <li key={purchase.id} className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium text-navy">
                      {purchase.productType === "GIFT" && purchase.giftPurchase
                        ? `Gift to ${purchase.giftPurchase.recipientEmail}`
                        : purchase.user?.email || "Guest purchase"}
                    </p>
                    <p className="text-sm text-gray-500">
                      ${(purchase.amount / 100).toFixed(2)} &bull; {purchase.status.toLowerCase()} &bull;{" "}
                      {new Date(purchase.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <RefundButton purchaseId={purchase.id} disabled={purchase.status === "REFUNDED"} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
