import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold text-navy">
          Welcome, {session.user.name}
        </h1>
        <p className="mt-2 text-gray-600">
          Your Warranty Action Plan will appear here once your home is set up.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {["Open", "Submitted", "Scheduled", "Resolved"].map((status) => (
            <div
              key={status}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <p className="text-sm text-gray-500">{status}</p>
              <p className="mt-2 text-3xl font-bold text-navy">0</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-navy">Warranty Action Plan</h2>
          <p className="mt-2 text-gray-600">
            Add your property address and closing date to generate a personalized
            plan with recommended review dates.
          </p>
          <button className="mt-6 rounded-full bg-green px-6 py-3 font-semibold text-white hover:bg-green-600">
            Set up my home
          </button>
        </div>
      </div>
    </div>
  );
}
