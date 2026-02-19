'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import InvoiceEditor from '@/components/InvoiceEditor';
import InvoicePreview from '@/components/InvoicePreview';
import { formatCurrency, formatDate, STATUS_CONFIG } from '@/lib/utils';
import {
  getInvoices,
  getClients,
  getSettings,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  updateInvoiceStatus
} from '@/lib/supabase';

const FILTER_STATUSES = [
  { id: 'all', label: 'Toutes' },
  { id: 'draft', label: 'Brouillon' },
  { id: 'sent', label: 'Envoyée' },
  { id: 'paid', label: 'Payée' },
  { id: 'overdue', label: 'En retard' }
];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filterStatus, setFilterStatus] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [invoicesData, clientsData, settingsData] = await Promise.all([
          getInvoices(),
          getClients(),
          getSettings()
        ]);

        setInvoices(invoicesData || []);
        setClients(clientsData || []);
        setSettings(settingsData || {});
        setError(null);
      } catch (err) {
        console.error('Erreur lors du chargement:', err);
        setError('Impossible de charger les données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    if (filterStatus === 'all') return true;
    return inv.status === filterStatus;
  });

  const handleNewInvoice = () => {
    setSelectedInvoice(null);
    setShowNewModal(true);
  };

  const handleSaveInvoice = async (formData) => {
    try {
      setIsSubmitting(true);

      if (selectedInvoice) {
        // Update existing invoice
        const updated = await updateInvoice(selectedInvoice.id, formData);
        setInvoices(prev =>
          prev.map(inv => (inv.id === selectedInvoice.id ? updated : inv))
        );
      } else {
        // Create new invoice
        const created = await createInvoice(formData);
        setInvoices(prev => [created, ...prev]);
      }

      setShowNewModal(false);
      setShowEditModal(false);
      setSelectedInvoice(null);
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement:', err);
      alert('Impossible d\'enregistrer la facture');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkSent = async () => {
    if (!selectedInvoice) return;
    try {
      setIsSubmitting(true);
      await updateInvoiceStatus(selectedInvoice.id, 'sent');
      const updated = { ...selectedInvoice, status: 'sent' };
      setSelectedInvoice(updated);
      setInvoices(prev =>
        prev.map(inv => (inv.id === selectedInvoice.id ? updated : inv))
      );
    } catch (err) {
      console.error('Erreur:', err);
      alert('Impossible de mettre à jour le statut');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedInvoice) return;
    try {
      setIsSubmitting(true);
      await updateInvoiceStatus(selectedInvoice.id, 'paid');
      const updated = { ...selectedInvoice, status: 'paid' };
      setSelectedInvoice(updated);
      setInvoices(prev =>
        prev.map(inv => (inv.id === selectedInvoice.id ? updated : inv))
      );
    } catch (err) {
      console.error('Erreur:', err);
      alert('Impossible de mettre à jour le statut');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedInvoice) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette facture?')) return;

    try {
      setIsSubmitting(true);
      await deleteInvoice(selectedInvoice.id);
      setInvoices(prev => prev.filter(inv => inv.id !== selectedInvoice.id));
      setShowDetailModal(false);
      setSelectedInvoice(null);
    } catch (err) {
      console.error('Erreur:', err);
      alert('Impossible de supprimer la facture');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRowClick = (invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailModal(true);
  };

  const handleEditClick = () => {
    setShowEditModal(true);
    setShowDetailModal(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Factures</h1>
          <p className="text-gray-600 mt-1">
            {filteredInvoices.length} facture{filteredInvoices.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleNewInvoice}
          className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle facture
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_STATUSES.map(filter => (
          <button
            key={filter.id}
            onClick={() => setFilterStatus(filter.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === filter.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Table or Empty State */}
      {filteredInvoices.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900">Aucune facture</h3>
          <p className="text-gray-600 mt-1">
            {filterStatus === 'all'
              ? 'Commencez par créer votre première facture'
              : 'Aucune facture avec ce statut'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">
                    N° facture
                  </th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">
                    Client
                  </th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">
                    Date
                  </th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">
                    Échéance
                  </th>
                  <th className="text-right py-3 px-6 font-semibold text-gray-900">
                    Total TTC
                  </th>
                  <th className="text-center py-3 px-6 font-semibold text-gray-900">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.map(invoice => {
                  const statusConfig = STATUS_CONFIG[invoice.status] || {};
                  return (
                    <tr
                      key={invoice.id}
                      onClick={() => handleRowClick(invoice)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-6 text-sm font-medium text-gray-900">
                        {invoice.invoice_number}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        {invoice.client?.name || 'Sans client'}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        {formatDate(invoice.issue_date)}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        {formatDate(invoice.due_date)}
                      </td>
                      <td className="py-4 px-6 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(invoice.total_amount, invoice.currency)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            statusConfig.badgeClass || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {statusConfig.label || invoice.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedInvoice(null);
        }}
        title={selectedInvoice?.invoice_number || 'Détail Facture'}
        size="xl"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            <InvoicePreview invoice={selectedInvoice} settings={settings} />

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-4">
              <button
                onClick={handleEditClick}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium text-sm"
              >
                Modifier
              </button>

              {selectedInvoice.status === 'draft' && (
                <button
                  onClick={handleMarkSent}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Mise à jour...' : 'Marquer envoyée'}
                </button>
              )}

              {(selectedInvoice.status === 'sent' || selectedInvoice.status === 'overdue') && (
                <button
                  onClick={handleMarkPaid}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Mise à jour...' : 'Marquer payée'}
                </button>
              )}

              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50 ml-auto"
              >
                {isSubmitting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
        }}
        title={selectedInvoice ? 'Modifier facture' : 'Nouvelle facture'}
        size="xl"
      >
        <InvoiceEditor
          invoice={selectedInvoice}
          clients={clients}
          settings={settings}
          onSave={handleSaveInvoice}
          onCancel={() => {
            setShowEditModal(false);
          }}
        />
      </Modal>

      {/* New Invoice Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => {
          setShowNewModal(false);
        }}
        title="Nouvelle facture"
        size="xl"
      >
        <InvoiceEditor
          invoice={null}
          clients={clients}
          settings={settings}
          onSave={handleSaveInvoice}
          onCancel={() => {
            setShowNewModal(false);
          }}
        />
      </Modal>
    </div>
  );
}
