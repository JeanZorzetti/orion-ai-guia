"""
Fiscal Service - NF-e Emission

Main service for issuing and managing NF-e (Nota Fiscal Eletrônica).
Integrates with fiscal API partners (PlugNotas, FocusNFe, etc.).

This service abstracts the complexity of SEFAZ communication and provides
a simple interface for NF-e operations.
"""

import httpx
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.sale import Sale
from app.models.workspace import Workspace
from app.models.fiscal_audit_log import FiscalAuditLog
from app.core.encryption import field_encryption
from app.services.fiscal_validator import FiscalValidator
from app.core.config import settings

logger = logging.getLogger(__name__)


class FiscalService:
    """
    Service for NF-e emission and management.

    Handles:
    - NF-e emission
    - NF-e cancellation
    - Communication with fiscal API partners
    - Audit logging
    """

    def __init__(self, workspace: Workspace, db: Session):
        """
        Initialize FiscalService with workspace configuration.

        Args:
            workspace: Workspace with fiscal configuration
            db: Database session for transactions
        """
        self.workspace = workspace
        self.db = db
        self.validator = FiscalValidator()

        # Determine API base URL based on partner
        if workspace.fiscal_partner == 'plugnotas':
            self.api_base_url = "https://api.plugnotas.com.br"
        elif workspace.fiscal_partner == 'focusnfe':
            self.api_base_url = "https://api.focusnfe.com.br"
        elif workspace.fiscal_partner == 'nfeio':
            self.api_base_url = "https://api.nfe.io"
        else:
            raise ValueError(f"Parceiro fiscal não suportado: {workspace.fiscal_partner}")

        # Decrypt API key
        if workspace.fiscal_partner_api_key:
            try:
                self.api_key = field_encryption.decrypt(workspace.fiscal_partner_api_key)
            except Exception as e:
                logger.error(f"Erro ao descriptografar API key: {str(e)}")
                raise ValueError("Credenciais fiscais inválidas ou corrompidas")
        else:
            raise ValueError("API key do parceiro fiscal não configurada")

    async def issue_nfe(self, sale_id: int, user_id: int, ip_address: Optional[str] = None) -> Dict[str, Any]:
        """
        Issue NF-e for a sale.

        Args:
            sale_id: ID of the sale
            user_id: ID of the user issuing the NF-e
            ip_address: IP address of the request (for audit)

        Returns:
            {
                "success": bool,
                "nfe_chave": str,
                "danfe_url": str,
                "xml_url": str,
                "error": str (if success=False)
            }
        """
        try:
            # 1. Load sale
            sale = self.db.query(Sale).filter(Sale.id == sale_id).first()
            if not sale:
                return {"success": False, "error": "Venda não encontrada"}

            # 2. Validate before issuing
            validation_errors = self.validator.validate_before_issue(sale, self.workspace)
            if validation_errors:
                error_msg = "; ".join(validation_errors)
                self._log_audit(
                    sale_id=sale_id,
                    user_id=user_id,
                    action='issue_failure',
                    error_message=f"Validação falhou: {error_msg}",
                    ip_address=ip_address
                )
                return {
                    "success": False,
                    "error": "Erros de validação",
                    "validation_errors": validation_errors
                }

            # 3. Check if already issued
            if sale.nfe_status == 'issued':
                return {"success": False, "error": "NF-e já emitida para esta venda"}

            # 4. Update status to processing
            sale.nfe_status = 'processing'
            self.db.commit()

            # 5. Build payload for fiscal API
            payload = self._build_nfe_payload(sale)

            # 6. Log attempt
            self._log_audit(
                sale_id=sale_id,
                user_id=user_id,
                action='issue_attempt',
                request_payload=payload,
                ip_address=ip_address
            )

            # 7. Send to fiscal API
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.api_base_url}/nfe",
                    json=payload,
                    headers=self._get_headers()
                )

            # 8. Process response
            if response.status_code in [200, 201]:
                data = response.json()

                # Update sale with NF-e data
                sale.nfe_status = 'issued'
                sale.nfe_id_partner = data.get('id')
                sale.nfe_chave = data.get('chave')
                sale.nfe_numero = data.get('numero')
                sale.nfe_serie = data.get('serie', self.workspace.nfe_serie)
                sale.nfe_xml_url = data.get('xml_url') or data.get('caminho_xml_nota_fiscal')
                sale.nfe_danfe_url = data.get('danfe_url') or data.get('caminho_danfe')
                sale.nfe_protocolo = data.get('protocolo')
                sale.nfe_issued_at = datetime.utcnow()

                # Increment NF-e number for next emission
                self.workspace.nfe_next_number += 1

                self.db.commit()

                # Log success
                self._log_audit(
                    sale_id=sale_id,
                    user_id=user_id,
                    action='issue_success',
                    response_payload=data,
                    ip_address=ip_address
                )

                logger.info(f"NF-e emitida com sucesso para venda {sale_id}: Chave {sale.nfe_chave}")

                return {
                    "success": True,
                    "nfe_chave": sale.nfe_chave,
                    "nfe_numero": sale.nfe_numero,
                    "danfe_url": sale.nfe_danfe_url,
                    "xml_url": sale.nfe_xml_url
                }

            else:
                # Error from fiscal API
                error_data = response.json() if response.text else {}
                error_message = error_data.get('message') or error_data.get('erro') or 'Erro desconhecido'
                error_code = error_data.get('code') or error_data.get('codigo')

                sale.nfe_status = 'rejected'
                sale.nfe_rejection_reason = error_message
                sale.nfe_rejection_code = str(error_code) if error_code else None
                self.db.commit()

                # Log failure
                self._log_audit(
                    sale_id=sale_id,
                    user_id=user_id,
                    action='issue_failure',
                    response_payload=error_data,
                    error_message=error_message,
                    error_code=str(error_code) if error_code else None,
                    ip_address=ip_address
                )

                logger.error(f"Erro ao emitir NF-e para venda {sale_id}: {error_message}")

                return {
                    "success": False,
                    "error": error_message,
                    "error_code": error_code
                }

        except Exception as e:
            logger.exception(f"Exceção ao emitir NF-e para venda {sale_id}")

            # Rollback status
            if sale:
                sale.nfe_status = 'pending'
                self.db.commit()

            self._log_audit(
                sale_id=sale_id,
                user_id=user_id,
                action='issue_failure',
                error_message=f"Exceção: {str(e)}",
                ip_address=ip_address
            )

            return {"success": False, "error": f"Erro interno: {str(e)}"}

    async def cancel_nfe(
        self,
        sale_id: int,
        reason: str,
        user_id: int,
        ip_address: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Cancel an issued NF-e.

        SEFAZ Rules:
        - Can only cancel within 24 hours of emission
        - Justification required (minimum 15 characters)

        Args:
            sale_id: ID of the sale
            reason: Cancellation justification (min 15 chars)
            user_id: ID of the user cancelling
            ip_address: IP address of the request

        Returns:
            {"success": bool, "message": str or "error": str}
        """
        try:
            # 1. Load sale
            sale = self.db.query(Sale).filter(Sale.id == sale_id).first()
            if not sale:
                return {"success": False, "error": "Venda não encontrada"}

            # 2. Check if NF-e is issued
            if sale.nfe_status != 'issued':
                return {"success": False, "error": f"NF-e não está emitida (status: {sale.nfe_status})"}

            # 3. Check 24-hour deadline
            if sale.nfe_issued_at:
                hours_since_issue = (datetime.utcnow() - sale.nfe_issued_at).total_seconds() / 3600
                if hours_since_issue > 24:
                    return {
                        "success": False,
                        "error": f"Prazo de cancelamento expirado. NF-e emitida há {hours_since_issue:.1f} horas (máx: 24h)"
                    }

            # 4. Validate justification
            if len(reason) < 15:
                return {"success": False, "error": "Justificativa deve ter no mínimo 15 caracteres"}

            # 5. Build cancellation payload
            cancel_payload = {
                "justificativa": reason
            }

            # 6. Log attempt
            self._log_audit(
                sale_id=sale_id,
                user_id=user_id,
                action='cancel_attempt',
                request_payload=cancel_payload,
                ip_address=ip_address
            )

            # 7. Send cancellation to fiscal API
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.api_base_url}/nfe/{sale.nfe_id_partner}/cancelamento",
                    json=cancel_payload,
                    headers=self._get_headers()
                )

            # 8. Process response
            if response.status_code == 200:
                data = response.json() if response.text else {}

                # Update sale
                sale.nfe_status = 'cancelled'
                sale.nfe_cancelled_at = datetime.utcnow()
                sale.nfe_cancellation_reason = reason
                self.db.commit()

                # Log success
                self._log_audit(
                    sale_id=sale_id,
                    user_id=user_id,
                    action='cancel_success',
                    response_payload=data,
                    ip_address=ip_address
                )

                logger.info(f"NF-e cancelada com sucesso para venda {sale_id}")

                return {"success": True, "message": "NF-e cancelada com sucesso"}

            else:
                # Error from fiscal API
                error_data = response.json() if response.text else {}
                error_message = error_data.get('message') or error_data.get('erro') or 'Erro ao cancelar NF-e'

                self._log_audit(
                    sale_id=sale_id,
                    user_id=user_id,
                    action='cancel_failure',
                    response_payload=error_data,
                    error_message=error_message,
                    ip_address=ip_address
                )

                logger.error(f"Erro ao cancelar NF-e para venda {sale_id}: {error_message}")

                return {"success": False, "error": error_message}

        except Exception as e:
            logger.exception(f"Exceção ao cancelar NF-e para venda {sale_id}")

            self._log_audit(
                sale_id=sale_id,
                user_id=user_id,
                action='cancel_failure',
                error_message=f"Exceção: {str(e)}",
                ip_address=ip_address
            )

            return {"success": False, "error": f"Erro interno: {str(e)}"}

    def _build_nfe_payload(self, sale: Sale) -> Dict[str, Any]:
        """
        Build JSON payload for fiscal API.

        This is a generic structure that works with most Brazilian fiscal APIs.
        Adjust field names if needed for specific partners.

        Args:
            sale: Sale object with all required data

        Returns:
            JSON payload for fiscal API
        """
        return {
            "natureza_operacao": sale.natureza_operacao,
            "serie": self.workspace.nfe_serie,
            "numero": self.workspace.nfe_next_number,
            "data_emissao": datetime.utcnow().isoformat(),
            "tipo_documento": 1,  # 1=Saída (venda)
            "finalidade_emissao": 1,  # 1=Normal
            "ambiente": self.workspace.nfe_ambiente,  # 1=Produção, 2=Homologação

            # Emitente (empresa)
            "emitente": {
                "cpf_cnpj": self.workspace.cnpj,
                "razao_social": self.workspace.razao_social,
                "nome_fantasia": self.workspace.nome_fantasia,
                "inscricao_estadual": self.workspace.inscricao_estadual,
                "regime_tributario": self.workspace.regime_tributario,
                "endereco": {
                    "logradouro": self.workspace.fiscal_logradouro,
                    "numero": self.workspace.fiscal_numero,
                    "complemento": self.workspace.fiscal_complemento,
                    "bairro": self.workspace.fiscal_bairro,
                    "codigo_municipio": self.workspace.fiscal_codigo_municipio,
                    "uf": self.workspace.fiscal_uf,
                    "cep": self.workspace.fiscal_cep
                }
            },

            # Destinatário (cliente)
            "destinatario": {
                "cpf_cnpj": sale.customer_cpf_cnpj,
                "nome": sale.customer_name,
                "email": sale.customer_email,
                "telefone": sale.customer_phone,
                "endereco": {
                    "logradouro": sale.customer_logradouro,
                    "numero": sale.customer_numero,
                    "complemento": sale.customer_complemento,
                    "bairro": sale.customer_bairro,
                    "codigo_municipio": sale.customer_codigo_municipio,
                    "uf": sale.customer_uf,
                    "cep": sale.customer_cep
                }
            },

            # Itens da nota
            "itens": [
                {
                    "numero_item": 1,
                    "codigo_produto": sale.product.sku or str(sale.product.id),
                    "descricao": sale.product.fiscal_description or sale.product.name,
                    "cfop": sale.cfop,
                    "unidade_comercial": sale.product.unidade_tributavel,
                    "quantidade_comercial": sale.quantity,
                    "valor_unitario": float(sale.unit_price),
                    "valor_total": float(sale.total_value),
                    "ncm": sale.product.ncm_code,
                    "cest": sale.product.cest_code,
                    "origem": sale.product.origin,

                    # Tributos
                    "tributos": {
                        "icms": {
                            "csosn": sale.product.icms_csosn,
                            "cst": sale.product.icms_cst,
                            "aliquota": float(sale.product.icms_aliquota or 0)
                        },
                        "pis": {
                            "cst": sale.product.pis_cst,
                            "aliquota": float(sale.product.pis_aliquota or 0)
                        },
                        "cofins": {
                            "cst": sale.product.cofins_cst,
                            "aliquota": float(sale.product.cofins_aliquota or 0)
                        }
                    }
                }
            ],

            # Total
            "total": {
                "valor_produtos": float(sale.total_value),
                "valor_desconto": 0.0,
                "valor_total": float(sale.total_value)
            },

            # Transporte
            "transporte": {
                "modalidade_frete": 9  # 9=Sem frete (venda local/digital)
            },

            # Informações Adicionais
            "informacoes_adicionais": {
                "informacoes_fisco": "NF-e emitida via Orion ERP",
                "informacoes_complementares": sale.notes or ""
            }
        }

    def _get_headers(self) -> Dict[str, str]:
        """Get HTTP headers for fiscal API requests"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    def _log_audit(
        self,
        sale_id: int,
        user_id: int,
        action: str,
        request_payload: Optional[Dict] = None,
        response_payload: Optional[Dict] = None,
        error_message: Optional[str] = None,
        error_code: Optional[str] = None,
        ip_address: Optional[str] = None
    ):
        """
        Log fiscal operation to audit table.

        Args:
            sale_id: ID of the sale
            user_id: ID of the user
            action: Action type (issue_attempt, issue_success, issue_failure, etc.)
            request_payload: JSON sent to fiscal API
            response_payload: JSON received from fiscal API
            error_message: Error message (if any)
            error_code: Error code (if any)
            ip_address: IP address of request
        """
        try:
            audit_log = FiscalAuditLog(
                workspace_id=self.workspace.id,
                sale_id=sale_id,
                user_id=user_id,
                action=action,
                request_payload=request_payload,
                response_payload=response_payload,
                error_message=error_message,
                error_code=error_code,
                ip_address=ip_address
            )
            self.db.add(audit_log)
            self.db.commit()
        except Exception as e:
            logger.error(f"Erro ao salvar log de auditoria fiscal: {str(e)}")
            # Don't raise - audit log failure shouldn't break the main flow
