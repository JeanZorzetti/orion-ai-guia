"""Script para verificar vendas no banco de dados"""

from app.database import SessionLocal
from sqlalchemy import func
from app.models.sale import Sale
from app.models.product import Product

db = SessionLocal()

# Verifica quantas vendas existem no total
total_sales = db.query(func.count(Sale.id)).scalar()
print(f'Total de vendas no banco: {total_sales}')

# Vendas completadas
completed_sales = db.query(func.count(Sale.id)).filter(Sale.status == 'completed').scalar()
print(f'Vendas completadas: {completed_sales}')

# Agrupa por produto
sales_by_product = db.query(
    Sale.product_id,
    func.count(Sale.id).label('count'),
    func.sum(Sale.quantity).label('total_qty')
).filter(Sale.status == 'completed').group_by(Sale.product_id).all()

print(f'\nVendas por produto:')
for sale in sales_by_product:
    # Busca nome do produto
    product = db.query(Product).filter(Product.id == sale.product_id).first()
    product_name = product.name if product else 'Desconhecido'
    print(f'  Produto ID {sale.product_id} ({product_name}): {sale.count} vendas, {sale.total_qty} unidades')

# Verifica datas das vendas
print(f'\nDatas das vendas (amostra):')
sample_sales = db.query(Sale).filter(Sale.status == 'completed').order_by(Sale.sale_date.desc()).limit(5).all()
for sale in sample_sales:
    print(f'  Produto ID {sale.product_id}: {sale.quantity} unidades em {sale.sale_date}')

db.close()
