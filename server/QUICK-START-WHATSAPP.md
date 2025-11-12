# 🚀 Quick Start - WhatsApp Import

Guia rápido para começar a usar o sistema de importação de históricos do WhatsApp.

## ⚡ Início Rápido (5 minutos)

### 1. Instalar Dependências

```bash
cd server
npm install
```

### 2. Configurar .env

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_KEY=sua-chave-de-servico
```

### 3. Criar Funções SQL

Copie e execute no SQL Editor do Supabase:

```sql
-- Habilitar pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Copie todo o conteúdo de sql/create_functions.sql e execute
```

### 4. Testar com Dados de Exemplo

```bash
npm run import:example
```

Isso vai:
- ✅ Importar 2 conversas de exemplo
- ✅ Gerar análises de leads
- ✅ Criar relatório HTML em `reports/lead-insights.html`

### 5. Ver Resultados

Abra no navegador:
```
server/reports/lead-insights.html
```

## 📁 Seus Próprios Dados

### 1. Preparar Arquivos JSON

Crie arquivos no formato `{phone}.json`:

```json
{
  "phone": "5511999999999",
  "messages": [
    {
      "from": "cliente",
      "text": "Olá!",
      "timestamp": "2025-11-12T10:00:00Z"
    }
  ]
}
```

### 2. Importar

```bash
npm run import -- full --path ./meus-dados
```

## 🔍 Consultas SQL Úteis

### Top 10 Leads Quentes

```sql
SELECT * FROM get_hot_leads(70) LIMIT 10;
```

### Leads Frios (>30 dias)

```sql
SELECT * FROM get_cold_leads(30);
```

### Métricas de um Lead

```sql
SELECT * FROM get_lead_metrics('uuid-do-cliente');
```

## 📊 Comandos CLI

```bash
# Apenas importar
npm run import -- import --path ./dados

# Apenas analisar (dados já importados)
npm run import -- analyze

# Pipeline completo
npm run import -- full --path ./dados
```

## 🎯 Próximos Passos

1. ✅ Importar seus dados reais
2. ✅ Explorar o relatório HTML
3. ✅ Testar as consultas SQL
4. ✅ Integrar com seu CRM
5. ✅ Automatizar importações

## 💡 Dicas

- Use `--output` para especificar onde salvar relatórios
- Crie função de mapeamento customizada se seus JSONs forem diferentes
- Execute análises periodicamente para atualizar métricas
- Use as funções SQL para criar dashboards customizados

## 🆘 Problemas?

Consulte o [README completo](./WHATSAPP-IMPORT-README.md) para troubleshooting detalhado.

---

**Pronto para começar!** 🚀
