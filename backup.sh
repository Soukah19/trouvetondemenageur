#!/bin/bash

# Script de sauvegarde TrouveTonDemenageur
# Usage: ./backup.sh [destination]

set -e

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="trouvetondemenageur-backup-${TIMESTAMP}.tar.gz"
DESTINATION=${1:-"/tmp"}
BACKUP_PATH="${DESTINATION}/${BACKUP_NAME}"

echo "🔄 Création de la sauvegarde..."
echo "📁 Destination: ${BACKUP_PATH}"

# Créer l'archive (exclure node_modules, dist, .git)
tar -czf "${BACKUP_PATH}" \
  --exclude=node_modules \
  --exclude=dist \
  --exclude=.git \
  --exclude=*.tar.gz \
  .

# Vérifier la création
if [ -f "${BACKUP_PATH}" ]; then
  SIZE=$(du -h "${BACKUP_PATH}" | cut -f1)
  echo "✅ Sauvegarde créée avec succès!"
  echo "📦 Fichier: ${BACKUP_NAME}"
  echo "💾 Taille: ${SIZE}"
  echo "📍 Emplacement: ${BACKUP_PATH}"

  # Afficher le contenu (premiers fichiers)
  echo ""
  echo "📋 Contenu de l'archive (aperçu):"
  tar -tzf "${BACKUP_PATH}" | head -20
  echo "..."

  # Statistiques
  TOTAL_FILES=$(tar -tzf "${BACKUP_PATH}" | wc -l)
  echo ""
  echo "📊 Statistiques:"
  echo "   - Fichiers: ${TOTAL_FILES}"
  echo "   - Taille: ${SIZE}"
  echo "   - Date: $(date '+%Y-%m-%d %H:%M:%S')"
else
  echo "❌ Erreur lors de la création de la sauvegarde"
  exit 1
fi

echo ""
echo "📝 Pour restaurer cette sauvegarde:"
echo "   tar -xzf ${BACKUP_PATH} -C /destination/path"
echo "   cd /destination/path"
echo "   npm install"
echo "   cp .env.example .env"
echo "   # Configurer les variables d'environnement dans .env"
echo "   npm run dev"
