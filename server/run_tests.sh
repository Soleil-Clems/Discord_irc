#!/bin/bash

# ─── Couleurs ─────────────────────────────────────────────────
CYAN='\033[36m'
GREEN='\033[32m'
RED='\033[31m'
RESET='\033[0m'

BACK_OK=0
FRONT_OK=0

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${RESET}"
echo -e "${CYAN}║         Lezom — Séquence de tests        ║${RESET}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${RESET}"
echo ""

# ─── Backend ──────────────────────────────────────────────────
echo -e "${CYAN}[1/2] Tests unitaires Backend (NestJS + Jest)${RESET}"
echo "─────────────────────────────────────────────"
cd lezom_back/server && npm run test:cov
if [ $? -eq 0 ]; then
    BACK_OK=1
    echo -e "${GREEN}✔  Backend OK${RESET}"
else
    echo -e "${RED}✘  Backend FAILED${RESET}"
fi

echo ""

# ─── Frontend ─────────────────────────────────────────────────
echo -e "${CYAN}[2/2] Tests unitaires Frontend (Next.js + Vitest)${RESET}"
echo "─────────────────────────────────────────────────"
cd ../../lezom_front/client && npm run test:coverage
if [ $? -eq 0 ]; then
    FRONT_OK=1
    echo -e "${GREEN}✔  Frontend OK${RESET}"
else
    echo -e "${RED}✘  Frontend FAILED${RESET}"
fi

echo ""
echo "─────────────────────────────────────────────"

# ─── Résumé ───────────────────────────────────────────────────
if [ $BACK_OK -eq 1 ] && [ $FRONT_OK -eq 1 ]; then
    echo -e "${GREEN}✔  Tous les tests passent.${RESET}"
    exit 0
else
    echo -e "${RED}✘  Certains tests ont échoué.${RESET}"
    exit 1
fi
