# Roadmap - IA Core (MVP)

**Objetivo:** Desenvolver e integrar os dois endpoints de IA que definem o diferencial competitivo do Orion ERP: automação de entrada de faturas e previsão inteligente de demanda.

**Status Atual:** ✅ Backend CRUD completo | ✅ Frontend UI completo | 🚀 Pronto para IA Core

---

## Visão Geral da Fase 12

A Fase 12 representa o **coração do produto Orion ERP**, implementando as funcionalidades de IA que transformam o sistema de um ERP tradicional em uma **plataforma inteligente e preditiva**.

### Diferenciais Competitivos:

1. **🤖 Automação de Contas a Pagar (PLN)**
   - Extração automática de dados de faturas (PDF/Imagem)
   - Redução de 90% do tempo de entrada manual
   - Matching inteligente de fornecedores
   - Validação humana apenas quando necessário

2. **📊 Previsão de Demanda (Machine Learning)**
   - Análise preditiva do histórico de vendas
   - Planejamento inteligente de estoque
   - Evita rupturas e excesso de inventário
   - Visualização gráfica de tendências

---

## Fase 12.1: Automação de Contas a Pagar (PLN) 🤖

### Visão Geral

Implementar processamento de linguagem natural (PLN) para extrair automaticamente informações de faturas enviadas por usuários, eliminando entrada manual de dados e acelerando o fluxo de contas a pagar.

### Arquitetura da Solução

```
[Upload de Fatura (PDF/IMG)]
    ↓
[Endpoint: POST /api/v1/invoices/upload]
    ↓
[LayoutLM/Tesseract OCR] → [Extração de Campos]
    ↓
[Fuzzy Matching] → [Identificação de Fornecedor]
    ↓
[JSON com Dados Extraídos]
    ↓
[Frontend: Pré-preenche CreateInvoiceModal]
    ↓
[Usuário Valida e Salva]
```

---

### 12.1.1 - Backend: Endpoint de Upload e Extração

**Arquivo:** `backend/app/api/v1/endpoints/invoices.py`

**Tecnologias:**

- **Hugging Face Transformers** - LayoutLM para extração de documentos estruturados
- **Tesseract OCR** - OCR alternativo/complementar
- **PyPDF2** ou **pdfplumber** - Processamento de PDFs
- **Pillow (PIL)** - Processamento de imagens
- **thefuzz (FuzzyWuzzy)** - Matching de fornecedores

**Tarefas:**

1. **Criar Endpoint de Upload** ⭐⭐⭐ ✅ **COMPLETO**
   * [x] Criar rota `POST /api/v1/invoices/upload`
   * [x] Aceitar `multipart/form-data` (arquivo + workspace_id)
   * [x] Validar tipos de arquivo permitidos:
     - PDF (.pdf)
     - Imagens (.jpg, .jpeg, .png)
   * [x] Validar tamanho máximo (10MB)
   * [x] Implementar tratamento de erros robusto
   * [x] Adicionar logging detalhado para debug

2. **Implementar Extração de Dados com IA** ⭐⭐⭐ ✅ **COMPLETO** (serviços já existiam)
   * [x] Instalar dependências:
     ```bash
     pip install transformers torch pillow pytesseract pdfplumber thefuzz
     ```
   * [x] Criar módulo `app/services/invoice_extractor.py` (já existia como invoice_processor.py)
   * [x] Implementar classe `InvoiceExtractor`:
     - Método `extract_from_pdf(file_path)` → dict
     - Método `extract_from_image(file_path)` → dict
     - Método `preprocess_document()` → normalização
   * [x] Integrar LayoutLM para extração estruturada (layout_lm_service.py):
     - Modelo: `microsoft/layoutlmv3-base`
     - Extrair: supplier_name, total_value, due_date, invoice_number
   * [x] Implementar fallback com Tesseract OCR
   * [x] Pós-processamento:
     - Limpar textos extraídos
     - Validar formatos de data
     - Converter valores monetários para float
   * [x] Adicionar confiança (confidence score) para cada campo

3. **Implementar Fuzzy Matching de Fornecedores** ⭐⭐ ✅ **COMPLETO** (já existia)
   * [x] Criar módulo `app/services/supplier_matcher.py` (já existia)
   * [x] Implementar função `match_supplier(name: str, workspace_id: int)`:
     - Buscar todos os fornecedores do workspace
     - Calcular similarity score com `thefuzz.fuzz.ratio()`
     - Retornar top 3 matches com scores
     - Threshold mínimo: 70% (configurável)
   * [x] Implementar normalização de nomes:
     - Remover acentos
     - Converter para lowercase
     - Remover pontuação especial
     - Remover palavras comuns (Ltda, LTDA, S.A., etc.)
   * [x] Considerar também matching por CNPJ/CPF (match exato)
   * [x] Busca histórica em faturas anteriores

