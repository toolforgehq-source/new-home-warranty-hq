export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white py-16 lg:py-24">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-navy lg:text-4xl">{title}</h1>
        <div className="mt-8 space-y-8 text-gray-700 leading-relaxed">
          {children}
        </div>
        <p className="mt-12 text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>
    </div>
  );
}
