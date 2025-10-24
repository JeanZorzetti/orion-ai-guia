# Schemas de Validação com Zod

Este diretório contém todos os schemas de validação usando [Zod](https://zod.dev/) para garantir type-safety e validação consistente em todos os formulários.

## Schemas Disponíveis

### 1. Product Schema ([product.ts](./product.ts))

**Schema de Criação:**
```typescript
import { productSchema, type ProductFormData } from '@/lib/validations/product';
```

**Campos:**
- `name` (obrigatório): Nome do produto (1-255 caracteres)
- `sku` (opcional): Código SKU
- `description` (opcional): Descrição do produto
- `category` (opcional): Categoria
- `cost_price` (obrigatório): Preço de custo (≥ 0)
- `sale_price` (obrigatório): Preço de venda (> 0)
- `stock_quantity` (obrigatório): Quantidade em estoque (inteiro ≥ 0)
- `min_stock_level` (obrigatório): Nível mínimo de estoque (inteiro ≥ 0)
- `unit` (opcional): Unidade de medida
- `active` (obrigatório): Status ativo/inativo

**Validações Customizadas:**
- ✅ Preço de venda deve ser ≥ preço de custo

**Schema de Atualização:**
```typescript
import { productUpdateSchema, type ProductUpdateFormData } from '@/lib/validations/product';
```
Todos os campos são opcionais (`.partial()`).

**Schema de Ajuste de Estoque:**
```typescript
import { stockAdjustmentSchema, type StockAdjustmentFormData } from '@/lib/validations/product';
```

### 2. Invoice Schema ([invoice.ts](./invoice.ts))

**Schema de Criação:**
```typescript
import { invoiceSchema, type InvoiceFormData } from '@/lib/validations/invoice';
```

**Campos:**
- `invoice_number` (obrigatório): Número da fatura (único)
- `supplier_id` (obrigatório): ID do fornecedor
- `invoice_date` (obrigatório): Data de emissão
- `due_date` (obrigatório): Data de vencimento
- `total_value` (obrigatório): Valor total (> 0)
- `tax_value` (opcional): Valor de impostos (≥ 0)
- `net_value` (opcional): Valor líquido (≥ 0)
- `category` (opcional): Categoria
- `description` (opcional): Descrição
- `status` (obrigatório): pending | validated | paid | cancelled

**Validações Customizadas:**
- ✅ Data de vencimento deve ser ≥ data de emissão

### 3. Sale Schema ([sale.ts](./sale.ts))

**Schema de Criação:**
```typescript
import { saleSchema, type SaleFormData } from '@/lib/validations/sale';
```

**Campos:**
- `customer_name` (obrigatório): Nome do cliente (1-255 caracteres)
- `product_id` (obrigatório): ID do produto
- `quantity` (obrigatório): Quantidade (inteiro > 0)
- `unit_price` (obrigatório): Preço unitário (> 0)
- `total_value` (obrigatório): Valor total (> 0)
- `sale_date` (obrigatório): Data da venda
- `status` (obrigatório): pending | completed | cancelled
- `notes` (opcional): Observações

**Validações Customizadas:**
- ✅ total_value deve ser = quantity × unit_price

### 4. Supplier Schema ([supplier.ts](./supplier.ts))

**Schema de Criação:**
```typescript
import { supplierSchema, type SupplierFormData } from '@/lib/validations/supplier';
```

**Campos:**
- `name` (obrigatório): Nome do fornecedor (1-255 caracteres)
- `document` (opcional): CPF/CNPJ (validado)
- `email` (opcional): Email válido
- `phone` (opcional): Telefone
- `address` (opcional): Endereço
- `city` (opcional): Cidade
- `state` (opcional): Estado (UF com 2 caracteres)
- `zip_code` (opcional): CEP
- `active` (obrigatório): Status ativo/inativo

**Validações Customizadas:**
- ✅ Documento (CPF/CNPJ) validado com regex
- ✅ Estado (UF) deve ter exatamente 2 caracteres

## Como Usar em Componentes

### Exemplo Completo com React Hook Form

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, type ProductFormData } from '@/lib/validations/product';
import { toast } from 'sonner';

