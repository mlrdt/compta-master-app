-- ============================================
-- Compta App - Migration Supabase
-- Exécuter ce script dans SQL Editor de Supabase
-- ============================================

-- Settings (singleton)
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    company_name TEXT DEFAULT '',
    address TEXT DEFAULT '',
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    trade_license TEXT DEFAULT '',
    trn TEXT DEFAULT '',
    default_currency TEXT DEFAULT 'AED',
    default_vat_rate NUMERIC DEFAULT 5.0,
    invoice_prefix TEXT DEFAULT 'INV',
    next_invoice_number INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Clients
CREATE TABLE IF NOT EXISTS clients (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT DEFAULT '',
    address TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    currency TEXT DEFAULT 'AED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('revenue', 'expense')),
    color TEXT DEFAULT '#6366f1'
);

-- Default categories
INSERT INTO categories (name, type, color) VALUES
    ('Services', 'revenue', '#10b981'),
    ('Produits', 'revenue', '#3b82f6'),
    ('Consulting', 'revenue', '#8b5cf6'),
    ('Autre revenu', 'revenue', '#f59e0b'),
    ('Loyer / Bureau', 'expense', '#ef4444'),
    ('Logiciels / Abonnements', 'expense', '#f97316'),
    ('Marketing', 'expense', '#ec4899'),
    ('Transport', 'expense', '#6366f1'),
    ('Repas / Business', 'expense', '#14b8a6'),
    ('Autre dépense', 'expense', '#64748b')
ON CONFLICT DO NOTHING;

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id BIGSERIAL PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    client_id BIGINT REFERENCES clients(id) ON DELETE SET NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    currency TEXT DEFAULT 'AED',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
    id BIGSERIAL PRIMARY KEY,
    invoice_id BIGINT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity NUMERIC DEFAULT 1,
    unit_price NUMERIC DEFAULT 0,
    vat_rate NUMERIC DEFAULT 5.0
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    type TEXT NOT NULL CHECK (type IN ('revenue', 'expense')),
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'AED',
    description TEXT DEFAULT '',
    invoice_id BIGINT REFERENCES invoices(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals
CREATE TABLE IF NOT EXISTS goals (
    id BIGSERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    revenue_goal NUMERIC DEFAULT 0,
    expense_limit NUMERIC DEFAULT 0,
    UNIQUE(year, month)
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    invoice_id BIGINT REFERENCES invoices(id) ON DELETE SET NULL,
    file_urls TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Uploaded Files
CREATE TABLE IF NOT EXISTS uploaded_files (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type TEXT DEFAULT '',
    size_bytes BIGINT DEFAULT 0,
    chat_message_id BIGINT REFERENCES chat_messages(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security (RLS)
-- Pour usage personnel, on désactive le RLS
-- Si tu veux activer l'auth plus tard, active RLS
-- ============================================

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

-- Policies : accès public pour usage personnel (anon key)
CREATE POLICY "Allow all on settings" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on invoice_items" ON invoice_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on goals" ON goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on chat_messages" ON chat_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on uploaded_files" ON uploaded_files FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Storage bucket pour les documents uploadés
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Allow public uploads to documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Allow public reads from documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "Allow public deletes from documents" ON storage.objects FOR DELETE USING (bucket_id = 'documents');

-- ============================================
-- Fonctions utiles
-- ============================================

-- Fonction pour incrémenter le numéro de facture
CREATE OR REPLACE FUNCTION get_next_invoice_number()
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    num INTEGER;
BEGIN
    SELECT invoice_prefix, next_invoice_number INTO prefix, num FROM settings WHERE id = 1;
    UPDATE settings SET next_invoice_number = num + 1 WHERE id = 1;
    RETURN prefix || '-' || LPAD(num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
