import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  if (pathname.startsWith('/bms')) {
    const token = request.cookies.get('tokens') || request.headers.get('authorization');
    
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }
  
  if (pathname.startsWith('/auth/login')) {
    const token = request.cookies.get('tokens') || request.headers.get('authorization');
    
    if (token) {
      return NextResponse.redirect(new URL('/bms/reservations', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/bms/:path*',
    '/auth/:path*',
  ],
};