export function CreateProductForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      active: true,
      stock_quantity: 0,
      min_stock_level: 0,
      unit: 'un',
    },
  });

  const onSubmit = async (data: ProductFormData) => {
    try {
      await productService.create(data);
      toast.success('Produto criado com sucesso!');
      reset();
    } catch (error) {
      toast.error('Erro ao criar produto');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Campo de texto simples */}
      <div>
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Nome do produto"
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      {/* Campo numérico */}
      <div>
        <Label htmlFor="cost_price">Preço de Custo *</Label>
        <Input
          id="cost_price"
          type="number"
          step="0.01"
          {...register('cost_price', { valueAsNumber: true })}
        />
        {errors.cost_price && (
          <p className="text-sm text-destructive">{errors.cost_price.message}</p>
        )}
      </div>

      {/* Campo boolean com Switch */}
      <div>
        <Label htmlFor="active">Ativo</Label>
        <Switch
          id="active"
          checked={watch('active')}
          onCheckedChange={(checked) => setValue('active', checked)}
        />
      </div>

      <Button type="submit">Criar Produto</Button>
    </form>
  );
}
```

### Exemplo com FormModal

```typescript
import { FormModal } from '@/components/ui/form-modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, type ProductFormData } from '@/lib/validations/product';

export function CreateProductModal({ open, onOpenChange, onSuccess }) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  const onSubmit = async (data: ProductFormData) => {
    await productService.create(data);
    onSuccess?.();
  };

  return (
    <FormModalWithoutForm
      open={open}
      onOpenChange={onOpenChange}
      title="Criar Produto"
      footer={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit(onSubmit)}>
            Criar
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Campos do formulário */}
        <div>
          <Label>Nome</Label>
          <Input {...register('name')} />
          {errors.name && <p className="text-destructive">{errors.name.message}</p>}
        </div>
      </form>
    </FormModalWithoutForm>
  );
}
```

## Componentes que Já Usam Schemas

✅ **Produtos:**
- `CreateProductModal` - usa `productSchema`
- `EditProductModal` - usa `productUpdateSchema`
- `AdjustStockModal` - usa `stockAdjustmentSchema`

✅ **Faturas:**
- `CreateInvoiceModal` - usa `invoiceSchema`
- `EditInvoiceModal` - usa `invoiceSchema` (partial)

✅ **Vendas:**
- `CreateSaleModal` - usa `saleSchema`
- `EditSaleModal` - usa `saleSchema` (partial)

✅ **Fornecedores:**
- `CreateSupplierModal` - usa `supplierSchema`
- `EditSupplierModal` - usa `supplierSchema` (partial)

## Benefícios

- ✅ **Type Safety**: TypeScript infere os tipos automaticamente
- ✅ **Validação Consistente**: Mesmas regras em todo o sistema
- ✅ **Mensagens em PT-BR**: Todas as mensagens de erro personalizadas
- ✅ **Validações Customizadas**: Regras de negócio (ex: preço venda ≥ custo)
- ✅ **DRY**: Schemas reutilizados em create/edit/update
- ✅ **Runtime + Compile Time**: Validação em ambos os momentos

## Adicionando Novos Schemas

1. Crie um novo arquivo em `lib/validations/`
2. Defina o schema com Zod:

```typescript
import { z } from 'zod';

export const mySchema = z.object({
  field1: z.string().min(1, 'Campo obrigatório'),
  field2: z.number().positive('Deve ser positivo'),
});

export type MyFormData = z.infer<typeof mySchema>;
```

3. Use no componente com `zodResolver`:

```typescript
const { register, handleSubmit } = useForm<MyFormData>({
  resolver: zodResolver(mySchema),
});
```

## Referências

- [Zod Documentation](https://zod.dev/)
- [React Hook Form with Zod](https://react-hook-form.com/get-started#SchemaValidation)
- [TypeScript Type Inference](https://www.typescriptlang.org/docs/handbook/type-inference.html)