4. **Estrutura de Resposta JSON** ⭐ ✅ **COMPLETO**
   * [x] Definir Pydantic schema `InvoiceExtractionResponse`:
     ```python
     {
       "extracted_data": {
         "invoice_number": "string",
         "supplier_name": "string",
         "supplier_matches": [
           {"id": 1, "name": "...", "score": 0.95},
           {"id": 2, "name": "...", "score": 0.82}
         ],
         "total_value": 1500.00,
         "due_date": "2025-11-15",
         "invoice_date": "2025-10-20",
         "confidence": {
           "invoice_number": 0.98,
           "supplier_name": 0.85,
           "total_value": 0.95,
           "due_date": 0.90
         }
       },
       "suggestions": {
         "supplier_id": 1,  // Top match
         "needs_review": false,  // Se confidence < 0.8
         "warnings": []
       },
       "processing_time_ms": 1250
     }
     ```

5. **Testes e Validação** ⭐⭐
   * [ ] Criar testes unitários para `InvoiceExtractor`
   * [ ] Criar testes para `SupplierMatcher`
   * [ ] Preparar dataset de teste:
     - 5 PDFs de faturas reais (anonimizadas)
     - 5 imagens de faturas
     - Casos com diferentes layouts
   * [ ] Medir métricas:
     - Acurácia de extração por campo
     - Tempo médio de processamento
     - Taxa de acerto do matching
   * [ ] Documentar limitações conhecidas

**Estimativa:** 5-7 dias de desenvolvimento

---

### 12.1.2 - Frontend: Integração com Upload Modal

**Arquivo:** `admin/src/components/invoice/InvoiceUploadModal.tsx`

**Tarefas:**

1. **Atualizar InvoiceUploadModal** ⭐⭐
   * [ ] Modificar componente existente (criado na Fase 5)
   * [ ] Adicionar estado de loading durante processamento:
     ```typescript
     const [isProcessing, setIsProcessing] = useState(false);
     const [extractionResult, setExtractionResult] = useState(null);
     ```
   * [ ] Implementar upload com `invoiceService.uploadAndExtract()`:
     ```typescript
     const handleUpload = async (file: File) => {
       setIsProcessing(true);
       try {
         const result = await invoiceService.uploadAndExtract(file);
         setExtractionResult(result);
         // Abrir modal de validação
       } catch (error) {
         toast.error('Erro ao processar fatura');
       } finally {
         setIsProcessing(false);
       }
     };
     ```

2. **Criar UI de Processamento** ⭐
   * [ ] Adicionar indicadores visuais:
     - Spinner animado durante upload
     - Barra de progresso (opcional)
     - Mensagem: "Processando fatura com IA..."
   * [ ] Mostrar tempo estimado (ex: ~2-5 segundos)
   * [ ] Adicionar animação de sucesso ao completar

3. **Integrar com CreateInvoiceModal** ⭐⭐⭐
   * [ ] Modificar `CreateInvoiceModal.tsx` para aceitar `initialData` prop:
     ```typescript
     interface CreateInvoiceModalProps {
       open: boolean;
       onOpenChange: (open: boolean) => void;
       onSuccess: () => void;
       initialData?: InvoiceExtractionResponse;  // Novo
     }
     ```
   * [ ] Pré-preencher campos do formulário:
     - `invoice_number` ← `extracted_data.invoice_number`
     - `supplier_id` ← `suggestions.supplier_id`
     - `total_value` ← `extracted_data.total_value`
     - `due_date` ← `extracted_data.due_date`
     - `invoice_date` ← `extracted_data.invoice_date`
   * [ ] Adicionar badges de confiança:
     - Verde (≥ 0.9): "Alta confiança"
     - Amarelo (0.7-0.9): "Média confiança - Revisar"
     - Vermelho (< 0.7): "Baixa confiança - Verificar"
   * [ ] Destacar campos com baixa confiança (border amarelo/vermelho)

4. **UI de Validação Humana** ⭐⭐
   * [ ] Adicionar seção "Dados Extraídos pela IA":
     ```tsx
     <Card className="bg-blue-50 border-blue-200">
       <CardHeader>
         <CardTitle className="flex items-center gap-2">
           <Sparkles className="h-5 w-5" />
           Dados Extraídos Automaticamente
         </CardTitle>
       </CardHeader>
       <CardContent>
         {/* Mostrar dados extraídos com badges de confiança */}
       </CardContent>
     </Card>
     ```
   * [ ] Adicionar dropdown para selecionar fornecedor:
     - Mostrar top 3 matches com scores
     - Opção "Nenhum dos acima" → Criar novo fornecedor
   * [ ] Permitir edição de todos os campos
   * [ ] Botões de ação:
     - "Validar e Salvar" (verde)
     - "Descartar e Inserir Manual" (cinza)
     - "Cancelar" (vermelho)

5. **Criar serviço de API** ⭐ ✅ **COMPLETO**
   * [x] Adicionar método em `admin/src/services/invoice.ts`
   * [x] Criar tipos TypeScript em `admin/src/types/index.ts`:
     - ConfidenceScores
     - SupplierMatch
     - ExtractedData
     - ExtractionSuggestions
     - InvoiceExtractionResponse
   * [x] Implementar uploadAndExtract com fetch nativo
   * [x] Tratamento de erros e autenticação Bearer token

