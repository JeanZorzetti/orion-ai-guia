"""
Schemas para DRE (Demonstração do Resultado do Exercício).

DRE é um relatório contábil que mostra:
- Receitas
- Custos e Despesas
- Lucro/Prejuízo

Formato padrão brasileiro (simplificado):
1. Receita Bruta de Vendas
2. (-) Deduções e Impostos sobre Vendas
3. (=) Receita Líquida
4. (-) CMV (Custo de Mercadorias Vendidas)
5. (=) Lucro Bruto
6. (-) Despesas Operacionais
7. (=) EBITDA
8. (-) Depreciação/Amortização
9. (-) Juros
10. (=) LAIR (Lucro Antes do IR)
11. (-) IR e CSLL
12. (=) Lucro Líquido
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date


class DRELineItem(BaseModel):
    """
    Uma linha do DRE.
    """
    category: str = Field(..., description="Categoria da linha (ex: 'Receita Bruta')")
    value: float = Field(..., description="Valor (positivo ou negativo)")
    is_total: bool = Field(default=False, description="Se é uma linha de total/subtotal")
    percentage_of_revenue: Optional[float] = Field(None, description="Percentual sobre receita bruta")


class DREResponse(BaseModel):
    """
    Resposta completa do DRE.
    """
    period_start: date = Field(..., description="Data inicial do período")
    period_end: date = Field(..., description="Data final do período")

    # Linhas do DRE
    items: List[DRELineItem] = Field(..., description="Linhas do DRE")

    # Principais indicadores (para fácil acesso)
    receita_bruta: float = Field(..., description="Receita Bruta total")
    receita_liquida: float = Field(..., description="Receita Líquida")
    lucro_bruto: float = Field(..., description="Lucro Bruto")
    ebitda: float = Field(..., description="EBITDA")
    lucro_liquido: float = Field(..., description="Lucro Líquido")

    # Margens (%)
    margem_bruta: float = Field(..., description="Margem Bruta (%)")
    margem_ebitda: float = Field(..., description="Margem EBITDA (%)")
    margem_liquida: float = Field(..., description="Margem Líquida (%)")

    # Metadata
    transactions_count: int = Field(..., description="Número de transações analisadas")
    data_source: str = Field(
        default="cash_flow",
        description="Fonte dos dados (cash_flow, sales, etc.)"
    )


class DRECategoryMapping(BaseModel):
    """
    Mapeamento de categorias de transações para linhas do DRE.

    Permite customização por workspace de como as categorias são
    classificadas no DRE.
    """
    revenue_categories: List[str] = Field(
        default=[
            "Venda",
            "Receita de Serviço",
            "Receita de Produto",
            "Outras Receitas"
        ],
        description="Categorias que são consideradas receita"
    )

    tax_categories: List[str] = Field(
        default=[
            "Impostos",
            "PIS",
            "COFINS",
            "ICMS",
            "ISS",
            "Taxas"
        ],
        description="Categorias de impostos e deduções"
    )

    cogs_categories: List[str] = Field(
        default=[
            "CMV",
            "Custo de Produto Vendido",
            "Custo de Mercadoria",
            "Compra de Estoque"
        ],
        description="Categorias de Custo de Mercadorias Vendidas"
    )

    operational_expense_categories: List[str] = Field(
        default=[
            "Salários",
            "Encargos",
            "Aluguel",
            "Marketing",
            "Vendas",
            "Administrativo",
            "Tecnologia",
            "Escritório",
            "Utilities"
        ],
        description="Categorias de despesas operacionais"
    )

    depreciation_categories: List[str] = Field(
        default=[
            "Depreciação",
            "Amortização"
        ],
        description="Categorias de depreciação/amortização"
    )

    financial_expense_categories: List[str] = Field(
        default=[
            "Juros",
            "Multas",
            "Encargos Financeiros",
            "Taxas Bancárias"
        ],
        description="Categorias de despesas financeiras"
    )
