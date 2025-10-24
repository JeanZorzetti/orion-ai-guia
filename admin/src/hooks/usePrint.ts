'use client';

import { useState, useCallback } from 'react';

interface UsePrintOptions {
  /**
   * Título do documento que aparecerá na impressão
   */
  documentTitle?: string;
  /**
   * Callback executado antes de imprimir
   */
  onBeforePrint?: () => void;
  /**
   * Callback executado após impressão/cancelamento
   */
  onAfterPrint?: () => void;
}

interface UsePrintReturn {
  /**
   * Estado indicando se está no modo de impressão
   */
  isPrinting: boolean;
  /**
   * Função para acionar a impressão
   */
  handlePrint: () => void;
  /**
   * Função para imprimir um elemento específico por ID
   */
  printElement: (elementId: string) => void;
}

/**
 * Hook para gerenciar funcionalidade de impressão
 *
 * @example
 * const { isPrinting, handlePrint } = usePrint({
 *   documentTitle: 'Relatório de Produtos',
 *   onBeforePrint: () => console.log('Preparando impressão...'),
 *   onAfterPrint: () => console.log('Impressão concluída'),
 * });
 *
 * // Usar com PrintButton
 * <PrintButton onClick={handlePrint} disabled={isPrinting} />
 */
export function usePrint(options: UsePrintOptions = {}): UsePrintReturn {
  const { documentTitle, onBeforePrint, onAfterPrint } = options;
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = useCallback(() => {
    setIsPrinting(true);

    // Salvar título original
    const originalTitle = document.title;

    // Definir título personalizado se fornecido
    if (documentTitle) {
      document.title = documentTitle;
    }

    // Executar callback antes de imprimir
    if (onBeforePrint) {
      onBeforePrint();
    }

    // Aguardar um frame para garantir que o estado seja atualizado
    requestAnimationFrame(() => {
      // Acionar impressão
      window.print();

      // Restaurar título original
      if (documentTitle) {
        document.title = originalTitle;
      }

      // Executar callback após impressão
      if (onAfterPrint) {
        onAfterPrint();
      }

      setIsPrinting(false);
    });
  }, [documentTitle, onBeforePrint, onAfterPrint]);

  const printElement = useCallback(
    (elementId: string) => {
      const element = document.getElementById(elementId);

      if (!element) {
        console.error(`Elemento com ID "${elementId}" não encontrado`);
        return;
      }

      setIsPrinting(true);

      // Salvar título original
      const originalTitle = document.title;

      // Definir título personalizado se fornecido
      if (documentTitle) {
        document.title = documentTitle;
      }

      // Executar callback antes de imprimir
      if (onBeforePrint) {
        onBeforePrint();
      }

      // Criar janela de impressão com apenas o conteúdo do elemento
      const printWindow = window.open('', '_blank');

      if (!printWindow) {
        console.error('Não foi possível abrir janela de impressão');
        setIsPrinting(false);
        return;
      }

      // Copiar estilos da página principal
      const styles = Array.from(document.styleSheets)
        .map(styleSheet => {
          try {
            return Array.from(styleSheet.cssRules)
              .map(rule => rule.cssText)
              .join('\n');
          } catch (e) {
            // Ignorar erros de CORS
            return '';
          }
        })
        .join('\n');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${documentTitle || originalTitle}</title>
            <style>${styles}</style>
          </head>
          <body>
            ${element.innerHTML}
          </body>
        </html>
      `);

      printWindow.document.close();

      // Aguardar carregamento e imprimir
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();

        // Restaurar título original
        if (documentTitle) {
          document.title = originalTitle;
        }

        // Executar callback após impressão
        if (onAfterPrint) {
          onAfterPrint();
        }

        setIsPrinting(false);
      };
    },
    [documentTitle, onBeforePrint, onAfterPrint]
  );

  return {
    isPrinting,
    handlePrint,
    printElement,
  };
}

/**
 * Hook simplificado para impressão básica
 */
export function useSimplePrint(documentTitle?: string) {
  return usePrint({ documentTitle });
}
