import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

// Auth gerektirmeyen route'lar
const publicRoutes = [
  '/login',
  '/photos',
  '/images',
  '/uploads',
  '/api/upload',
  '/villa-photos' // Villa fotoğrafları için eklendi
];

// JWT secret'ını TextEncoder ile Buffer'a çevir
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gizli-anahtar'
);

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

// Herkese açık path'leri kontrol eden fonksiyon
function isPublicPath(pathname: string) {
  return publicRoutes.some(route => pathname.startsWith(route)) || 
         pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) !== null;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log('Middleware running for path:', pathname);

  // Villa fotoğrafları için özel işlem
  if (pathname.startsWith('/villa-photos/')) {
    // API route'a yönlendir
    const newUrl = new URL('/api/static' + pathname, request.url);
    return NextResponse.rewrite(newUrl);
  }

  // Public dosyalara direkt erişim izni
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;
  console.log('Token exists:', !!token);

  // API routes için kontrol
  if (pathname.startsWith('/api')) {
    const response = NextResponse.next();
    
    // Dosya yükleme limiti için headers
    response.headers.set('max-body-size', '100mb');
    return response;
  }

  if (!token) {
    console.log('No token, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Jose ile token doğrulama
    const { payload } = await jose.jwtVerify(token, secret);
    const user = payload as unknown as JWTPayload;
    console.log('Token verified:', !!payload);

    // Admin kontrolü
    if (user.role !== 'admin') {
      console.log('User is not admin, access denied');
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }

    return NextResponse.next();
  } catch (error) {
    console.log('Token verification failed:', error);
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/villa-photos/:path*'  // Villa fotoğrafları için eklendi
  ],
}; 