"""
Serviço de Integração com Canais de Venda (Shopify, Mercado Livre, etc.)
"""

import httpx
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from app.models.workspace import Workspace
from app.models.sale import Sale
from app.models.product import Product
from app.core.encryption import FieldEncryption
from app.core.config import settings

logger = logging.getLogger(__name__)


class ShopifyIntegrationService:
    """
    Serviço de integração com Shopify para sincronização de pedidos
    """

    def __init__(self, workspace: Workspace, db: Session):
        self.workspace = workspace
        self.db = db
        self.api_version = "2024-01"  # Versão da API Shopify

        if not workspace.integration_shopify_store_url or not workspace.integration_shopify_api_key:
            raise ValueError("Credenciais Shopify não configuradas. Configure em Integrações.")

        # Descriptografar API key se estiver criptografada
        try:
            encryption = FieldEncryption(key=settings.ENCRYPTION_KEY)
            self.api_key = encryption.decrypt(workspace.integration_shopify_api_key)
        except:
            # Se falhar, assume que não está criptografada (compatibilidade)
            self.api_key = workspace.integration_shopify_api_key

        self.store_url = workspace.integration_shopify_store_url.replace('https://', '').replace('http://', '').strip('/')
        self.base_url = f"https://{self.store_url}/admin/api/{self.api_version}"

    async def test_connection(self) -> Dict[str, Any]:
        """
        Testa a conexão com a Shopify

        Returns:
            {
                "success": bool,
                "shop_name": str (se success=True),
                "error": str (se success=False)
            }
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.base_url}/shop.json",
                    headers={"X-Shopify-Access-Token": self.api_key}
                )

            if response.status_code == 200:
                shop_data = response.json().get('shop', {})
                return {
                    "success": True,
                    "shop_name": shop_data.get('name'),
                    "shop_domain": shop_data.get('domain'),
                    "shop_email": shop_data.get('email')
                }
            else:
                error_data = response.json() if response.status_code != 401 else {"errors": "Credenciais inválidas"}
                return {
                    "success": False,
                    "error": error_data.get('errors', 'Erro ao conectar com Shopify')
                }

        except httpx.TimeoutException:
            return {"success": False, "error": "Timeout ao conectar com Shopify"}
        except Exception as e:
            logger.error(f"Erro ao testar conexão Shopify: {str(e)}")
            return {"success": False, "error": str(e)}

    async def sync_orders(self, limit: int = 250) -> Dict[str, Any]:
        """
        Sincroniza pedidos da Shopify para o Orion ERP

        Args:
            limit: Número máximo de pedidos para sincronizar (max 250)

        Returns:
            {
                "success": bool,
                "new_orders_imported": int,
                "skipped_orders": int,
                "errors": List[str],
                "message": str
            }
        """
        stats = {
            "success": True,
            "new_orders_imported": 0,
            "skipped_orders": 0,
            "errors": []
        }

        try:
            # Buscar pedidos desde a última sincronização
            since_date = self.workspace.integration_shopify_last_sync

            params = {
                "status": "any",
                "limit": min(limit, 250),  # Máximo da Shopify
                "financial_status": "paid",  # Apenas pedidos pagos
            }

            if since_date:
                params["created_at_min"] = since_date.isoformat()

            logger.info(f"Sincronizando pedidos Shopify para workspace {self.workspace.id} desde {since_date}")

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.get(
                    f"{self.base_url}/orders.json",
                    params=params,
                    headers={"X-Shopify-Access-Token": self.api_key}
                )

            if response.status_code != 200:
                error_msg = f"Erro Shopify API: {response.status_code} - {response.text}"
                logger.error(error_msg)
                stats["success"] = False
                stats["errors"].append(error_msg)
                return stats

            orders = response.json().get('orders', [])
            logger.info(f"Encontrados {len(orders)} pedidos Shopify")

            for shopify_order in orders:
                try:
                    # Verificar se já foi importado
                    existing = self.db.query(Sale).filter(
                        Sale.workspace_id == self.workspace.id,
                        Sale.origin_channel == 'shopify',
                        Sale.origin_order_id == str(shopify_order['id'])
                    ).first()

                    if existing:
                        stats['skipped_orders'] += 1
                        logger.debug(f"Pedido Shopify #{shopify_order.get('order_number')} já existe")
                        continue

                    # Mapear e criar venda
                    sale = self._map_shopify_order_to_sale(shopify_order)

                    if sale:
                        self.db.add(sale)
                        self.db.flush()  # Obter ID da venda
                        stats['new_orders_imported'] += 1
                        logger.info(f"Pedido Shopify #{shopify_order.get('order_number')} importado como venda #{sale.id}")
                    else:
                        stats['skipped_orders'] += 1
                        logger.warning(f"Pedido Shopify #{shopify_order.get('order_number')} sem itens válidos - pulado")

                except Exception as e:
                    error_msg = f"Pedido #{shopify_order.get('order_number')}: {str(e)}"
                    logger.error(f"Erro ao importar pedido Shopify: {error_msg}")
                    stats['errors'].append(error_msg)

            # Atualizar timestamp da última sync
            self.workspace.integration_shopify_last_sync = datetime.utcnow()
            self.db.commit()

            # Mensagem de resumo
            if stats['new_orders_imported'] > 0:
                stats['message'] = f"{stats['new_orders_imported']} novos pedidos importados com sucesso!"
            elif stats['skipped_orders'] > 0:
                stats['message'] = f"Nenhum pedido novo encontrado ({stats['skipped_orders']} já importados)"
            else:
                stats['message'] = "Nenhum pedido encontrado no período"

            return stats

        except httpx.TimeoutException:
            logger.error("Timeout ao sincronizar pedidos Shopify")
            stats["success"] = False
            stats["errors"].append("Timeout ao conectar com Shopify")
            return stats
        except Exception as e:
            logger.error(f"Erro na sincronização Shopify: {str(e)}")
            self.db.rollback()
            stats["success"] = False
            stats["errors"].append(f"Erro interno: {str(e)}")
            return stats

    def _map_shopify_order_to_sale(self, shopify_order: Dict) -> Optional[Sale]:
        """
        Mapeia um pedido da Shopify para o modelo Sale do Orion

        Args:
            shopify_order: Dados do pedido da Shopify (JSON)

        Returns:
            Sale object ou None se não puder mapear
        """
        try:
            # Dados do cliente
            customer = shopify_order.get('customer', {})
            shipping_address = shopify_order.get('shipping_address') or shopify_order.get('billing_address', {})

            # Nome do cliente
            customer_name = f"{customer.get('first_name', '')} {customer.get('last_name', '')}".strip()
            if not customer_name:
                customer_name = customer.get('name', 'Cliente Shopify')

            # Criar Sale
            sale = Sale(
                workspace_id=self.workspace.id,
                origin_channel='shopify',
                origin_order_id=str(shopify_order['id']),

                # Dados do cliente
                customer_name=customer_name,
                customer_email=customer.get('email'),
                customer_phone=customer.get('phone'),
                customer_cpf_cnpj='',  # Shopify não tem por padrão - pode vir de metafield

                # Endereço do cliente
                customer_cep=shipping_address.get('zip', '').replace('-', '').replace(' ', ''),
                customer_logradouro=shipping_address.get('address1'),
                customer_numero='S/N',  # Shopify não separa número do logradouro
                customer_complemento=shipping_address.get('address2'),
                customer_bairro=shipping_address.get('province'),  # Shopify não tem bairro separado
                customer_cidade=shipping_address.get('city'),
                customer_uf=self._get_uf_code(shipping_address.get('province_code')),

                # Status
                status='completed',  # Pedidos Shopify já pagos

                # Valores
                quantity=sum(item.get('quantity', 0) for item in shopify_order.get('line_items', [])),
                unit_price=0,  # Será calculado pela média dos itens
                total_value=float(shopify_order.get('total_price', 0)),

                # Data da venda
                sale_date=datetime.fromisoformat(shopify_order['created_at'].replace('Z', '+00:00')).date(),

                # Notas
                notes=f"Pedido Shopify #{shopify_order.get('order_number')} - {shopify_order.get('name', '')}",

                # Timestamps
                created_at=datetime.fromisoformat(shopify_order['created_at'].replace('Z', '+00:00'))
            )

            # Verificar se tem produtos para mapear
            line_items = shopify_order.get('line_items', [])
            if not line_items:
                logger.warning(f"Pedido Shopify #{shopify_order.get('order_number')} sem line_items")
                return None

            # Tentar mapear pelo menos um produto
            product_found = False
            for line_item in line_items:
                sku = line_item.get('sku')

                if not sku:
                    logger.warning(f"Item sem SKU no pedido {shopify_order.get('order_number')}: {line_item.get('name')}")
                    continue

                # Buscar produto pelo SKU
                product = self.db.query(Product).filter(
                    Product.workspace_id == self.workspace.id,
                    Product.sku == sku
                ).first()

                if product:
                    # Se encontrou pelo menos um produto, a venda é válida
                    product_found = True
                    sale.product_id = product.id
                    sale.unit_price = float(line_item.get('price', 0))
                    break
                else:
                    logger.warning(f"Produto SKU '{sku}' não encontrado no Orion - pedido {shopify_order.get('order_number')}")

            if not product_found:
                logger.warning(f"Pedido {shopify_order.get('order_number')} sem produtos válidos no Orion - pulando")
                return None

            return sale

        except Exception as e:
            logger.error(f"Erro ao mapear pedido Shopify: {str(e)}")
            return None

    def _get_uf_code(self, province_code: Optional[str]) -> str:
        """
        Mapeia código de província do Shopify para código UF brasileiro

        Args:
            province_code: Código da província (ex: 'SP', 'RJ')

        Returns:
            Código UF de 2 letras ou string vazia
        """
        if not province_code:
            return ''

        # Shopify já usa os códigos de 2 letras para Brasil
        province_code = province_code.upper().strip()

        # Lista de UFs válidas
        valid_ufs = [
            'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
            'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
            'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
        ]

        if province_code in valid_ufs:
            return province_code

        logger.warning(f"Código de província inválido: {province_code}")
        return ''
