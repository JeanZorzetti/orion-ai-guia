from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional


class SaleBase(BaseModel):
    """Base schema for Sale"""
    product_id: int
    customer_name: str = Field(..., min_length=1, max_length=255)
    customer_cpf_cnpj: Optional[str] = Field(None, max_length=14)
    customer_email: Optional[str] = Field(None, max_length=255)
    customer_phone: Optional[str] = Field(None, max_length=20)

    # Endereço do Cliente
    customer_cep: Optional[str] = Field(None, max_length=8)
    customer_logradouro: Optional[str] = Field(None, max_length=255)
    customer_numero: Optional[str] = Field(None, max_length=20)
    customer_complemento: Optional[str] = Field(None, max_length=100)
    customer_bairro: Optional[str] = Field(None, max_length=100)
    customer_cidade: Optional[str] = Field(None, max_length=100)
    customer_uf: Optional[str] = Field(None, max_length=2)
    customer_codigo_municipio: Optional[str] = Field(None, max_length=7)

    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., ge=0)
    total_value: float = Field(..., ge=0)
    sale_date: date

    # Campos fiscais opcionais
    natureza_operacao: Optional[str] = Field(None, max_length=100)
    cfop: Optional[str] = Field(None, max_length=4)
    origin_channel: Optional[str] = Field(None, max_length=50)
    origin_order_id: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class SaleCreate(SaleBase):
    """Schema for creating a new Sale"""
    pass


class SaleUpdate(BaseModel):
    """Schema for updating a Sale"""
    product_id: Optional[int] = None
    customer_name: Optional[str] = Field(None, min_length=1, max_length=255)
    customer_cpf_cnpj: Optional[str] = Field(None, max_length=14)
    customer_email: Optional[str] = Field(None, max_length=255)
    customer_phone: Optional[str] = Field(None, max_length=20)

    # Endereço do Cliente
    customer_cep: Optional[str] = Field(None, max_length=8)
    customer_logradouro: Optional[str] = Field(None, max_length=255)
    customer_numero: Optional[str] = Field(None, max_length=20)
    customer_complemento: Optional[str] = Field(None, max_length=100)
    customer_bairro: Optional[str] = Field(None, max_length=100)
    customer_cidade: Optional[str] = Field(None, max_length=100)
    customer_uf: Optional[str] = Field(None, max_length=2)
    customer_codigo_municipio: Optional[str] = Field(None, max_length=7)

    quantity: Optional[int] = Field(None, gt=0)
    unit_price: Optional[float] = Field(None, ge=0)
    total_value: Optional[float] = Field(None, ge=0)
    status: Optional[str] = Field(None, pattern="^(pending|completed|cancelled)$")
    sale_date: Optional[date] = None

    # Campos fiscais opcionais
    natureza_operacao: Optional[str] = Field(None, max_length=100)
    cfop: Optional[str] = Field(None, max_length=4)
    origin_channel: Optional[str] = Field(None, max_length=50)
    origin_order_id: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class SaleResponse(SaleBase):
    """Schema for Sale response"""
    id: int
    workspace_id: int
    status: str

    # Campos NF-e
    nfe_status: Optional[str] = None
    nfe_id_partner: Optional[str] = None
    nfe_chave: Optional[str] = None
    nfe_numero: Optional[int] = None
    nfe_serie: Optional[int] = None
    nfe_xml_url: Optional[str] = None
    nfe_danfe_url: Optional[str] = None
    nfe_protocolo: Optional[str] = None
    nfe_issued_at: Optional[datetime] = None
    nfe_rejection_reason: Optional[str] = None
    nfe_rejection_code: Optional[str] = None
    nfe_cancelled_at: Optional[datetime] = None
    nfe_cancellation_reason: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
