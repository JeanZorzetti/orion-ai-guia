"""
Fiscal Validator Service

Validates data before NF-e emission to prevent SEFAZ rejections.
Checks company data, product fiscal fields, customer information, etc.

All validations are based on Brazilian NF-e (Nota Fiscal Eletrônica) requirements.
"""

from typing import List, Optional
from app.models.sale import Sale
from app.models.workspace import Workspace
from app.models.product import Product


class FiscalValidator:
    """
    Validates fiscal data before NF-e emission.

    Ensures all required fields are present and valid according to SEFAZ rules.
    """

    def validate_before_issue(self, sale: Sale, workspace: Workspace) -> List[str]:
        """
        Comprehensive validation before issuing NF-e.

        Args:
            sale: Sale object with customer and product data
            workspace: Workspace object with company fiscal configuration

        Returns:
            List of error messages (empty if validation passes)
        """
        errors = []

        # Validate workspace (company) data
        errors.extend(self._validate_workspace(workspace))

        # Validate product fiscal data
        errors.extend(self._validate_product(sale.product))

        # Validate customer data
        errors.extend(self._validate_customer(sale))

        # Validate sale values
        errors.extend(self._validate_sale_values(sale))

        return errors

    def _validate_workspace(self, workspace: Workspace) -> List[str]:
        """Validate company fiscal configuration"""
        errors = []

        # CNPJ
        if not workspace.cnpj:
            errors.append("CNPJ da empresa não configurado")
        elif len(workspace.cnpj) != 14:
            errors.append(f"CNPJ inválido: deve ter 14 dígitos (atual: {len(workspace.cnpj)})")

        # Razão Social
        if not workspace.razao_social:
            errors.append("Razão Social não configurada")

        # Inscrição Estadual
        if not workspace.inscricao_estadual:
            errors.append("Inscrição Estadual não configurada")

        # Regime Tributário
        if not workspace.regime_tributario:
            errors.append("Regime Tributário não configurado")
        elif workspace.regime_tributario not in [1, 2, 3]:
            errors.append(f"Regime Tributário inválido: deve ser 1 (Simples), 2 (SN-Excesso) ou 3 (Normal)")

        # Endereço Fiscal
        if not workspace.fiscal_logradouro:
            errors.append("Logradouro da empresa não configurado")
        if not workspace.fiscal_numero:
            errors.append("Número do endereço da empresa não configurado")
        if not workspace.fiscal_bairro:
            errors.append("Bairro da empresa não configurado")
        if not workspace.fiscal_cidade:
            errors.append("Cidade da empresa não configurada")
        if not workspace.fiscal_uf:
            errors.append("UF da empresa não configurada")
        elif len(workspace.fiscal_uf) != 2:
            errors.append(f"UF inválida: deve ter 2 caracteres (atual: {workspace.fiscal_uf})")
        if not workspace.fiscal_cep:
            errors.append("CEP da empresa não configurado")
        elif len(workspace.fiscal_cep) != 8:
            errors.append(f"CEP inválido: deve ter 8 dígitos sem traço (atual: {workspace.fiscal_cep})")

        # API Fiscal
        if not workspace.fiscal_partner:
            errors.append("Parceiro fiscal (PlugNotas/FocusNFe) não configurado")
        if not workspace.fiscal_partner_api_key:
            errors.append("API Key do parceiro fiscal não configurada")

        # Certificado Digital
        if workspace.certificate_status != 'active':
            errors.append(f"Certificado Digital não ativo (status: {workspace.certificate_status})")

        return errors

    def _validate_product(self, product: Product) -> List[str]:
        """Validate product fiscal data"""
        errors = []

        # NCM é obrigatório
        if not product.ncm_code:
            errors.append(f"Produto '{product.name}': NCM não configurado (obrigatório para NF-e)")
        elif len(product.ncm_code) != 8:
            errors.append(f"Produto '{product.name}': NCM inválido - deve ter 8 dígitos (atual: {product.ncm_code})")

        # Origem da mercadoria
        if product.origin is None:
            errors.append(f"Produto '{product.name}': Origem da mercadoria não configurada")
        elif product.origin not in range(0, 9):  # 0-8 são valores válidos
            errors.append(f"Produto '{product.name}': Origem inválida (deve ser 0-8, atual: {product.origin})")

        # ICMS - deve ter CSOSN ou CST
        if not product.icms_csosn and not product.icms_cst:
            errors.append(f"Produto '{product.name}': ICMS CSOSN ou CST não configurado")

        # PIS/COFINS - deve ter CST
        if not product.pis_cst:
            errors.append(f"Produto '{product.name}': PIS CST não configurado")
        if not product.cofins_cst:
            errors.append(f"Produto '{product.name}': COFINS CST não configurado")

        # Unidade tributável
        if not product.unidade_tributavel:
            errors.append(f"Produto '{product.name}': Unidade tributável não configurada")

        return errors

    def _validate_customer(self, sale: Sale) -> List[str]:
        """Validate customer data"""
        errors = []

        # Nome
        if not sale.customer_name:
            errors.append("Nome do cliente não informado")
        elif len(sale.customer_name) < 3:
            errors.append(f"Nome do cliente muito curto (mínimo 3 caracteres)")

        # CPF/CNPJ
        if not sale.customer_cpf_cnpj:
            errors.append("CPF/CNPJ do cliente não informado (obrigatório para NF-e)")
        else:
            cpf_cnpj_len = len(sale.customer_cpf_cnpj)
            if cpf_cnpj_len not in [11, 14]:
                errors.append(f"CPF/CNPJ inválido: deve ter 11 (CPF) ou 14 (CNPJ) dígitos (atual: {cpf_cnpj_len})")

        # Email (opcional, mas se informado deve ser válido)
        if sale.customer_email and '@' not in sale.customer_email:
            errors.append(f"Email do cliente inválido: {sale.customer_email}")

        # Endereço do Cliente (obrigatório para NF-e)
        if not sale.customer_logradouro:
            errors.append("Logradouro do cliente não informado")
        if not sale.customer_numero:
            errors.append("Número do endereço do cliente não informado")
        if not sale.customer_bairro:
            errors.append("Bairro do cliente não informado")
        if not sale.customer_cidade:
            errors.append("Cidade do cliente não informada")
        if not sale.customer_uf:
            errors.append("UF do cliente não informada")
        elif len(sale.customer_uf) != 2:
            errors.append(f"UF do cliente inválida: deve ter 2 caracteres (atual: {sale.customer_uf})")
        if not sale.customer_cep:
            errors.append("CEP do cliente não informado")
        elif len(sale.customer_cep) != 8:
            errors.append(f"CEP do cliente inválido: deve ter 8 dígitos sem traço (atual: {sale.customer_cep})")

        return errors

    def _validate_sale_values(self, sale: Sale) -> List[str]:
        """Validate sale financial values"""
        errors = []

        # Valor total
        if not sale.total_value or sale.total_value <= 0:
            errors.append(f"Valor total inválido: R$ {sale.total_value}")

        # Quantidade
        if not sale.quantity or sale.quantity <= 0:
            errors.append(f"Quantidade inválida: {sale.quantity}")

        # Preço unitário
        if not sale.unit_price or sale.unit_price <= 0:
            errors.append(f"Preço unitário inválido: R$ {sale.unit_price}")

        # Consistência: total_value deve ser aproximadamente quantity * unit_price
        expected_total = sale.quantity * sale.unit_price
        if abs(sale.total_value - expected_total) > 0.02:  # Tolerância de R$ 0.02 para arredondamentos
            errors.append(
                f"Inconsistência nos valores: "
                f"{sale.quantity} x R$ {sale.unit_price} = R$ {expected_total}, "
                f"mas total_value = R$ {sale.total_value}"
            )

        return errors

    def validate_cnpj(self, cnpj: str) -> bool:
        """
        Validate CNPJ format and check digits.

        Args:
            cnpj: CNPJ string (only digits, 14 chars)

        Returns:
            True if valid, False otherwise
        """
        if not cnpj or len(cnpj) != 14:
            return False

        # Check if all digits are the same (invalid CNPJ)
        if cnpj == cnpj[0] * 14:
            return False

        # Calculate first check digit
        sum_val = 0
        weight = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        for i in range(12):
            sum_val += int(cnpj[i]) * weight[i]

        remainder = sum_val % 11
        digit1 = 0 if remainder < 2 else 11 - remainder

        if int(cnpj[12]) != digit1:
            return False

        # Calculate second check digit
        sum_val = 0
        weight = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        for i in range(13):
            sum_val += int(cnpj[i]) * weight[i]

        remainder = sum_val % 11
        digit2 = 0 if remainder < 2 else 11 - remainder

        return int(cnpj[13]) == digit2

    def validate_cpf(self, cpf: str) -> bool:
        """
        Validate CPF format and check digits.

        Args:
            cpf: CPF string (only digits, 11 chars)

        Returns:
            True if valid, False otherwise
        """
        if not cpf or len(cpf) != 11:
            return False

        # Check if all digits are the same (invalid CPF)
        if cpf == cpf[0] * 11:
            return False

        # Calculate first check digit
        sum_val = 0
        for i in range(9):
            sum_val += int(cpf[i]) * (10 - i)

        remainder = sum_val % 11
        digit1 = 0 if remainder < 2 else 11 - remainder

        if int(cpf[9]) != digit1:
            return False

        # Calculate second check digit
        sum_val = 0
        for i in range(10):
            sum_val += int(cpf[i]) * (11 - i)

        remainder = sum_val % 11
        digit2 = 0 if remainder < 2 else 11 - remainder

        return int(cpf[10]) == digit2
