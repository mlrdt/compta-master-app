#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: ./scripts/new-project.sh nom-du-projet"
  exit 1
fi

PROJECT=$1

echo "🚀 Création du projet $PROJECT..."

gh repo create $PROJECT --public --template mlrdt/webapp-template --clone
cd $PROJECT

gh secret set NEXT_PUBLIC_SUPABASE_URL --body "${2:-remplace_moi}"
gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY --body "${3:-remplace_moi}"
gh secret set SUPABASE_SERVICE_ROLE_KEY --body "${4:-remplace_moi}"

echo ""
echo "✅ Projet $PROJECT créé !"
echo ""
echo "Il te reste 2 choses :"
echo "1. Connecter le repo sur https://vercel.com/new"
echo "2. Ajouter VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID dans les secrets GitHub"
echo ""
echo "Repo : https://github.com/mlrdt/$PROJECT"
