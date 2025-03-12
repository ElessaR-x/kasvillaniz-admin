import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { getUser } from '@/lib/auth';
import { uploadToS3 } from '@/lib/s3';

export const config = {
  api: {
    bodyParser: false, // Dosya yüklemeleri için gerekli
    responseLimit: false,
    // Timeout süresini artır
    externalResolver: true,
  },
  runtime: 'nodejs', // Node.js runtime'ı kullan
  maxDuration: 300, // 5 dakika timeout
};

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });
    }

    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `Dosya boyutu çok büyük (maksimum 100MB). Mevcut boyut: ${(file.size / (1024 * 1024)).toFixed(2)}MB` 
      }, { status: 400 });
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
      
      // Görüntüyü optimize et
      const optimizedBuffer = await sharp(Buffer.from(arrayBuffer), {
        failOnError: false,
        limitInputPixels: false,
        sequentialRead: true
      })
        .resize(1920, 1080, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ 
          quality: 80,
          progressive: true,
          force: false,
          optimizeCoding: true
        })
        .toBuffer();

      // S3'e yükle
      const fileUrl = await uploadToS3(optimizedBuffer, fileName);
      
      return NextResponse.json({
        url: fileUrl,
        success: true,
        fileName: fileName,
        size: optimizedBuffer.length
      }, {
        headers: {
          'Cache-Control': 'no-store'
        }
      });

    } catch (error) {
      console.error('Görsel işleme hatası:', error);
      return NextResponse.json({
        error: 'Görsel işlenirken bir hata oluştu',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Dosya yükleme hatası:', error);
    return NextResponse.json({
      error: 'Dosya yüklenemedi',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 });
  }
} 