/**
 * EXEMPLO DE USO DO FORMMODAL
 *
 * Este arquivo mostra como usar o componente FormModal genérico
 */

import { useState } from 'react';
import { FormModal, FormModalWithoutForm } from './form-modal';
import { Input } from './input';
import { Label } from './label';
import { Button } from './button';
import { toast } from 'sonner';

// EXEMPLO 1: FormModal com onSubmit simples
export function SimpleFormModalExample() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Simular uma chamada de API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`Produto "${name}" criado com sucesso!`);
      setName(''); // Limpar form
    } catch (error) {
      toast.error('Erro ao criar produto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Abrir Modal</Button>

      <FormModal
        open={open}
        onOpenChange={setOpen}
        title="Criar Novo Produto"
        description="Preencha as informações do produto abaixo"
        submitLabel="Criar Produto"
        cancelLabel="Cancelar"
        onSubmit={handleSubmit}
        loading={loading}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Produto</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome..."
              disabled={loading}
            />
          </div>
        </div>
      </FormModal>
    </>
  );
}

// EXEMPLO 2: FormModal com React Hook Form
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  sku: z.string().min(1, 'SKU é obrigatório'),
  price: z.number().positive('Preço deve ser positivo'),
});

type ProductFormData = z.infer<typeof productSchema>;

export function ReactHookFormModalExample() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Produto criado!');
      reset();
      setOpen(false);
    } catch (error) {
      toast.error('Erro ao criar produto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Criar com React Hook Form</Button>

      <FormModalWithoutForm
        open={open}
        onOpenChange={setOpen}
        title="Criar Produto"
        description="Use React Hook Form para validação"
        loading={loading}
        footer={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={loading}
            >
              Criar
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              {...register('name')}
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              {...register('sku')}
              disabled={loading}
            />
            {errors.sku && (
              <p className="text-sm text-destructive mt-1">
                {errors.sku.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="price">Preço</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              {...register('price', { valueAsNumber: true })}
              disabled={loading}
            />
            {errors.price && (
              <p className="text-sm text-destructive mt-1">
                {errors.price.message}
              </p>
            )}
          </div>
        </form>
      </FormModalWithoutForm>
    </>
  );
}

// EXEMPLO 3: FormModal com diferentes tamanhos
export function DifferentSizesExample() {
  const [openSm, setOpenSm] = useState(false);
  const [openMd, setOpenMd] = useState(false);
  const [openLg, setOpenLg] = useState(false);
  const [openXl, setOpenXl] = useState(false);

  return (
    <div className="space-x-2">
      <Button onClick={() => setOpenSm(true)}>Small (sm)</Button>
      <Button onClick={() => setOpenMd(true)}>Medium (md)</Button>
      <Button onClick={() => setOpenLg(true)}>Large (lg)</Button>
      <Button onClick={() => setOpenXl(true)}>Extra Large (xl)</Button>

      <FormModal
        open={openSm}
        onOpenChange={setOpenSm}
        title="Modal Pequeno"
        size="sm"
      >
        <p>Conteúdo do modal pequeno</p>
      </FormModal>

      <FormModal
        open={openMd}
        onOpenChange={setOpenMd}
        title="Modal Médio"
        size="md"
      >
        <p>Conteúdo do modal médio (padrão)</p>
      </FormModal>

      <FormModal
        open={openLg}
        onOpenChange={setOpenLg}
        title="Modal Grande"
        size="lg"
      >
        <p>Conteúdo do modal grande</p>
      </FormModal>

      <FormModal
        open={openXl}
        onOpenChange={setOpenXl}
        title="Modal Extra Grande"
        size="xl"
      >
        <p>Conteúdo do modal extra grande</p>
      </FormModal>
    </div>
  );
}

// EXEMPLO 4: FormModal que previne fechamento
export function PreventCloseExample() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setLoading(false);
    setHasChanges(false);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Modal com Prevent Close</Button>

      <FormModal
        open={open}
        onOpenChange={setOpen}
        title="Editar Produto"
        description="As alterações não salvas serão perdidas se você fechar o modal"
        submitLabel="Salvar"
        onSubmit={handleSubmit}
        loading={loading}
        preventClose={hasChanges || loading}
        closeOnSubmit={true}
      >
        <div className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input
              onChange={() => setHasChanges(true)}
              disabled={loading}
            />
          </div>
          {hasChanges && (
            <p className="text-sm text-amber-600">
              Você tem alterações não salvas
            </p>
          )}
        </div>
      </FormModal>
    </>
  );
}

// EXEMPLO 5: Keyboard shortcuts
export function KeyboardShortcutsInfo() {
  return (
    <div className="p-4 border rounded-lg bg-muted/50">
      <h3 className="font-semibold mb-2">Atalhos de Teclado do FormModal</h3>
      <ul className="space-y-1 text-sm">
        <li>
          <kbd className="px-2 py-1 bg-background border rounded">ESC</kbd> - Fechar modal (se não estiver preventClose)
        </li>
        <li>
          <kbd className="px-2 py-1 bg-background border rounded">Ctrl/Cmd</kbd> +{' '}
          <kbd className="px-2 py-1 bg-background border rounded">Enter</kbd> - Submeter formulário
        </li>
      </ul>
    </div>
  );
}