6. **Feedback e Analytics** ⭐ 🚧 **EM PROGRESSO**
   * [x] Preparar CreateInvoiceModal para aceitar initialData
   * [ ] Adicionar toast de sucesso:
     - "Fatura processada com sucesso! Revise os dados extraídos."
   * [ ] Adicionar métricas de uso:
     - Tempo de processamento mostrado ao usuário
     - Taxa de aceitação dos dados sugeridos
     - Campos mais editados manualmente
   * [ ] Implementar botão "Reportar Erro" para feedback

**Estimativa:** 3-4 dias de desenvolvimento
**Status Atual:** Backend 100% completo | Frontend ~40% completo (types + service + base preparada)

---

## Fase 12.2: Previsão de Demanda (Machine Learning) 📊

### Visão Geral

Implementar análise preditiva de séries temporais para prever a demanda futura de produtos com base no histórico de vendas, auxiliando no planejamento de estoque e compras.

### Arquitetura da Solução

```
[ProductDetailsModal aberto]
    ↓
[Fetch: GET /api/v1/products/{id}/demand-forecast]
    ↓
[Backend: Busca histórico de Sales]
    ↓
[Modelo ML: ARIMA/Prophet] → [Previsão 4 semanas]
    ↓
[JSON: historical_data + forecast]
    ↓
[Frontend: Card + Gráfico (Recharts)]
```

---

### 12.2.1 - Backend: Endpoint de Previsão

**Arquivo:** `backend/app/api/v1/endpoints/products.py`

**Tecnologias:**

- **Scikit-learn** - Regressão Linear, Random Forest
- **Statsmodels** - ARIMA, SARIMAX
- **Prophet (Facebook)** - Previsão de séries temporais (recomendado)
- **Pandas** - Manipulação de dados
- **NumPy** - Operações numéricas

**Tarefas:**

1. **Criar Endpoint de Previsão** ⭐⭐
   * [ ] Criar rota `GET /api/v1/products/{product_id}/demand-forecast`
   * [ ] Query parameters opcionais:
     - `period` (default: "4_weeks"): "2_weeks", "4_weeks", "8_weeks", "12_weeks"
     - `granularity` (default: "weekly"): "daily", "weekly", "monthly"
   * [ ] Validar que o produto existe e pertence ao workspace do usuário
   * [ ] Implementar cache de previsões (ex: 24 horas)
   * [ ] Adicionar rate limiting (evitar abuso de processamento)

2. **Implementar Análise de Histórico** ⭐⭐
   * [ ] Criar módulo `app/services/demand_forecaster.py`
   * [ ] Implementar classe `DemandForecaster`:
     ```python
     class DemandForecaster:
         def get_historical_sales(self, product_id: int, workspace_id: int):
             """Busca vendas dos últimos 6-12 meses"""
             pass

         def aggregate_by_period(self, sales: List[Sale], granularity: str):
             """Agrupa vendas por dia/semana/mês"""
             pass

         def calculate_statistics(self, historical_data):
             """Calcula média, mediana, tendência"""
             pass
     ```
   * [ ] Buscar vendas do produto dos últimos 12 meses (mínimo)
   * [ ] Filtrar apenas vendas com status 'completed'
   * [ ] Agrupar por período configurado (dia/semana/mês)
   * [ ] Tratar períodos sem vendas (preencher com zero)

3. **Implementar Modelo de ML** ⭐⭐⭐
   * [ ] Instalar dependências:
     ```bash
     pip install scikit-learn statsmodels prophet pandas numpy
     ```
   * [ ] Implementar método `predict_demand()`:
     ```python
     def predict_demand(
         self,
         historical_data: pd.DataFrame,
         periods_ahead: int = 4
     ) -> dict:
         """
         Gera previsão de demanda

         Returns:
             {
                 "predictions": [...],
                 "confidence_interval": {"lower": [...], "upper": [...]},
                 "model_used": "prophet",
                 "model_metrics": {"mape": 0.15, "rmse": 5.2}
             }
         """
     ```
   * [ ] Escolher modelo baseado em volume de dados:
     - **< 12 pontos de dados**: Média móvel simples
     - **12-50 pontos**: Regressão Linear ou Média Móvel Exponencial
     - **> 50 pontos**: Prophet ou ARIMA
   * [ ] Implementar Prophet (recomendado):
     ```python
     from prophet import Prophet

     model = Prophet(
         daily_seasonality=False,
         weekly_seasonality=True,
         yearly_seasonality=True
     )
     model.fit(df)
     future = model.make_future_dataframe(periods=periods_ahead, freq='W')
     forecast = model.predict(future)
     ```
   * [ ] Calcular intervalos de confiança (80% e 95%)
   * [ ] Validar previsões (não permitir valores negativos)

