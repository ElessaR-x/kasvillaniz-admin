import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';

const prisma = new PrismaClient();

// JWT secret'ını TextEncoder ile Buffer'a çevir
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'gizli-anahtar'
);

// JWT için algoritma
const alg = 'HS256';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('Login attempt:', { email });

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email ve şifre gereklidir' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    console.log('Found user:', user ? 'yes' : 'no');

    if (!user) {
      return NextResponse.json(
        { error: 'Kullanıcı bulunamadı' },
        { status: 401 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        { error: 'Geçersiz kullanıcı hesabı' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Geçersiz şifre' },
        { status: 401 }
      );
    }

    // Role kontrolü
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Bu panele erişim yetkiniz bulunmamaktadır' },
        { status: 403 }
      );
    }

    // JWT token oluştur
    const token = await new jose.SignJWT({ 
      userId: user.id,
      email: user.email,
      role: user.role 
    })
      .setProtectedHeader({ alg })
      .setExpirationTime('1d')
      .sign(secret);

    console.log('Token generated:', token.slice(0, 20) + '...');

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400
    });

    console.log('Cookie set completed');
    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Giriş yapılırken bir hata oluştu' },
      { status: 500 }
    );
  }
} 