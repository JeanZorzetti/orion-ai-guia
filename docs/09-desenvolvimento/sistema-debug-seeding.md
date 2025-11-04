# Sistema de Debug e Seeding de Dados

> Documentação do sistema de população e limpeza de dados de teste para o Orion ERP.

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Cenário Implementado](#2-cenário-implementado)
3. [Endpoints da API](#3-endpoints-da-api)
4. [Interface do Usuário](#4-interface-do-usuário)
5. [Dados Gerados](#5-dados-gerados)
6. [Como Usar](#6-como-usar)
7. [Implementação Técnica](#7-implementação-técnica)
8. [Segurança](#8-segurança)

---

## 1. Visão Geral

### Propósito

O sistema de debug e seeding permite popular rapidamente o Orion ERP com dados realistas para:

- **Demonstrações**: Mostrar funcionalidades com dados convincentes
- **Testes**: Testar features com volume significativo de dados
- **Desenvolvimento**: Validar analytics, gráficos e relatórios
- **Training**: Treinar usuários em ambiente controlado

### Funcionalidades

✅ **Popular dados** - Cria cenário completo de indústria de moda praia
✅ **Limpar dados** - Remove todos os dados de teste
✅ **Verificar status** - Mostra quantidade de dados de debug existentes
✅ **Sazonalidade** - Vendas seguem padrões realistas
✅ **Rollback completo** - Limpeza sem deixar resíduos

---

## 2. Cenário Implementado

### Indústria de Moda Praia 🏖️

**Perfil da Empresa:**
- **Segmento**: Indústria e varejo de moda praia
- **Faturamento**: R$ 7.000.000/ano (~R$ 583k/mês)
- **Lojas**: 3 pontos de venda
  - Loja Física - Shopping Barra (30% das vendas)
  - Loja Física - Centro (25% das vendas)
  - Loja Física - Praia (20% das vendas)
  - E-commerce próprio (15% das vendas)
  - Marketplaces (10% das vendas)

**Características:**
- Forte sazonalidade (verão vs inverno)
- Ticket médio: R$ 262
- Mix de produtos femininos (75%), masculinos (15%), infantis (5%), acessórios (5%)
- Faixa de preço: R$ 59 a R$ 299

---

## 3. Endpoints da API

### POST `/api/v1/debug/seed-beach-fashion`

Popular o sistema com dados de moda praia.

**Query Parameters:**
- `months` (opcional): Número de meses de histórico (padrão: 12, max: 24)

**Exemplo:**
```bash
curl -X POST "http://localhost:8000/api/v1/debug/seed-beach-fashion?months=12" \
  -H "Authorization: Bearer {token}"
```

**Resposta:**
```json
{
  "success": true,
  "message": "Dados de moda praia criados com sucesso! 🏖️",
  "stats": {
    "products_created": 27,
    "customers_created": 36,
    "sales_created": 2689,
    "total_revenue": 705478.50,
    "months_generated": 12,
    "average_ticket": 262.35,
    "date_range": {
      "start": "2024-01-15T10:00:00",
      "end": "2025-01-15T10:00:00"
    }
  }
}
```

**O que é criado:**
1. 27 produtos de moda praia (biquínis, maiôs, sungas, acessórios)
2. 36 clientes (mix feminino/masculino)
3. ~2.700 vendas distribuídas ao longo do período
4. Transações de estoque automáticas

---

### DELETE `/api/v1/debug/clear-debug-data`

Remove TODOS os dados de debug do workspace.

**Query Parameters:**
- `confirm` (obrigatório): `true` para confirmar a exclusão

**Exemplo:**
```bash
curl -X DELETE "http://localhost:8000/api/v1/debug/clear-debug-data?confirm=true" \
  -H "Authorization: Bearer {token}"
```

**Resposta:**
```json
{
  "success": true,
  "message": "Todos os dados de debug foram removidos com sucesso! 🗑️",
  "stats": {
    "products_deleted": 27,
    "customers_deleted": 36,
    "sales_deleted": 2689,
    "transactions_deleted": 0
  }
}
```

**⚠️ ATENÇÃO:** Esta operação é **IRREVERSÍVEL**. Todos os dados de debug são permanentemente deletados.

---

### GET `/api/v1/debug/seed-status`

Verifica quantidade de dados de debug no workspace.

**Exemplo:**
```bash
curl -X GET "http://localhost:8000/api/v1/debug/seed-status" \
  -H "Authorization: Bearer {token}"
```

**Resposta:**
```json
{
  "workspace_id": 5,
  "has_debug_data": true,
  "products_count": 27,
  "customers_count": 36,
  "sales_count": 2689,
  "total_revenue": 705478.50,
  "average_ticket": 262.35
}
```

---

## 4. Interface do Usuário

### Painel de Debug

Localização: `/admin/debug`

**Componente:** [DebugDataPanel.tsx](../../admin/src/components/debug/DebugDataPanel.tsx)

**Recursos:**
- ✅ Botão "Popular Dados" com loading state
- ✅ Botão "Limpar Dados" com confirmação de segurança
- ✅ Status em tempo real dos dados
- ✅ Feedback visual com cores e ícones
- ✅ Detalhes expansíveis sobre o que será criado

**Screenshot (conceito):**
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Painel de Debug - Dados de Teste                        │
│                                                             │
│ Popule o sistema com dados realistas de uma indústria      │
│ de moda praia (R$ 7M/ano, 3 lojas).                        │
├─────────────────────────────────────────────────────────────┤
│ Status Atual                                    [Atualizar] │
│                                                             │
│ Produtos    Clientes    Vendas    Faturamento  Ticket Médio│
│   27          36        2689      R$ 705k       R$ 262     │
├─────────────────────────────────────────────────────────────┤
│ [🏖️ Popular Dados]  [🗑️ Limpar Dados de Debug]            │
├─────────────────────────────────────────────────────────────┤
│ ✅ Dados criados com sucesso!                               │
│ • 27 produtos  • 36 clientes  • 2689 vendas                │
│ • R$ 705k faturamento  • R$ 262 ticket médio               │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Dados Gerados

### Produtos (27 itens)

#### Biquínis Femininos (10 modelos) - 60% do catálogo
| SKU | Nome | Preço | NCM |
|-----|------|-------|-----|
| BIQ-HP-001 | Biquíni Hot Pant Cintura Alta Preto | R$ 219,90 | 61123100 |
| BIQ-AD-002 | Biquíni Asa Delta Floral Tropical | R$ 199,90 | 61123100 |
| BIQ-CT-003 | Biquíni Cortininha Liso Coral | R$ 209,90 | 61123100 |
| BIQ-FD-004 | Biquíni Fio Dental Tie Dye | R$ 189,90 | 61123100 |
| BIQ-PS-005 | Biquíni Plus Size Frente Única | R$ 239,90 | 61123100 |
| BIQ-TC-006 | Biquíni Top Cropped Com Proteção UV | R$ 249,90 | 61123100 |
| BIQ-OS-007 | Biquíni Ombro Só Listrado Vintage | R$ 229,90 | 61123100 |
| BIQ-BR-008 | Biquíni Bojo Removível Azul Marinho | R$ 259,90 | 61123100 |
| BIQ-CR-009 | Biquíni Crochê Boho Chic Off White | R$ 279,90 | 61123100 |
| BIQ-AS-010 | Biquíni Assimétrico Animal Print | R$ 269,90 | 61123100 |

#### Maiôs Femininos (4 modelos) - 15% do catálogo
| SKU | Nome | Preço | NCM |
|-----|------|-------|-----|
| MAI-CV-001 | Maiô Cavado Preto Clássico | R$ 249,90 | 61123100 |
| MAI-DP-002 | Maiô Decote Profundo Metalizado | R$ 289,90 | 61123100 |
| MAI-ML-003 | Maiô Manga Longa UV50+ Estampado | R$ 299,90 | 61123100 |
| MAI-FU-004 | Maiô Frente Única Franzido | R$ 259,90 | 61123100 |

#### Moda Praia Masculina (5 modelos) - 15% do catálogo
| SKU | Nome | Preço | NCM |
|-----|------|-------|-----|
| SUN-SL-001 | Sunga Slip Dry Fit Preta | R$ 89,90 | 61123100 |
| SUN-BX-002 | Sunga Boxer Listrada Retrô | R$ 99,90 | 61123100 |
| SHO-SF-001 | Short Praia Surf Estampa Tropical | R$ 129,90 | 61034200 |
| SHO-LG-002 | Bermudão Surf Long Degradê | R$ 149,90 | 61034200 |
| SHO-TC-003 | Short Tactel Secagem Rápida Azul | R$ 119,90 | 61034200 |

#### Moda Praia Infantil (3 modelos) - 5% do catálogo
| SKU | Nome | Preço | NCM |
|-----|------|-------|-----|
| INF-BI-001 | Biquíni Infantil Babado Rosa | R$ 79,90 | 61123100 |
| INF-MA-001 | Maiô Infantil Sereia UV50+ | R$ 99,90 | 61123100 |
| INF-SU-001 | Sunga Infantil Super Heróis | R$ 59,90 | 61123100 |

#### Acessórios Praia (5 modelos) - 5% do catálogo
| SKU | Nome | Preço | NCM |
|-----|------|-------|-----|
| SAI-KI-001 | Saída de Praia Kimono Floral | R$ 159,90 | 61091000 |
| ACE-CH-001 | Chapéu de Praia Aba Larga Palha | R$ 89,90 | 65040000 |
| ACE-CA-001 | Canga Estampada 100% Viscose | R$ 69,90 | 62149000 |

**Características dos Produtos:**
- Todos possuem dados fiscais completos (NCM, CFOP)
- Estoque inicial: 50-200 unidades
- Margem: 40-60% sobre custo
- Tags: `moda-praia`, `verao-2025`, categoria

---

### Clientes (36 perfis)

**Distribuição:**
- 20 clientes femininos (56%)
- 16 clientes masculinos (44%)

**Exemplos:**
- Ana Paula Silva
- Carlos Eduardo Silva
- Maria Fernanda Costa
- Felipe Santos
- Juliana Santos
- Lucas Oliveira

**Dados incluídos:**
- Nome completo
- Email (gerado automaticamente)
- Telefone (formato brasileiro)
- CPF (11 dígitos simulados)
- Tag: `[DEBUG-SEED]`

---

### Vendas (~2.700 ao ano)

**Distribuição Mensal com Sazonalidade:**

| Mês | Multiplicador | Vendas Aprox. | Faturamento |
|-----|---------------|---------------|-------------|
| Janeiro | 1.3x | 290 | R$ 76k |
| Fevereiro | 1.2x | 268 | R$ 70k |
| Março | 0.9x | 201 | R$ 52k |
| Abril | 0.7x | 156 | R$ 41k |
| Maio | 0.6x | 134 | R$ 35k |
| Junho | 0.5x | 111 | R$ 29k |
| Julho | 0.5x | 111 | R$ 29k |
| Agosto | 0.6x | 134 | R$ 35k |
| Setembro | 0.8x | 178 | R$ 47k |
| Outubro | 1.0x | 223 | R$ 58k |
| Novembro | 1.4x | 312 | R$ 82k |
| Dezembro | 1.5x | 335 | R$ 88k |
| **TOTAL** | - | **2.689** | **R$ 705k** |

**Características das Vendas:**
- Quantidade por venda: 1-3 peças (70% apenas 1 peça)
- Variação de preço: 70-105% do preço base
  - Alta temporada (verão): 95-105% (desconto mínimo)
  - Baixa temporada (inverno): 70-90% (liquidação)
- Canais de venda:
  - Loja Física Shopping (30%)
  - Loja Física Centro (25%)
  - Loja Física Praia (20%)
  - E-commerce (15%)
  - Marketplaces (10%)
- Métodos de pagamento: Cartão crédito/débito, PIX, Boleto
- Status: Todas completed

---

## 6. Como Usar

### Passo 1: Acessar Painel

Navegue para `/admin/debug` no frontend.

### Passo 2: Verificar Status

Clique em **"Atualizar"** para ver se já existem dados de debug.

### Passo 3: Popular Dados

1. Clique em **"🏖️ Popular Dados (Moda Praia)"**
2. Aguarde o processamento (pode levar 30-60 segundos)
3. Veja o resumo dos dados criados

**Tempo estimado:**
- Produtos: ~1 segundo
- Clientes: ~1 segundo
- Vendas: ~30-60 segundos (depende do volume)

### Passo 4: Explorar Dados

Navegue pelo sistema para ver os dados populados:
- **Produtos**: `/admin/produtos`
- **Vendas**: `/admin/vendas`
- **Dashboard**: `/admin/dashboard` (verá gráficos populados)
- **Relatórios**: Analytics agora têm dados suficientes

### Passo 5: Limpar Dados (quando terminar)

1. Clique em **"🗑️ Limpar Dados de Debug"**
2. Confirme a ação no modal
3. Clique em **"Sim, limpar tudo"**
4. Aguarde a exclusão

**⚠️ IMPORTANTE:** Limpe os dados de debug antes de ir para produção!

---

## 7. Implementação Técnica

### Backend

**Arquivo:** [debug_data.py](../../backend/app/api/api_v1/endpoints/debug_data.py)

**Principais funções:**

```python
def seed_beach_fashion_data(months: int, db: Session, current_user: User):
    """
    Cria produtos, clientes e vendas de moda praia.

    Lógica:
    1. Cria 27 produtos com dados completos
    2. Cria 36 clientes diversos
    3. Gera ~2.700 vendas com:
       - Sazonalidade realista (pico verão, baixa inverno)
       - Distribuição por canal
       - Variação de preço por temporada
       - Mix de produtos proporcional
    """
```

**Algoritmo de Sazonalidade:**
```python
seasonal_multipliers = {
    1: 1.3,   # Janeiro - Verão (pico)
    6: 0.5,   # Junho - Inverno (baixa)
    12: 1.5   # Dezembro - Verão (pico máximo)
}

month_target = monthly_target * seasonal_mult
num_sales_month = int(month_target / 262)  # Ticket médio
```

**Identificação de Dados Debug:**
- Produtos: SKU pattern (`BIQ-`, `MAI-`, etc.) + tag `moda-praia`
- Clientes: Tag `[DEBUG-SEED]`
- Vendas: Notes contém `[DEBUG-SEED]`

---

### Frontend

**Arquivo:** [DebugDataPanel.tsx](../../admin/src/components/debug/DebugDataPanel.tsx)

**Componente React** com:
- State management (useState)
- Fetch API calls para backend
- Loading states
- Error handling
- Confirmação de exclusão (modal inline)
- Feedback visual (cores, ícones)

**Chamadas à API:**
```typescript
// Popular
const response = await fetch('/api/v1/debug/seed-beach-fashion?months=12', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
})

// Limpar
const response = await fetch('/api/v1/debug/clear-debug-data?confirm=true', {
  method: 'DELETE',
  headers: { 'Authorization': `Bearer ${token}` }
})

// Status
const response = await fetch('/api/v1/debug/seed-status', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

---

## 8. Segurança

### Proteções Implementadas

✅ **Autenticação obrigatória** - Todos os endpoints requerem JWT
✅ **Multi-tenancy** - Dados criados apenas no workspace do usuário
✅ **Confirmação explícita** - Exclusão requer `confirm=true`
✅ **Tags identificadoras** - Facilita limpeza seletiva
✅ **Transações atômicas** - Rollback automático em caso de erro

### Avisos de Segurança

⚠️ **NÃO use em produção** sem proteções adicionais:

1. **Desabilitar em produção:**
```typescript
// Adicione verificação de ambiente
if (process.env.NODE_ENV === 'production') {
  return <div>Debug panel disabled in production</div>
}
```

2. **Restringir por role:**
```python
@router.post("/seed-beach-fashion")
def seed_beach_fashion_data(
    current_user: User = Depends(get_current_super_admin)  # Apenas super admin
):
```

3. **Rate limiting:**
```python
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

@limiter.limit("2/hour")  # Máximo 2 vezes por hora
@router.post("/seed-beach-fashion")
```

4. **Audit log:**
```python
# Log todas as ações de debug
logger.info(f"DEBUG SEED: User {current_user.id} created {stats['sales_created']} sales")
```

---

## Perguntas Frequentes

### Por que moda praia?

Escolhemos moda praia porque:
- Forte sazonalidade (testa analytics sazonais)
- Mix de produtos variado (feminino, masculino, infantil)
- Faixa de preço adequada (R$ 200-300)
- Relevante para mercado brasileiro
- Dados realistas baseados em pesquisa de mercado

### Posso personalizar os dados?

Sim! Edite o arquivo `debug_data.py`:

```python
BEACH_FASHION_PRODUCTS = [
    # Adicione seus produtos aqui
    {
        "category": "Sua Categoria",
        "items": [
            {"name": "Produto X", "sku": "SKU-X", "base_price": 199.90, ...}
        ]
    }
]
```

### Os dados afetam métricas reais?

Os dados de debug são:
- Identificados por tags/patterns específicos
- Facilmente filtráveis em queries
- Completamente removíveis via limpeza

Recomendamos limpar antes de usar dados reais.

### Posso criar múltiplos cenários?

Sim! Crie novos endpoints:
```python
@router.post("/seed-electronics-store")
def seed_electronics_data(...):
    # Seu cenário de eletrônicos
```

### Como adicionar transações de caixa?

Atualmente apenas vendas são criadas. Para adicionar transações:

```python
# Dentro do loop de vendas
cash_transaction = CashFlowTransaction(
    workspace_id=workspace_id,
    bank_account_id=1,  # Conta padrão
    type="income",
    amount=total_value,
    category="sales",
    description=f"[DEBUG-SEED] Venda {sale.id}",
    transaction_date=sale_date
)
db.add(cash_transaction)
```

---

## Roadmap Futuro

Melhorias planejadas:

- [ ] Múltiplos cenários (eletrônicos, alimentos, etc.)
- [ ] Configuração de parâmetros (faturamento, lojas, etc.)
- [ ] Geração de contas a pagar/receber
- [ ] Transações de caixa automáticas
- [ ] Integração com marketplaces fake
- [ ] Geração de NF-es de teste
- [ ] Seed de usuários adicionais
- [ ] Export/import de cenários
- [ ] Seed incremental (adicionar mais dados)
- [ ] Logs detalhados de seeding

---

**Versão:** 1.0
**Última atualização:** 2025-01-15
**Autor:** Documentação Orion ERP
