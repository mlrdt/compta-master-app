# 📊 Compta App — Spécification & Roadmap

> Application web de suivi et prévision financière pour **Melted** (studio de production vidéo / motion design)
> Dernière mise à jour : 19 février 2026

---

## 1. Vue d'ensemble

### 1.1 Contexte
Milan dirige **Melted**, un studio de production vidéo et motion design spécialisé dans les sujets techniques (industrie, science, technologie). L'application **Compta** doit servir d'outil de gestion financière simple, visuel et efficace pour un indépendant / petite structure.

### 1.2 Objectifs principaux
- **Suivi financier temps réel** — voir en un coup d'œil CA, dépenses, solde, tendances
- **Prévisions budgétaires** — anticiper les revenus et dépenses sur 3-6 mois
- **Gestion des factures** — créer, suivre et transformer en transactions
- **Objectifs financiers** — fixer des cibles mensuelles et mesurer la progression
- **Assistant IA** — générer des factures depuis des documents (bons de commande, contrats)

### 1.3 Stack technique actuelle
| Composant | Technologie |
|-----------|-------------|
| Frontend | Next.js 14 (App Router), React 18, Tailwind CSS 3 |
| Backend/API | Next.js API Routes (serverless) |
| Base de données | Supabase (PostgreSQL) |
| IA | OpenAI GPT-4o via API |
| Graphiques | Chart.js + react-chartjs-2 |
| PDF | html2pdf.js |
| Markdown (Chat) | react-markdown |
| Icônes | Heroicons + Lucide React |
| Hébergement | Vercel |

---

## 2. État actuel — Audit des fonctionnalités existantes (v2.0)

### 2.1 ✅ Dashboard (page d'accueil)
- **4 cartes KPI** : CA du mois, Dépenses, Solde, Factures en attente
- **Barre de progression** objectif de revenus (si configuré dans settings)
- **Graphique barres** : Revenus vs Dépenses sur 6 mois + prévision 3 mois (régression linéaire)
- **Graphique donut** : Répartition des dépenses du mois par catégorie

### 2.2 ✅ Factures (`/invoices`)
- Liste filtrée par statut (brouillon, envoyée, payée, en retard, annulée)
- Création / édition avec éditeur de lignes (description, quantité, prix, TVA)
- Gestion des clients liés
- Workflow de statut : brouillon → envoyée → payée
- Création auto d'une transaction revenue quand marquée "payée"
- Aperçu détaillé de facture (InvoicePreview)
- Export PDF (via html2pdf.js)

### 2.3 ✅ Transactions (`/transactions`)
- Liste avec filtres (type + mois)
- CRUD complet (date, type, catégorie, montant, devise, description)
- Lien avec catégories (couleur + nom)
- Support multi-devises (AED, EUR, USD)

### 2.4 ✅ Chat IA (`/chat`)
- Conversation persistante (stockée en BDD)
- Upload de fichiers (images + PDF) avec drag & drop
- Génération de factures via GPT-4o (vision pour images)
- Extraction de données structurées (invoice_json)
- Création directe de facture depuis le chat

### 2.5 ✅ Paramètres (`/settings`)
- **Société** : nom, adresse, email, téléphone, licence, TRN, devise, TVA, préfixe facture
- **Clients** : CRUD complet
- **Catégories** : revenus et dépenses avec couleurs
- **Objectifs** : objectifs mensuels CA + limite de dépenses par mois/année

### 2.6 Base de données (9 tables)
```
settings          → Config singleton (société, devise, TVA...)
clients           → Base clients
categories        → Catégories revenus/dépenses
invoices          → Factures
invoice_items     → Lignes de factures
transactions      → Revenus et dépenses
goals             → Objectifs mensuels (CA + limite dépenses)
chat_messages     → Historique du chat IA
uploaded_files    → Documents uploadés
```

---

## 3. Analyse des lacunes & Axes d'amélioration

### 3.1 🔴 Problèmes identifiés

