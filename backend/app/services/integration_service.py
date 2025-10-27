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


class MercadoLivreIntegrationService:
    """
    Serviço de integração com Mercado Livre para sincronização de pedidos
    Usa OAuth 2.0 para autenticação
    """

    def __init__(self, workspace: Workspace, db: Session):
        self.workspace = workspace
        self.db = db
        self.api_base_url = "https://api.mercadolibre.com"

        if not workspace.integration_mercadolivre_access_token:
            raise ValueError("Mercado Livre não está conectado. Faça a autenticação OAuth primeiro.")

        # Descriptografar access token
        try:
            encryption = FieldEncryption(key=settings.ENCRYPTION_KEY)
            self.access_token = encryption.decrypt(workspace.integration_mercadolivre_access_token)
        except:
            self.access_token = workspace.integration_mercadolivre_access_token

    async def test_connection(self) -> Dict[str, Any]:
        """Testa conexão com Mercado Livre"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.api_base_url}/users/me",
                    headers={"Authorization": f"Bearer {self.access_token}"}
                )

            if response.status_code == 200:
                user_data = response.json()
                return {
                    "success": True,
                    "user_id": user_data.get('id'),
                    "nickname": user_data.get('nickname')
                }
            else:
                return {"success": False, "error": "Token inválido ou expirado"}
        except Exception as e:
            logger.error(f"Erro ao testar conexão ML: {str(e)}")
            return {"success": False, "error": str(e)}

    async def sync_orders(self, limit: int = 50) -> Dict[str, Any]:
        """Sincroniza pedidos do Mercado Livre"""
        stats = {
            "success": True,
            "new_orders_imported": 0,
            "skipped_orders": 0,
            "errors": []
        }

        try:
            since_date = self.workspace.integration_mercadolivre_last_sync

            # Buscar pedidos
            params = {
                "seller": self.workspace.integration_mercadolivre_user_id,
                "sort": "date_desc",
                "limit": limit
            }

            if since_date:
                params["order.date_created.from"] = since_date.isoformat()

            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.get(
                    f"{self.api_base_url}/orders/search",
                    params=params,
                    headers={"Authorization": f"Bearer {self.access_token}"}
                )

            if response.status_code != 200:
                stats["success"] = False
                stats["errors"].append(f"Erro ML API: {response.status_code}")
                return stats

            orders = response.json().get('results', [])

            for ml_order in orders:
                try:
                    # Verificar se já foi importado
                    existing = self.db.query(Sale).filter(
                        Sale.workspace_id == self.workspace.id,
                        Sale.origin_channel == 'mercadolivre',
                        Sale.origin_order_id == str(ml_order['id'])
                    ).first()

                    if existing:
                        stats['skipped_orders'] += 1
                        continue

                    # Mapear e criar venda
                    sale = self._map_order_to_sale(ml_order)

                    if sale:
                        self.db.add(sale)
                        self.db.flush()
                        stats['new_orders_imported'] += 1
                    else:
                        stats['skipped_orders'] += 1

                except Exception as e:
                    logger.error(f"Erro ao importar pedido ML {ml_order.get('id')}: {str(e)}")
                    stats['errors'].append(f"Pedido {ml_order.get('id')}: {str(e)}")

            # Atualizar última sync
            self.workspace.integration_mercadolivre_last_sync = datetime.utcnow()
            self.db.commit()

            stats['message'] = f"{stats['new_orders_imported']} novos pedidos importados!" if stats['new_orders_imported'] > 0 else "Nenhum pedido novo encontrado"
            return stats

        except Exception as e:
            logger.error(f"Erro na sincronização ML: {str(e)}")
            self.db.rollback()
            stats["success"] = False
            stats["errors"].append(str(e))
            return stats

    def _map_order_to_sale(self, ml_order: Dict) -> Optional[Sale]:
        """Mapeia pedido ML para Sale"""
        try:
            # Buscar primeiro item do pedido
            items = ml_order.get('order_items', [])
            if not items:
                return None

            first_item = items[0]
            item_data = first_item.get('item', {})
            sku = item_data.get('seller_custom_field')

            if not sku:
                logger.warning(f"Pedido ML {ml_order['id']} sem SKU")
                return None

            # Buscar produto
            product = self.db.query(Product).filter(
                Product.workspace_id == self.workspace.id,
                Product.sku == sku
            ).first()

            if not product:
                logger.warning(f"SKU {sku} não encontrado")
                return None

            # Dados do comprador
            buyer = ml_order.get('buyer', {})
            shipping = ml_order.get('shipping', {})
            receiver_address = shipping.get('receiver_address', {})

            sale = Sale(
                workspace_id=self.workspace.id,
                origin_channel='mercadolivre',
                origin_order_id=str(ml_order['id']),
                product_id=product.id,
                customer_name=f"{buyer.get('first_name', '')} {buyer.get('last_name', '')}".strip() or 'Cliente ML',
                customer_email=buyer.get('email'),
                customer_phone=buyer.get('phone', {}).get('number'),
                customer_cpf_cnpj='',
                customer_cep=receiver_address.get('zip_code', '').replace('-', ''),
                customer_logradouro=receiver_address.get('street_name'),
                customer_numero=receiver_address.get('street_number'),
                customer_complemento=receiver_address.get('comment'),
                customer_bairro=receiver_address.get('neighborhood', {}).get('name'),
                customer_cidade=receiver_address.get('city', {}).get('name'),
                customer_uf=receiver_address.get('state', {}).get('id'),
                quantity=first_item.get('quantity', 1),
                unit_price=float(first_item.get('unit_price', 0)),
                total_value=float(ml_order.get('total_amount', 0)),
                status='completed',
                sale_date=datetime.fromisoformat(ml_order['date_created'].replace('Z', '+00:00')).date(),
                notes=f"Pedido Mercado Livre #{ml_order['id']}",
                created_at=datetime.fromisoformat(ml_order['date_created'].replace('Z', '+00:00'))
            )

            return sale

        except Exception as e:
            logger.error(f"Erro ao mapear pedido ML: {str(e)}")
            return None


class WooCommerceIntegrationService:
    """
    Serviço de integração com WooCommerce para sincronização de pedidos
    Usa autenticação via Consumer Key + Consumer Secret
    """

    def __init__(self, workspace: Workspace, db: Session):
        self.workspace = workspace
        self.db = db

        if not workspace.integration_woocommerce_store_url:
            raise ValueError("WooCommerce não está configurado. Configure a URL da loja primeiro.")

        # Remove trailing slash da URL
        self.store_url = workspace.integration_woocommerce_store_url.rstrip('/')
        self.api_base_url = f"{self.store_url}/wp-json/wc/v3"

        # Descriptografar consumer key e secret
        try:
            encryption = FieldEncryption(key=settings.ENCRYPTION_KEY)
            self.consumer_key = encryption.decrypt(workspace.integration_woocommerce_consumer_key)
            self.consumer_secret = encryption.decrypt(workspace.integration_woocommerce_consumer_secret)
        except:
            self.consumer_key = workspace.integration_woocommerce_consumer_key
            self.consumer_secret = workspace.integration_woocommerce_consumer_secret

    async def test_connection(self) -> Dict[str, Any]:
        """Testa conexão com WooCommerce"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{self.api_base_url}/system_status",
                    auth=(self.consumer_key, self.consumer_secret)
                )

                if response.status_code == 200:
                    data = response.json()
                    return {
                        'success': True,
                        'message': 'Conexão com WooCommerce estabelecida com sucesso',
                        'store_name': data.get('settings', {}).get('site_title', 'Loja WooCommerce'),
                        'wc_version': data.get('environment', {}).get('version', 'Unknown')
                    }
                else:
                    return {
                        'success': False,
                        'message': f'Erro ao conectar: {response.status_code}'
                    }

        except Exception as e:
            logger.error(f"Erro ao testar conexão WooCommerce: {str(e)}")
            return {
                'success': False,
                'message': f'Erro ao testar conexão: {str(e)}'
            }

    async def sync_orders(self, limit: int = 50) -> Dict[str, Any]:
        """
        Sincroniza pedidos do WooCommerce

        Args:
            limit: Número máximo de pedidos a processar

        Returns:
            Estatísticas da sincronização
        """
        try:
            # Buscar pedidos desde a última sincronização
            params = {
                'per_page': limit,
                'status': 'processing,completed',  # Apenas pedidos pagos
                'orderby': 'date',
                'order': 'desc'
            }

            # Se houver sincronização anterior, filtrar por data
            if self.workspace.integration_woocommerce_last_sync:
                params['after'] = self.workspace.integration_woocommerce_last_sync.isoformat()

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.api_base_url}/orders",
                    auth=(self.consumer_key, self.consumer_secret),
                    params=params
                )

                if response.status_code != 200:
                    raise Exception(f"Erro na API WooCommerce: {response.status_code}")

                wc_orders = response.json()

            logger.info(f"Encontrados {len(wc_orders)} pedidos WooCommerce")

            new_orders_count = 0
            skipped_orders_count = 0
            errors = []

            for wc_order in wc_orders:
                try:
                    # Verificar se pedido já foi importado
                    existing_sale = self.db.query(Sale).filter(
                        Sale.workspace_id == self.workspace.id,
                        Sale.notes.contains(f"WooCommerce #{wc_order['id']}")
                    ).first()

                    if existing_sale:
                        skipped_orders_count += 1
                        continue

                    # Mapear pedido para Sale
                    sale = self._map_order_to_sale(wc_order)

                    if sale:
                        self.db.add(sale)
                        self.db.commit()
                        new_orders_count += 1
                        logger.info(f"Pedido WooCommerce #{wc_order['id']} importado com sucesso")
                    else:
                        skipped_orders_count += 1

                except Exception as e:
                    error_msg = f"Erro ao processar pedido #{wc_order.get('id', 'unknown')}: {str(e)}"
                    logger.error(error_msg)
                    errors.append(error_msg)
                    self.db.rollback()

            # Atualizar timestamp de última sincronização
            self.workspace.integration_woocommerce_last_sync = datetime.utcnow()
            self.db.commit()

            return {
                'success': True,
                'new_orders_imported': new_orders_count,
                'orders_skipped': skipped_orders_count,
                'errors': errors
            }

        except Exception as e:
            logger.error(f"Erro ao sincronizar pedidos WooCommerce: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'new_orders_imported': 0,
                'orders_skipped': 0,
                'errors': [str(e)]
            }

    def _map_order_to_sale(self, wc_order: Dict) -> Optional[Sale]:
        """
        Mapeia um pedido do WooCommerce para um objeto Sale

        Args:
            wc_order: Dados do pedido WooCommerce

        Returns:
            Objeto Sale ou None se não foi possível mapear
        """
        try:
            # Extrair primeiro item do pedido
            line_items = wc_order.get('line_items', [])
            if not line_items:
                logger.warning(f"Pedido WooCommerce #{wc_order['id']} sem itens")
                return None

            first_item = line_items[0]

            # Tentar encontrar produto por SKU
            product_sku = first_item.get('sku', '')
            product = None

            if product_sku:
                product = self.db.query(Product).filter(
                    Product.workspace_id == self.workspace.id,
                    Product.sku == product_sku
                ).first()

            if not product:
                logger.warning(f"Produto com SKU '{product_sku}' não encontrado no workspace")
                return None

            # Extrair dados do cliente
            billing = wc_order.get('billing', {})
            shipping = wc_order.get('shipping', {})

            # Usar endereço de envio, se não houver usar billing
            address = shipping if shipping.get('address_1') else billing

            # Criar objeto Sale
            sale = Sale(
                workspace_id=self.workspace.id,
                product_id=product.id,
                customer_name=f"{billing.get('first_name', '')} {billing.get('last_name', '')}".strip() or 'Cliente WooCommerce',
                customer_email=billing.get('email'),
                customer_phone=billing.get('phone'),
                customer_cpf_cnpj='',
                customer_cep=address.get('postcode', '').replace('-', ''),
                customer_logradouro=address.get('address_1'),
                customer_numero='',
                customer_complemento=address.get('address_2'),
                customer_bairro='',
                customer_cidade=address.get('city'),
                customer_uf=address.get('state'),
                quantity=first_item.get('quantity', 1),
                unit_price=float(first_item.get('price', 0)),
                total_value=float(wc_order.get('total', 0)),
                status='completed',
                sale_date=datetime.fromisoformat(wc_order['date_created']).date(),
                notes=f"Pedido WooCommerce #{wc_order['id']} - {wc_order.get('status', 'unknown')}",
                created_at=datetime.fromisoformat(wc_order['date_created'])
            )

            return sale

        except Exception as e:
            logger.error(f"Erro ao mapear pedido WooCommerce: {str(e)}")
            return None
