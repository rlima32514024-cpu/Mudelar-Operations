interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
  valueColor?: string
}

export function KpiCard({ label, value, sub, valueColor = 'text-gray-900' }: KpiCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
      <p className={`text-2xl font-bold mt-2 tabular-nums truncate ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1 truncate">{sub}</p>}
    </div>
  )
}
