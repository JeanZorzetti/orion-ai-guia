'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download, X, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { fiscalService } from '@/services/fiscal';
import { Badge } from '@/components/ui/badge';
import type { Sale, NFEStatus } from '@/types/fiscal';

interface NFEActionsProps {
  sale: Sale;
  onUpdate: () => void;
}

export function NFEActions({ sale, onUpdate }: NFEActionsProps) {
  const [loading, setLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  async function handleIssue() {
    setLoading(true);
    try {
      const result = await fiscalService.issueNFe(sale.id);

      if (result.success) {
        toast.success('NF-e emitida com sucesso!', {
          description: `Chave: ${result.nfe_chave}`,
        });
        onUpdate();
      } else {
        toast.error('Erro ao emitir NF-e', {
          description: result.error || 'Erro desconhecido',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao emitir NF-e';
      toast.error('Erro ao emitir NF-e', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (cancelReason.length < 15) {
      toast.error('A justificativa deve ter no mínimo 15 caracteres');
      return;
    }

    setLoading(true);
    try {
      const result = await fiscalService.cancelNFe(sale.id, cancelReason);

      if (result.success) {
        toast.success('NF-e cancelada com sucesso');
        setCancelDialogOpen(false);
        setCancelReason('');
        onUpdate();
      } else {
        toast.error('Erro ao cancelar NF-e', {
          description: result.error || 'Erro desconhecido',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao cancelar NF-e';
      toast.error('Erro ao cancelar NF-e', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }

  function renderStatusBadge() {
    const statusMap: Record<NFEStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Pendente', variant: 'secondary' },
      processing: { label: 'Processando', variant: 'default' },
      issued: { label: 'Emitida', variant: 'default' },
      rejected: { label: 'Rejeitada', variant: 'destructive' },
      cancelled: { label: 'Cancelada', variant: 'outline' },
    };

    // Default para 'pending' se nfe_status não estiver definido
    const nfeStatus = sale.nfe_status || 'pending';
    const status = statusMap[nfeStatus];

    return (
      <Badge variant={status.variant} className="flex items-center gap-1">
        {nfeStatus === 'issued' && <CheckCircle className="h-3 w-3" />}
        {nfeStatus === 'rejected' && <AlertTriangle className="h-3 w-3" />}
        {nfeStatus === 'processing' && <Loader2 className="h-3 w-3 animate-spin" />}
        {status.label}
      </Badge>
    );
  }

  // Default para 'pending' se não estiver definido
  const nfeStatus = sale.nfe_status || 'pending';

  return (
    <div className="flex items-center gap-2">
      {renderStatusBadge()}

      {(nfeStatus === 'pending' || !sale.nfe_status) && (
        <Button
          size="sm"
          onClick={handleIssue}
          disabled={loading}
          variant="default"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Emitindo...
            </>
          ) : (
            <>
              <FileText className="mr-2 h-4 w-4" />
              Emitir NF-e
            </>
          )}
        </Button>
      )}

      {nfeStatus === 'issued' && (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() => sale.nfe_danfe_url && window.open(sale.nfe_danfe_url, '_blank')}
            disabled={!sale.nfe_danfe_url}
          >
            <Download className="mr-2 h-4 w-4" />
            DANFE
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => sale.nfe_xml_url && window.open(sale.nfe_xml_url, '_blank')}
            disabled={!sale.nfe_xml_url}
          >
            <Download className="mr-2 h-4 w-4" />
            XML
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setCancelDialogOpen(true)}
            disabled={loading}
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
        </>
      )}

      {nfeStatus === 'rejected' && (
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground max-w-xs truncate">
            {sale.nfe_rejection_reason}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={handleIssue}
            disabled={loading}
          >
            Tentar Novamente
          </Button>
        </div>
      )}

      {nfeStatus === 'cancelled' && sale.nfe_cancelled_at && (
        <p className="text-sm text-muted-foreground">
          Cancelada em {new Date(sale.nfe_cancelled_at).toLocaleDateString('pt-BR')}
        </p>
      )}

      {/* Dialog de Cancelamento */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar NF-e</DialogTitle>
            <DialogDescription>
              O cancelamento só é permitido até 24 horas após a emissão.
              Forneça uma justificativa (mínimo 15 caracteres).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Justificativa *</Label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex: Cliente solicitou cancelamento da compra"
                rows={4}
                minLength={15}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {cancelReason.length}/15 caracteres mínimos
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false);
                setCancelReason('');
              }}
              disabled={loading}
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={loading || cancelReason.length < 15}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                'Confirmar Cancelamento'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
