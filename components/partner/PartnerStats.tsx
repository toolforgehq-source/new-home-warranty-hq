import { Gift, CheckCircle, Clock, DollarSign } from "lucide-react";

export function PartnerStats({
  total,
  redeemed,
  pending,
  totalAmount,
}: {
  total: number;
  redeemed: number;
  pending: number;
  totalAmount: number;
}) {
  const stats = [
    { label: "Gifts sent", value: total, icon: Gift },
    { label: "Redeemed", value: redeemed, icon: CheckCircle },
    { label: "Pending", value: pending, icon: Clock },
    {
      label: "Total spent",
      value: `$${(totalAmount / 100).toFixed(0)}`,
      icon: DollarSign,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl bg-white p-5 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green">
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-2xl font-bold text-navy">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
