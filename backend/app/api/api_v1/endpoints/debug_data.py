"""
Debug Data Seeding Endpoint
============================
Endpoints para popular o sistema com dados realistas de teste
e limpar dados de debug quando necessário.

Caso de uso: Indústria de Moda Praia com 3 lojas, faturamento 7M/ano
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models import User, Product, Sale, BankAccount, CashFlowTransaction
from app.models.customer import Customer
from datetime import datetime, timedelta
import random
from typing import Dict, Any, List

router = APIRouter()


# ============================================================================
# DADOS REALISTAS - MODA PRAIA
# ============================================================================

BEACH_FASHION_PRODUCTS = [
    # FEMININO - Biquínis (60% do catálogo)
    {
        "category": "Biquíni Feminino",
        "items": [
            {"name": "Biquíni Hot Pant Cintura Alta Preto", "sku": "BIQ-HP-001", "base_price": 219.90, "weight": 0.15, "ncm": "61123100"},
            {"name": "Biquíni Asa Delta Floral Tropical", "sku": "BIQ-AD-002", "base_price": 199.90, "weight": 0.12, "ncm": "61123100"},
            {"name": "Biquíni Cortininha Liso Coral", "sku": "BIQ-CT-003", "base_price": 209.90, "weight": 0.13, "ncm": "61123100"},
            {"name": "Biquíni Fio Dental Tie Dye", "sku": "BIQ-FD-004", "base_price": 189.90, "weight": 0.10, "ncm": "61123100"},
            {"name": "Biquíni Plus Size Frente Única", "sku": "BIQ-PS-005", "base_price": 239.90, "weight": 0.18, "ncm": "61123100"},
            {"name": "Biquíni Top Cropped Com Proteção UV", "sku": "BIQ-TC-006", "base_price": 249.90, "weight": 0.16, "ncm": "61123100"},
            {"name": "Biquíni Ombro Só Listrado Vintage", "sku": "BIQ-OS-007", "base_price": 229.90, "weight": 0.14, "ncm": "61123100"},
            {"name": "Biquíni Bojo Removível Azul Marinho", "sku": "BIQ-BR-008", "base_price": 259.90, "weight": 0.17, "ncm": "61123100"},
            {"name": "Biquíni Crochê Boho Chic Off White", "sku": "BIQ-CR-009", "base_price": 279.90, "weight": 0.14, "ncm": "61123100"},
            {"name": "Biquíni Assimétrico Animal Print", "sku": "BIQ-AS-010", "base_price": 269.90, "weight": 0.15, "ncm": "61123100"},
        ]
    },
    # FEMININO - Maiôs (15% do catálogo)
    {
        "category": "Maiô Feminino",
        "items": [
            {"name": "Maiô Cavado Preto Clássico", "sku": "MAI-CV-001", "base_price": 249.90, "weight": 0.20, "ncm": "61123100"},
            {"name": "Maiô Decote Profundo Metalizado", "sku": "MAI-DP-002", "base_price": 289.90, "weight": 0.22, "ncm": "61123100"},
            {"name": "Maiô Manga Longa UV50+ Estampado", "sku": "MAI-ML-003", "base_price": 299.90, "weight": 0.25, "ncm": "61123100"},
            {"name": "Maiô Frente Única Franzido", "sku": "MAI-FU-004", "base_price": 259.90, "weight": 0.21, "ncm": "61123100"},
        ]
    },
    # MASCULINO - Sungas e Shorts (15% do catálogo)
    {
        "category": "Moda Praia Masculina",
        "items": [
            {"name": "Sunga Slip Dry Fit Preta", "sku": "SUN-SL-001", "base_price": 89.90, "weight": 0.08, "ncm": "61123100"},
            {"name": "Sunga Boxer Listrada Retrô", "sku": "SUN-BX-002", "base_price": 99.90, "weight": 0.10, "ncm": "61123100"},
            {"name": "Short Praia Surf Estampa Tropical", "sku": "SHO-SF-001", "base_price": 129.90, "weight": 0.18, "ncm": "61034200"},
            {"name": "Bermudão Surf Long Degradê", "sku": "SHO-LG-002", "base_price": 149.90, "weight": 0.22, "ncm": "61034200"},
            {"name": "Short Tactel Secagem Rápida Azul", "sku": "SHO-TC-003", "base_price": 119.90, "weight": 0.16, "ncm": "61034200"},
        ]
    },
    # INFANTIL (5% do catálogo)
    {
        "category": "Moda Praia Infantil",
        "items": [
            {"name": "Biquíni Infantil Babado Rosa", "sku": "INF-BI-001", "base_price": 79.90, "weight": 0.08, "ncm": "61123100"},
            {"name": "Maiô Infantil Sereia UV50+", "sku": "INF-MA-001", "base_price": 99.90, "weight": 0.12, "ncm": "61123100"},
            {"name": "Sunga Infantil Super Heróis", "sku": "INF-SU-001", "base_price": 59.90, "weight": 0.06, "ncm": "61123100"},
        ]
    },
    # ACESSÓRIOS (5% do catálogo)
    {
        "category": "Acessórios Praia",
        "items": [
            {"name": "Saída de Praia Kimono Floral", "sku": "SAI-KI-001", "base_price": 159.90, "weight": 0.25, "ncm": "61091000"},
            {"name": "Chapéu de Praia Aba Larga Palha", "sku": "ACE-CH-001", "base_price": 89.90, "weight": 0.15, "ncm": "65040000"},
            {"name": "Canga Estampada 100% Viscose", "sku": "ACE-CA-001", "base_price": 69.90, "weight": 0.20, "ncm": "62149000"},
        ]
    }
]

# Nomes de clientes realistas
CUSTOMER_NAMES_FEMALE = [
    "Ana Paula Silva", "Maria Fernanda Costa", "Juliana Santos", "Beatriz Oliveira",
    "Camila Rodrigues", "Larissa Almeida", "Rafaela Souza", "Gabriela Martins",
    "Amanda Lima", "Carolina Pereira", "Isabela Carvalho", "Letícia Ribeiro",
    "Mariana Gomes", "Natália Barbosa", "Paula Fernandes", "Renata Castro",
    "Tatiana Rocha", "Vanessa Dias", "Bianca Moreira", "Débora Monteiro"
]

CUSTOMER_NAMES_MALE = [
    "Carlos Eduardo Silva", "Felipe Santos", "Lucas Oliveira", "Rafael Costa",
    "Bruno Rodrigues", "Thiago Almeida", "Marcelo Souza", "Daniel Martins",
    "André Lima", "Ricardo Pereira", "Fábio Carvalho", "Gustavo Ribeiro",
    "Leonardo Gomes", "Matheus Barbosa", "Paulo Fernandes", "Rodrigo Castro"
]

STORE_CHANNELS = [
    "Loja Física - Shopping Barra",
    "Loja Física - Centro",
    "Loja Física - Praia",
    "E-commerce",
    "Marketplace - Mercado Livre",
    "Marketplace - Shopify",
    "Instagram Shopping",
    "WhatsApp Business"
]


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.options("/seed-beach-fashion")
async def seed_beach_fashion_options():
    """Handle CORS preflight for seed-beach-fashion endpoint"""
    return {"status": "ok"}


@router.post("/seed-beach-fashion", status_code=status.HTTP_201_CREATED)
def seed_beach_fashion_data(
    months: int = 12,  # Padrão: 1 ano de histórico
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    🏖️ [DEBUG] Popular sistema com dados realistas de indústria de moda praia

    Cenário:
    - Indústria com 3 lojas (2 físicas + e-commerce)
    - Faturamento: ~R$ 7M/ano (R$ 583k/mês)
    - Ticket médio: R$ 262
    - Produtos: Biquínis, maiôs, sungas, acessórios (R$ 199-299)
    - Sazonalidade: Picos em Nov-Fev (verão)

    Args:
        months: Meses de histórico a gerar (padrão: 12)

    Returns:
        Resumo dos dados criados
    """

    workspace_id = current_user.workspace_id
    stats = {
        "products_created": 0,
        "customers_created": 0,
        "sales_created": 0,
        "total_revenue": 0.0,
        "months_generated": months,
        "date_range": {}
    }

    # ========================================================================
    # PASSO 1: Criar produtos
    # ========================================================================

    print(f"[SEED] Criando produtos de moda praia...")
    products_created = []

    for category_group in BEACH_FASHION_PRODUCTS:
        category_name = category_group["category"]

        for item in category_group["items"]:
            # Verifica se já existe (para evitar duplicação)
            existing = db.query(Product).filter(
                Product.workspace_id == workspace_id,
                Product.sku == item["sku"]
            ).first()

            if existing:
                products_created.append(existing)
                continue

            # Calcula margem (40-60% sobre custo)
            sale_price = item["base_price"]
            unit_cost = sale_price / random.uniform(1.4, 1.6)

            # Estoque inicial baseado na popularidade do produto
            initial_stock = random.randint(50, 200)

            product = Product(
                workspace_id=workspace_id,
                name=item["name"],
                sku=item["sku"],
                category=category_name,
                description=f"Produto de moda praia - Coleção Verão 2025. {category_name}.",
                unit_cost=round(unit_cost, 2),
                sale_price=sale_price,
                current_stock=initial_stock,
                min_stock_level=20,
                max_stock_level=300,
                reorder_point=40,
                safety_stock=30,
                weight_kg=item["weight"],
                active=True,
                # Dados fiscais
                ncm=item["ncm"],
                cfop="5102",  # Venda de mercadoria adquirida
                origem_mercadoria=0,  # Nacional
                # Tags para filtros
                tags=f"moda-praia,verao-2025,{category_name.lower().replace(' ', '-')}"
            )

            db.add(product)
            products_created.append(product)

    db.commit()
    stats["products_created"] = len(products_created)
    print(f"[SEED] ✅ {len(products_created)} produtos criados")

    # ========================================================================
    # PASSO 2: Criar clientes
    # ========================================================================

    print(f"[SEED] Criando base de clientes...")
    customers_created = []
    all_customer_names = CUSTOMER_NAMES_FEMALE + CUSTOMER_NAMES_MALE

    for name in all_customer_names:
        # Verifica se já existe
        existing = db.query(Customer).filter(
            Customer.workspace_id == workspace_id,
            Customer.name == name
        ).first()

        if existing:
            customers_created.append(existing)
            continue

        # Gera CPF fake (11 dígitos)
        cpf = f"{random.randint(100, 999)}{random.randint(100, 999)}{random.randint(100, 999)}{random.randint(10, 99)}"

        customer = Customer(
            workspace_id=workspace_id,
            name=name,
            email=f"{name.lower().replace(' ', '.')}@email.com",
            phone=f"(11) 9{random.randint(1000, 9999)}-{random.randint(1000, 9999)}",
            cpf_cnpj=cpf,
            customer_type="individual",
            tags="[DEBUG-SEED]"
        )

        db.add(customer)
        customers_created.append(customer)

    db.commit()
    stats["customers_created"] = len(customers_created)
    print(f"[SEED] ✅ {len(customers_created)} clientes criados")

    # ========================================================================
    # PASSO 3: Criar vendas com padrões realistas
    # ========================================================================

    print(f"[SEED] Gerando {months} meses de vendas...")

    # Configurações de sazonalidade (moda praia tem forte sazonalidade)
    # Pico: Nov-Fev (verão), Baixa: Jun-Ago (inverno)
    seasonal_multipliers = {
        1: 1.3,   # Janeiro - Verão (pico)
        2: 1.2,   # Fevereiro - Verão
        3: 0.9,   # Março - Outono
        4: 0.7,   # Abril
        5: 0.6,   # Maio
        6: 0.5,   # Junho - Inverno (baixa)
        7: 0.5,   # Julho - Inverno (baixa)
        8: 0.6,   # Agosto
        9: 0.8,   # Setembro - Primavera
        10: 1.0,  # Outubro
        11: 1.4,  # Novembro - Pré-verão (pico)
        12: 1.5,  # Dezembro - Verão (pico máximo)
    }

    # Meta: R$ 7M/ano = R$ 583k/mês base
    monthly_target = 583_000

    sales_created = []
    total_revenue = 0.0

    start_date = datetime.utcnow() - timedelta(days=30 * months)
    stats["date_range"]["start"] = start_date.isoformat()

    for month_offset in range(months):
        # Calcula data do mês
        month_start = start_date + timedelta(days=30 * month_offset)
        month_number = month_start.month

        # Aplica multiplicador sazonal
        seasonal_mult = seasonal_multipliers.get(month_number, 1.0)
        month_target = monthly_target * seasonal_mult

        # Número de vendas no mês (baseado em ticket médio de R$ 262)
        num_sales_month = int(month_target / 262)

        print(f"[SEED] Mês {month_offset + 1}/{months} - {month_start.strftime('%B/%Y')} - {num_sales_month} vendas (sazonalidade: {seasonal_mult:.1f}x)")

        for sale_num in range(num_sales_month):
            # Data aleatória dentro do mês
            day_offset = random.randint(0, 29)
            sale_date = month_start + timedelta(days=day_offset)

            # Seleciona produto (biquínis têm 60% de chance)
            category_weights = [0.60, 0.15, 0.15, 0.05, 0.05]
            category_idx = random.choices(
                range(len(BEACH_FASHION_PRODUCTS)),
                weights=category_weights,
                k=1
            )[0]

            category_products = [p for p in products_created if p.category == BEACH_FASHION_PRODUCTS[category_idx]["category"]]

            if not category_products:
                continue

            product = random.choice(category_products)

            # Quantidade (moda praia geralmente 1-2 peças por venda)
            quantity = random.choices([1, 2, 3], weights=[0.70, 0.25, 0.05], k=1)[0]

            # Preço com variação (descontos, promoções)
            # Verão: menos desconto (demanda alta)
            # Inverno: mais desconto (liquidação)
            if seasonal_mult > 1.0:  # Alta temporada
                price_variation = random.uniform(0.95, 1.05)  # Desconto mínimo
            else:  # Baixa temporada
                price_variation = random.uniform(0.70, 0.90)  # Descontos maiores

            unit_price = product.sale_price * price_variation
            total_value = quantity * unit_price

            # Seleciona cliente
            customer = random.choice(customers_created)

            # Canal de venda (lojas físicas dominam, mas e-commerce crescendo)
            channel = random.choices(
                STORE_CHANNELS,
                weights=[0.30, 0.25, 0.20, 0.15, 0.05, 0.03, 0.01, 0.01],  # Físico > Online
                k=1
            )[0]

            # Cria venda
            sale = Sale(
                workspace_id=workspace_id,
                product_id=product.id,
                customer_id=customer.id,
                customer_name=customer.name,
                customer_email=customer.email,
                quantity=quantity,
                unit_price=unit_price,
                total_value=total_value,
                sale_date=sale_date,
                status="completed",
                payment_method=random.choice(["credit_card", "debit_card", "pix", "boleto"]),
                sale_channel=channel,
                notes=f"[DEBUG-SEED] Venda sintética - Moda Praia - {product.category}"
            )

            db.add(sale)
            sales_created.append(sale)
            total_revenue += total_value

            # Commit a cada 100 vendas para não sobrecarregar
            if len(sales_created) % 100 == 0:
                db.commit()

    db.commit()

    stats["sales_created"] = len(sales_created)
    stats["total_revenue"] = round(total_revenue, 2)
    stats["date_range"]["end"] = sales_created[-1].sale_date.isoformat() if sales_created else None
    stats["average_ticket"] = round(total_revenue / len(sales_created), 2) if sales_created else 0

    print(f"[SEED] ✅ {len(sales_created)} vendas criadas")
    print(f"[SEED] 💰 Faturamento total: R$ {total_revenue:,.2f}")
    print(f"[SEED] 🎯 Ticket médio: R$ {stats['average_ticket']:.2f}")

    return {
        "success": True,
        "message": "Dados de moda praia criados com sucesso! 🏖️",
        "stats": stats,
        "products_sample": [
            {"id": p.id, "name": p.name, "sku": p.sku, "price": p.sale_price}
            for p in products_created[:5]
        ]
    }


