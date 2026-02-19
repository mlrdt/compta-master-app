'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

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
        details: '',
        quantity: 1,
        unit_price: 0,
        vat_rate: settings.default_vat_rate || 5
      }
    ]
  });

  // Initialize form with invoice data if editing
  useEffect(() => {
    if (invoice) {
      // Split description into title and details if contains \n
      const items = (invoice.items || []).map((item, idx) => {
        const parts = item.description ? item.description.split('\n') : [''];
        return {
          id: Date.now() + idx,
          description: parts[0] || '',
          details: parts.slice(1).join('\n') || '',
          quantity: item.quantity,
          unit_price: item.unit_price,
          vat_rate: item.vat_rate
        };
      });

      setFormData({
        client_id: invoice.client_id,
        currency: invoice.currency,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        notes: invoice.notes || '',
        items: items.length > 0 ? items : [
          {
            id: Date.now(),
            description: '',
            details: '',
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
          ? { 
              ...item, 
              [field]: field === 'description' || field === 'details' ? value : parseFloat(value) || 0 
            }
          : item
      )
    }));
  };

  const addLineItem = () => {
    const newItem = {
      id: Date.now(),
      description: '',
      details: '',
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
    if (formData.items.length === 1) {
      alert('Vous devez avoir au moins un article');
      return;
    }
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

    // Concatenate description + "\n" + details for storage
    const itemsForStorage = formData.items.map(({ id, description, details, ...rest }) => ({
      description: details.trim() ? `${description}\n${details}` : description,
      ...rest
    }));

    onSave({
      ...formData,
      items: itemsForStorage
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Line Items - Card Format */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Articles
        </label>
        <div className="space-y-4">
          {formData.items.map((item, index) => {
            const lineTotal = calculateLineTotal(
              item.quantity,
              item.unit_price,
              item.vat_rate
            );
            return (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative"
              >
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={() => removeLineItem(item.id)}
                  className="absolute top-3 right-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-1 transition-colors"
                  aria-label="Supprimer"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Article number */}
                <div className="text-sm font-semibold text-gray-500 mb-3">
                  Article #{index + 1}
                </div>

                {/* Description */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={item.description}
                    onChange={(e) =>
                      handleItemChange(item.id, 'description', e.target.value)
                    }
                    placeholder="Description de la prestation"
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    required
                  />
                </div>

                {/* Details (optional) */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Détails (optionnel)
                  </label>
                  <textarea
                    value={item.details}
                    onChange={(e) =>
                      handleItemChange(item.id, 'details', e.target.value)
                    }
                    placeholder="Détails supplémentaires..."
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Quantity, Price, VAT, Total */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Quantité *
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(item.id, 'quantity', e.target.value)
                      }
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Prix unitaire *
                    </label>
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) =>
                        handleItemChange(item.id, 'unit_price', e.target.value)
                      }
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      TVA % *
                    </label>
                    <input
                      type="number"
                      value={item.vat_rate}
                      onChange={(e) =>
                        handleItemChange(item.id, 'vat_rate', e.target.value)
                      }
                      step="0.1"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Total
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-indigo-600">
                      {lineTotal.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addLineItem}
          className="mt-4 w-full px-4 py-3 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium border border-gray-300"
        >
          + Ajouter une ligne
        </button>
      </div>

      {/* Totals Summary */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-100">
        <h3 className="font-semibold text-gray-900 mb-4 text-lg">Résumé</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Sous-total</span>
            <span className="font-medium text-gray-900">
              {totals.subtotal.toFixed(2)} {formData.currency}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">TVA totale</span>
            <span className="font-medium text-gray-900">
              {totals.totalVat.toFixed(2)} {formData.currency}
            </span>
          </div>
          <div className="flex justify-between border-t border-indigo-200 pt-3">
            <span className="font-bold text-gray-900 text-lg">Total TTC</span>
            <span className="font-bold text-2xl text-indigo-600">
              {totals.total.toFixed(2)} {formData.currency}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors font-medium"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="px-6 py-3 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors font-medium"
        >
          Enregistrer
        </button>
      </div>
    </form>
  );
}
