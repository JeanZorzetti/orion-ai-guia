import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas que não requerem autenticação
const publicRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir acesso a rotas públicas
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Redirecionar raiz para login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verificar se há refresh_token (não conseguimos acessar localStorage no middleware)
  // O cliente fará a verificação real usando authService.isAuthenticated()
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
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
