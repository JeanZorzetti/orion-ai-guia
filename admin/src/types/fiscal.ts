// Types para o módulo fiscal

export type NFEStatus = 'pending' | 'processing' | 'issued' | 'rejected' | 'cancelled';

export type FiscalPartner = 'plugnotas' | 'focusnfe' | 'nfeio';

export type RegimeTributario = 1 | 2 | 3; // 1=Simples, 2=SN-Excesso, 3=Normal

export type NFEAmbiente = 1 | 2; // 1=Produção, 2=Homologação

export type CertificateStatus = 'active' | 'expired' | 'not_uploaded';

export interface FiscalConfig {
  // Dados da Empresa
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  inscricao_estadual: string;
  inscricao_municipal?: string;
  regime_tributario: RegimeTributario;

  // Endereço Fiscal
  fiscal_cep: string;
  fiscal_logradouro: string;
  fiscal_numero: string;
  fiscal_complemento?: string;
  fiscal_bairro: string;
  fiscal_cidade: string;
  fiscal_uf: string;
  fiscal_codigo_municipio: string;

  // Credenciais API Fiscal
  fiscal_partner: FiscalPartner;
  fiscal_partner_api_key: string;

  // Configurações NF-e
  nfe_serie: number;
  nfe_ambiente: NFEAmbiente;

  // Metadata (readonly - vem do backend)
  certificate_status?: CertificateStatus;
  certificate_expires_at?: string;
  fiscal_config_updated_at?: string;
}

export interface FiscalConfigResponse extends Omit<FiscalConfig, 'fiscal_partner_api_key'> {
  certificate_status: CertificateStatus;
  certificate_expires_at?: string;
  fiscal_config_updated_at?: string;
}

export interface IssueNFeResponse {
  success: boolean;
  nfe_chave?: string;
  danfe_url?: string;
  xml_url?: string;
  error?: string;
  validation_errors?: string[];
}

export interface CancelNFeResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface NFEStatusResponse {
  nfe_status: NFEStatus;
  nfe_chave?: string;
  nfe_numero?: number;
  nfe_serie?: number;
  nfe_danfe_url?: string;
  nfe_xml_url?: string;
  nfe_issued_at?: string;
  nfe_rejection_reason?: string;
  nfe_cancelled_at?: string;
  nfe_cancellation_reason?: string;
}

export interface Sale {
  id: number;
  nfe_status: NFEStatus;
  nfe_chave?: string;
  nfe_danfe_url?: string;
  nfe_xml_url?: string;
  nfe_rejection_reason?: string;
  nfe_issued_at?: string;
  nfe_cancelled_at?: string;
  nfe_cancellation_reason?: string;
}
