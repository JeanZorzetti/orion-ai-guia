'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supplierService } from '@/services/supplier';
import { Supplier } from '@/types';
import { toast } from 'sonner';
import { supplierSchema } from '@/lib/validations/supplier';

type SupplierFormData = z.infer<typeof supplierSchema>;

interface EditSupplierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  onSuccess: () => void;
}

const EditSupplierModal: React.FC<EditSupplierModalProps> = ({
  open,
  onOpenChange,
  supplier,
  onSuccess,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<SupplierFormData & { active: boolean }>({
    resolver: zodResolver(supplierSchema.extend({ active: z.boolean() })),
  });

  const active = watch('active');

  useEffect(() => {
    if (supplier && open) {
      setValue('name', supplier.name);
      setValue('document', supplier.document || '');
      setValue('email', supplier.email || '');
      setValue('phone', supplier.phone || '');
      setValue('address', supplier.address || '');
      setValue('city', supplier.city || '');
      setValue('state', supplier.state || '');
      setValue('zip_code', supplier.zip_code || '');
      setValue('active', supplier.active);
    }
  }, [supplier, open, setValue]);

  const onSubmit = async (data: SupplierFormData & { active: boolean }) => {
    if (!supplier) return;

    try {
      await supplierService.update(supplier.id, data);
      toast.success('Fornecedor atualizado com sucesso!');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao atualizar fornecedor:', error);
      toast.error('Erro ao atualizar fornecedor. Verifique os dados e tente novamente.');
    }
  };

  if (!supplier) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Fornecedor</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nome */}
          <div>
            <Label htmlFor="name">
              Nome <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Nome do fornecedor"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Documento */}
          <div>
            <Label htmlFor="document">Documento (CPF/CNPJ)</Label>
            <Input
              id="document"
              {...register('document')}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              className={errors.document ? 'border-red-500' : ''}
            />
            {errors.document && (
              <p className="text-sm text-red-500 mt-1">{errors.document.message}</p>
            )}
          </div>

          {/* Email e Telefone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="email@exemplo.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="(00) 00000-0000"
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* Endereço */}
          <div>
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              {...register('address')}
              placeholder="Rua, número, complemento"
              className={errors.address ? 'border-red-500' : ''}
            />
            {errors.address && (
              <p className="text-sm text-red-500 mt-1">{errors.address.message}</p>
            )}
          </div>

          {/* Cidade, Estado, CEP */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                {...register('city')}
                placeholder="Cidade"
                className={errors.city ? 'border-red-500' : ''}
              />
              {errors.city && (
                <p className="text-sm text-red-500 mt-1">{errors.city.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="state">Estado</Label>
              <Input
                id="state"
                {...register('state')}
                placeholder="UF"
                maxLength={2}
                className={errors.state ? 'border-red-500' : ''}
              />
              {errors.state && (
                <p className="text-sm text-red-500 mt-1">{errors.state.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="zip_code">CEP</Label>
              <Input
                id="zip_code"
                {...register('zip_code')}
                placeholder="00000-000"
                className={errors.zip_code ? 'border-red-500' : ''}
              />
              {errors.zip_code && (
                <p className="text-sm text-red-500 mt-1">{errors.zip_code.message}</p>
              )}
            </div>
          </div>

          {/* Status Ativo */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="active" className="text-base">
                Fornecedor Ativo
              </Label>
              <p className="text-sm text-gray-500">
                Desative para ocultar este fornecedor da listagem principal
              </p>
            </div>
            <Switch
              id="active"
              checked={active}
              onCheckedChange={(checked) => setValue('active', checked)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditSupplierModal;
