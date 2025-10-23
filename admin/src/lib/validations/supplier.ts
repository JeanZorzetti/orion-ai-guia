import { z } from 'zod';

// Função para validar CPF/CNPJ (básica)
const validateDocument = (doc: string) => {
  const cleaned = doc.replace(/[^\d]/g, '');
  return cleaned.length === 11 || cleaned.length === 14;
};

export const supplierSchema = z.object({
  name: z.string({ message: 'Nome do fornecedor é obrigatório' })
    .min(1, 'Nome não pode estar vazio')
    .max(255, 'Nome muito longo'),

  document: z.string().optional().refine(
    (val) => !val || validateDocument(val),
    {
      message: 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos',
    }
  ),

  email: z.string().email('Email inválido').optional().or(z.literal('')),

  phone: z.string().optional(),

  address: z.string().optional(),

  city: z.string().optional(),

  state: z.string().optional(),

  zip_code: z.string().optional(),

  notes: z.string().optional(),

  active: z.boolean().default(true),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;

export const supplierUpdateSchema = supplierSchema.partial();

export type SupplierUpdateFormData = z.infer<typeof supplierUpdateSchema>;
