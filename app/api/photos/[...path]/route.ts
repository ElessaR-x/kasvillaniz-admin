import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { headers } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const filePath = path.join('/villa-photos', ...(await params).path);
    
    // Dosyayı buffer olarak okuyalım
    const fileBuffer = await readFile(filePath);
    
    const headersList = headers();
    const acceptHeader = (await headersList).get('accept');
    const contentType = acceptHeader?.includes('image/') 
      ? acceptHeader 
      : 'image/jpeg';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Dosya okuma hatası:', error);
    return NextResponse.json(
      { error: 'Dosya bulunamadı' },
      { status: 404 }
    );
  }
} 