| # | Problème | Impact | Priorité |
|---|----------|--------|----------|
| 1 | **Pas d'authentification** — RLS ouvert (anon public) | Sécurité critique | P0 |
| 2 | **Incohérence type "income" vs "revenue"** — La DB utilise `revenue` mais le frontend utilise parfois `income` | Bugs de filtres | P1 |
| 3 | **Devise AED en dur** dans la DB migration et certains composants alors que l'usage est en EUR | Confusion | P1 |
| 4 | **Pas de gestion multi-devises réelle** — pas de conversion, affichage brut | Inexactitude financière | P2 |
| 5 | **Prévision trop simpliste** — régression linéaire basique | Prévisions peu fiables | P2 |
| 6 | **Pas d'export de données** (CSV, Excel) | Limitation comptable | P2 |
| 7 | **Pas de récurrence** pour les transactions/dépenses fixes | Saisie manuelle répétitive | P2 |
| 8 | **Pas de tableau de flux de trésorerie** (cash flow) | Visibilité limitée | P2 |
| 9 | **Pas de rapports/bilans** période personnalisée | Analyse limitée | P3 |

### 3.2 🟡 Améliorations UX

| # | Amélioration | Justification |
|---|-------------|---------------|
| 1 | Totaux en bas du tableau transactions | Vue rapide |
| 2 | Recherche/filtre dans les transactions | Retrouver rapidement |
| 3 | Dashboard plus riche (tendance YoY, mois précédent vs actuel) | Contexte |
| 4 | Notifications factures en retard | Suivi cash flow |
| 5 | Mode sombre | Confort |
| 6 | PWA / offline basique | Accès mobile |

---

## 4. Roadmap de développement — Phases

### Phase 1 — Stabilisation & Corrections (1-2 jours)
> Objectif : corriger les bugs et incohérences avant d'ajouter des fonctionnalités

- [ ] **Fix type incohérence** : harmoniser `revenue`/`income` → utiliser `revenue` partout (aligné DB)
- [ ] **Fix devise par défaut** : passer tout en EUR par défaut (DB migration + frontend)
- [ ] **Ajouter totaux** en bas du tableau transactions (total revenus / total dépenses / solde du mois)
- [ ] **Fix DashboardCharts** : les propriétés `category` et `amount` dans expenseBreakdown ne correspondent pas (`name` et `total` dans supabase.js)
- [ ] **Test complet** de chaque page avec des données réelles

---

### Phase 2 — Suivi & Prévisions financières avancées (3-5 jours)
> Objectif : transformer l'app en vrai outil de pilotage financier

#### 2A. Tableau de flux de trésorerie (Cash Flow)
**Nouvelle page : `/cashflow`**
- Vue mensuelle : solde d'ouverture + entrées − sorties = solde de clôture
- Vue prévisionnelle sur 6-12 mois intégrant :
  - Factures envoyées (encaissements prévus)
  - Dépenses récurrentes programmées
  - Objectifs/prévisions
- Graphique en cascade (waterfall chart) pour visualiser les flux

