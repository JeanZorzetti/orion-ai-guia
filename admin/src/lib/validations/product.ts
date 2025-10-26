import { z } from 'zod';

export const productSchema = z.object({
  name: z.string({ message: 'Nome do produto é obrigatório' })
    .min(1, 'Nome não pode estar vazio')
    .max(255, 'Nome muito longo'),

  sku: z.string().optional(),

  description: z.string().optional(),

  category: z.string().optional(),

  cost_price: z.number({ message: 'Preço de custo é obrigatório' })
    .min(0, 'Preço de custo não pode ser negativo'),

  sale_price: z.number({ message: 'Preço de venda é obrigatório' })
    .positive('Preço de venda deve ser maior que zero'),

  stock_quantity: z.number({ message: 'Quantidade em estoque é obrigatória' })
    .int('Quantidade deve ser um número inteiro')
    .min(0, 'Quantidade não pode ser negativa'),

  min_stock_level: z.number({ message: 'Nível mínimo de estoque é obrigatório' })
    .int('Nível mínimo deve ser um número inteiro')
    .min(0, 'Nível mínimo não pode ser negativo'),

  unit: z.string().optional(),

  active: z.boolean(),

  // Campos Fiscais
  ncm_code: z.string()
    .length(8, 'NCM deve ter exatamente 8 dígitos')
    .regex(/^\d{8}$/, 'NCM deve conter apenas dígitos')
    .optional(),

  cest_code: z.string()
    .length(7, 'CEST deve ter exatamente 7 dígitos')
    .regex(/^\d{7}$/, 'CEST deve conter apenas dígitos')
    .optional(),

  origin: z.number()
    .int()
    .min(0, 'Origem deve estar entre 0 e 8')
    .max(8, 'Origem deve estar entre 0 e 8')
    .optional(),

  fiscal_description: z.string().max(500, 'Descrição fiscal muito longa').optional(),
}).refine(
  (data) => data.sale_price >= data.cost_price,
  {
    message: 'Preço de venda deve ser maior ou igual ao preço de custo',
    path: ['sale_price'],
  }
);

export type ProductFormData = z.infer<typeof productSchema>;

export const productUpdateSchema = productSchema.partial();

export type ProductUpdateFormData = z.infer<typeof productUpdateSchema>;

// Schema específico para ajuste de estoque
export const stockAdjustmentSchema = z.object({
  adjustment_type: z.enum(['in', 'out', 'correction']),
  quantity: z.number().int().positive('Quantidade deve ser maior que zero'),
  reason: z.string().min(1, 'Motivo é obrigatório').max(500, 'Motivo muito longo'),
});

export type StockAdjustmentFormData = z.infer<typeof stockAdjustmentSchema>;
