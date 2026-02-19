'use client'

import { useEffect, useState } from 'react'
import {
  getSettings,
  updateSettings,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getClients,
  createClient,
  updateClient,
  deleteClient,
  getGoals,
  upsertGoal,
} from '@/lib/supabase'
import { MONTHS_FR } from '@/lib/utils'
import Modal from '@/components/Modal'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

const COLOR_OPTIONS = [
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#f97316',
  '#ec4899',
  '#6366f1',
  '#14b8a6',
  '#64748b',
  '#84cc16',
  '#06b6d4',
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('company')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)

  // Company tab state
  const [settings, setSettings] = useState({
    company_name: '',
    address: '',
    email: '',
    phone: '',
    trade_license: '',
    trn: '',
    default_currency: 'EUR',
    default_vat_rate: 0,
    invoice_prefix: '',
  })

  // Clients tab state
  const [clients, setClients] = useState([])
  const [showClientModal, setShowClientModal] = useState(false)
  const [editingClientId, setEditingClientId] = useState(null)
  const [clientFormData, setClientFormData] = useState({
    name: '',
    email: '',
    address: '',
    phone: '',
    currency: 'EUR',
  })

  // Categories tab state
  const [categories, setCategories] = useState([])
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    type: 'income',
    color: COLOR_OPTIONS[0],
  })

  // Goals tab state
  const [goals, setGoals] = useState({})
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [goalsFormData, setGoalsFormData] = useState({})

  // Load initial data
  useEffect(() => {
    loadAllData()
  }, [])

  // Load goals when year changes
  useEffect(() => {
    loadGoals()
  }, [selectedYear])

  const loadAllData = async () => {
    try {
      setLoading(true)
      const [sets, cats, clnts] = await Promise.all([
        getSettings(),
        getCategories(),
        getClients(),
      ])
      setSettings(sets || {})
      setCategories(cats || [])
      setClients(clnts || [])
    } catch (err) {
      console.error('Erreur lors du chargement:', err)
      showMessage('Erreur lors du chargement des données', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadGoals = async () => {
    try {
      const goalsData = await getGoals(selectedYear)
      const goalsMap = {}
      goalsData?.forEach((goal) => {
        goalsMap[goal.month] = {
          revenue_target: goal.revenue_target || '',
          expense_limit: goal.expense_limit || '',
        }
      })
      setGoalsFormData(goalsMap)
      setGoals(goalsMap)
    } catch (err) {
      console.error('Erreur lors du chargement des objectifs:', err)
    }
  }

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 3000)
  }

  // ============ Company Tab ============

  const handleCompanyChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleCompanySave = async () => {
    try {
      await updateSettings(settings)
      showMessage('Paramètres enregistrés avec succès', 'success')
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
      showMessage('Erreur lors de la sauvegarde', 'error')
    }
  }

  // ============ Clients Tab ============

  const resetClientForm = () => {
    setClientFormData({
      name: '',
      email: '',
      address: '',
      phone: '',
      currency: 'EUR',
    })
    setEditingClientId(null)
  }

  const openClientModal = (client = null) => {
    if (client) {
      setEditingClientId(client.id)
      setClientFormData({
        name: client.name,
        email: client.email || '',
        address: client.address || '',
        phone: client.phone || '',
        currency: client.currency || 'EUR',
      })
    } else {
      resetClientForm()
    }
    setShowClientModal(true)
  }

  const closeClientModal = () => {
    setShowClientModal(false)
    resetClientForm()
  }

  const handleClientSave = async () => {
    try {
      if (!clientFormData.name) {
        showMessage('Le nom du client est obligatoire', 'error')
        return
      }

      if (editingClientId) {
        await updateClient(editingClientId, clientFormData)
      } else {
        await addClientRecord(clientFormData)
      }

      const clnts = await getClients()
      setClients(clnts || [])
      closeClientModal()
      showMessage('Client enregistré avec succès', 'success')
    } catch (err) {
      console.error('Erreur:', err)
      showMessage('Erreur lors de la sauvegarde du client', 'error')
    }
  }

  const handleClientDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      return
    }

    try {
      await deleteClient(id)
      setClients(clients.filter((c) => c.id !== id))
      showMessage('Client supprimé avec succès', 'success')
    } catch (err) {
      console.error('Erreur:', err)
      showMessage('Erreur lors de la suppression du client', 'error')
    }
  }

  // ============ Categories Tab ============

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      type: 'income',
      color: COLOR_OPTIONS[0],
    })
    setEditingCategoryId(null)
  }

  const openCategoryModal = (type, category = null) => {
    if (category) {
      setEditingCategoryId(category.id)
      setCategoryFormData({
        name: category.name,
        type: category.type,
        color: category.color || COLOR_OPTIONS[0],
      })
    } else {
      resetCategoryForm()
      setCategoryFormData((prev) => ({ ...prev, type }))
    }
    setShowCategoryModal(true)
  }

  const closeCategoryModal = () => {
    setShowCategoryModal(false)
    resetCategoryForm()
  }

  const handleCategorySave = async () => {
    try {
      if (!categoryFormData.name) {
        showMessage('Le nom de la catégorie est obligatoire', 'error')
        return
      }

      if (editingCategoryId) {
        await updateCategory(editingCategoryId, categoryFormData)
      } else {
        await createCategory(categoryFormData)
      }

      const cats = await getCategories()
      setCategories(cats || [])
      closeCategoryModal()
      showMessage('Catégorie enregistrée avec succès', 'success')
    } catch (err) {
      console.error('Erreur:', err)
      showMessage('Erreur lors de la sauvegarde de la catégorie', 'error')
    }
  }

  const handleCategoryDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      return
    }

    try {
      await deleteCategory(id)
      setCategories(categories.filter((c) => c.id !== id))
      showMessage('Catégorie supprimée avec succès', 'success')
    } catch (err) {
      console.error('Erreur:', err)
      showMessage('Erreur lors de la suppression', 'error')
    }
  }

  // ============ Goals Tab ============

  const handleGoalChange = (month, field, value) => {
    setGoalsFormData((prev) => ({
      ...prev,
      [month]: {
        ...prev[month],
        [field]: value,
      },
    }))
  }

  const handleGoalsSave = async () => {
    try {
      // Save all goals for the year
      for (let month = 1; month <= 12; month++) {
        const monthData = goalsFormData[month]
        if (monthData?.revenue_target || monthData?.expense_limit) {
          await upsertGoal({
            year: selectedYear,
            month,
            revenue_target: monthData.revenue_target ? parseFloat(monthData.revenue_target) : null,
            expense_limit: monthData.expense_limit ? parseFloat(monthData.expense_limit) : null,
          })
        }
      }
      showMessage('Objectifs enregistrés avec succès', 'success')
    } catch (err) {
      console.error('Erreur:', err)
      showMessage('Erreur lors de la sauvegarde des objectifs', 'error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-600 mt-2">Gérez votre entreprise et vos préférences</p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'company', label: 'Société' },
              { id: 'clients', label: 'Clients' },
              { id: 'categories', label: 'Catégories' },
              { id: 'goals', label: 'Objectifs' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* ============ COMPANY TAB ============ */}
            {activeTab === 'company' && (
              <div className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom de l'entreprise
                    </label>
                    <input
                      type="text"
                      value={settings.company_name || ''}
                      onChange={(e) => handleCompanyChange('company_name', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={settings.email || ''}
                      onChange={(e) => handleCompanyChange('email', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adresse
                    </label>
                    <input
                      type="text"
                      value={settings.address || ''}
                      onChange={(e) => handleCompanyChange('address', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={settings.phone || ''}
                      onChange={(e) => handleCompanyChange('phone', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Licence commerciale
                    </label>
                    <input
                      type="text"
                      value={settings.trade_license || ''}
                      onChange={(e) => handleCompanyChange('trade_license', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TRN</label>
                    <input
                      type="text"
                      value={settings.trn || ''}
                      onChange={(e) => handleCompanyChange('trn', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Devise par défaut
                    </label>
                    <select
                      value={settings.default_currency || 'EUR'}
                      onChange={(e) => handleCompanyChange('default_currency', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="AED">AED</option>
                      <option value="EUR">EUR</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Taux TVA par défaut (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={settings.default_vat_rate || ''}
                      onChange={(e) => handleCompanyChange('default_vat_rate', parseFloat(e.target.value))}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Préfixe facture
                    </label>
                    <input
                      type="text"
                      value={settings.invoice_prefix || ''}
                      onChange={(e) => handleCompanyChange('invoice_prefix', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handleCompanySave}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Enregistrer
                </button>
              </div>
            )}

            {/* ============ CLIENTS TAB ============ */}
            {activeTab === 'clients' && (
              <div className="space-y-4">
                <button
                  onClick={() => openClientModal()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Nouveau client
                </button>

                {clients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Aucun client enregistré</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nom
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Téléphone
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Devise
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {clients.map((client) => (
                          <tr key={client.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {client.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {client.email || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {client.phone || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {client.currency || 'EUR'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => openClientModal(client)}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleClientDelete(client.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ============ CATEGORIES TAB ============ */}
            {activeTab === 'categories' && (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* Revenue Categories */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenus</h3>
                  <button
                    onClick={() => openCategoryModal('income')}
                    className="mb-4 inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Ajouter
                  </button>

                  <div className="space-y-2">
                    {categories
                      .filter((c) => c.type === 'income')
                      .map((cat) => (
                        <div
                          key={cat.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-sm text-gray-900">{cat.name}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openCategoryModal('income', cat)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCategoryDelete(cat.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Expense Categories */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Dépenses</h3>
                  <button
                    onClick={() => openCategoryModal('expense')}
                    className="mb-4 inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Ajouter
                  </button>

                  <div className="space-y-2">
                    {categories
                      .filter((c) => c.type === 'expense')
                      .map((cat) => (
                        <div
                          key={cat.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-sm text-gray-900">{cat.name}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openCategoryModal('expense', cat)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCategoryDelete(cat.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============ GOALS TAB ============ */}
            {activeTab === 'goals' && (
              <div className="space-y-6">
                {/* Year selector */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedYear(selectedYear - 1)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    ←
                  </button>
                  <span className="text-lg font-semibold text-gray-900">{selectedYear}</span>
                  <button
                    onClick={() => setSelectedYear(selectedYear + 1)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    →
                  </button>
                </div>

                {/* Months grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {MONTHS_FR.map((month, index) => {
                    const monthNum = index + 1
                    const monthData = goalsFormData[monthNum] || {}
                    return (
                      <div
                        key={monthNum}
                        className="p-4 border border-gray-200 rounded-lg space-y-3"
                      >
                        <h4 className="font-semibold text-gray-900">{month}</h4>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Objectif CA
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={monthData.revenue_target || ''}
                            onChange={(e) =>
                              handleGoalChange(monthNum, 'revenue_target', e.target.value)
                            }
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Limite dépenses
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={monthData.expense_limit || ''}
                            onChange={(e) =>
                              handleGoalChange(monthNum, 'expense_limit', e.target.value)
                            }
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>

                <button
                  onClick={handleGoalsSave}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Enregistrer les objectifs
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Client Modal */}
      <Modal
        isOpen={showClientModal}
        onClose={closeClientModal}
        title={editingClientId ? 'Modifier le client' : 'Nouveau client'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input
              type="text"
              value={clientFormData.name}
              onChange={(e) => setClientFormData({ ...clientFormData, name: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={clientFormData.email}
              onChange={(e) => setClientFormData({ ...clientFormData, email: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <input
              type="text"
              value={clientFormData.address}
              onChange={(e) =>
                setClientFormData({ ...clientFormData, address: e.target.value })
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input
              type="tel"
              value={clientFormData.phone}
              onChange={(e) => setClientFormData({ ...clientFormData, phone: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
            <select
              value={clientFormData.currency}
              onChange={(e) =>
                setClientFormData({ ...clientFormData, currency: e.target.value })
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="AED">AED</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleClientSave}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Enregistrer
            </button>
            <button
              onClick={closeClientModal}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Annuler
            </button>
          </div>
        </div>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={closeCategoryModal}
        title={editingCategoryId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
            <input
              type="text"
              value={categoryFormData.name}
              onChange={(e) =>
                setCategoryFormData({ ...categoryFormData, name: e.target.value })
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="income"
                  checked={categoryFormData.type === 'income'}
                  onChange={(e) =>
                    setCategoryFormData({ ...categoryFormData, type: e.target.value })
                  }
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Revenu</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="expense"
                  checked={categoryFormData.type === 'expense'}
                  onChange={(e) =>
                    setCategoryFormData({ ...categoryFormData, type: e.target.value })
                  }
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Dépense</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Couleur</label>
            <div className="grid grid-cols-6 gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  onClick={() => setCategoryFormData({ ...categoryFormData, color })}
                  className={`w-full h-10 rounded-lg border-2 transition-transform ${
                    categoryFormData.color === color
                      ? 'border-gray-900 scale-110'
                      : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleCategorySave}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Enregistrer
            </button>
            <button
              onClick={closeCategoryModal}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Annuler
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
