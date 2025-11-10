#!/bin/bash

# Script para testar o upload de documentos

echo "🧪 Testando API de Upload de Documentos"
echo "========================================"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:4000"

# Teste 1: Health Check
echo -e "${YELLOW}1. Testando Health Check...${NC}"
curl -s "$API_URL/health" | json_pp
echo ""
echo ""

# Teste 2: Upload de arquivo TXT
echo -e "${YELLOW}2. Testando upload de arquivo TXT...${NC}"
echo "Este é um arquivo de teste" > test.txt
curl -X POST "$API_URL/api/v1/docs" \
  -F "file=@test.txt" \
  -s | json_pp
rm test.txt
echo ""
echo ""

# Teste 3: Upload de arquivo MD
echo -e "${YELLOW}3. Testando upload de arquivo MD...${NC}"
curl -X POST "$API_URL/api/v1/docs" \
  -F "file=@README.md" \
  -s | json_pp
echo ""
echo ""

# Teste 4: Erro - sem arquivo
echo -e "${YELLOW}4. Testando erro - sem arquivo...${NC}"
curl -X POST "$API_URL/api/v1/docs" \
  -s | json_pp
echo ""
echo ""

# Teste 5: Erro - tipo inválido
echo -e "${YELLOW}5. Testando erro - tipo de arquivo inválido...${NC}"
echo "fake image" > test.png
curl -X POST "$API_URL/api/v1/docs" \
  -F "file=@test.png" \
  -s | json_pp
rm test.png
echo ""
echo ""

echo -e "${GREEN}✅ Testes concluídos!${NC}"
