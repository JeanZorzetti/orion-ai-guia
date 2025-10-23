import { z } from 'zod';

export const saleSchema = z.object({
  product_id: z.number({ message: 'Produto é obrigatório' })
    .positive('Selecione um produto válido'),

  customer_name: z.string({ message: 'Nome do cliente é obrigatório' })
    .min(1, 'Nome do cliente não pode estar vazio')
    .max(255, 'Nome muito longo'),

  quantity: z.number({ message: 'Quantidade é obrigatória' })
    .int('Quantidade deve ser um número inteiro')
    .positive('Quantidade deve ser maior que zero'),

  unit_price: z.number({ message: 'Preço unitário é obrigatório' })
    .positive('Preço unitário deve ser maior que zero'),

  total_value: z.number({ message: 'Valor total é obrigatório' })
    .positive('Valor total deve ser maior que zero'),

  sale_date: z.string({ message: 'Data da venda é obrigatória' })
    .min(1, 'Data da venda é obrigatória'),

  status: z.enum(['pending', 'completed', 'cancelled']),

  notes: z.string().optional(),
}).refine(
  (data) => {
    // Validar se total_value = quantity * unit_price (com margem de erro para arredondamento)
    const calculated = data.quantity * data.unit_price;
    const diff = Math.abs(calculated - data.total_value);
    return diff < 0.01; // Margem de 1 centavo
  },
  {
    message: 'Valor total deve ser igual a quantidade × preço unitário',
    path: ['total_value'],
  }
);

export type SaleFormData = z.infer<typeof saleSchema>;

export const saleUpdateSchema = saleSchema.partial();

export type SaleUpdateFormData = z.infer<typeof saleUpdateSchema>;
