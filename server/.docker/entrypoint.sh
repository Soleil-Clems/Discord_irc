#!/bin/bash

if [ ! -f .env ]; then
  echo "Fichier .env introuvable, création depuis .env.example..."
  cp .env.example .env
else
  echo "Suppression de l'ancien fichier .env..."
  rm .env
  cp .env.example .env
fi

export $(grep -v '^#' .env | xargs)

echo "attente de MySQL..."
until mysqladmin ping -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" --silent 2>/dev/null; do
  sleep 2
done
echo "MySQL est prêt"

echo "Chargement de la base de données..."
mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < /docker-entrypoint-initdb.d/lezom.sql
echo "Base chargée"