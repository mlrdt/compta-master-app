'use client'

import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

export default function DashboardCharts({
  monthlyData = [],
  forecastData = [],
  expenseBreakdown = [],
  currency = 'EUR',
}) {
  // Prepare Bar Chart Data
  const historicalMonths = monthlyData.map((item) => item.month)
  const forecastMonths = forecastData.map((item) => item.month)
  const allMonths = [...historicalMonths, ...forecastMonths]

  const historicalRevenue = monthlyData.map((item) => item.revenue || 0)
  const historicalExpenses = monthlyData.map((item) => item.expenses || 0)
  const forecastRevenue = forecastData.map((item) => item.revenue || 0)
  const forecastExpenses = forecastData.map((item) => item.expenses || 0)

  const barChartData = {
    labels: allMonths,
    datasets: [
      {
        label: 'Revenus',
        data: [...historicalRevenue, ...forecastRevenue],
        backgroundColor: historicalRevenue.map((_, i) =>
          i < historicalRevenue.length ? '#10b981' : '#a7f3d0'
        ),
        borderColor: forecastRevenue.map((_, i) =>
          i < historicalRevenue.length ? '#059669' : '#6ee7b7'
        ),
        borderWidth: forecastRevenue.map((_, i) =>
          i < historicalRevenue.length ? 1 : 2
        ),
        borderDash: forecastRevenue.map((_, i) =>
          i < historicalRevenue.length ? [] : [5, 5]
        ),
        opacity: forecastRevenue.map((_, i) =>
          i < historicalRevenue.length ? 1 : 0.6
        ),
      },
      {
        label: 'Dépenses',
        data: [...historicalExpenses, ...forecastExpenses],
        backgroundColor: historicalExpenses.map((_, i) =>
          i < historicalExpenses.length ? '#ef4444' : '#fca5a5'
        ),
        borderColor: historicalExpenses.map((_, i) =>
          i < historicalExpenses.length ? '#dc2626' : '#f87171'
        ),
        borderWidth: forecastExpenses.map((_, i) =>
          i < historicalExpenses.length ? 1 : 2
        ),
        borderDash: forecastExpenses.map((_, i) =>
          i < historicalExpenses.length ? [] : [5, 5]
        ),
        opacity: forecastExpenses.map((_, i) =>
          i < historicalExpenses.length ? 1 : 0.6
        ),
      },
    ],
  }

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 12 },
        },
      },
      title: {
        display: true,
        text: 'Revenus vs Dépenses',
        font: { size: 16, weight: 'bold' },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function (value) {
            return value.toLocaleString('fr-FR') + ' ' + currency
          },
        },
      },
    },
  }

  // Prepare Doughnut Chart Data
  const categoryLabels = expenseBreakdown.map((item) => item.category)
  const categoryValues = expenseBreakdown.map((item) => item.amount)
  const categoryColors = expenseBreakdown.map((item) => item.color || '#6366f1')
  const totalExpenses = categoryValues.reduce((sum, val) => sum + val, 0)

  const doughnutChartData = {
    labels: categoryLabels,
    datasets: [
      {
        data: categoryValues,
        backgroundColor: categoryColors,
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  }

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { size: 12 },
          padding: 15,
        },
      },
      title: {
        display: true,
        text: 'Répartition des dépenses',
        font: { size: 16, weight: 'bold' },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const value = context.parsed
            const total = context.dataset.data.reduce((a, b) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return (
              context.label +
              ': ' +
              value.toLocaleString('fr-FR') +
              ' ' +
              currency +
              ' (' +
              percentage +
              '%)'
            )
          },
        },
      },
    },
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Bar Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <Bar data={barChartData} options={barChartOptions} />
      </div>

      {/* Doughnut Chart with Center Text */}
      <div className="bg-white rounded-lg shadow p-6 relative flex items-center justify-center">
        <div className="relative w-full" style={{ maxWidth: '300px', margin: '0 auto' }}>
          <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-lg font-bold text-gray-900">
                {totalExpenses.toLocaleString('fr-FR')} {currency}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
