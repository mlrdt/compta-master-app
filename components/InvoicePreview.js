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
        className="bg-white p-8 rounded-lg shadow print:shadow-none print:rounded-none print:p-0"
      >
        {/* Header */}
        <div className="flex justify-between mb-8 pb-6 border-b-2 border-gray-300">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{settings.company_name || 'Nom Entreprise'}</h1>
            <p className="text-gray-600 mt-1 text-sm">{settings.company_address || 'Adresse'}</p>
          </div>
          <div className="text-right">
            <h2 className="text-4xl font-bold text-indigo-600">FACTURE</h2>
          </div>
        </div>

        {/* Company Details */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="text-sm text-gray-600 space-y-1">
            <p>
              <span className="font-semibold">Email:</span> {settings.company_email || 'email@example.com'}
            </p>
            <p>
              <span className="font-semibold">Téléphone:</span> {settings.company_phone || ''}
            </p>
            {settings.trade_license && (
              <p>
                <span className="font-semibold">License Commercial:</span> {settings.trade_license}
              </p>
            )}
            {settings.trn && (
              <p>
                <span className="font-semibold">TRN:</span> {settings.trn}
              </p>
            )}
          </div>

          {/* Invoice Info Box */}
          <div className="bg-gray-100 p-4 rounded-lg text-sm space-y-2 text-right">
            <div>
              <span className="font-semibold">N° facture:</span> {invoice.invoice_number}
            </div>
            <div>
              <span className="font-semibold">Date:</span> {formatDate(invoice.issue_date)}
            </div>
            <div>
              <span className="font-semibold">Échéance:</span> {formatDate(invoice.due_date)}
            </div>
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                {invoice.status || 'Brouillon'}
              </span>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="mb-8">
          <h3 className="font-semibold text-gray-900 mb-2">Facturer à:</h3>
          <p className="text-gray-700 text-sm">
            {invoice.client?.name || 'Aucun client spécifié'}
          </p>
          {invoice.client?.address && (
            <p className="text-gray-700 text-sm">{invoice.client.address}</p>
          )}
          {invoice.client?.email && (
            <p className="text-gray-700 text-sm">{invoice.client.email}</p>
          )}
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-y border-gray-300">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Description</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900 w-16">Qté</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900 w-24">Prix unitaire</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900 w-16">TVA%</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900 w-24">Montant</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, idx) => {
                const lineTotal = item.quantity * item.unit_price * (1 + item.vat_rate / 100);
                return (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="py-3 px-4 text-gray-700">{item.description}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{item.quantity}</td>
                    <td className="py-3 px-4 text-right text-gray-700">
                      {item.unit_price.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-700">{item.vat_rate}%</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                      {lineTotal.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64 space-y-2 border-t border-gray-300 pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Sous-total:</span>
              <span className="font-medium text-gray-900">
                {totals.subtotal.toFixed(2)} {invoice.currency}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">TVA:</span>
              <span className="font-medium text-gray-900">
                {totals.totalVat.toFixed(2)} {invoice.currency}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-300 pt-2">
              <span className="font-bold text-gray-900">Total TTC:</span>
              <span className="font-bold text-lg text-indigo-600">
                {totals.total.toFixed(2)} {invoice.currency}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm">Notes:</h4>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-300 pt-6 text-center text-sm text-gray-600">
          <p className="font-semibold text-gray-900 mb-2">Merci pour votre confiance</p>
          <p>{settings.company_name || 'Nom Entreprise'}</p>
          {settings.company_email && <p>{settings.company_email}</p>}
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
          .print\\:p-0 {
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}
