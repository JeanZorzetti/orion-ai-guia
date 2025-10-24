'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Search,
  FileText,
  Package,
  ShoppingCart,
  Building2,
  Loader2,
} from 'lucide-react';
import { invoiceService } from '@/services/invoice';
import { productService } from '@/services/product';
import { saleService } from '@/services/sale';
import { supplierService } from '@/services/supplier';

interface SearchResult {
  id: number;
  title: string;
  subtitle?: string;
  type: 'invoice' | 'product' | 'sale' | 'supplier';
  url: string;
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Atalho Ctrl+K para abrir busca
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Limpar busca ao fechar
  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      setResults([]);
    }
  }, [open]);

  // Realizar busca
  const performSearch = useCallback(async (term: string) => {
    if (!term || term.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const searchResults: SearchResult[] = [];

    try {
      // Buscar em paralelo em todas as entidades
      const [invoices, products, sales, suppliers] = await Promise.all([
        invoiceService.getAll().catch(() => []),
        productService.getAll().catch(() => []),
        saleService.getAll().catch(() => []),
        supplierService.getAll().catch(() => []),
      ]);

      const lowerTerm = term.toLowerCase();

      // Buscar faturas
      invoices
        .filter(
          (inv) =>
            inv.invoice_number.toLowerCase().includes(lowerTerm) ||
            inv.supplier?.name?.toLowerCase().includes(lowerTerm)
        )
        .slice(0, 5)
        .forEach((inv) => {
          searchResults.push({
            id: inv.id,
            title: `Fatura #${inv.invoice_number}`,
            subtitle: inv.supplier?.name || 'Sem fornecedor',
            type: 'invoice',
            url: '/admin/financeiro/contas-a-pagar',
          });
        });

      // Buscar produtos
      products
        .filter(
          (prod) =>
            prod.name.toLowerCase().includes(lowerTerm) ||
            prod.sku?.toLowerCase().includes(lowerTerm)
        )
        .slice(0, 5)
        .forEach((prod) => {
          searchResults.push({
            id: prod.id,
            title: prod.name,
            subtitle: prod.sku || 'Sem SKU',
            type: 'product',
            url: '/admin/estoque/produtos',
          });
        });

      // Buscar vendas
      sales
        .filter((sale) => sale.customer_name.toLowerCase().includes(lowerTerm))
        .slice(0, 5)
        .forEach((sale) => {
          searchResults.push({
            id: sale.id,
            title: `Venda #${sale.id} - ${sale.customer_name}`,
            subtitle: sale.product?.name || `Produto #${sale.product_id}`,
            type: 'sale',
            url: '/admin/vendas',
          });
        });

      // Buscar fornecedores
      suppliers
        .filter(
          (sup) =>
            sup.name.toLowerCase().includes(lowerTerm) ||
            sup.document?.toLowerCase().includes(lowerTerm) ||
            sup.email?.toLowerCase().includes(lowerTerm)
        )
        .slice(0, 5)
        .forEach((sup) => {
          searchResults.push({
            id: sup.id,
            title: sup.name,
            subtitle: sup.document || sup.email || '',
            type: 'supplier',
            url: '/admin/fornecedores',
          });
        });

      setResults(searchResults);
    } catch (error) {
      console.error('Erro ao buscar:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, performSearch]);

  const handleSelect = (result: SearchResult) => {
    router.push(result.url);
    setOpen(false);
  };

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'invoice':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'product':
        return <Package className="h-4 w-4 text-green-600" />;
      case 'sale':
        return <ShoppingCart className="h-4 w-4 text-purple-600" />;
      case 'supplier':
        return <Building2 className="h-4 w-4 text-orange-600" />;
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'invoice':
        return 'Fatura';
      case 'product':
        return 'Produto';
      case 'sale':
        return 'Venda';
      case 'supplier':
        return 'Fornecedor';
    }
  };

  return (
    <>
      {/* Botão para abrir busca */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Search className="h-4 w-4" />
        <span>Buscar...</span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-gray-100 px-1.5 font-mono text-xs text-gray-600">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Dialog de busca */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0 gap-0">
          <div className="flex items-center border-b px-4">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Buscar faturas, produtos, vendas, fornecedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
          </div>

          <div className="max-h-[400px] overflow-y-auto p-2">
            {searchTerm.length < 2 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                Digite pelo menos 2 caracteres para buscar...
              </div>
            ) : results.length === 0 && !loading ? (
              <div className="py-8 text-center text-sm text-gray-500">
                Nenhum resultado encontrado para &quot;{searchTerm}&quot;
              </div>
            ) : (
              <div className="space-y-1">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelect(result)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-left transition-colors"
                  >
                    {getIcon(result.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                      {getTypeLabel(result.type)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t px-4 py-3 text-xs text-gray-500 flex items-center justify-between">
            <span>Use ↑↓ para navegar</span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">ESC</kbd> para fechar
            </span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
