'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se há token
    const token = localStorage.getItem('token');

    if (!token) {
      // Redirecionar para login preservando a URL atual
      const currentPath = window.location.pathname;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
    } else {
      setIsAuthenticated(true);
    }

    setIsLoading(false);
  }, [router]);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Só renderizar conteúdo se autenticado
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
