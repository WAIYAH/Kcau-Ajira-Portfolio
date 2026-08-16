export default function ComingSoon({ title, phase, description }: { title: string; phase: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-kca-orange">{phase}</p>
      <h2 className="mt-2 text-xl font-bold text-gray-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">{description}</p>
    </div>
  )
}