4. **Calcular Métricas e Insights** ⭐⭐
   * [ ] Implementar função `generate_insights()`:
     ```python
     def generate_insights(self, historical_data, forecast):
         """
         Gera insights acionáveis

         Returns:
             {
                 "trend": "increasing/stable/decreasing",
                 "seasonality_detected": bool,
                 "avg_weekly_demand": float,
                 "recommended_stock_level": int,
                 "reorder_point": int,
                 "alerts": [
                     {"type": "warning", "message": "..."},
                     {"type": "info", "message": "..."}
                 ]
             }
         ```
     ```
   * [ ] Detectar tendência (crescente/estável/decrescente):
     - Regressão linear nos últimos 3 meses
     - Classificar por inclinação da reta
   * [ ] Detectar sazonalidade:
     - Análise de autocorrelação
     - Identificar padrões semanais/mensais
   * [ ] Calcular estoque recomendado:
     - Média da previsão + desvio padrão × safety factor
     - Considerar lead time de fornecedores (se disponível)
   * [ ] Gerar alertas inteligentes:
     - "Demanda prevista acima do estoque atual"
     - "Tendência de queda - revisar compras"
     - "Sazonalidade detectada - preparar para pico"

5. **Estrutura de Resposta JSON** ⭐
   * [ ] Definir schema `DemandForecastResponse`:
     ```python
     {
       "product": {
         "id": 1,
         "name": "Produto X",
         "current_stock": 45,
         "min_stock_level": 20
       },
       "historical": [
         {"period": "2025-W40", "units_sold": 12, "date_start": "2025-10-06"},
         {"period": "2025-W41", "units_sold": 15, "date_start": "2025-10-13"},
         ...
       ],
       "forecast": [
         {
           "period": "2025-W44",
           "predicted_units": 18,
           "lower_bound": 14,
           "upper_bound": 22,
           "confidence": 0.85,
           "date_start": "2025-11-03"
         },
         ...
       ],
       "insights": {
         "trend": "increasing",
         "trend_percentage": 12.5,
         "seasonality_detected": true,
         "avg_weekly_demand": 14.2,
         "recommended_stock_level": 60,
         "reorder_point": 30,
         "stock_coverage_weeks": 3.2,
         "alerts": [
           {
             "type": "warning",
             "severity": "high",
             "message": "Estoque atual cobrirá apenas 3 semanas da demanda prevista",
             "action": "Considere fazer um pedido de reposição"
           }
         ]
       },
       "model_info": {
         "model_used": "prophet",
         "data_points": 24,
         "training_period": "2024-11-01 to 2025-10-23",
         "mape": 15.2,
         "rmse": 3.8,
         "last_updated": "2025-10-23T14:30:00Z"
       }
     }
     ```

6. **Cache e Otimização** ⭐
   * [ ] Implementar cache Redis (opcional):
     - Chave: `forecast:product:{id}:period:{period}`
     - TTL: 24 horas
   * [ ] Cache em memória (fallback):
     - Dict com LRU (max 100 produtos)
   * [ ] Processar em background para produtos populares:
     - Cron job noturno para top 20 produtos
     - Pré-calcular e armazenar em cache

7. **Testes e Validação** ⭐⭐
   * [ ] Criar testes unitários:
     - Teste com dados sintéticos
     - Teste com dados reais anonimizados
     - Teste edge cases (produto sem vendas, vendas esporádicas)
   * [ ] Validar acurácia do modelo:
     - Split de dados: 80% treino, 20% teste
     - Calcular MAPE (Mean Absolute Percentage Error)
     - Objetivo: MAPE < 20% (boa acurácia)
   * [ ] Testes de performance:
     - Tempo de resposta < 2 segundos
     - Suportar 10 requisições simultâneas
   * [ ] Documentar limitações:
     - Mínimo de dados necessários
     - Acurácia esperada por cenário
     - Casos onde previsão não é confiável

**Estimativa:** 6-8 dias de desenvolvimento

---

### 12.2.2 - Frontend: Visualização de Previsão

**Arquivo:** `admin/src/components/product/ProductDetailsModal.tsx`

**Tecnologias:**

- **Recharts** - Biblioteca de gráficos (já planejada no roadmap)
- **date-fns** - Manipulação de datas
- **Lucide React** - Ícones

**Tarefas:**

1. **Instalar Dependências** ⭐
   * [ ] Instalar Recharts:
     ```bash
     npm install recharts
     ```
   * [ ] Instalar tipos TypeScript:
     ```bash
     npm install -D @types/recharts
     ```

2. **Criar Hook de Data Fetching** ⭐
   * [ ] Criar `useDemandForecast` hook:
     ```typescript
     // hooks/useDemandForecast.ts
     export function useDemandForecast(productId: number | null) {
       const [data, setData] = useState<DemandForecastResponse | null>(null);
       const [loading, setLoading] = useState(false);
       const [error, setError] = useState<string | null>(null);

       useEffect(() => {
         if (!productId) return;

         const fetchForecast = async () => {
           setLoading(true);
           try {
             const result = await productService.getDemandForecast(productId);
             setData(result);
           } catch (err) {
             setError(err.message);
           } finally {
             setLoading(false);
           }
         };

         fetchForecast();
       }, [productId]);

       return { data, loading, error };
     }
     ```

3. **Atualizar ProductDetailsModal** ⭐⭐
   * [ ] Importar hook `useDemandForecast`
   * [ ] Adicionar chamada ao abrir modal:
     ```typescript
     const { data: forecast, loading, error } = useDemandForecast(product?.id);
     ```
   * [ ] Adicionar nova aba "Previsão de Demanda":
     ```tsx
     <Tabs defaultValue="details">
       <TabsList>
         <TabsTrigger value="details">Detalhes</TabsTrigger>
         <TabsTrigger value="forecast">
           <TrendingUp className="mr-2 h-4 w-4" />
           Previsão de Demanda
         </TabsTrigger>
       </TabsList>

       <TabsContent value="details">
         {/* Conteúdo atual */}
       </TabsContent>

       <TabsContent value="forecast">
         <DemandForecastView data={forecast} loading={loading} error={error} />
       </TabsContent>
     </Tabs>
     ```

4. **Criar Componente DemandForecastView** ⭐⭐⭐
   * [ ] Criar arquivo `components/product/DemandForecastView.tsx`
   * [ ] Estrutura do componente:
     ```tsx
     interface DemandForecastViewProps {
       data: DemandForecastResponse | null;
       loading: boolean;
       error: string | null;
     }

     export function DemandForecastView({ data, loading, error }: DemandForecastViewProps) {
       if (loading) return <ForecastSkeleton />;
       if (error) return <ErrorCard error={error} />;
       if (!data) return <EmptyForecastState />;

       return (
         <div className="space-y-6">
           <InsightsCards insights={data.insights} />
           <ForecastChart historical={data.historical} forecast={data.forecast} />
           <AlertsList alerts={data.insights.alerts} />
           <ModelInfo modelInfo={data.model_info} />
         </div>
       );
     }
     ```

5. **Criar Cards de Insights** ⭐⭐
   * [ ] Componente `InsightsCards`:
     ```tsx
     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
       {/* Card 1: Previsão Próximas 4 Semanas */}
       <Card>
         <CardHeader className="flex flex-row items-center justify-between pb-2">
           <CardTitle className="text-sm font-medium">
             Demanda Prevista (4 sem)
           </CardTitle>
           <Package className="h-4 w-4 text-blue-600" />
         </CardHeader>
         <CardContent>
           <div className="text-2xl font-bold">
             {forecast.reduce((sum, f) => sum + f.predicted_units, 0)} un
           </div>
           <p className="text-xs text-muted-foreground">
             Média: {insights.avg_weekly_demand} un/semana
           </p>
         </CardContent>
       </Card>

       {/* Card 2: Tendência */}
       <Card>
         <CardHeader className="flex flex-row items-center justify-between pb-2">
           <CardTitle className="text-sm font-medium">Tendência</CardTitle>
           <TrendingUp className={`h-4 w-4 ${getTrendColor(insights.trend)}`} />
         </CardHeader>
         <CardContent>
           <div className="text-2xl font-bold">
             {insights.trend === 'increasing' ? '↗️ Crescente' :
              insights.trend === 'decreasing' ? '↘️ Decrescente' :
              '→ Estável'}
           </div>
           <p className="text-xs text-muted-foreground">
             {insights.trend_percentage > 0 ? '+' : ''}{insights.trend_percentage}%
           </p>
         </CardContent>
       </Card>

       {/* Card 3: Estoque Recomendado */}
       <Card>
         <CardHeader className="flex flex-row items-center justify-between pb-2">
           <CardTitle className="text-sm font-medium">
             Estoque Recomendado
           </CardTitle>
           <AlertTriangle className="h-4 w-4 text-orange-600" />
         </CardHeader>
         <CardContent>
           <div className="text-2xl font-bold">
             {insights.recommended_stock_level} un
           </div>
           <p className="text-xs text-muted-foreground">
             Atual: {product.stock_quantity} un
           </p>
         </CardContent>
       </Card>

       {/* Card 4: Cobertura */}
       <Card>
         <CardHeader className="flex flex-row items-center justify-between pb-2">
           <CardTitle className="text-sm font-medium">Cobertura</CardTitle>
           <Clock className="h-4 w-4 text-green-600" />
         </CardHeader>
         <CardContent>
           <div className="text-2xl font-bold">
             {insights.stock_coverage_weeks.toFixed(1)} sem
           </div>
           <p className="text-xs text-muted-foreground">
             Com estoque atual
           </p>
         </CardContent>
       </Card>
     </div>
     ```

6. **Criar Gráfico de Previsão** ⭐⭐⭐
   * [ ] Componente `ForecastChart` com Recharts:
     ```tsx
     import {
       LineChart, Line, XAxis, YAxis, CartesianGrid,
       Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area
     } from 'recharts';

     export function ForecastChart({ historical, forecast }) {
       // Combinar dados históricos e previsão
       const combinedData = [
         ...historical.map(h => ({
           period: h.period,
           actual: h.units_sold,
           type: 'historical'
         })),
         ...forecast.map(f => ({
           period: f.period,
           predicted: f.predicted_units,
           lowerBound: f.lower_bound,
           upperBound: f.upper_bound,
           type: 'forecast'
         }))
       ];

       return (
         <Card>
           <CardHeader>
             <CardTitle>Histórico e Previsão de Vendas</CardTitle>
             <CardDescription>
               Vendas realizadas e demanda prevista para as próximas semanas
             </CardDescription>
           </CardHeader>
           <CardContent>
             <ResponsiveContainer width="100%" height={400}>
               <LineChart data={combinedData}>
                 <CartesianGrid strokeDasharray="3 3" />
                 <XAxis
                   dataKey="period"
                   label={{ value: 'Período', position: 'insideBottom', offset: -5 }}
                 />
                 <YAxis
                   label={{ value: 'Unidades', angle: -90, position: 'insideLeft' }}
                 />
                 <Tooltip content={<CustomTooltip />} />
                 <Legend />

                 {/* Linha sólida para dados históricos */}
                 <Line
                   type="monotone"
                   dataKey="actual"
                   stroke="#2563eb"
                   strokeWidth={2}
                   name="Vendas Reais"
                   dot={{ r: 4 }}
                 />

                 {/* Área de confiança */}
                 <Area
                   type="monotone"
                   dataKey="upperBound"
                   stroke="none"
                   fill="#93c5fd"
                   fillOpacity={0.3}
                   name="Limite Superior"
                 />
                 <Area
                   type="monotone"
                   dataKey="lowerBound"
                   stroke="none"
                   fill="#93c5fd"
                   fillOpacity={0.3}
                   name="Limite Inferior"
                 />

                 {/* Linha pontilhada para previsão */}
                 <Line
                   type="monotone"
                   dataKey="predicted"
                   stroke="#16a34a"
                   strokeWidth={2}
                   strokeDasharray="5 5"
                   name="Previsão"
                   dot={{ r: 4, fill: '#16a34a' }}
                 />

                 {/* Linha vertical separando histórico de previsão */}
                 <ReferenceLine
                   x={historical[historical.length - 1]?.period}
                   stroke="red"
                   strokeDasharray="3 3"
                   label="Hoje"
                 />
               </LineChart>
             </ResponsiveContainer>
           </CardContent>
         </Card>
       );
     }
     ```

7. **Criar Lista de Alertas** ⭐
   * [ ] Componente `AlertsList`:
     ```tsx
     export function AlertsList({ alerts }) {
       if (!alerts || alerts.length === 0) return null;

       return (
         <Card>
           <CardHeader>
             <CardTitle>Alertas e Recomendações</CardTitle>
           </CardHeader>
           <CardContent className="space-y-3">
             {alerts.map((alert, index) => (
               <Alert
                 key={index}
                 variant={alert.severity === 'high' ? 'destructive' : 'default'}
               >
                 <AlertTriangle className="h-4 w-4" />
                 <AlertTitle className="capitalize">{alert.type}</AlertTitle>
                 <AlertDescription>
                   {alert.message}
                   {alert.action && (
                     <div className="mt-2">
                       <Badge variant="outline">{alert.action}</Badge>
                     </div>
                   )}
                 </AlertDescription>
               </Alert>
             ))}
           </CardContent>
         </Card>
       );
     }
     ```

8. **Criar Card de Info do Modelo** ⭐
   * [ ] Componente `ModelInfo` (colapsável):
     ```tsx
     export function ModelInfo({ modelInfo }) {
       const [isExpanded, setIsExpanded] = useState(false);

       return (
         <Card>
           <CardHeader
             className="cursor-pointer"
             onClick={() => setIsExpanded(!isExpanded)}
           >
             <CardTitle className="flex items-center justify-between text-sm">
               <span>Informações do Modelo de IA</span>
               <ChevronDown className={`h-4 w-4 transition-transform ${
                 isExpanded ? 'rotate-180' : ''
               }`} />
             </CardTitle>
           </CardHeader>
           {isExpanded && (
             <CardContent className="text-sm space-y-2">
               <div className="grid grid-cols-2 gap-2">
                 <div>
                   <span className="text-muted-foreground">Modelo:</span>
                   <span className="ml-2 font-medium capitalize">
                     {modelInfo.model_used}
                   </span>
                 </div>
                 <div>
                   <span className="text-muted-foreground">Pontos de dados:</span>
                   <span className="ml-2 font-medium">{modelInfo.data_points}</span>
                 </div>
                 <div>
                   <span className="text-muted-foreground">MAPE:</span>
                   <span className="ml-2 font-medium">{modelInfo.mape}%</span>
                   <Badge
                     className="ml-2"
                     variant={modelInfo.mape < 20 ? 'default' : 'secondary'}
                   >
                     {modelInfo.mape < 15 ? 'Ótimo' :
                      modelInfo.mape < 25 ? 'Bom' : 'Regular'}
                   </Badge>
                 </div>
                 <div>
                   <span className="text-muted-foreground">Última atualização:</span>
                   <span className="ml-2 font-medium">
                     {formatDistanceToNow(new Date(modelInfo.last_updated), {
                       addSuffix: true,
                       locale: ptBR
                     })}
                   </span>
                 </div>
               </div>
               <div className="text-xs text-muted-foreground pt-2 border-t">
                 <p>Período de treinamento: {modelInfo.training_period}</p>
               </div>
             </CardContent>
           )}
         </Card>
       );
     }
     ```

9. **Criar Estados de Loading/Error/Empty** ⭐
   * [ ] `ForecastSkeleton`:
     ```tsx
     export function ForecastSkeleton() {
       return (
         <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             {[...Array(4)].map((_, i) => (
               <Skeleton key={i} className="h-24" />
             ))}
           </div>
           <Skeleton className="h-96 w-full" />
         </div>
       );
     }
     ```
   * [ ] `ErrorCard`:
     ```tsx
     export function ErrorCard({ error }) {
       return (
         <Card className="border-destructive">
           <CardContent className="pt-6">
             <div className="flex flex-col items-center justify-center py-8">
               <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
               <h3 className="font-semibold text-lg mb-2">
                 Erro ao Carregar Previsão
               </h3>
               <p className="text-sm text-muted-foreground mb-4">{error}</p>
               <Button variant="outline" onClick={() => window.location.reload()}>
                 Tentar Novamente
               </Button>
             </div>
           </CardContent>
         </Card>
       );
     }
     ```
   * [ ] `EmptyForecastState`:
     ```tsx
     export function EmptyForecastState() {
       return (
         <Card>
           <CardContent className="pt-6">
             <div className="flex flex-col items-center justify-center py-8">
               <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
               <h3 className="font-semibold text-lg mb-2">
                 Dados Insuficientes
               </h3>
               <p className="text-sm text-muted-foreground text-center max-w-md">
                 Este produto não possui histórico de vendas suficiente para
                 gerar uma previsão confiável. São necessárias pelo menos
                 12 semanas de dados.
               </p>
             </div>
           </CardContent>
         </Card>
       );
     }
     ```

10. **Criar serviço de API** ⭐
    * [ ] Adicionar método em `admin/src/services/product.ts`:
      ```typescript
      async getDemandForecast(
        productId: number,
        period: '2_weeks' | '4_weeks' | '8_weeks' | '12_weeks' = '4_weeks'
      ): Promise<DemandForecastResponse> {
        const response = await api.get(
          `/products/${productId}/demand-forecast`,
          { params: { period } }
        );
        return response.data;
      }
      ```

11. **Adicionar Botão de Atualização** ⭐
    * [ ] Adicionar botão "Atualizar Previsão" no header do modal:
      ```tsx
      <Button
        variant="outline"
        size="sm"
        onClick={() => refetchForecast()}
        disabled={loading}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
        Atualizar
      </Button>
      ```

**Estimativa:** 4-5 dias de desenvolvimento

---

## Cronograma Geral da Fase 12

### Semana 1-2: Automação de Contas a Pagar
- **Dias 1-3**: Backend - Endpoint e extração com IA
- **Dias 4-5**: Backend - Fuzzy matching e testes
- **Dias 6-7**: Frontend - Integração e validação humana
- **Dia 8**: Testes end-to-end e ajustes

### Semana 3-4: Previsão de Demanda
- **Dias 9-11**: Backend - Endpoint e modelo ML
- **Dias 12-13**: Backend - Insights e otimização
- **Dias 14-16**: Frontend - Componentes e gráficos
- **Dia 17**: Testes end-to-end e ajustes

### Semana 5: Polimento e Lançamento
- **Dias 18-19**: Testes integrados de ambas funcionalidades
- **Dia 20**: Ajustes de performance e UX
- **Dia 21**: Documentação e treinamento
- **Dia 22**: Deploy em produção e monitoramento

**Total estimado:** 4-5 semanas (22 dias úteis)

---

## Requisitos Técnicos

### Backend Dependencies

```txt
# IA e Machine Learning
transformers==4.35.0
torch==2.1.0
pillow==10.1.0
pytesseract==0.3.10
pdfplumber==0.10.3
thefuzz==0.20.0
python-Levenshtein==0.23.0