#### 2B. Transactions récurrentes
- Nouveau champ `is_recurring` + `recurrence_rule` (mensuel, trimestriel, annuel)
- Génération automatique des transactions à date
- Exemples : loyer bureau, abonnements logiciels, assurance...
- Table DB additionnelle :
```sql
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id BIGSERIAL PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('revenue', 'expense')),
    category_id BIGINT REFERENCES categories(id),
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'EUR',
    description TEXT DEFAULT '',
    frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE,
    next_occurrence DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2C. Prévisions améliorées
- **Méthode** : moyenne mobile pondérée + prise en compte de la saisonnalité
- **Scénarios** : optimiste / réaliste / pessimiste (±15%)
- **Intégration des récurrences** dans les projections
- **Intégration du pipeline factures** (envoyées non payées) comme revenus probables

#### 2D. Objectifs enrichis
- Progression visuelle mois par mois (barres de progression)
- Alerte quand on dépasse la limite de dépenses
- Comparaison objectif vs réalisé sur l'année entière
- KPI : taux d'atteinte, écart moyen, meilleur/pire mois

---

### Phase 3 — Rapports & Export (2-3 jours)
> Objectif : produire des rapports exploitables pour la comptabilité

#### 3A. Page Rapports (`/reports`)
- **Compte de résultat** (P&L) : revenus − dépenses = résultat, par période personnalisable
- **Répartition par catégorie** : tableau + graphique pour une période donnée
- **Comparaison de périodes** : mois vs mois, trimestre vs trimestre, année vs année
- **Top clients** par CA généré

#### 3B. Export de données
- Export CSV des transactions (filtré par date/type/catégorie)
- Export CSV des factures
- Export PDF du rapport P&L
- Format compatible avec un comptable externe

---

### Phase 4 — Sécurité & Robustesse (1-2 jours)

- [ ] **Authentification Supabase** : activer auth email/password ou magic link
- [ ] **RLS activé** : politiques basées sur `auth.uid()`
- [ ] **Protection des API routes** : vérifier le token côté serveur
- [ ] **Backup régulier** : script d'export automatique de la DB

---

### Phase 5 — Améliorations UX & Mobile (2-3 jours)

- [ ] **PWA** (Progressive Web App) : manifest + service worker pour installation mobile
- [ ] **Mode sombre** : toggle dans les paramètres
- [ ] **Recherche globale** : barre de recherche dans la sidebar (transactions, factures, clients)
- [ ] **Notifications** : alerte factures en retard (badge dans sidebar)
- [ ] **Raccourcis clavier** : Ctrl+N pour nouvelle transaction, etc.
- [ ] **Onboarding** : premier lancement guidé

---

## 5. Architecture cible

### 5.1 Structure de fichiers (cible Phase 3)

```
compta-app/
├── app/
│   ├── api/
│   │   ├── ai/route.js              ← Chat IA (existant)
│   │   ├── recurring/route.js        ← CRON récurrences (nouveau)
│   │   └── reports/route.js          ← Génération rapports (nouveau)
│   ├── cashflow/page.js              ← Flux de trésorerie (nouveau)
│   ├── chat/page.js                  ← Chat IA (existant)
│   ├── invoices/page.js              ← Factures (existant)
│   ├── reports/page.js               ← Rapports (nouveau)
│   ├── settings/page.js              ← Paramètres (existant)
│   ├── transactions/page.js          ← Transactions (existant)
│   ├── layout.js                     ← Layout principal
│   ├── page.js                       ← Dashboard
│   └── globals.css
├── components/
│   ├── CashFlowChart.js              ← Graphique waterfall (nouveau)
│   ├── DashboardCharts.js            ← Graphiques dashboard (existant)
│   ├── ForecastChart.js              ← Graphique prévisions (nouveau)
│   ├── GoalProgress.js               ← Progression objectifs (nouveau)
│   ├── InvoiceEditor.js              ← Éditeur factures (existant)
│   ├── InvoicePreview.js             ← Aperçu factures (existant)
│   ├── Modal.js                      ← Modal générique (existant)
│   ├── PnLReport.js                  ← Rapport P&L (nouveau)
│   ├── RecurringManager.js           ← Gestion récurrences (nouveau)
│   ├── Sidebar.js                    ← Navigation (existant)
│   └── StatCard.js                   ← Carte KPI (existant)
├── lib/
│   ├── forecast.js                   ← Algorithmes de prévision (nouveau)
│   ├── reports.js                    ← Logique rapports (nouveau)
│   ├── supabase.js                   ← Client Supabase (existant)
│   └── utils.js                      ← Utilitaires (existant)
├── public/
│   ├── manifest.json                 ← PWA manifest (nouveau)
│   └── icons/                        ← Icônes PWA (nouveau)
├── supabase-migration.sql            ← Migration initiale
├── supabase-migration-v3.sql         ← Migration Phase 2-3 (nouveau)
├── SPEC-COMPTA-APP.md                ← Ce document
├── GUIDE-INSTALLATION.md
├── package.json
├── next.config.js
├── tailwind.config.js
└── postcss.config.js
```

### 5.2 Nouvelles tables DB (Phase 2-3)

```sql
-- Transactions récurrentes
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id BIGSERIAL PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('revenue', 'expense')),
    category_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    currency TEXT DEFAULT 'EUR',
    description TEXT DEFAULT '',
    frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'yearly')),
    day_of_month INTEGER DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE,
    next_occurrence DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Snapshots mensuels (pour historique fiable)
CREATE TABLE IF NOT EXISTS monthly_snapshots (
    id BIGSERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    total_revenue NUMERIC DEFAULT 0,
    total_expenses NUMERIC DEFAULT 0,
    balance NUMERIC DEFAULT 0,
    opening_balance NUMERIC DEFAULT 0,
    closing_balance NUMERIC DEFAULT 0,
    snapshot_date TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(year, month)
);
```

### 5.3 Sidebar mise à jour

```
📊 Tableau de bord     (existant)
📄 Factures            (existant)
💰 Transactions        (existant)
📈 Flux de trésorerie  (nouveau — Phase 2)
📋 Rapports            (nouveau — Phase 3)
🤖 Chat IA             (existant)
⚙️ Paramètres          (existant)
```

---

## 6. Algorithme de prévision amélioré (Phase 2C)

```javascript
// lib/forecast.js

