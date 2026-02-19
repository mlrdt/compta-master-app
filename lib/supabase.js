import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Variables Supabase manquantes. Vérifie ton .env.local');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// ============ SETTINGS ============
export async function getSettings() {
  const { data, error } = await supabase.from('settings').select('*').eq('id', 1).single();
  if (error) throw error;
  return data;
}

export async function updateSettings(updates) {
  const { data, error } = await supabase.from('settings').update(updates).eq('id', 1).select().single();
  if (error) throw error;
  return data;
}

// ============ CLIENTS ============
export async function getClients() {
  const { data, error } = await supabase.from('clients').select('*').order('name');
  if (error) throw error;
  return data || [];
}

export async function getClient(id) {
  const { data, error } = await supabase.from('clients').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function addClientRecord(client) {
    const { data, error } = await supabase.from('clients').insert(client).select().single();
  if (error) throw error;
  return data;
}

export async function updateClient(id, updates) {
  const { data, error } = await supabase.from('clients').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteClient(id) {
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw error;
}

// ============ CATEGORIES ============
export async function getCategories(type = null) {
  let query = supabase.from('categories').select('*').order('name');
  if (type) query = query.eq('type', type);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createCategory(cat) {
  const { data, error } = await supabase.from('categories').insert(cat).select().single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id, updates) {
  const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// ============ INVOICES ============
export async function getInvoices(filters = {}) {
  let query = supabase.from('invoices').select(`
    *,
    clients(name, email, address),
    invoice_items(*)
  `).order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.client_id) query = query.eq('client_id', filters.client_id);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(inv => ({
    ...inv,
    client_name: inv.clients?.name || '',
    client_email: inv.clients?.email || '',
    client_address: inv.clients?.address || '',
    items: inv.invoice_items || [],
    subtotal: (inv.invoice_items || []).reduce((s, i) => s + i.quantity * i.unit_price, 0),
    vat_total: (inv.invoice_items || []).reduce((s, i) => s + i.quantity * i.unit_price * i.vat_rate / 100, 0),
    total: (inv.invoice_items || []).reduce((s, i) => s + i.quantity * i.unit_price * (1 + i.vat_rate / 100), 0),
  }));
}

export async function getInvoice(id) {
  const { data, error } = await supabase.from('invoices').select(`
    *,
    clients(name, email, address, phone),
    invoice_items(*)
  `).eq('id', id).single();
  if (error) throw error;
  const items = data.invoice_items || [];
  return {
    ...data,
    client_name: data.clients?.name || '',
    client_email: data.clients?.email || '',
    client_address: data.clients?.address || '',
    client_phone: data.clients?.phone || '',
    items,
    subtotal: items.reduce((s, i) => s + i.quantity * i.unit_price, 0),
    vat_total: items.reduce((s, i) => s + i.quantity * i.unit_price * i.vat_rate / 100, 0),
    total: items.reduce((s, i) => s + i.quantity * i.unit_price * (1 + i.vat_rate / 100), 0),
  };
}

export async function createInvoice(invoice, items) {
  // Get next invoice number
  const { data: numData, error: numError } = await supabase.rpc('get_next_invoice_number');
  if (numError) throw numError;

  const { data: inv, error: invError } = await supabase.from('invoices').insert({
    invoice_number: numData,
    client_id: invoice.client_id || null,
    date: invoice.date || new Date().toISOString().split('T')[0],
    due_date: invoice.due_date || null,
    status: invoice.status || 'draft',
    currency: invoice.currency || 'AED',
    notes: invoice.notes || '',
  }).select().single();
  if (invError) throw invError;

  // Insert items
  if (items && items.length > 0) {
    const itemsWithInvoice = items.map(it => ({
      invoice_id: inv.id,
      description: it.description || '',
      quantity: it.quantity || 1,
      unit_price: it.unit_price || 0,
      vat_rate: it.vat_rate ?? 5,
    }));
    const { error: itemsError } = await supabase.from('invoice_items').insert(itemsWithInvoice);
    if (itemsError) throw itemsError;
  }

  return getInvoice(inv.id);
}

export async function updateInvoice(id, invoice, items) {
  const { error: invError } = await supabase.from('invoices').update({
    client_id: invoice.client_id,
    date: invoice.date,
    due_date: invoice.due_date,
    status: invoice.status,
    currency: invoice.currency,
    notes: invoice.notes,
  }).eq('id', id);
  if (invError) throw invError;

  // Replace items
  if (items !== undefined) {
    await supabase.from('invoice_items').delete().eq('invoice_id', id);
    if (items.length > 0) {
      const itemsWithInvoice = items.map(it => ({
        invoice_id: id,
        description: it.description || '',
        quantity: it.quantity || 1,
        unit_price: it.unit_price || 0,
        vat_rate: it.vat_rate ?? 5,
      }));
      const { error } = await supabase.from('invoice_items').insert(itemsWithInvoice);
      if (error) throw error;
    }
  }

  return getInvoice(id);
}

export async function updateInvoiceStatus(id, status) {
  const { error } = await supabase.from('invoices').update({ status }).eq('id', id);
  if (error) throw error;

  // Auto-create revenue transaction when marked as paid
  if (status === 'paid') {
    const inv = await getInvoice(id);
    // Check if transaction already exists
    const { data: existing } = await supabase.from('transactions').select('id').eq('invoice_id', id);
    if (!existing || existing.length === 0) {
      await supabase.from('transactions').insert({
        date: new Date().toISOString().split('T')[0],
        type: 'revenue',
        amount: Math.round(inv.total * 100) / 100,
        currency: inv.currency,
        description: `Facture ${inv.invoice_number}`,
        invoice_id: id,
      });
    }
  }

  return getInvoice(id);
}

export async function deleteInvoice(id) {
  const { error } = await supabase.from('invoices').delete().eq('id', id);
  if (error) throw error;
}

// ============ TRANSACTIONS ============
export async function getTransactions(filters = {}) {
  let query = supabase.from('transactions').select(`
    *,
    categories(name, color)
  `).order('date', { ascending: false });

  if (filters.type) query = query.eq('type', filters.type);
  if (filters.month) {
    const start = `${filters.month}-01`;
    const [y, m] = filters.month.split('-').map(Number);
    const end = new Date(y, m, 0).toISOString().split('T')[0];
    query = query.gte('date', start).lte('date', end);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(t => ({
    ...t,
    category_name: t.categories?.name || '',
    category_color: t.categories?.color || '#64748b',
  }));
}

export async function createTransaction(transaction) {
  const { data, error } = await supabase.from('transactions').insert(transaction).select(`
    *, categories(name, color)
  `).single();
  if (error) throw error;
  return { ...data, category_name: data.categories?.name || '', category_color: data.categories?.color || '#64748b' };
}

export async function updateTransaction(id, updates) {
  const { data, error } = await supabase.from('transactions').update(updates).eq('id', id).select(`
    *, categories(name, color)
  `).single();
  if (error) throw error;
  return { ...data, category_name: data.categories?.name || '', category_color: data.categories?.color || '#64748b' };
}

export async function deleteTransaction(id) {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}

// ============ GOALS ============
export async function getGoals(year) {
  const { data, error } = await supabase.from('goals').select('*')
    .eq('year', year).order('month');
  if (error) throw error;
  return data || [];
}

export async function upsertGoal(goal) {
  const { data, error } = await supabase.from('goals').upsert(goal, { onConflict: 'year,month' }).select().single();
  if (error) throw error;
  return data;
}

// ============ DASHBOARD ============
export async function getDashboardStats() {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthStart = `${currentMonth}-01`;
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const [revResult, expResult, pendingResult, goalResult] = await Promise.all([
    supabase.from('transactions').select('amount').eq('type', 'revenue').gte('date', monthStart).lte('date', monthEnd),
    supabase.from('transactions').select('amount').eq('type', 'expense').gte('date', monthStart).lte('date', monthEnd),
    supabase.from('invoices').select('*, invoice_items(*)').in('status', ['sent', 'overdue']),
    supabase.from('goals').select('*').eq('year', now.getFullYear()).eq('month', now.getMonth() + 1),
  ]);

  const revenue = (revResult.data || []).reduce((s, t) => s + Number(t.amount), 0);
  const expenses = (expResult.data || []).reduce((s, t) => s + Number(t.amount), 0);
  const pendingInvoices = pendingResult.data || [];
  const pendingTotal = pendingInvoices.reduce((s, inv) => {
    const items = inv.invoice_items || [];
    return s + items.reduce((is, i) => is + i.quantity * i.unit_price * (1 + i.vat_rate / 100), 0);
  }, 0);

  return {
    revenue: Math.round(revenue * 100) / 100,
    expenses: Math.round(expenses * 100) / 100,
    balance: Math.round((revenue - expenses) * 100) / 100,
    pending_count: pendingInvoices.length,
    pending_total: Math.round(pendingTotal * 100) / 100,
    goal: goalResult.data?.[0] || null,
  };
}

export async function getMonthlyData(months = 6) {
  const now = new Date();
  const result = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const start = `${ym}-01`;
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];

    const [revRes, expRes] = await Promise.all([
      supabase.from('transactions').select('amount').eq('type', 'revenue').gte('date', start).lte('date', end),
      supabase.from('transactions').select('amount').eq('type', 'expense').gte('date', start).lte('date', end),
    ]);

    const rev = (revRes.data || []).reduce((s, t) => s + Number(t.amount), 0);
    const exp = (expRes.data || []).reduce((s, t) => s + Number(t.amount), 0);

    result.push({
      month: ym,
      label: d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
      revenue: Math.round(rev * 100) / 100,
      expenses: Math.round(exp * 100) / 100,
    });
  }

  return result;
}

export async function getExpenseBreakdown() {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const start = `${ym}-01`;
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const { data, error } = await supabase.from('transactions')
    .select('amount, categories(name, color)')
    .eq('type', 'expense')
    .gte('date', start)
    .lte('date', end);

  if (error) throw error;

  const breakdown = {};
  (data || []).forEach(t => {
    const name = t.categories?.name || 'Non catégorisé';
    const color = t.categories?.color || '#64748b';
    if (!breakdown[name]) breakdown[name] = { name, color, total: 0 };
    breakdown[name].total += Number(t.amount);
  });

  return Object.values(breakdown).sort((a, b) => b.total - a.total);
}

// ============ CHAT ============
export async function getChatMessages() {
  const { data, error } = await supabase.from('chat_messages').select('*').order('created_at');
  if (error) throw error;
  return data || [];
}

export async function addChatMessage(msg) {
  const { data, error } = await supabase.from('chat_messages').insert(msg).select().single();
  if (error) throw error;
  return data;
}

export async function clearChat() {
  await supabase.from('chat_messages').delete().neq('id', 0);
}

// ============ FILE UPLOAD ============
export async function uploadFile(file) {
  const ext = file.name.split('.').pop();
  const path = `uploads/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from('documents').upload(path, file);
  if (error) throw error;

  const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);

  const { data: fileRecord, error: dbError } = await supabase.from('uploaded_files').insert({
    name: file.name,
    storage_path: path,
    mime_type: file.type,
    size_bytes: file.size,
  }).select().single();

  if (dbError) throw dbError;

  return { ...fileRecord, url: urlData.publicUrl };
}
