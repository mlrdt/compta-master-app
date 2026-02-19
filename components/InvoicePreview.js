'use client';

import { useRef } from 'react';

export default function InvoicePreview({ invoice, settings = {} }) {
  const previewRef = useRef(null);

  const downloadPDF = async () => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = previewRef.current;
      const options = {
        margin: 10,
        filename: `facture-${invoice.invoice_number}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      };
      html2pdf().set(options).from(element).save();
    } catch (error) {
      console.error('Erreur lors du téléchargement du PDF:', error);
      alert('Impossible de générer le PDF');
    }
  };

  const printInvoice = () => {
    window.print();
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalVat = 0;

    invoice.items?.forEach(item => {
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'draft': 'bg-gray-100 text-gray-800',
      'sent': 'bg-blue-100 text-blue-800',
      'paid': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800'
    };
    return statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // Split description into title and details if contains \n
  const parseItemDescription = (description) => {
    if (!description) return { title: '', details: '' };
    const parts = description.split('\n');
    return {
      title: parts[0] || '',
      details: parts.slice(1).join('\n') || ''
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-end print:hidden">
        <button
          onClick={printInvoice}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Imprimer
        </button>
        <button
          onClick={downloadPDF}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Télécharger PDF
        </button>
      </div>

      <div
        ref={previewRef}
        className="bg-white rounded-lg shadow-lg print:shadow-none print:rounded-none overflow-hidden"
      >
        {/* Header - Colorful indigo/violet gradient */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">FACTURE</h1>
              <p className="text-xl font-semibold text-indigo-100">
                {invoice.invoice_number}
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${getStatusColor(invoice.status)} print:bg-white print:border print:border-gray-300 print:text-gray-800`}>
                {invoice.status || 'Brouillon'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Company Info */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {settings.company_name || 'Nom Entreprise'}
            </h2>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{settings.company_address || 'Adresse'}</p>
              <p>Email: {settings.company_email || 'email@example.com'}</p>
              {settings.company_phone && <p>Tél: {settings.company_phone}</p>}
              {settings.trade_license && <p>License: {settings.trade_license}</p>}
              {settings.trn && <p>TRN: {settings.trn}</p>}
            </div>
          </div>

          {/* Dates and Client Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Dates */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Dates</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Émission:</span>
                  <span className="font-medium text-gray-900">{formatDate(invoice.issue_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Échéance:</span>
                  <span className="font-medium text-gray-900">{formatDate(invoice.due_date)}</span>
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Client</h3>
              <div className="text-sm">
                <p className="font-medium text-gray-900">
                  {invoice.client?.name || 'Aucun client spécifié'}
                </p>
                {invoice.client?.address && (
                  <p className="text-gray-600 mt-1">{invoice.client.address}</p>
                )}
                {invoice.client?.email && (
                  <p className="text-gray-600">{invoice.client.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Prestations / Items - Card Format */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Prestations</h3>
            <div className="space-y-4">
              {invoice.items?.map((item, idx) => {
                const { title, details } = parseItemDescription(item.description);
                const lineTotal = item.quantity * item.unit_price * (1 + item.vat_rate / 100);
                
                return (
                  <div
                    key={idx}
                    className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-base mb-1">
                          {title}
                        </h4>
                        {details && (
                          <p className="text-sm text-gray-500 whitespace-pre-wrap">
                            {details}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-2xl font-bold text-indigo-600">
                          {lineTotal.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {invoice.currency}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 pt-3 border-t border-gray-200">
                      <div>
                        <span className="text-gray-500">Qté:</span>{' '}
                        <span className="font-medium text-gray-900">{item.quantity}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">P.U:</span>{' '}
                        <span className="font-medium text-gray-900">
                          {item.unit_price.toFixed(2)} {invoice.currency}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">TVA:</span>{' '}
                        <span className="font-medium text-gray-900">{item.vat_rate}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-100 mb-8">
            <div className="space-y-3">
              <div className="flex justify-between text-base">
                <span className="text-gray-700">Sous-total</span>
                <span className="font-medium text-gray-900">
                  {totals.subtotal.toFixed(2)} {invoice.currency}
                </span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-gray-700">TVA totale</span>
                <span className="font-medium text-gray-900">
                  {totals.totalVat.toFixed(2)} {invoice.currency}
                </span>
              </div>
              <div className="flex justify-between border-t-2 border-indigo-200 pt-3">
                <span className="font-bold text-gray-900 text-xl">Total TTC</span>
                <span className="font-bold text-3xl text-indigo-600">
                  {totals.total.toFixed(2)} {invoice.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mb-8 bg-yellow-50 rounded-lg p-5 border border-yellow-200">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Notes
              </h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t-2 border-gray-300 pt-6 text-center">
            <p className="font-semibold text-gray-900 text-base mb-2">
              Merci pour votre confiance
            </p>
            <p className="text-sm text-gray-600">{settings.company_name || 'Nom Entreprise'}</p>
            {settings.company_email && (
              <p className="text-sm text-gray-600">{settings.company_email}</p>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          button {
            display: none;
          }
          .print\\:shadow-none {
            box-shadow: none;
          }
          .print\\:rounded-none {
            border-radius: 0;
          }
          .print\\:bg-white {
            background-color: white;
          }
          .print\\:border {
            border-width: 1px;
          }
          .print\\:border-gray-300 {
            border-color: #d1d5db;
          }
          .print\\:text-gray-800 {
            color: #1f2937;
          }
        }
      `}</style>
    </div>
  );
}
