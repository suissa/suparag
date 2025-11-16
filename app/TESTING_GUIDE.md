# 🧪 Guia de Testes - CRM Frontend

## 📋 Testes Implementados

### ✅ Testes E2E com Playwright

Implementamos **6 suítes de testes** cobrindo todas as funcionalidades principais:

1. **navigation.spec.ts** - Navegação entre páginas
2. **customers.spec.ts** - CRUD de clientes
3. **interactions.spec.ts** - Gerenciamento de interações
4. **tickets.spec.ts** - Gerenciamento de tickets
5. **rag-search.spec.ts** - Busca semântica RAG
6. **metrics.spec.ts** - Dashboard de métricas

---

## 🚀 Como Executar os Testes

### 1. Pré-requisitos

Certifique-se de que o servidor de desenvolvimento está rodando:

```bash
# Terminal 1 - Frontend
cd app
npm run dev  # Porta 5173

# Terminal 2 - Backend (opcional, mas recomendado)
cd server
npm run dev  # Porta 4000
```

### 2. Instalar Browsers do Playwright

```bash
cd app
npx playwright install
```

### 3. Executar Testes

#### Modo Headless (padrão)
```bash
npm test
```

#### Modo UI (interativo)
```bash
npm run test:ui
```

#### Modo Headed (ver navegador)
```bash
npm run test:headed
```

#### Ver Relatório
```bash
npm run test:report
```

---

## 📊 Cobertura de Testes

### 1. Navegação (navigation.spec.ts)
- ✅ Navegar para todas as páginas principais
- ✅ Verificar item ativo na sidebar
- ✅ Verificar status da API

### 2. Clientes (customers.spec.ts)
- ✅ Exibir página de clientes
- ✅ Abrir modal de novo cliente
- ✅ Criar novo cliente
- ✅ Buscar clientes
- ✅ Navegar para detalhes
- ✅ Exibir loading state

### 3. Interações (interactions.spec.ts)
- ✅ Exibir página de interações
- ✅ Filtrar por canal
- ✅ Abrir modal de nova interação
- ✅ Exibir sentimento com cores

### 4. Tickets (tickets.spec.ts)
- ✅ Exibir página de tickets
- ✅ Filtrar por status
- ✅ Exibir status coloridos
- ✅ Abrir modal de novo ticket

### 5. Busca Semântica RAG (rag-search.spec.ts)
- ✅ Exibir página de RAG
- ✅ Exibir card de busca semântica
- ✅ Realizar busca semântica
- ✅ Abrir modal de novo documento
- ✅ Criar novo documento RAG
- ✅ Exibir tabela de documentos
- ✅ Mostrar similaridade nos resultados

### 6. Métricas (metrics.spec.ts)
- ✅ Exibir página de métricas
- ✅ Exibir 4 cards de KPIs
- ✅ Exibir gráficos
- ✅ Exibir resumo detalhado
- ✅ Ter ícones nos cards

---

## 📸 Screenshots Automáticos

Os testes estão configurados para capturar screenshots automaticamente em caso de falha:

```typescript
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
}
```

Screenshots são salvos em: `app/test-results/`

---

## 📈 Relatório HTML

Após executar os testes, um relatório HTML é gerado automaticamente:

```bash
npm run test:report
```

O relatório inclui:
- ✅ Tempo total de execução
- ✅ Pass/Fail count
- ✅ Screenshots de falhas
- ✅ Vídeos de falhas
- ✅ Trace viewer para debug

Localização: `app/reports/playwright-report/index.html`

---

## 🎯 Configuração do Playwright

### playwright.config.ts

```typescript
{
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['html', { outputFolder: 'reports/playwright-report' }],
    ['json', { outputFile: 'reports/test-results.json' }],
    ['list']
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium' },
    { name: 'firefox' },
    { name: 'webkit' },
  ],
}
```

---

## 🔍 Exemplos de Testes

### Teste de Navegação

```typescript
test('deve navegar para todas as páginas principais', async ({ page }) => {
  await page.goto('/');
  
  await page.click('text=Clientes');
  await expect(page).toHaveURL('/customers');
  await expect(page.locator('h1')).toContainText('Clientes');
});
```

### Teste de CRUD

```typescript
test('deve criar um novo cliente', async ({ page }) => {
  await page.goto('/customers');
  await page.click('button:has-text("Novo Cliente")');
  
  await page.fill('input[value=""]', 'Cliente Teste');
  await page.fill('input[type="email"]', 'teste@example.com');
  
  await page.click('button[type="submit"]');
  
  await expect(page.locator('text=Cliente Teste')).toBeVisible();
});
```

### Teste de Busca Semântica

```typescript
test('deve realizar busca semântica', async ({ page }) => {
  await page.goto('/rag');
  
  await page.fill('input[placeholder*="busca semântica"]', 'teste');
  await page.click('button:has-text("Buscar")');
  
  await page.waitForTimeout(2000);
  
  const hasResults = await page.locator('text=Resultados').isVisible();
  expect(hasResults).toBeTruthy();
});
```

---

## 🐛 Debug de Testes

### 1. Modo Debug

```bash
npx playwright test --debug
```

### 2. Ver Trace

```bash
npx playwright show-trace test-results/trace.zip
```

### 3. Codegen (gravar testes)

```bash
npx playwright codegen http://localhost:5173
```

---

## 📝 Boas Práticas

### 1. Seletores
- ✅ Use `text=` para textos visíveis
- ✅ Use `role=` para elementos semânticos
- ✅ Evite seletores CSS complexos
- ✅ Use `data-testid` quando necessário

### 2. Esperas
- ✅ Use `waitForTimeout` com moderação
- ✅ Prefira `waitForSelector` ou `waitForLoadState`
- ✅ Use `expect` com auto-retry

### 3. Isolamento
- ✅ Cada teste deve ser independente
- ✅ Use `beforeEach` para setup
- ✅ Limpe dados de teste após execução

---

## 🚀 CI/CD

### GitHub Actions (exemplo)

```yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: reports/playwright-report/
```

---

## 📊 Métricas de Testes

### Cobertura Atual
- **6 suítes de teste**
- **~30 casos de teste**
- **Cobertura**: Navegação, CRUD, Busca, Filtros, Métricas
- **Browsers**: Chrome, Firefox, Safari

### Tempo de Execução
- **Headless**: ~30-60 segundos
- **Headed**: ~60-90 segundos
- **UI Mode**: Interativo

---

## 🎯 Próximos Testes

### Prioridade Alta
- [ ] Testes de autenticação
- [ ] Testes de permissões
- [ ] Testes de erro (404, 500)
- [ ] Testes de validação de formulários

### Prioridade Média
- [ ] Testes de paginação
- [ ] Testes de export de dados
- [ ] Testes de responsividade
- [ ] Testes de acessibilidade

### Prioridade Baixa
- [ ] Testes de performance
- [ ] Testes de carga
- [ ] Testes de integração com API
- [ ] Testes de realtime

---

## 📚 Recursos

- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Guide](https://playwright.dev/docs/ci)

---

**Testes implementados com ❤️ usando Playwright**
