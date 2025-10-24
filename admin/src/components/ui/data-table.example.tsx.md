/**
 * EXEMPLO DE USO DO DATATABLE
 *
 * Este arquivo mostra como usar o componente DataTable genérico
 */

import { DataTable, DataTableColumn, DataTableAction } from './data-table';
import { Eye, Edit, Trash2, Package } from 'lucide-react';
import { Button } from './button';

// 1. Defina o tipo dos seus dados
interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  stock_quantity: number;
  sale_price: number;
  active: boolean;
}

// 2. Defina as colunas
const columns: DataTableColumn<Product>[] = [
  {
    key: 'sku',
    label: 'SKU',
    sortable: true,
    width: '120px',
  },
  {
    key: 'name',
    label: 'Produto',
    sortable: true,
  },
  {
    key: 'category',
    label: 'Categoria',
    sortable: true,
  },
  {
    key: 'stock_quantity',
    label: 'Estoque',
    sortable: true,
    align: 'right',
    render: (product) => (
      <span className="font-semibold">{product.stock_quantity}</span>
    ),
  },
  {
    key: 'sale_price',
    label: 'Preço',
    sortable: true,
    align: 'right',
    render: (product) => (
      <span>
        R$ {product.sale_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </span>
    ),
  },
  {
    key: 'active',
    label: 'Status',
    sortable: false,
    align: 'center',
    render: (product) => (
      <span
        className={`px-2 py-1 rounded text-xs ${
          product.active
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}
      >
        {product.active ? 'Ativo' : 'Inativo'}
      </span>
    ),
  },
];

// 3. Defina as ações por linha
const actions: DataTableAction<Product>[] = [
  {
    label: 'Visualizar',
    icon: Eye,
    onClick: (product) => console.log('View', product),
    variant: 'ghost',
  },
  {
    label: 'Editar',
    icon: Edit,
    onClick: (product) => console.log('Edit', product),
    variant: 'ghost',
  },
  {
    label: 'Excluir',
    icon: Trash2,
    onClick: (product) => console.log('Delete', product),
    variant: 'ghost',
    show: (product) => !product.active, // Só mostra se inativo
  },
];

// 4. Use o componente
export function ProductsTableExample() {
  const products: Product[] = [
    {
      id: 1,
      name: 'Produto A',
      sku: 'SKU-001',
      category: 'Eletrônicos',
      stock_quantity: 10,
      sale_price: 99.9,
      active: true,
    },
    // ... mais produtos
  ];

  return (
    <DataTable
      // Dados
      data={products}
      columns={columns}
      keyExtractor={(item) => item.id}

      // Estados
      loading={false}
      error={null}

      // Header
      title="Produtos"
      headerActions={
        <Button>
          Novo Produto
        </Button>
      }

      // Busca
      searchable={true}
      searchPlaceholder="Buscar produtos..."
      searchKeys={['name', 'sku', 'category']}

      // Paginação
      paginated={true}
      defaultPageSize={10}
      pageSizeOptions={[10, 25, 50, 100]}

      // Ações
      actions={actions}

      // Empty state
      emptyIcon={Package}
      emptyTitle="Nenhum produto encontrado"
      emptyDescription="Comece criando seu primeiro produto!"
      emptyAction={{
        label: 'Criar Primeiro Produto',
        onClick: () => console.log('Create product'),
      }}

      // Retry
      onRetry={() => console.log('Retry')}
    />
  );
}

// EXEMPLO SIMPLIFICADO (sem paginação, busca, etc)
export function SimpleTableExample() {
  const data = [
    { id: 1, name: 'Item 1', value: 100 },
    { id: 2, name: 'Item 2', value: 200 },
  ];

  return (
    <DataTable
      data={data}
      columns={[
        { key: 'name', label: 'Nome' },
        { key: 'value', label: 'Valor', align: 'right' },
      ]}
      keyExtractor={(item) => item.id}
      searchable={false}
      paginated={false}
    />
  );
}
