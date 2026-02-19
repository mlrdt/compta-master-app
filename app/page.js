'use client'

import { useEffect, useState } from 'react'
import StatCard from '@/components/StatCard'
import DashboardCharts from '@/components/DashboardCharts'
import { getDashboardStats, getMonthlyData, getExpenseBreakdown, getSettings } from '@/lib/supabase'
import { formatCurrency, linearForecast } from '@/lib/utils'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [monthlyData, setMonthlyData] = useState([])
  const [forecastData, setForecastData] = useState([])
  const [expenseBreakdown, setExpenseBreakdown] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load all dashboard data
        const [dashboardStats, monthly, breakdown, appSettings] = await Promise.all([
          getDashboardStats(),
          getMonthlyData(),
          getExpenseBreakdown(),
          getSettings(),
        ])

        setStats(dashboardStats)
        setMonthlyData(monthly)
        setExpenseBreakdown(breakdown)
        setSettings(appSettings)

        // Generate forecast using linearForecast
        if (monthly && monthly.length > 0) {
          const revenueData = monthly.map((item) => item.revenue || 0)
          const expenseData = monthly.map((item) => item.expenses || 0)
          const months = monthly.map((item) => item.month)

          const revenueForecast = linearForecast(revenueData, 3)
          const expenseForecast = linearForecast(expenseData, 3)

          const forecastMonths = [
            new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString(
              'fr-FR',
              { month: 'short', year: '2-digit' }
            ),
            new Date(new Date().getFullYear(), new Date().getMonth() + 2, 1).toLocaleDateString(
              'fr-FR',
              { month: 'short', year: '2-digit' }
            ),
            new Date(new Date().getFullYear(), new Date().getMonth() + 3, 1).toLocaleDateString(
              'fr-FR',
              { month: 'short', year: '2-digit' }
            ),
          ]

          const forecast = forecastMonths.map((month, i) => ({
            month,
            revenue: revenueForecast[i],
            expenses: expenseForecast[i],
          }))

          setForecastData(forecast)
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err)
        setError('Erreur lors du chargement des données du tableau de bord')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 mb-2">Erreur</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 mb-2">Aucune donnée</p>
          <p className="text-gray-600">Aucune statistique disponible pour le moment</p>
        </div>
      </div>
    )
  }

  const currency = settings?.currency || 'EUR'
  const balanceColor = stats.balance >= 0 ? '#10b981' : '#ef4444'
  const pendingTotal = stats.pending_total || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600 mt-1">Bienvenue dans votre espace comptable</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="CA du mois"
          value={formatCurrency(stats.revenue, currency)}
          color="#10b981"
        />
        <StatCard
          label="Dépenses"
          value={formatCurrency(stats.expenses, currency)}
          color="#ef4444"
        />
        <StatCard
          label="Solde"
          value={formatCurrency(stats.balance, currency)}
          color={balanceColor}
        />
        <StatCard
          label="Factures en attente"
          value={stats.pending_count || 0}
          subtitle={
            pendingTotal > 0
              ? `Total: ${formatCurrency(pendingTotal, currency)}`
              : 'Aucune facture'
          }
          color="#eab308"
        />
      </div>

      {/* Revenue vs Goal Progress Bar */}
      {settings?.revenue_goal && stats.revenue > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Objectif de revenus</h3>
            <span className="text-sm text-gray-600">
              {Math.round((stats.revenue / settings.revenue_goal) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min((stats.revenue / settings.revenue_goal) * 100, 100)}%`,
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Réalisé: {formatCurrency(stats.revenue, currency)}</span>
            <span>Objectif: {formatCurrency(settings.revenue_goal, currency)}</span>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      {monthlyData.length > 0 ? (
        <DashboardCharts
          monthlyData={monthlyData}
          forecastData={forecastData}
          expenseBreakdown={expenseBreakdown}
          currency={currency}
        />
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-600 font-medium">Pas assez de données pour afficher les graphiques</p>
          <p className="text-gray-500 text-sm mt-1">
            Ajoutez des transactions pour voir vos statistiques
          </p>
        </div>
      )}
    </div>
  )
}
