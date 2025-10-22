import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas públicas (não requerem autenticação)
const publicRoutes = ['/', '/login', '/register'];

// Rotas protegidas que requerem autenticação
const protectedRoutes = ['/admin/dashboard', '/admin/financeiro', '/admin/estoque', '/suppliers', '/invoices', '/products', '/sales', '/accounts-payable'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir acesso a rotas públicas (site institucional + login/register)
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Verificar se é uma rota protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    // Aqui poderíamos verificar cookies/tokens, mas como usamos localStorage
    // a verificação real será feita no cliente
    // Por enquanto, apenas permitimos o acesso (a página fará o redirect se necessário)
    return NextResponse.next();
  }

  // Permitir acesso a todas as outras rotas (/admin/*, etc)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (images, fonts, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|assets).*)',
  ],
};
