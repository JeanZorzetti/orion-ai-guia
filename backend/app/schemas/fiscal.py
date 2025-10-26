"""
Pydantic Schemas for Fiscal Operations

Defines request/response models for NF-e operations.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime


# Request Schemas

class IssueNFeRequest(BaseModel):
    """Request to issue NF-e for a sale"""
    # No body needed - sale_id comes from path parameter
    pass


class CancelNFeRequest(BaseModel):
    """Request to cancel an issued NF-e"""
    reason: str = Field(
        ...,
        min_length=15,
        max_length=500,
        description="Justificativa de cancelamento (mínimo 15 caracteres)"
    )

    @validator('reason')
    def validate_reason(cls, v):
        if not v or not v.strip():
            raise ValueError("Justificativa não pode estar vazia")
        return v.strip()


class FiscalConfigRequest(BaseModel):
    """Request to update fiscal configuration"""
    # Dados da Empresa
    cnpj: str = Field(..., min_length=14, max_length=14, description="CNPJ sem pontuação (14 dígitos)")
    razao_social: str = Field(..., min_length=3, max_length=255)
    nome_fantasia: Optional[str] = Field(None, max_length=255)
    inscricao_estadual: str = Field(..., min_length=2, max_length=20)
    inscricao_municipal: Optional[str] = Field(None, max_length=20)
    regime_tributario: int = Field(..., ge=1, le=3, description="1=Simples, 2=SN-Excesso, 3=Normal")

    # Endereço Fiscal
    fiscal_cep: str = Field(..., min_length=8, max_length=8, description="CEP sem traço (8 dígitos)")
    fiscal_logradouro: str = Field(..., min_length=3, max_length=255)
    fiscal_numero: str = Field(..., min_length=1, max_length=20)
    fiscal_complemento: Optional[str] = Field(None, max_length=100)
    fiscal_bairro: str = Field(..., min_length=2, max_length=100)
    fiscal_cidade: str = Field(..., min_length=2, max_length=100)
    fiscal_uf: str = Field(..., min_length=2, max_length=2, description="UF em maiúsculas")
    fiscal_codigo_municipio: str = Field(..., min_length=7, max_length=7)

    # Parceiro Fiscal
    fiscal_partner: str = Field(..., description="Parceiro: 'plugnotas', 'focusnfe', 'nfeio'")
    fiscal_partner_api_key: str = Field(..., min_length=10, description="API Key do parceiro fiscal")

    # Configurações de NF-e
    nfe_serie: int = Field(default=1, ge=1, le=999, description="Série da NF-e (1-999)")
    nfe_ambiente: int = Field(default=2, ge=1, le=2, description="1=Produção, 2=Homologação")

    @validator('fiscal_uf')
    def validate_uf(cls, v):
        if v:
            v = v.upper()
            valid_ufs = [
                'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
                'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
                'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
            ]
            if v not in valid_ufs:
                raise ValueError(f"UF inválida: {v}")
        return v

    @validator('fiscal_partner')
    def validate_partner(cls, v):
        valid_partners = ['plugnotas', 'focusnfe', 'nfeio']
        if v.lower() not in valid_partners:
            raise ValueError(f"Parceiro inválido. Opções: {', '.join(valid_partners)}")
        return v.lower()

    @validator('cnpj', 'fiscal_cep')
    def validate_only_digits(cls, v):
        if not v.isdigit():
            raise ValueError("Deve conter apenas dígitos")
        return v


# Response Schemas

class IssueNFeResponse(BaseModel):
    """Response after issuing NF-e"""
    success: bool
    nfe_chave: Optional[str] = None
    nfe_numero: Optional[int] = None
    danfe_url: Optional[str] = None
    xml_url: Optional[str] = None
    error: Optional[str] = None
    validation_errors: Optional[List[str]] = None


class CancelNFeResponse(BaseModel):
    """Response after cancelling NF-e"""
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None


class FiscalConfigResponse(BaseModel):
    """Response with fiscal configuration"""
    cnpj: Optional[str]
    razao_social: Optional[str]
    nome_fantasia: Optional[str]
    inscricao_estadual: Optional[str]
    regime_tributario: Optional[int]
    fiscal_partner: Optional[str]
    nfe_serie: int
    nfe_ambiente: int
    certificate_status: str
    certificate_expires_at: Optional[datetime]
    fiscal_config_updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class NFEStatusResponse(BaseModel):
    """Response with NF-e status for a sale"""
    sale_id: int
    nfe_status: str
    nfe_chave: Optional[str]
    nfe_numero: Optional[int]
    nfe_serie: Optional[int]
    nfe_danfe_url: Optional[str]
    nfe_xml_url: Optional[str]
    nfe_issued_at: Optional[datetime]
    nfe_rejection_reason: Optional[str]
    nfe_cancelled_at: Optional[datetime]
    nfe_cancellation_reason: Optional[str]

    class Config:
        from_attributes = True
