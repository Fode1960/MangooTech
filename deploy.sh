#!/bin/bash

# Script de déploiement automatique pour MangooTech
# Ce script automatise le processus de build et de déploiement

set -e  # Arrêter le script en cas d'erreur

echo "🚀 Début du déploiement de MangooTech..."

# Vérifier que nous sommes sur la branche main
echo "📋 Vérification de la branche actuelle..."
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo "⚠️  Attention: Vous n'êtes pas sur la branche main (branche actuelle: $current_branch)"
    read -p "Voulez-vous continuer? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Déploiement annulé"
        exit 1
    fi
fi

# Vérifier s'il y a des changements non commitées
echo "📋 Vérification des changements non commitées..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Il y a des changements non commitées:"
    git status --short
    read -p "Voulez-vous continuer sans committer ces changements? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Déploiement annulé. Veuillez committer vos changements d'abord."
        exit 1
    fi
fi

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm ci

# Lancer les tests de linting
echo "🔍 Vérification du code (linting)..."
npm run lint

# Build du projet
echo "🏗️  Build du projet..."
npm run build

# Vérifier que le build a réussi
if [ ! -d "dist" ]; then
    echo "❌ Erreur: Le dossier 'dist' n'a pas été créé. Le build a échoué."
    exit 1
fi

echo "✅ Build terminé avec succès!"

# Pousser vers GitHub (si demandé)
read -p "Voulez-vous pousser les changements vers GitHub? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📤 Push vers GitHub..."
    git push origin main
    echo "✅ Push terminé! Le déploiement automatique va commencer sur GitHub Pages."
    echo "🌐 Votre site sera disponible à: https://fode1960.github.io/MangooTech/"
else
    echo "ℹ️  Push ignoré. Vous pouvez pousser manuellement avec: git push origin main"
fi

echo "🎉 Déploiement local terminé avec succès!"
echo "📁 Les fichiers de build sont dans le dossier 'dist/'"
echo "🔗 Pour déployer sur GitHub Pages, poussez vers la branche main"