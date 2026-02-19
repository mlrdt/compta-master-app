# Guide d'installation — Compta App

## Ce dont tu as besoin

- Un navigateur web (Chrome, Safari, Firefox)
- 10 minutes de ton temps
- Pas besoin de savoir coder !

---

## Étape 1 : Créer la base de données Supabase (5 min)

1. Va sur **https://supabase.com** et crée un compte gratuit (tu peux te connecter avec GitHub ou Google)

2. Clique sur **"New Project"**
   - Nom : `compta` (ou ce que tu veux)
   - Mot de passe : choisis un mot de passe fort (note-le quelque part)
   - Région : choisis la plus proche de toi
   - Clique **"Create new project"**
   - Attends ~2 minutes que le projet se crée

3. Une fois le projet créé, va dans **"SQL Editor"** (icône dans la barre de gauche)
   - Clique sur **"New query"**
   - Ouvre le fichier `supabase-migration.sql` (fourni dans ce dossier)
   - Copie-colle **tout le contenu** dans l'éditeur SQL
   - Clique sur **"Run"** (ou Ctrl+Enter)
   - Tu devrais voir "Success" — tes tables sont créées !

4. Récupère tes clés :
   - Va dans **Settings** (icône engrenage en bas à gauche) → **API**
   - Copie le **"Project URL"** → ça ressemble à `https://xxxxx.supabase.co`
   - Copie la **"anon public"** key → ça commence par `eyJ...`
   - Garde ces deux valeurs, tu en auras besoin à l'étape 3

---

## Étape 2 : Obtenir une clé API OpenAI (3 min)

1. Va sur **https://platform.openai.com** et crée un compte (ou connecte-toi)

2. Va dans **"API Keys"** (menu de gauche ou https://platform.openai.com/api-keys)

3. Clique **"Create new secret key"**
   - Nom : `compta-app`
   - Copie la clé → ça commence par `sk-...`
   - ⚠️ **Garde cette clé en sécurité**, tu ne pourras plus la voir après !

4. Vérifie que tu as du crédit : va dans **Billing** → ajoute un mode de paiement si ce n'est pas fait (il faut un minimum de $5 de crédit pour utiliser l'API)

---

## Étape 3 : Déployer l'application sur Vercel (2 min)

### Option A : Déploiement rapide (recommandé)

1. Va sur **https://github.com** et crée un compte si tu n'en as pas

2. Crée un nouveau repository :
   - Clique sur **"+"** → **"New repository"**
   - Nom : `compta-app`
   - Visibilité : **Private** (recommandé)
   - Clique **"Create repository"**

3. Upload les fichiers :
   - Sur la page du repo, clique **"uploading an existing file"**
   - Glisse tout le contenu du dossier `compta-app-v2` dans la zone
   - Clique **"Commit changes"**

4. Va sur **https://vercel.com** et connecte-toi avec ton compte GitHub

5. Clique **"Add New..."** → **"Project"**
   - Sélectionne ton repo `compta-app`
   - Dans **"Environment Variables"**, ajoute ces 3 variables :

   | Nom | Valeur |
   |-----|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Ton URL Supabase (étape 1) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Ta clé anon Supabase (étape 1) |
   | `OPENAI_API_KEY` | Ta clé API OpenAI (étape 2) |

6. Clique **"Deploy"**
   - Attends ~2 minutes
   - Ton app est en ligne ! Vercel te donne une URL du type `compta-app.vercel.app`

### Option B : En ligne de commande (pour les devs)

```bash
# Clone ou copie les fichiers
cd compta-app-v2

# Copie .env.example en .env.local et remplis les valeurs
cp .env.example .env.local

# Installe les dépendances
npm install

# Lance en local
npm run dev

# Pour déployer sur Vercel
npx vercel
```

---

## Utilisation

### Tableau de bord
Ta page d'accueil avec tes stats du mois : chiffre d'affaires, dépenses, solde, et factures en attente. Les graphiques montrent l'évolution sur 6 mois + une prévision sur 3 mois.

### Factures
Crée, édite et gère tes factures. Tu peux :
- Créer une facture manuellement
- Changer le statut (brouillon → envoyée → payée)
- Télécharger en PDF
- Quand tu marques une facture comme "payée", une transaction de revenu est créée automatiquement

### Chat IA
La fonctionnalité star ! Glisse un bon de commande, un contrat ou n'importe quel document :
- L'IA extrait les infos et propose une facture
- Tu peux discuter pour ajuster ("change le prix", "ajoute une ligne", etc.)
- Quand c'est bon, clique "Créer cette facture"
- Tu peux ensuite la modifier manuellement si besoin

### Transactions
Suivi de tous tes revenus et dépenses par catégorie.

### Paramètres
- **Société** : tes infos (nom, adresse, Trade License, TRN)
- **Clients** : ta base de clients
- **Catégories** : personnalise tes catégories de revenus/dépenses
- **Objectifs** : définis des objectifs mensuels de CA

---

## FAQ

**Mes données sont-elles en sécurité ?**
Oui. Tes données sont stockées sur Supabase (infrastructure PostgreSQL). C'est la même technologie utilisée par des milliers d'entreprises. Les sauvegardes sont automatiques.

**Combien ça coûte ?**
- Supabase : gratuit (plan Free, 500 MB de base de données)
- Vercel : gratuit (plan Hobby)
- OpenAI : ~$0.01-0.05 par utilisation du chat IA (modèle GPT-4o)

**Je peux y accéder depuis mon téléphone ?**
Oui ! L'app est accessible depuis n'importe quel appareil avec un navigateur, via l'URL Vercel.

**Comment faire une sauvegarde ?**
Tes données Supabase sont sauvegardées automatiquement. Pour une sauvegarde manuelle, tu peux exporter les données depuis le dashboard Supabase.