@router.options("/clear-debug-data")
async def clear_debug_data_options():
    """Handle CORS preflight for clear-debug-data endpoint"""
    return {"status": "ok"}


@router.delete("/clear-debug-data", status_code=status.HTTP_200_OK)
def clear_debug_data(
    confirm: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    🗑️ [DEBUG] Limpar TODOS os dados de debug/seed do workspace

    ⚠️ ATENÇÃO: Esta operação é IRREVERSÍVEL!

    Remove:
    - Todos os produtos com tag [DEBUG-SEED]
    - Todos os clientes com tag [DEBUG-SEED]
    - Todas as vendas relacionadas
    - Todas as transações de caixa relacionadas

    Args:
        confirm: OBRIGATÓRIO = true para confirmar a exclusão

    Returns:
        Resumo dos dados deletados
    """

    if not confirm:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Para confirmar a exclusão, envie confirm=true no query parameter"
        )

    workspace_id = current_user.workspace_id
    stats = {
        "products_deleted": 0,
        "customers_deleted": 0,
        "sales_deleted": 0,
        "transactions_deleted": 0
    }

    print(f"[CLEANUP] Iniciando limpeza de dados debug...")

    # ========================================================================
    # PASSO 1: Deletar vendas de debug
    # ========================================================================

    sales_to_delete = db.query(Sale).filter(
        Sale.workspace_id == workspace_id,
        or_(
            Sale.notes.like('%[DEBUG-SEED]%'),
            Sale.notes.like('%[FAKE DATA - TEST]%')
        )
    ).all()

    stats["sales_deleted"] = len(sales_to_delete)

    for sale in sales_to_delete:
        db.delete(sale)

    print(f"[CLEANUP] ✅ {stats['sales_deleted']} vendas deletadas")

    # ========================================================================
    # PASSO 2: Deletar clientes de debug
    # ========================================================================

    customers_to_delete = db.query(Customer).filter(
        Customer.workspace_id == workspace_id,
        Customer.tags.like('%[DEBUG-SEED]%')
    ).all()

    stats["customers_deleted"] = len(customers_to_delete)

    for customer in customers_to_delete:
        db.delete(customer)

    print(f"[CLEANUP] ✅ {stats['customers_deleted']} clientes deletados")

    # ========================================================================
    # PASSO 3: Deletar produtos de debug
    # ========================================================================

    # Identifica produtos pela tag ou SKU pattern
    products_to_delete = db.query(Product).filter(
        Product.workspace_id == workspace_id,
        or_(
            Product.tags.like('%moda-praia%'),
            Product.sku.like('BIQ-%'),
            Product.sku.like('MAI-%'),
            Product.sku.like('SUN-%'),
            Product.sku.like('SHO-%'),
            Product.sku.like('INF-%'),
            Product.sku.like('SAI-%'),
            Product.sku.like('ACE-%')
        )
    ).all()

    stats["products_deleted"] = len(products_to_delete)

    for product in products_to_delete:
        db.delete(product)

    print(f"[CLEANUP] ✅ {stats['products_deleted']} produtos deletados")

    # ========================================================================
    # PASSO 4: Deletar transações de caixa relacionadas (se houver)
    # ========================================================================

    transactions_to_delete = db.query(CashFlowTransaction).filter(
        CashFlowTransaction.workspace_id == workspace_id,
        CashFlowTransaction.description.like('%[DEBUG-SEED]%')
    ).all()

    stats["transactions_deleted"] = len(transactions_to_delete)

    for transaction in transactions_to_delete:
        db.delete(transaction)

    print(f"[CLEANUP] ✅ {stats['transactions_deleted']} transações deletadas")

    # ========================================================================
    # Commit final
    # ========================================================================

    db.commit()

    print(f"[CLEANUP] 🎉 Limpeza concluída!")

    return {
        "success": True,
        "message": "Todos os dados de debug foram removidos com sucesso! 🗑️",
        "stats": stats
    }


@router.get("/seed-status")
def get_seed_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    📊 [DEBUG] Verificar status dos dados de debug/seed no workspace

    Retorna contadores de dados de debug existentes.
    """

    workspace_id = current_user.workspace_id

    # Conta produtos de moda praia
    products_count = db.query(Product).filter(
        Product.workspace_id == workspace_id,
        or_(
            Product.tags.like('%moda-praia%'),
            Product.sku.like('BIQ-%'),
            Product.sku.like('MAI-%'),
            Product.sku.like('SUN-%')
        )
    ).count()

    # Conta clientes debug
    customers_count = db.query(Customer).filter(
        Customer.workspace_id == workspace_id,
        Customer.tags.like('%[DEBUG-SEED]%')
    ).count()

    # Conta vendas debug
    sales_count = db.query(Sale).filter(
        Sale.workspace_id == workspace_id,
        or_(
            Sale.notes.like('%[DEBUG-SEED]%'),
            Sale.notes.like('%[FAKE DATA - TEST]%')
        )
    ).count()

    # Calcula faturamento total debug
    debug_sales = db.query(Sale).filter(
        Sale.workspace_id == workspace_id,
        or_(
            Sale.notes.like('%[DEBUG-SEED]%'),
            Sale.notes.like('%[FAKE DATA - TEST]%')
        )
    ).all()

    total_revenue = sum(sale.total_value for sale in debug_sales)

    return {
        "workspace_id": workspace_id,
        "has_debug_data": products_count > 0 or customers_count > 0 or sales_count > 0,
        "products_count": products_count,
        "customers_count": customers_count,
        "sales_count": sales_count,
        "total_revenue": round(total_revenue, 2),
        "average_ticket": round(total_revenue / sales_count, 2) if sales_count > 0 else 0
    }