# ML para Previsão
scikit-learn==1.3.2
statsmodels==0.14.0
prophet==1.1.5
pandas==2.1.3
numpy==1.26.2

# Utilidades
python-multipart==0.0.6  # Para upload de arquivos
redis==5.0.1  # Para cache (opcional)
celery==5.3.4  # Para processamento assíncrono (opcional)
```

### Frontend Dependencies

```json
{
  "dependencies": {
    "recharts": "^2.10.3",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "@types/recharts": "^1.8.29"
  }
}
```

### Infraestrutura

#### Mínimo (MVP):
- **RAM**: 4GB+ (para rodar modelos de ML)
- **CPU**: 2+ cores
- **Storage**: 10GB+ (para modelos e cache)
- **Python**: 3.9+

#### Recomendado (Produção):
- **RAM**: 8GB+
- **CPU**: 4+ cores ou GPU (para LayoutLM)
- **Storage**: 20GB+ SSD
- **Redis**: Para cache de previsões
- **Celery**: Para processamento assíncrono
- **PostgreSQL**: Já em uso

---

## Métricas de Sucesso

### KPIs Técnicos:

**Automação de Faturas:**
- ✅ Taxa de extração correta: > 85%
- ✅ Tempo de processamento: < 3 segundos
- ✅ Taxa de matching de fornecedores: > 90%
- ✅ Redução de tempo de entrada: > 80%

**Previsão de Demanda:**
- ✅ MAPE (Mean Absolute Percentage Error): < 20%
- ✅ Tempo de resposta: < 2 segundos
- ✅ Cobertura de produtos: 100% com dados suficientes
- ✅ Acurácia de insights: > 80%

### KPIs de Negócio:

- ✅ Adoção da automação: > 70% das faturas via upload
- ✅ Satisfação do usuário: > 4/5 estrelas
- ✅ Redução de erros manuais: > 50%
- ✅ ROI de IA: positivo em 3 meses

---

## Testes e Validação

### Testes Unitários:
- [ ] Backend: Coverage > 80%
- [ ] Testes para cada função de extração
- [ ] Testes para fuzzy matching
- [ ] Testes para modelos de ML
- [ ] Testes para cálculo de insights

### Testes de Integração:
- [ ] Fluxo completo: upload → extração → validação → salvar
- [ ] Fluxo completo: abrir produto → fetch previsão → exibir gráfico
- [ ] Testes de erro: arquivo corrompido, sem dados, etc.

### Testes de Performance:
- [ ] Load test: 100 uploads simultâneos
- [ ] Load test: 50 previsões simultâneas
- [ ] Teste de memória: sem memory leaks
- [ ] Teste de cache: hit rate > 60%

### Testes de Usabilidade:
- [ ] 5 usuários testam automação de faturas
- [ ] 5 usuários testam previsão de demanda
- [ ] Coleta de feedback qualitativo
- [ ] Ajustes baseados em feedback

---

## Riscos e Mitigações

### Riscos Técnicos:

1. **LayoutLM muito pesado/lento**
   - **Mitigação**: Implementar Tesseract OCR como fallback
   - **Mitigação**: Processar em background com Celery
   - **Mitigação**: Usar modelo menor (layoutlm-base)

2. **Acurácia baixa de extração**
   - **Mitigação**: Pós-processamento inteligente
   - **Mitigação**: Confidence scores para alertar usuário
   - **Mitigação**: Feedback loop para melhorar modelo

3. **Dados insuficientes para previsão**
   - **Mitigação**: Definir mínimo de 12 semanas de dados
   - **Mitigação**: Usar média móvel simples como fallback
   - **Mitigação**: Comunicar claramente limitações

4. **Performance do Prophet**
   - **Mitigação**: Cache agressivo (24h TTL)
   - **Mitigação**: Pré-processamento noturno
   - **Mitigação**: Fallback para modelos mais simples

### Riscos de Negócio:

1. **Usuários não confiam na IA**
   - **Mitigação**: Transparência total (confidence scores)
   - **Mitigação**: Validação humana obrigatória
   - **Mitigação**: Tutoriais e onboarding

2. **Expectativas irreais de acurácia**
   - **Mitigação**: Documentar limitações claramente
   - **Mitigação**: Mostrar métricas de confiança
   - **Mitigação**: Educar sobre ML e previsões

---

## Documentação

### Documentação Técnica:
- [ ] API documentation (Swagger/OpenAPI)
- [ ] README de instalação de dependências
- [ ] Guia de configuração de modelos
- [ ] Troubleshooting guide

### Documentação de Usuário:
- [ ] Tutorial: Como usar automação de faturas
- [ ] Tutorial: Como interpretar previsões
- [ ] FAQ sobre IA no Orion ERP
- [ ] Vídeo demonstrativo (2-3 minutos)

---

## Próximos Passos (Pós-MVP)

### Fase 13: Melhorias de IA (Futuro)

1. **Fine-tuning de Modelos**
   - Coletar dados rotulados de usuários
   - Retreinar LayoutLM com dados específicos
   - Melhorar acurácia de extração

2. **Novos Recursos de IA**
   - Detecção de anomalias em gastos
   - Recomendação de fornecedores alternativos
   - Análise de sentimento em notas de produtos
   - Chatbot para suporte

3. **Automação Avançada**
   - Aprovação automática de faturas de baixo risco
   - Reordenamento automático de estoque
   - Alertas preditivos de problemas

4. **Dashboard de IA**
   - Métricas de uso de IA
   - ROI da automação
   - Acurácia por tipo de documento
   - Economia de tempo mensurada

---

**Última atualização:** 2025-10-24
**Versão:** 1.0 (MVP)
**Status:** 🚀 Pronto para Implementação
