'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getCategories,
  getSettings,
} from '@/lib/supabase'
import { formatCurrency, formatDate, TYPE_CONFIG } from '@/lib/utils'
import Modal from '@/components/Modal'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function TransactionsPage() {
  const router = useRouter()
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filter state
  const [selectedType, setSelectedType] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('')

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    category_id: '',
    amount: '',
    currency: 'EUR',
    description: '',
  })

  // Initialize with current month
  useEffect(() => {
    const today = new Date()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const year = today.getFullYear()
    setSelectedMonth(`${year}-${month}`)
  }, [])

  // Load data on mount
  useEffect(() => {
    if (!selectedMonth) return

    const loadData = async () => {
      try {
        setLoading(true)
        const [txns, cats, sets] = await Promise.all([
          getTransactions({ month: selectedMonth }),
          getCategories(),
          getSettings(),
        ])
        setTransactions(txns || [])
        setCategories(cats || [])
        setSettings(sets)
        setError(null)
      } catch (err) {
        console.error('Erreur lors du chargement:', err)
        setError('Erreur lors du chargement des données')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedMonth])

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    if (selectedType !== 'all' && t.type !== selectedType) return false
    return true
  })

  // Get categories for current type
  const categoriesForType = categories.filter((c) => {
    if (selectedType === 'all') return true
    return c.type === selectedType
  })

  // Modal form handlers
  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      category_id: '',
      amount: '',
      currency: settings?.default_currency || 'EUR',
      description: '',
    })
    setEditingId(null)
  }

  const openModal = (transaction = null) => {
    if (transaction) {
      setEditingId(transaction.id)
      setFormData({
        date: transaction.date,
        type: transaction.type,
        category_id: transaction.category_id,
        amount: transaction.amount.toString(),
        currency: transaction.currency,
        description: transaction.description || '',
      })
    } else {
      resetForm()
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    resetForm()
  }

  const handleSave = async () => {
    try {
      if (!formData.date || !formData.category_id || !formData.amount) {
        setError('Veuillez remplir tous les champs obligatoires')
        return
      }

      const data = {
        date: formData.date,
        type: formData.type,
        category_id: formData.category_id,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        description: formData.description,
      }

      if (editingId) {
        await updateTransaction(editingId, data)
      } else {
        await createTransaction(data)
      }

      // Reload transactions
      const txns = await getTransactions({ month: selectedMonth })
      setTransactions(txns || [])
      closeModal()
      setError(null)
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
      setError('Erreur lors de la sauvegarde')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
      return
    }

    try {
      await deleteTransaction(id)
      setTransactions(transactions.filter((t) => t.id !== id))
      setError(null)
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      setError('Erreur lors de la suppression')
    }
  }

  const getCategoryById = (id) => categories.find((c) => c.id === id)
  const getCategoryColor = (id) => getCategoryById(id)?.color || '#gray'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-600 mt-2">Gérez vos revenus et dépenses</p>
          </div>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Nouvelle transaction
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Filter bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Type filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Type</label>
              <div className="flex gap-2">
                {['all', 'income', 'expense'].map((type) => {
                  const labels = {
                    all: 'Tous',
                    income: 'Revenus',
                    expense: 'Dépenses',
                  }
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedType === type
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {labels[type]}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Month filter */}
            <div>
              <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-3">
                Mois
              </label>
              <input
                type="month"
                id="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Chargement...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-lg font-medium">Aucune transaction</p>
              <p className="text-sm mt-2">Créez votre première transaction pour commencer</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.map((transaction) => {
                    const category = getCategoryById(transaction.category_id)
                    const typeConfig = TYPE_CONFIG[transaction.type]
                    return (
                      <tr
                        key={transaction.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => openModal(transaction)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeConfig.badgeClass}`}
                          >
                            {typeConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: getCategoryColor(transaction.category_id) }}
                            />
                            <span className="text-sm text-gray-900">{category?.name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                          {transaction.description || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openModal(transaction)
                            }}
                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(transaction.id)
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title={editingId ? 'Modifier la transaction' : 'Nouvelle transaction'}>
        <div className="space-y-4">
          {/* Date */}
          <div>
            <label htmlFor="modal-date" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              id="modal-date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="income"
                  checked={formData.type === 'income'}
                  onChange={(e) => {
                    setFormData({ ...formData, type: e.target.value, category_id: '' })
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Revenu</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="expense"
                  checked={formData.type === 'expense'}
                  onChange={(e) => {
                    setFormData({ ...formData, type: e.target.value, category_id: '' })
                  }}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Dépense</span>
              </label>
            </div>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="modal-category" className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <select
              id="modal-category"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Sélectionnez une catégorie</option>
              {categoriesForType.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="modal-amount" className="block text-sm font-medium text-gray-700 mb-1">
              Montant
            </label>
            <input
              type="number"
              id="modal-amount"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Currency */}
          <div>
            <label htmlFor="modal-currency" className="block text-sm font-medium text-gray-700 mb-1">
              Devise
            </label>
            <select
              id="modal-currency"
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="AED">AED</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="modal-description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="modal-description"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Enregistrer
            </button>
            <button
              onClick={closeModal}
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
