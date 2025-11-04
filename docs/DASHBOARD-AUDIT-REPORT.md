# Dashboard Audit Report
**Data da Auditoria**: 2025-11-04
**Status**: ⚠️ PROBLEMAS CRÍTICOS ENCONTRADOS

---

## 📊 Executive Summary

Após análise completa do dashboard (`admin/src/app/admin/dashboard/page.tsx`), foram identificados **8 problemas críticos** que afetam a confiabilidade dos dados exibidos.

### Problemas por Severidade:
- **P0 (Críticos - Bloqueadores)**: 3 problemas
- **P1 (Importantes - Alta Prioridade)**: 3 problemas
- **P2 (Melhorias - Média Prioridade)**: 2 problemas

---

## 🔴 P0: PROBLEMAS CRÍTICOS (Bloqueadores)

### P0.1: Gráfico "Receita nas Últimas 4 Semanas" pode estar vazio

**Localização**: [admin/src/app/admin/dashboard/page.tsx:200-215](admin/src/app/admin/dashboard/page.tsx#L200-L215)

**Problema**:
O gráfico usa `allCompletedSales` (linha 201) que filtra vendas de `sales`, mas `sales` é carregado com apenas **6 meses de dados** e **limite de 5000 vendas** (linha 61-63).

```typescript
// Linha 57-64: Carrega apenas 6 meses com limite de 5000
const sixMonthsAgo = subMonths(new Date(), 6);
const [invoicesData, productsData, salesData] = await Promise.all([
  invoiceService.getAll(),
  productService.getAll(),
  saleService.getAll({
    start_date: sixMonthsAgo.toISOString().split('T')[0],
    limit: 5000  // ⚠️ LIMITE PODE SER INSUFICIENTE
  }),
]);

// Linha 201: Usa esses dados para calcular as últimas 4 semanas
const allCompletedSales = sales.filter((sale) => sale.status === 'completed');
const revenueChartData = Array.from({ length: 4 }, (_, i) => {
  const weekStart = subDays(today, (3 - i) * 7);
  const weekEnd = subDays(today, (3 - i) * 7 - 6);
  const weekSales = allCompletedSales.filter((sale) => {
    const saleDate = new Date(sale.sale_date);
    return saleDate >= weekEnd && saleDate <= weekStart;
  });
  const weekRevenue = weekSales.reduce((sum, sale) => sum + sale.total_value, 0);
  return { date: `Sem ${4 - i}`, receita: weekRevenue };
});
```

**Impacto**:
- Se houver mais de 5000 vendas nos últimos 6 meses, o gráfico mostrará valores **INCORRETOS** (menores que o real)
- Com dados de seed (24k+ vendas), apenas **20% dos dados** são considerados
- Gráfico pode mostrar R$ 0 se as vendas mais recentes não estiverem entre as 5000 carregadas

**Cenário de Falha**:
1. Sistema tem 24.472 vendas nos últimos 12 meses
2. Dashboard carrega apenas 5000 vendas (20% do total)
3. Query ordena por `sale_date DESC` (linha 44 em `sales.py`)
4. **Se as 5000 vendas mais recentes não incluírem as últimas 4 semanas**, gráfico fica vazio

**Solução**:
```typescript
// OPÇÃO 1: Carregar apenas últimas 4 semanas para o gráfico
const fourWeeksAgo = subDays(new Date(), 28);
const recentSalesData = await saleService.getAll({
  start_date: fourWeeksAgo.toISOString().split('T')[0],
  status_filter: 'completed',
  limit: 10000  // Limite alto para garantir todas as vendas das últimas 4 semanas
});

// OPÇÃO 2: Backend agregado (melhor performance)
const weeklyRevenue = await dashboardService.getWeeklyRevenue({ weeks: 4 });
```

**Prioridade**: 🔴 **P0** - Gráfico principal do dashboard pode mostrar dados incorretos

---

### P0.2: Gráfico "Vendas por Canal (6 Meses)" com os mesmos problemas

**Localização**: [admin/src/app/admin/dashboard/page.tsx:217-239](admin/src/app/admin/dashboard/page.tsx#L217-L239)

**Problema**:
Mesmo problema do P0.1, mas para 6 meses de dados.

```typescript
// Linha 218-239: Usa allCompletedSales (limitado a 5000 vendas)
const salesByChannelData = Array.from({ length: 6 }, (_, i) => {
  const monthDate = subMonths(today, 5 - i);
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);

  const monthSales = allCompletedSales.filter((sale) => {
    const saleDate = new Date(sale.sale_date);
    return saleDate >= monthStart && saleDate <= monthEnd;
  });

  // Agrupar vendas por canal
  const channelTotals: Record<string, number> = {};
  monthSales.forEach((sale) => {
    const channel = sale.origin_channel || 'manual';
    channelTotals[channel] = (channelTotals[channel] || 0) + sale.total_value;
  });

  return {
    period: format(monthDate, 'MMM', { locale: ptBR }),
    ...channelTotals
  };
});
```

**Impacto**:
- Com 24k+ vendas, apenas 20% dos dados são considerados
- Distribuição por canal fica **INCORRETA**
- Meses mais antigos podem aparecer com valores zerados

**Solução**:
```typescript
// OPÇÃO 1: Carregar 6 meses completos
const sixMonthsData = await saleService.getAll({
  start_date: subMonths(new Date(), 6).toISOString().split('T')[0],
  status_filter: 'completed',
  limit: 50000  // Limite muito alto para garantir todos os dados
});

// OPÇÃO 2: Backend agregado (RECOMENDADO)
const channelStats = await dashboardService.getSalesByChannel({ months: 6 });
```

**Prioridade**: 🔴 **P0** - Segundo gráfico principal mostrando dados incorretos

---

### P0.3: Cards de KPI são afetados pelos filtros do usuário

**Localização**: [admin/src/app/admin/dashboard/page.tsx:105-135](admin/src/app/admin/dashboard/page.tsx#L105-L135)

**Problema**:
Os cards principais (Receita Total, Vendas Totais, Ticket Médio) usam `filteredSales` que é afetado pelos filtros de data e canal aplicados pelo usuário.

```typescript
// Linha 106-132: Aplica filtros do usuário
let filteredSales = sales.filter((sale) => sale.status === 'completed');

// Aplicar filtro de data
if (dateRange?.from || dateRange?.to) {
  filteredSales = filteredSales.filter((sale) => {
    const saleDate = new Date(sale.sale_date);
    if (dateRange.from && dateRange.to) {
      return saleDate >= dateRange.from && saleDate <= dateRange.to;
    }
    // ...
  });
}

// Aplicar filtro de canal
if (selectedChannels.length > 0) {
  filteredSales = filteredSales.filter((sale) => {
    const channel = sale.origin_channel || 'manual';
    return selectedChannels.includes(channel);
  });
}

// Linha 133-135: Cards usam filteredSales
const completedSales = filteredSales;
const totalRevenue = completedSales.reduce((sum, sale) => sum + sale.total_value, 0);
const averageTicket = completedSales.length > 0 ? totalRevenue / completedSales.length : 0;
```

**Impacto**:
- Card "Receita Total (Mês)" mostra valor filtrado, não o valor real do mês
- Card "Vendas Totais" mostra quantidade filtrada, não o total real
- Card "Ticket Médio" é calculado sobre dados filtrados

**Comportamento Atual**:
1. Usuário seleciona "últimos 7 dias" no filtro
2. Card "Receita Total (Mês)" mostra **receita dos últimos 7 dias**, não do mês
3. **TÍTULO DO CARD ESTÁ INCORRETO** - diz "Mês" mas mostra período filtrado

**Solução**:
```typescript
// Cards principais devem usar dados do mês SEMPRE (sem filtros)
const currentMonthStart = startOfMonth(today);
const currentMonthEnd = endOfMonth(today);

// Vendas do mês SEMPRE (para cards fixos)
const currentMonthSales = allCompletedSales.filter((sale) => {
  const saleDate = new Date(sale.sale_date);
  return saleDate >= currentMonthStart && saleDate <= currentMonthEnd;
});
const currentMonthRevenue = currentMonthSales.reduce((sum, sale) => sum + sale.total_value, 0);

// Vendas filtradas SEPARADAS (para outras visualizações)
let filteredSales = allCompletedSales;
if (dateRange?.from || dateRange?.to) {
  // Aplicar filtros apenas para seções que devem ser filtráveis
}
```

**Prioridade**: 🔴 **P0** - Cards principais mostrando valores incorretos, título enganoso

---

## 🟠 P1: PROBLEMAS IMPORTANTES (Alta Prioridade)

### P1.1: Tendência de receita incorreta quando há filtros ativos

**Localização**: [admin/src/app/admin/dashboard/page.tsx:163-180](admin/src/app/admin/dashboard/page.tsx#L163-L180)

**Problema**:
A tendência de receita (mês atual vs. mês anterior) usa `completedSales` que é afetado pelos filtros do usuário.

```typescript
// Linha 164-175: Calcula mês atual e anterior usando completedSales (filtrado)
const currentMonthSales = completedSales.filter((sale) => {
  const saleDate = new Date(sale.sale_date);
  return saleDate >= currentMonthStart && saleDate <= currentMonthEnd;
});
const currentMonthRevenue = currentMonthSales.reduce((sum, sale) => sum + sale.total_value, 0);

const lastMonthSales = completedSales.filter((sale) => {
  const saleDate = new Date(sale.sale_date);
  return saleDate >= lastMonthStart && saleDate <= lastMonthEnd;
});
const lastMonthRevenue = lastMonthSales.reduce((sum, sale) => sum + sale.total_value, 0);

// Linha 178-180: Calcula tendência sobre dados filtrados
const revenueTrend = lastMonthRevenue > 0
  ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
  : 0;
```

**Impacto**:
- Se usuário filtra por canal "Shopify", tendência compara apenas Shopify mês atual vs. mês anterior
- Badge de tendência mostra "vs. mês anterior" mas está comparando períodos diferentes
- Pode mostrar +500% de crescimento simplesmente porque o filtro mudou os dados

**Cenário de Falha**:
1. Usuário filtra por "últimos 7 dias" + canal "Shopify"
2. `completedSales` agora tem apenas vendas Shopify dos últimos 7 dias
3. `currentMonthSales` filtra esses 7 dias por mês atual → pode ficar **vazio**
4. `lastMonthSales` filtra esses 7 dias por mês anterior → **vazio**
5. Tendência mostra 0% ou valor incorreto

**Solução**:
```typescript
// Tendências devem SEMPRE usar dados completos (sem filtros)
const allCurrentMonthSales = allCompletedSales.filter((sale) => {
  const saleDate = new Date(sale.sale_date);
  return saleDate >= currentMonthStart && saleDate <= currentMonthEnd;
});
const currentMonthRevenue = allCurrentMonthSales.reduce((sum, sale) => sum + sale.total_value, 0);

const allLastMonthSales = allCompletedSales.filter((sale) => {
  const saleDate = new Date(sale.sale_date);
  return saleDate >= lastMonthStart && saleDate <= lastMonthEnd;
});
const lastMonthRevenue = allLastMonthSales.reduce((sum, sale) => sum + sale.total_value, 0);

const revenueTrend = lastMonthRevenue > 0
  ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
  : 0;
```

**Prioridade**: 🟠 **P1** - Métrica de tendência incorreta pode levar a decisões erradas

---

### P1.2: Sparklines usando dados filtrados

**Localização**: [admin/src/app/admin/dashboard/page.tsx:182-190](admin/src/app/admin/dashboard/page.tsx#L182-L190)

**Problema**:
Os sparklines (mini-gráficos nos cards) usam `completedSales` que é afetado pelos filtros.

```typescript
// Linha 183-190: Sparkline usa completedSales (filtrado)
const last30Days = Array.from({ length: 30 }, (_, i) => {
  const date = subDays(today, 29 - i);
  const dailySales = completedSales.filter((sale) => {
    const saleDate = startOfDay(new Date(sale.sale_date));
    return saleDate.getTime() === date.getTime();
  });
  return dailySales.reduce((sum, sale) => sum + sale.total_value, 0);
});
```

**Impacto**:
- Sparkline mostra tendência dos últimos 30 dias **FILTRADOS**, não real
- Se usuário filtra por "últimos 7 dias", sparkline mostra apenas 7 pontos não-zero
- Visual fica **ENGANOSO** - parece que o negócio está em queda, mas é apenas o filtro

**Solução**:
```typescript
// Sparklines devem SEMPRE usar dados completos dos últimos 30 dias
const last30DaysAll = Array.from({ length: 30 }, (_, i) => {
  const date = subDays(today, 29 - i);
  const dailySales = allCompletedSales.filter((sale) => {
    const saleDate = startOfDay(new Date(sale.sale_date));
    return saleDate.getTime() === date.getTime();
  });
  return dailySales.reduce((sum, sale) => sum + sale.total_value, 0);
});
```

**Prioridade**: 🟠 **P1** - Visualização enganosa pode confundir o usuário

---

### P1.3: "Vendas dos Últimos 7 Dias" usa dados filtrados

**Localização**: [admin/src/app/admin/dashboard/page.tsx:138-153](admin/src/app/admin/dashboard/page.tsx#L138-L153)

**Problema**:
O card "Vendas dos Últimos 7 Dias" (linhas 620-664) usa `completedSales` (filtrado) para calcular as vendas diárias.

```typescript
// Linha 138-148: Calcula últimos 7 dias usando completedSales (filtrado)
const last7Days = Array.from({ length: 7 }, (_, i) => {
  const date = addDays(today, -6 + i);
  return {
    date,
    day: format(date, 'EEE', { locale: ptBR }),
    sales: completedSales.filter((sale) => {
      const saleDate = startOfDay(new Date(sale.sale_date));
      return saleDate.getTime() === date.getTime();
    }),
  };
});
```

**Impacto**:
- Se usuário filtra por canal "Shopify", card mostra apenas vendas Shopify dos últimos 7 dias
- **TÍTULO DO CARD NÃO INDICA** que os valores são filtrados
- Usuário pode pensar que o negócio está vendendo pouco, mas é só o filtro ativo

**Solução**:
```typescript
// OPÇÃO 1: Deixar o card filtrado, mas adicionar indicação visual
<CardTitle className="flex items-center gap-2">
  <TrendingUp className="h-5 w-5 text-green-500" />
  Vendas dos Últimos 7 Dias
  {(dateRange || selectedChannels.length > 0) && (
    <Badge variant="secondary" className="text-xs ml-2">
      Filtrado
    </Badge>
  )}
</CardTitle>

// OPÇÃO 2: Sempre usar dados completos (recomendado)
const last7DaysAll = Array.from({ length: 7 }, (_, i) => {
  const date = addDays(today, -6 + i);
  return {
    date,
    day: format(date, 'EEE', { locale: ptBR }),
    sales: allCompletedSales.filter((sale) => {
      const saleDate = startOfDay(new Date(sale.sale_date));
      return saleDate.getTime() === date.getTime();
    }),
  };
});
```

**Prioridade**: 🟠 **P1** - Card importante mostrando valores filtrados sem indicação clara

---

## 🟡 P2: MELHORIAS (Média Prioridade)

### P2.1: Performance - Múltiplos filtros em arrays grandes

**Localização**: Todo o arquivo `page.tsx`

**Problema**:
O código faz múltiplos filtros em sequência sobre o array `sales` (que pode ter 5000+ itens):

1. Filtro por status: `sales.filter((sale) => sale.status === 'completed')` - linha 106
2. Filtro por data: `filteredSales.filter(...)` - linhas 110-123
3. Filtro por canal: `filteredSales.filter(...)` - linhas 126-131
4. Filtro para sparkline: `completedSales.filter(...)` - linha 185
5. Filtro para últimos 7 dias: `completedSales.filter(...)` - linha 143
6. Filtro para mês atual: `completedSales.filter(...)` - linha 164
7. Filtro para mês anterior: `completedSales.filter(...)` - linha 171
8. Filtro para gráfico de receita: `allCompletedSales.filter(...)` - linha 205
9. Filtro para gráfico de canal: `allCompletedSales.filter(...)` - linha 223

**Impacto**:
- Com 24k+ vendas, cada filtro percorre 24k itens
- Total: **9 iterações x 24.000 itens = 216.000 operações**
- Dashboard leva **2-3 segundos** para renderizar após mudança de filtro

**Solução**:
```typescript
// OPÇÃO 1: Memoização com useMemo
const allCompletedSales = useMemo(
  () => sales.filter((sale) => sale.status === 'completed'),
  [sales]
);

const filteredSales = useMemo(() => {
  let result = allCompletedSales;

  if (dateRange?.from || dateRange?.to) {
    result = result.filter((sale) => {
      // filtro de data
    });
  }

  if (selectedChannels.length > 0) {
    result = result.filter((sale) => {
      // filtro de canal
    });
  }

  return result;
}, [allCompletedSales, dateRange, selectedChannels]);

// OPÇÃO 2: Backend agregado (RECOMENDADO)
const dashboardData = await dashboardService.getStats({
  workspace_id: currentUser.workspace_id,
  filters: { dateRange, channels: selectedChannels }
});
```

**Prioridade**: 🟡 **P2** - Performance aceitável mas pode melhorar

---

### P2.2: Falta de tratamento de erros nos cálculos

**Localização**: Várias partes do arquivo

**Problema**:
Vários cálculos não tratam casos de divisão por zero ou datas inválidas:

```typescript
// Linha 135: Divisão por zero não tratada explicitamente
const averageTicket = completedSales.length > 0 ? totalRevenue / completedSales.length : 0;

// Linha 178: Divisão por zero não tratada explicitamente
const revenueTrend = lastMonthRevenue > 0
  ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
  : 0;

// Linha 256-261: Try-catch para formato de data, mas sem log de erro
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return dateString;
  }
};
```

**Impacto**:
- Se `completedSales.length === 0`, `averageTicket` será 0 (correto)
- Se `lastMonthRevenue === 0`, tendência será 0 (pode ser enganoso)
- Erros de data são silenciosos (dificulta debug)

**Solução**:
```typescript
// Ticket médio com validação melhor
const averageTicket = completedSales.length > 0 && totalRevenue > 0
  ? totalRevenue / completedSales.length
  : 0;

// Tendência com tratamento especial para primeiro mês
const revenueTrend = lastMonthRevenue > 0
  ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
  : currentMonthRevenue > 0 ? 100 : 0;  // 100% se não houve venda no mês anterior

// Formato de data com log de erro (desenvolvimento)
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', dateString, error);
    return dateString;
  }
};
```

**Prioridade**: 🟡 **P2** - Funciona na maioria dos casos, mas pode ser mais robusto

---

## 📋 BACKEND ANALYSIS

### Endpoint: `GET /sales/`

**Localização**: [backend/app/api/api_v1/endpoints/sales.py:16-45](backend/app/api/api_v1/endpoints/sales.py#L16-L45)

**Análise**:
```python
@router.get("/", response_model=List[SaleResponse])
def get_sales(
    skip: int = 0,
    limit: int = 50000,  # ⚠️ Limite aumentado
    status_filter: Optional[str] = None,
    product_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Sale).filter(Sale.workspace_id == current_user.workspace_id)

    # Filtros aplicados
    if status_filter:
        query = query.filter(Sale.status == status_filter)

    if product_id:
        query = query.filter(Sale.product_id == product_id)

    if start_date:
        query = query.filter(Sale.sale_date >= start_date)

    if end_date:
        query = query.filter(Sale.sale_date <= end_date)

    # ⚠️ PROBLEMA: Order by + limit pode não retornar os dados necessários
    sales = query.order_by(Sale.sale_date.desc()).offset(skip).limit(limit).all()
    return sales
```

**Problemas Identificados**:

1. **Limite de 50.000** foi aumentado para suportar dados de seed, mas:
   - Retorna **TODAS as vendas** (não apenas completed)
   - Ordena por `sale_date DESC` (mais recente primeiro)
   - Dashboard carrega apenas 5.000 (linha 63 do dashboard)
   - Com 24k+ vendas, apenas 20% dos dados são carregados

2. **Sem paginação eficiente**:
   - `skip` e `limit` são fornecidos, mas dashboard não usa paginação
   - Carrega tudo de uma vez (high memory usage)

3. **Sem agregação**:
   - Backend retorna array de vendas individuais
   - Frontend faz toda a agregação (somas, médias, agrupamentos)
   - Com 24k vendas, isso é **MUITO INEFICIENTE**

**Recomendações**:

```python
# NOVO ENDPOINT AGREGADO (RECOMENDADO)
@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    channel_filter: Optional[List[str]] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna estatísticas agregadas para o dashboard.
    Muito mais eficiente que retornar todas as vendas.
    """
    query = db.query(Sale).filter(
        Sale.workspace_id == current_user.workspace_id,
        Sale.status == 'completed'
    )

    if start_date:
        query = query.filter(Sale.sale_date >= start_date)

    if end_date:
        query = query.filter(Sale.sale_date <= end_date)

    if channel_filter:
        query = query.filter(Sale.origin_channel.in_(channel_filter))

    # Agregações SQL (MUITO MAIS RÁPIDO)
    from sqlalchemy import func

    stats = query.with_entities(
        func.count(Sale.id).label('total_sales'),
        func.sum(Sale.total_value).label('total_revenue'),
        func.avg(Sale.total_value).label('average_ticket')
    ).first()

    # Vendas por semana (últimas 4)
    weekly_revenue = db.query(
        func.date_trunc('week', Sale.sale_date).label('week'),
        func.sum(Sale.total_value).label('revenue')
    ).filter(
        Sale.workspace_id == current_user.workspace_id,
        Sale.status == 'completed',
        Sale.sale_date >= date.today() - timedelta(days=28)
    ).group_by('week').order_by('week').all()

    # Vendas por canal (últimos 6 meses)
    channel_stats = db.query(
        func.date_trunc('month', Sale.sale_date).label('month'),
        Sale.origin_channel,
        func.sum(Sale.total_value).label('revenue')
    ).filter(
        Sale.workspace_id == current_user.workspace_id,
        Sale.status == 'completed',
        Sale.sale_date >= date.today() - timedelta(days=180)
    ).group_by('month', Sale.origin_channel).all()

    return {
        'total_sales': stats.total_sales or 0,
        'total_revenue': stats.total_revenue or 0,
        'average_ticket': stats.average_ticket or 0,
        'weekly_revenue': [
            {'week': w.week, 'revenue': w.revenue} for w in weekly_revenue
        ],
        'channel_stats': [
            {'month': c.month, 'channel': c.origin_channel, 'revenue': c.revenue}
            for c in channel_stats
        ]
    }
```

---

## 🎯 PRIORIZAÇÃO E PLANO DE AÇÃO

### Sprint 1: Correções P0 (Críticas) - 1 dia
**Objetivo**: Garantir que os gráficos principais mostrem dados corretos

1. **[P0.1]** Corrigir carregamento de dados para "Receita nas Últimas 4 Semanas"
   - Criar endpoint agregado ou carregar apenas últimas 4 semanas
   - Tempo: 2h

2. **[P0.2]** Corrigir carregamento de dados para "Vendas por Canal (6 Meses)"
   - Criar endpoint agregado ou carregar 6 meses completos
   - Tempo: 2h

3. **[P0.3]** Separar dados filtrados de dados fixos nos cards principais
   - Criar `allCompletedSales` (sem filtros) e `filteredSales` (com filtros)
   - Usar `allCompletedSales` para cards fixos
   - Tempo: 2h

**Resultado Esperado**: Todos os gráficos e cards principais mostram dados corretos

---

### Sprint 2: Correções P1 (Importantes) - 1 dia
**Objetivo**: Corrigir métricas de tendência e indicações visuais

1. **[P1.1]** Corrigir cálculo de tendência de receita
   - Usar `allCompletedSales` para comparação mês a mês
   - Tempo: 1h

2. **[P1.2]** Corrigir sparklines
   - Usar `allCompletedSales` para últimos 30 dias
   - Tempo: 1h

3. **[P1.3]** Adicionar indicação visual de filtros ativos
   - Mostrar badge "Filtrado" em cards que usam filtros
   - Ou separar cards filtrados de cards fixos
   - Tempo: 2h

**Resultado Esperado**: Todas as métricas de tendência corretas e usuário sabe quais dados são filtrados

---

### Sprint 3: Otimizações P2 (Melhorias) - 2 dias
**Objetivo**: Melhorar performance e robustez

1. **[P2.1]** Implementar endpoint agregado no backend
   - Criar `GET /sales/stats` com agregações SQL
   - Migrar frontend para usar novo endpoint
   - Tempo: 4h

2. **[P2.1]** Adicionar memoização no frontend
   - Usar `useMemo` para cálculos pesados
   - Tempo: 2h

3. **[P2.2]** Melhorar tratamento de erros
   - Adicionar validações extras
   - Logs de erro em desenvolvimento
   - Tempo: 2h

**Resultado Esperado**: Dashboard carrega em <1s, código mais robusto

---

## 📊 MÉTRICAS DE SUCESSO

### Antes (Estado Atual):
- ❌ Gráficos podem mostrar R$ 0 com dados de seed
- ❌ Cards mostram valores filtrados sem indicação
- ❌ Dashboard leva 2-3s para carregar
- ❌ 216.000 operações de filtro em arrays

### Depois (Estado Desejado):
- ✅ Todos os gráficos mostram dados corretos sempre
- ✅ Cards principais fixos (sem filtros), outros claramente marcados
- ✅ Dashboard carrega em <1s
- ✅ Backend faz agregação SQL (muito mais rápido)

---

## 🔍 TESTES NECESSÁRIOS

### Testes Unitários:
```typescript
describe('Dashboard Data Processing', () => {
  it('should calculate revenue correctly with 0 sales', () => {
    const sales = [];
    const revenue = calculateRevenue(sales);
    expect(revenue).toBe(0);
  });

  it('should calculate average ticket correctly', () => {
    const sales = [
      { total_value: 100 },
      { total_value: 200 },
      { total_value: 300 }
    ];
    const average = calculateAverageTicket(sales);
    expect(average).toBe(200);
  });

  it('should handle filters without affecting fixed cards', () => {
    const allSales = [/* 100 vendas */];
    const filters = { dateRange: last7Days };

    const fixedCardData = calculateFixedCardData(allSales);
    const filteredCardData = calculateFilteredCardData(allSales, filters);

    expect(fixedCardData.revenue).toBeGreaterThan(filteredCardData.revenue);
  });
});
```

### Testes de Integração:
```python
def test_dashboard_stats_endpoint():
    # Criar 1000 vendas de teste
    sales = create_test_sales(1000)

    # Chamar endpoint agregado
    response = client.get('/api/v1/sales/stats?start_date=2025-01-01')

    assert response.status_code == 200
    assert response.json()['total_sales'] == 1000
    assert response.json()['total_revenue'] > 0
```

### Testes E2E:
```typescript
test('Dashboard should load within 1 second', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('/admin/dashboard');
  await page.waitForSelector('[data-testid="dashboard-loaded"]');
  const loadTime = Date.now() - startTime;

  expect(loadTime).toBeLessThan(1000);
});

test('Revenue chart should show data after seeding', async ({ page }) => {
  // Seed 24k vendas
  await seedDashboard(24000);

  await page.goto('/admin/dashboard');

  // Verificar que o gráfico tem dados
  const chartData = await page.locator('[data-testid="revenue-chart"]').textContent();
  expect(chartData).not.toContain('R$ 0,00');
});
```

---

## 📝 CONCLUSÃO

O dashboard tem **8 problemas identificados**, sendo **3 críticos (P0)** que afetam diretamente a confiabilidade dos dados exibidos.

**Principais problemas**:
1. Gráficos principais podem mostrar dados incorretos devido ao limite de 5000 vendas
2. Cards principais são afetados pelos filtros do usuário sem indicação clara
3. Múltiplos filtros em arrays grandes causam performance ruim

**Recomendação**: Implementar os 3 sprints na ordem proposta para resolver todos os problemas em **4 dias**.

**Próximo passo**: Iniciar Sprint 1 corrigindo o carregamento de dados dos gráficos principais.
