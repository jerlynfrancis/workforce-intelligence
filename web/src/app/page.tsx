export default function ExecutiveSummary() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-zinc-900">Executive Summary</h1>
      <p className="mt-2 text-zinc-500">Workforce intelligence overview for COG.</p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Labour Cost" value="—" />
        <MetricCard label="Variance to Budget" value="—" />
        <MetricCard label="Agency Spend" value="—" />
        <MetricCard label="Avg Service Level" value="—" />
      </div>

      <div className="mt-8 p-12 border-2 border-dashed border-zinc-200 rounded-xl flex items-center justify-center text-zinc-400">
        Data coming soon — waiting on data generation
      </div>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold text-zinc-900">{value}</p>
    </div>
  )
}
