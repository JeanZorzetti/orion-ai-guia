'use client';

import { useState, useEffect, useCallback } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface UseThemeReturn {
  /**
   * Tema atual ('light', 'dark', ou 'system')
   */
  theme: Theme;
  /**
   * Tema efetivo aplicado ('light' ou 'dark')
   * Quando theme='system', resolvedTheme retorna 'light' ou 'dark' baseado na preferência do sistema
   */
  resolvedTheme: 'light' | 'dark';
  /**
   * Define o tema
   */
  setTheme: (theme: Theme) => void;
  /**
   * Alterna entre light e dark (ignora system)
   */
  toggleTheme: () => void;
}

const STORAGE_KEY = 'orion-erp-theme';

/**
 * Hook para gerenciar tema dark/light/system
 *
 * Persiste a preferência no localStorage e aplica automaticamente
 * a classe no elemento <html>
 *
 * @example
 * const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
 *
 * // Usar com ThemeToggle
 * <ThemeToggle theme={theme} onThemeChange={setTheme} />
 */
export function useTheme(): UseThemeReturn {
  // Detectar preferência do sistema
  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  // Carregar tema do localStorage
  const getStoredTheme = useCallback((): Theme => {
    if (typeof window === 'undefined') return 'system';
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch (error) {
      console.error('Error loading theme from localStorage:', error);
    }
    return 'system';
  }, []);

  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => getSystemTheme());

  // Calcular tema resolvido
  const resolvedTheme: 'light' | 'dark' = theme === 'system' ? systemTheme : theme;

  // Aplicar tema no DOM
  const applyTheme = useCallback((resolvedTheme: 'light' | 'dark') => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;

    // Remover classes anteriores
    root.classList.remove('light', 'dark');

    // Adicionar classe do tema atual
    root.classList.add(resolvedTheme);

    // Atualizar atributo data-theme (para compatibilidade)
    root.setAttribute('data-theme', resolvedTheme);
  }, []);

  // Listener para mudanças na preferência do sistema
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    // Adicionar listener
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Aplicar tema quando mudar
  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme, applyTheme]);

  // Função para definir tema
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);

    // Salvar no localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, newTheme);
      } catch (error) {
        console.error('Error saving theme to localStorage:', error);
      }
    }
  }, []);

  // Função para alternar tema (apenas light/dark)
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
  };
}

/**
 * Hook simplificado que retorna apenas light/dark (sem system)
 */
export function useSimpleTheme() {
  const { resolvedTheme, toggleTheme } = useTheme();
  return { theme: resolvedTheme, toggleTheme };
}
