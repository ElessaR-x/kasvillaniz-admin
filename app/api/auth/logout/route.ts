import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ message: 'Başarıyla çıkış yapıldı' });
    
    // Cookie'yi response üzerinden sil
    response.cookies.delete('auth_token');

    return response;
  } catch{
    return NextResponse.json(
      { error: 'Çıkış yapılırken bir hata oluştu' },
      { status: 500 }
    );
  }
} 