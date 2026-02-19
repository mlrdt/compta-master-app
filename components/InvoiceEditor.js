'use client';

import { useState, useEffect } from 'react';

export default function InvoiceEditor({
  invoice = null,
  clients = [],
  settings = {},
  onSave,
  onCancel
}) {
  const [formData, setFormData] = useState({
    client_id: null,
    currency: settings.default_currency || 'EUR',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    items: [
      {
        id: Date.now(),
        description: '',
        quantity: 1,
        unit_price: 0,
        vat_rate: settings.default_vat_rate || 5
      }
    ]
  });

  // Initialize form with invoice data if editing
  useEffect(() => {
    if (invoice) {
      setFormData({
        client_id: invoice.client_id,
        currency: invoice.currency,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        notes: invoice.notes || '',
        items: invoice.items || [
          {
            id: Date.now(),
            description: '',
            quantity: 1,
            unit_price: 0,
            vat_rate: settings.default_vat_rate || 5
          }
        ]
      });
    }
  }, [invoice, settings]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === id
          ? { ...item, [field]: field === 'description' ? value : parseFloat(value) || 0 }
          : item
      )
    }));
  };

  const addLineItem = () => {
    const newItem = {
      id: Date.now(),
      description: '',
      quantity: 1,
      unit_price: 0,
      vat_rate: settings.default_vat_rate || 5
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeLineItem = (id) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const calculateLineTotal = (quantity, unitPrice, vatRate) => {
    return quantity * unitPrice * (1 + vatRate / 100);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalVat = 0;

    formData.items.forEach(item => {
      const baseCost = item.quantity * item.unit_price;
      const vat = baseCost * (item.vat_rate / 100);
      subtotal += baseCost;
      totalVat += vat;
    });

    return {
      subtotal,
      totalVat,
      total: subtotal + totalVat
    };
  };

  const totals = calculateTotals();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.items.some(item => item.description.trim())) {
      alert('Veuillez ajouter au moins une ligne avec une description');
      return;
    }

    onSave({
      ...formData,
      items: formData.items.map(({ id, ...item }) => item)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client
          </label>
          <select
            name="client_id"
            value={formData.client_id || ''}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Aucun client</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Devise
          </label>
          <select
            name="currency"
            value={formData.currency}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="AED">AED</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date d'émission
          </label>
          <input
            type="date"
            name="issue_date"
            value={formData.issue_date}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date d'échéance
          </label>
          <input
            type="date"
            name="due_date"
            value={formData.due_date}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          rows="3"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Notes ou conditions de paiement..."
        />
      </div>

      {/* Line Items */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Articles
        </label>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3">Description</th>
                <th className="text-right py-2 px-3 w-16">Qté</th>
                <th className="text-right py-2 px-3 w-24">Prix unitaire</th>
                <th className="text-right py-2 px-3 w-16">TVA%</th>
                <th className="text-right py-2 px-3 w-24">Total</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map(item => {
                const lineTotal = calculateLineTotal(
                  item.quantity,
                  item.unit_price,
                  item.vat_rate
                );
                return (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(item.id, 'description', e.target.value)
                        }
                        placeholder="Description"
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs"
                        required
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(item.id, 'quantity', e.target.value)
                        }
                        step="0.01"
                        min="0"
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs text-right"
                        required
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) =>
                          handleItemChange(item.id, 'unit_price', e.target.value)
                        }
                        step="0.01"
                        min="0"
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs text-right"
                        required
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={item.vat_rate}
                        onChange={(e) =>
                          handleItemChange(item.id, 'vat_rate', e.target.value)
                        }
                        step="0.1"
                        min="0"
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs text-right"
                        required
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-medium text-xs">
                      {lineTotal.toFixed(2)}
                    </td>
                    <td className="py-2 px-3">
                      <button
                        type="button"
                        onClick={() => removeLineItem(item.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        aria-label="Supprimer"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button
          type="button"
          onClick={addLineItem}
          className="mt-3 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          + Ajouter une ligne
        </button>
      </div>

      {/* Totals */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Sous-total</span>
          <span className="font-medium">{totals.subtotal.toFixed(2)} {formData.currency}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">TVA totale</span>
          <span className="font-medium">{totals.totalVat.toFixed(2)} {formData.currency}</span>
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-2">
          <span className="font-semibold text-gray-900">Total TTC</span>
          <span className="font-bold text-lg text-indigo-600">
            {totals.total.toFixed(2)} {formData.currency}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors font-medium"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-medium"
        >
          Enregistrer
        </button>
      </div>
    </form>
  );
}
