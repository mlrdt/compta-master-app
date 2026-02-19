// Currency formatting
export function formatCurrency(amount, currency = 'AED') {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0) + ' ' + currency;
}

// Date formatting
export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Month names in French
export const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

// Status labels and colors
export const STATUS_CONFIG = {
  draft: { label: 'Brouillon', class: 'bg-gray-100 text-gray-700' },
  sent: { label: 'Envoyée', class: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Payée', class: 'bg-green-100 text-green-700' },
  overdue: { label: 'En retard', class: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Annulée', class: 'bg-gray-100 text-gray-400' },
};

// Transaction type config
export const TYPE_CONFIG = {
  revenue: { label: 'Revenu', class: 'bg-green-100 text-green-700' },
  expense: { label: 'Dépense', class: 'bg-red-100 text-red-700' },
};

// Linear forecast
export function linearForecast(values, periods = 3) {
  const n = values.length;
  if (n < 2 || values.every(v => v === 0)) {
    const avg = n > 0 ? values.reduce((s, v) => s + v, 0) / n : 0;
    return Array(periods).fill(Math.round(avg * 100) / 100);
  }
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((s, v) => s + v, 0) / n;
  const num = values.reduce((s, v, i) => s + (i - xMean) * (v - yMean), 0);
  const den = values.reduce((s, _, i) => s + (i - xMean) ** 2, 0);
  const slope = den !== 0 ? num / den : 0;
  const intercept = yMean - slope * xMean;
  return Array.from({ length: periods }, (_, j) =>
    Math.round(Math.max(0, slope * (n + j) + intercept) * 100) / 100
  );
}

// Today's date as YYYY-MM-DD
export function today() {
  return new Date().toISOString().split('T')[0];
}

// Current month as YYYY-MM
export function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// File to base64 for OpenAI vision
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
