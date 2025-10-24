'use client';

import { useState, useEffect, useCallback } from 'react';

export interface CompanySettings {
  /**
   * Nome da empresa
   */
  companyName: string;
  /**
   * URL do logo da empresa
   */
  companyLogo: string | null;
  /**
   * Slogan ou descrição da empresa
   */
  companySlogan: string | null;
}

interface UseCompanySettingsReturn {
  /**
   * Configurações atuais da empresa
   */
  settings: CompanySettings;
  /**
   * Atualizar configurações
   */
  updateSettings: (newSettings: Partial<CompanySettings>) => void;
  /**
   * Resetar para configurações padrão
   */
  resetSettings: () => void;
  /**
   * Indica se as configurações estão carregando
   */
  loading: boolean;
}

const STORAGE_KEY = 'orion-erp-company-settings';

const DEFAULT_SETTINGS: CompanySettings = {
  companyName: 'Orion ERP',
  companyLogo: null,
  companySlogan: 'Sistema de Gestão Empresarial',
};

/**
 * Hook para gerenciar configurações da empresa
 *
 * Persiste as configurações no localStorage e fornece
 * funções para atualizar e resetar
 *
 * @example
 * const { settings, updateSettings, resetSettings } = useCompanySettings();
 *
 * // Atualizar nome da empresa
 * updateSettings({ companyName: 'Minha Empresa' });
 *
 * // Atualizar logo
 * updateSettings({ companyLogo: 'https://example.com/logo.png' });
 */
export function useCompanySettings(): UseCompanySettingsReturn {
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Carregar configurações do localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch (error) {
      console.error('Error loading company settings from localStorage:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar configurações
  const updateSettings = useCallback((newSettings: Partial<CompanySettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };

      // Salvar no localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (error) {
          console.error('Error saving company settings to localStorage:', error);
        }
      }

      return updated;
    });
  }, []);

  // Resetar configurações
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.error('Error removing company settings from localStorage:', error);
      }
    }
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings,
    loading,
  };
}
