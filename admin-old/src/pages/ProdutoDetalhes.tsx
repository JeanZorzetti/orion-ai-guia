import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './src/components/ui/card';
import { Badge } from './src/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './src/components/ui/table';
import { 
  Package,
  TrendingUp,
  Calendar,
  DollarSign,
  BarChart3
} from 'lucide-react';

const ProdutoDetalhes: React.FC = () => {
  const { id } = useParams();

  // Mock data
  const produto = {
    id: parseInt(id || '1'),
    nome: 'Produto Exemplo A',
    sku: 'PRD-001-A',
    estoqueAtual: 45,
    estoqueMinimo: 20,
    precoVenda: 89.90,
    categoria: 'Eletrônicos'
  };

  const previsaoDemanda = {
    proximasTresSemanas: 85,
    tendencia: 'crescimento',
    confianca: 92
  };

  const historicoVendas = [
    { id: 1, data: '2024-01-10', quantidade: 12, valor: 1078.80, cliente: 'Cliente A' },
    { id: 2, data: '2024-01-08', quantidade: 8, valor: 719.20, cliente: 'Cliente B' },
    { id: 3, data: '2024-01-05', quantidade: 15, valor: 1348.50, cliente: 'Cliente C' },
    { id: 4, data: '2024-01-03', quantidade: 6, valor: 539.40, cliente: 'Cliente D' },
    { id: 5, data: '2024-01-01', quantidade: 20, valor: 1798.00, cliente: 'Cliente E' },
  ];

  const dadosGrafico = [
    { semana: 'Sem -4', historico: 15, previsao: null },
    { semana: 'Sem -3', historico: 22, previsao: null },
    { semana: 'Sem -2', historico: 18, previsao: null },
    { semana: 'Sem -1', historico: 25, previsao: null },
    { semana: 'Sem 1', historico: null, previsao: 28 },
    { semana: 'Sem 2', historico: null, previsao: 32 },
    { semana: 'Sem 3', historico: null, previsao: 25 },
    { semana: 'Sem 4', historico: null, previsao: 30 },
  ];

  const getStatusEstoque = () => {
    if (produto.estoqueAtual <= produto.estoqueMinimo) {
      return { label: 'Crítico', variant: 'destructive' as const };
    } else if (produto.estoqueAtual <= produto.estoqueMinimo * 1.5) {
      return { label: 'Baixo', variant: 'default' as const };
    } else {
      return { label: 'Adequado', variant: 'secondary' as const };
    }
  };

  const statusEstoque = getStatusEstoque();

  return (
    <div className="space-y-6">
      {/* Header do Produto */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{produto.nome}</h1>
          <div className="flex items-center gap-4 mt-2 text-muted-foreground">
            <span>SKU: {produto.sku}</span>
            <span>•</span>
            <span>Categoria: {produto.categoria}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-foreground mb-1">
            {produto.estoqueAtual}
          </div>
          <div className="text-sm text-muted-foreground">unidades em estoque</div>
          <Badge variant={statusEstoque.variant} className="mt-2">
            {statusEstoque.label}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card Principal: Previsão de Demanda */}
        <Card className="lg:col-span-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10" data-tour="prediction-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              Previsão de Demanda Inteligente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {previsaoDemanda.proximasTresSemanas}
                </div>
                <div className="text-sm text-muted-foreground">
                  Previsão para as próximas 4 semanas
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-semibold text-green-600 mb-2">
                  {previsaoDemanda.confianca}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Nível de confiança
                </div>
              </div>

              <div className="text-center">
                <Badge variant="default" className="text-lg px-4 py-2">
                  Tendência de {previsaoDemanda.tendencia}
                </Badge>
              </div>
            </div>

            {/* Gráfico Simples */}
            <div className="mt-6 p-4 bg-background rounded-lg">
              <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Histórico vs. Previsão (Vendas Semanais)
              </h4>
              <div className="space-y-3">
                {dadosGrafico.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-16 text-xs text-muted-foreground">
                      {item.semana}
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      {item.historico && (
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-3 bg-muted-foreground rounded-full"
                            style={{ width: `${(item.historico / 35) * 120}px` }}
                          />
                          <span className="text-xs text-muted-foreground min-w-[40px]">
                            {item.historico}
                          </span>
                        </div>
                      )}
                      {item.previsao && (
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-3 bg-primary rounded-full opacity-80"
                            style={{ width: `${(item.previsao / 35) * 120}px` }}
                          />
                          <span className="text-xs text-primary min-w-[40px]">
                            {item.previsao}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-6 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-muted-foreground rounded-full" />
                  <span>Histórico</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded-full opacity-80" />
                  <span>Previsão IA</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações do Produto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Informações do Produto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Preço de Venda:</span>
              <span className="font-semibold">
                R$ {produto.precoVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Estoque Mínimo:</span>
              <span className="font-semibold">{produto.estoqueMinimo} unidades</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Categoria:</span>
              <Badge variant="outline">{produto.categoria}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Vendas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Histórico de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historicoVendas.slice(0, 5).map((venda) => (
                  <TableRow key={venda.id}>
                    <TableCell className="text-sm">
                      {new Date(venda.data).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="font-medium">{venda.quantidade}</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      R$ {venda.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProdutoDetalhes;