import { z } from 'zod';

export const invoiceSchema = z.object({
  supplier_id: z.number({ message: 'Fornecedor é obrigatório' })
    .positive('Selecione um fornecedor válido'),

  invoice_number: z.string({ message: 'Número da fatura é obrigatório' })
    .min(1, 'Número da fatura não pode estar vazio'),

  invoice_date: z.string({ message: 'Data de emissão é obrigatória' })
    .min(1, 'Data de emissão é obrigatória'),

  due_date: z.string().optional(),

  total_value: z.number({ message: 'Valor total é obrigatório' })
    .positive('Valor total deve ser maior que zero'),

  net_value: z.number().optional(),

  tax_value: z.number().optional(),

  status: z.enum(['pending', 'validated', 'paid', 'cancelled']),

  category: z.string().optional(),

  notes: z.string().optional(),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;

// Schema para edição (todos os campos opcionais exceto o que você quer forçar)
export const invoiceUpdateSchema = invoiceSchema.partial();

export type InvoiceUpdateFormData = z.infer<typeof invoiceUpdateSchema>;
