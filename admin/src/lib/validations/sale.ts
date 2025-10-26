import { z } from 'zod';

export const saleSchema = z.object({
  product_id: z.number({ message: 'Produto é obrigatório' })
    .positive('Selecione um produto válido'),

  customer_name: z.string({ message: 'Nome do cliente é obrigatório' })
    .min(1, 'Nome do cliente não pode estar vazio')
    .max(255, 'Nome muito longo'),

  customer_cpf_cnpj: z.string().max(14).optional(),
  customer_email: z.string().email('Email inválido').max(255).optional().or(z.literal('')),
  customer_phone: z.string().max(20).optional(),

  // Endereço do Cliente
  customer_cep: z.string().max(8).optional(),
  customer_logradouro: z.string().max(255).optional(),
  customer_numero: z.string().max(20).optional(),
  customer_complemento: z.string().max(100).optional(),
  customer_bairro: z.string().max(100).optional(),
  customer_cidade: z.string().max(100).optional(),
  customer_uf: z.string().max(2).optional(),
  customer_codigo_municipio: z.string().max(7).optional(),

  quantity: z.number({ message: 'Quantidade é obrigatória' })
    .int('Quantidade deve ser um número inteiro')
    .positive('Quantidade deve ser maior que zero'),

  unit_price: z.number({ message: 'Preço unitário é obrigatório' })
    .positive('Preço unitário deve ser maior que zero'),

  total_value: z.number({ message: 'Valor total é obrigatório' })
    .positive('Valor total deve ser maior que zero'),

  sale_date: z.string({ message: 'Data da venda é obrigatória' })
    .min(1, 'Data da venda é obrigatória'),

  status: z.enum(['pending', 'completed', 'cancelled']).optional(),

  // Campos fiscais
  natureza_operacao: z.string().max(100).optional(),
  cfop: z.string().max(4).optional(),
  origin_channel: z.string().max(50).optional(),
  origin_order_id: z.string().max(100).optional(),
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