/**
 * Prévision par moyenne mobile pondérée avec scénarios
 * @param {number[]} values - Valeurs historiques (6-12 mois)
 * @param {number} periods - Nombre de mois à prévoir
 * @returns {{ optimistic: number[], realistic: number[], pessimistic: number[] }}
 */
export function weightedForecast(values, periods = 3) {
  const n = values.length;
  if (n < 2) {
    const avg = n > 0 ? values[0] : 0;
    return {
      optimistic: Array(periods).fill(avg * 1.15),
      realistic: Array(periods).fill(avg),
      pessimistic: Array(periods).fill(avg * 0.85),
    };
  }

  // Poids exponentiels (mois récents = plus importants)
  const weights = values.map((_, i) => Math.pow(1.3, i));
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  const weightedAvg = values.reduce((s, v, i) => s + v * weights[i], 0) / totalWeight;

  // Tendance (pente)
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((s, v) => s + v, 0) / n;
  const num = values.reduce((s, v, i) => s + (i - xMean) * (v - yMean), 0);
  const den = values.reduce((s, _, i) => s + (i - xMean) ** 2, 0);
  const slope = den !== 0 ? num / den : 0;

  // Prévisions
  const realistic = Array.from({ length: periods }, (_, j) =>
    Math.max(0, Math.round((weightedAvg + slope * (j + 1)) * 100) / 100)
  );

  return {
    optimistic: realistic.map(v => Math.round(v * 1.15 * 100) / 100),
    realistic,
    pessimistic: realistic.map(v => Math.round(v * 0.85 * 100) / 100),
  };
}

/**
 * Intègre le pipeline factures dans la prévision de revenus
 * @param {number[]} forecastRevenue - Prévisions de base
 * @param {object[]} pendingInvoices - Factures envoyées non payées
 * @returns {number[]} Prévisions ajustées
 */
export function adjustWithPipeline(forecastRevenue, pendingInvoices) {
  // Répartir les montants attendus sur les mois à venir
  const adjusted = [...forecastRevenue];
  pendingInvoices.forEach(inv => {
    const dueDate = new Date(inv.due_date);
    const monthIndex = dueDate.getMonth() - new Date().getMonth();
    if (monthIndex >= 0 && monthIndex < adjusted.length) {
      adjusted[monthIndex] += inv.total * 0.85; // 85% probabilité d'encaissement
    }
  });
  return adjusted;
}
```

---

## 7. Priorités de développement recommandées

| Priorité | Phase | Effort | Impact |
|----------|-------|--------|--------|
| 🔴 P0 | Phase 1 — Fix bugs + cohérence | 1-2j | Fondation stable |
| 🟠 P1 | Phase 2A — Cash flow | 2j | Visibilité financière |
| 🟠 P1 | Phase 2B — Récurrences | 1-2j | Gain de temps quotidien |
| 🟡 P2 | Phase 2C — Prévisions avancées | 1j | Pilotage stratégique |
| 🟡 P2 | Phase 2D — Objectifs enrichis | 1j | Motivation & suivi |
| 🟢 P3 | Phase 3 — Rapports & Export | 2-3j | Comptabilité professionnelle |
| 🔵 P4 | Phase 4 — Auth & sécurité | 1-2j | Protection des données |
| ⚪ P5 | Phase 5 — PWA & UX | 2-3j | Confort d'usage |

**Effort total estimé : 12-18 jours de développement**

---

## 8. KPIs de succès

| Métrique | Cible |
|----------|-------|
| Toutes les transactions saisies | < 2 min par saisie |
| Facture créée via chat IA | < 3 min (de l'upload au brouillon) |
| Vue cash flow opérationnelle | Anticipation à 6 mois |
| Export mensuel pour comptable | 1 clic |
| Objectifs suivis | Progression visible au quotidien |

---

## 9. Notes techniques

### 9.1 Variables d'environnement
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
OPENAI_API_KEY=sk-...
```

### 9.2 Conventions de code
- **Langue UI** : Français
- **Devise par défaut** : EUR
- **Format dates** : `fr-FR` (JJ/MM/AAAA)
- **Format montants** : `fr-FR` avec séparateur milliers (1 234,56 €)
- **Types de transaction en DB** : `revenue` / `expense` (jamais `income`)
- **Composants** : React Client Components (`'use client'`)
- **Style** : Tailwind CSS, palette indigo/gray

### 9.3 Déploiement
- **Vercel** pour le frontend + API routes
- **Supabase** pour la DB + Storage + (futur) Auth
- **CI/CD** : déploiement automatique via push GitHub → Vercel
