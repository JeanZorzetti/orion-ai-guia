'use client';

import React from 'react';

interface PrintLayoutProps {
  /**
   * Título do relatório
   */
  title: string;
  /**
   * Subtítulo ou descrição
   */
  subtitle?: string;
  /**
   * Conteúdo a ser impresso
   */
  children: React.ReactNode;
  /**
   * Mostrar cabeçalho da empresa
   */
  showHeader?: boolean;
  /**
   * Mostrar rodapé com data/hora
   */
  showFooter?: boolean;
  /**
   * Nome da empresa (opcional, usa padrão)
   */
  companyName?: string;
  /**
   * Informações adicionais no cabeçalho
   */
  headerInfo?: React.ReactNode;
  /**
   * Informações adicionais no rodapé
   */
  footerInfo?: React.ReactNode;
  /**
   * ID do elemento (para impressão seletiva)
   */
  id?: string;
}

/**
 * Layout para impressão de relatórios com cabeçalho e rodapé
 *
 * @example
 * <PrintLayout
 *   title="Relatório de Produtos"
 *   subtitle="Lista completa de produtos em estoque"
 *   showHeader
 *   showFooter
 * >
 *   <ProductsTable />
 * </PrintLayout>
 */
export function PrintLayout({
  title,
  subtitle,
  children,
  showHeader = true,
  showFooter = true,
  companyName = 'Orion ERP',
  headerInfo,
  footerInfo,
  id = 'print-content',
}: PrintLayoutProps) {
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const currentTime = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div id={id} className="print-layout">
      {/* Cabeçalho (apenas na impressão) */}
      {showHeader && (
        <div className="print-header hidden print:block">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{companyName}</h1>
              <p className="text-sm text-gray-600">Sistema de Gestão Empresarial</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold">{currentDate}</p>
              <p className="text-gray-600">{currentTime}</p>
            </div>
          </div>
          {headerInfo && (
            <div className="mt-2 pt-2 border-t border-gray-300">
              {headerInfo}
            </div>
          )}
        </div>
      )}

      {/* Título do Relatório */}
      <div className="print-report-title">
        <h2 className="text-xl font-bold mb-1">{title}</h2>
        {subtitle && (
          <p className="text-sm text-gray-600 mb-4">{subtitle}</p>
        )}
      </div>

      {/* Conteúdo */}
      <div className="print-content">
        {children}
      </div>

      {/* Rodapé (apenas na impressão) */}
      {showFooter && (
        <div className="print-footer hidden print:block">
          <div className="border-t border-gray-300 pt-2 mt-4">
            <div className="flex justify-between items-center text-xs text-gray-600">
              <div>
                {footerInfo || (
                  <span>© {new Date().getFullYear()} {companyName} - Todos os direitos reservados</span>
                )}
              </div>
              <div>
                <span>Impresso em {currentDate} às {currentTime}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Container para tabelas em relatórios impressos
 */
export function PrintTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="print-table-container">
      {children}
    </div>
  );
}

/**
 * Seção com título em relatórios
 */
export function PrintSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="print-section">
      <h3 className="text-lg font-semibold mb-3 mt-4">{title}</h3>
      {children}
    </div>
  );
}

/**
 * Grid de informações para relatórios
 */
export function PrintInfoGrid({
  items,
}: {
  items: Array<{ label: string; value: string | number | React.ReactNode }>;
}) {
  return (
    <div className="print-info-grid grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {items.map((item, index) => (
        <div key={index} className="print-info-item">
          <dt className="text-xs text-gray-600 mb-1">{item.label}</dt>
          <dd className="text-sm font-semibold">{item.value}</dd>
        </div>
      ))}
    </div>
  );
}

/**
 * Sumário/Resumo para relatórios
 */
export function PrintSummary({
  title = 'Resumo',
  items,
}: {
  title?: string;
  items: Array<{ label: string; value: string | number; highlight?: boolean }>;
}) {
  return (
    <div className="print-summary mt-6 p-4 border-2 border-gray-300 rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <dl className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className={`flex justify-between items-center ${
              item.highlight ? 'text-lg font-bold' : ''
            }`}
          >
            <dt>{item.label}:</dt>
            <dd className={item.highlight ? 'text-primary' : ''}>
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Quebra de página para impressão
 */
export function PrintPageBreak() {
  return <div className="print-page-break" />;
}

/**
 * Wrapper para esconder elementos na impressão
 */
export function NoPrint({ children }: { children: React.ReactNode }) {
  return <div className="no-print">{children}</div>;
}

/**
 * Wrapper para mostrar elementos apenas na impressão
 */
export function PrintOnly({ children }: { children: React.ReactNode }) {
  return <div className="hidden print:block">{children}</div>;
}
