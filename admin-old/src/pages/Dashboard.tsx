import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './src/components/ui/card';
import { Button } from './src/components/ui/button';
import { Badge } from './src/components/ui/badge';
import { 
  Upload, 
  AlertTriangle, 
  Calendar, 
  TrendingUp,
  FileText,
  Package,
  DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const contasAVencer = [
    { id: 1, fornecedor: 'Fornecedor ABC Ltda', vencimento: '2024-01-15', valor: 2500.00 },
    { id: 2, fornecedor: 'Distribuidora XYZ', vencimento: '2024-01-18', valor: 1800.50 },
    { id: 3, fornecedor: 'Serviços Tech', vencimento: '2024-01-20', valor: 980.00 },
  ];

  const produtosBaixoEstoque = [
    { id: 1, nome: 'Produto A', estoque: 5, minimo: 20 },
    { id: 2, nome: 'Produto B', estoque: 12, minimo: 50 },
    { id: 3, nome: 'Produto C', estoque: 8, minimo: 30 },
  ];

  const vendasSemana = [
    { dia: 'Seg', valor: 1200 },
    { dia: 'Ter', valor: 1800 },
    { dia: 'Qua', valor: 2200 },
    { dia: 'Qui', valor: 1600 },
    { dia: 'Sex', valor: 2800 },
    { dia: 'Sáb', valor: 3200 },
    { dia: 'Dom', valor: 1400 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Bem-vindo de volta, João!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Ações Rápidas */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Comece por aqui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Automatize seu fluxo financeiro em segundos
            </p>
            <Button size="lg" className="w-full" data-tour="import-button">
              <FileText className="mr-2 h-4 w-4" />
              Importar Fatura
            </Button>
          </CardContent>
        </Card>

        {/* Card 2: Contas a Vencer */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              Contas a Vencer
            </CardTitle>
            <Link 
              to="/admin/financeiro/contas-a-pagar" 
              className="text-sm text-primary hover:underline"
            >
              Ver todas
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {contasAVencer.map((conta) => (
              <div key={conta.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{conta.fornecedor}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {conta.vencimento}
                  </p>
                </div>
                <p className="font-semibold text-sm">
                  R$ {conta.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Card 3: Alerta de Estoque */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Atenção ao Estoque
            </CardTitle>
            <Link 
              to="/admin/estoque/produtos" 
              className="text-sm text-primary hover:underline"
            >
              Ver todos os produtos
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {produtosBaixoEstoque.map((produto) => (
              <div key={produto.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                <div>
                  <p className="font-medium text-sm">{produto.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    Mínimo: {produto.minimo} unidades
                  </p>
                </div>
                <Badge variant="destructive" className="text-xs">
                  {produto.estoque} restantes
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Card 4: Visão Rápida de Vendas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Vendas da Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {vendasSemana.map((venda, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{venda.dia}</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-2 bg-primary rounded-full" 
                      style={{ width: `${(venda.valor / 3200) * 60}px` }}
                    />
                    <span className="text-sm font-medium min-w-[80px] text-right">
                      R$ {venda.valor.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Total: <span className="font-semibold text-foreground">
                  R$ {vendasSemana.reduce((sum, v) => sum + v.valor, 0).toLocaleString('pt-BR')}
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;