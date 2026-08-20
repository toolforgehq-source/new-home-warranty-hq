import Image from "next/image";
import Link from "next/link";

export function PartnerProfileCard({
  profile,
  email,
}: {
  profile: {
    company?: string | null;
    partnerType: string;
    phone?: string | null;
    photoUrl?: string | null;
    logoUrl?: string | null;
    slug: string;
    isApproved: boolean;
  };
  email: string;
}) {
  const partnerTypeLabels: Record<string, string> = {
    REALTOR: "Realtor",
    LENDER: "Lender",
    TITLE: "Title / closing company",
    INSPECTOR: "Inspector",
    OTHER: "Partner",
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-navy">Partner profile</h2>
      <div className="mt-4 flex items-center gap-4">
        {profile.photoUrl ? (
          <Image
            src={profile.photoUrl}
            alt="Partner"
            width={64}
            height={64}
            unoptimized
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy text-xl font-bold text-white">
            {(profile.company || email).charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-semibold text-navy">{profile.company || "Your company"}</p>
          <p className="text-sm text-gray-500">{partnerTypeLabels[profile.partnerType] || profile.partnerType}</p>
          <p className="text-sm text-gray-500">{email}</p>
        </div>
      </div>
      {profile.phone && (
        <p className="mt-4 text-sm text-gray-600">
          <span className="font-medium">Phone:</span> {profile.phone}
        </p>
      )}
      {profile.logoUrl && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase text-gray-500">Company logo</p>
          <Image src={profile.logoUrl} alt="Logo" width={160} height={40} unoptimized className="mt-2 h-10 w-auto object-contain" />
        </div>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/partner/dashboard/edit"
          className="rounded-full px-4 py-2 text-sm font-semibold text-navy ring-1 ring-gray-200 hover:bg-gray-50"
        >
          Edit profile
        </Link>
        {!profile.isApproved && (
          <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
            Pending admin approval
          </span>
        )}
      </div>
    </div>
  );
}
