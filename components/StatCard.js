export default function StatCard({ label, value, subtitle, color = '#6366f1' }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 flex items-start gap-4">
      <div
        className="w-1 h-20 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <div className="flex-1">
        <div className="text-sm text-gray-600 font-medium">{label}</div>
        <div className="text-3xl font-bold text-gray-900 mt-2">{value}</div>
        {subtitle && <div className="text-sm text-gray-500 mt-2">{subtitle}</div>}
      </div>
    </div>
  )
}
