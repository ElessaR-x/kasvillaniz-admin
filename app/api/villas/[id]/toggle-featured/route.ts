import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUser } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const { id } = await params;

    // Mevcut villayı bul
    const villa = await prisma.villa.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        isFeatured: true
      }
    });

    if (!villa) {
      return NextResponse.json({ error: 'Villa bulunamadı' }, { status: 404 });
    }

    // Durumu tersine çevir
    const updatedVilla = await prisma.villa.update({
      where: { id },
      data: {
        isFeatured: {
          set: !villa.isFeatured
        }
      },
      select: {
        id: true,
        name: true,
        isFeatured: true
      }
    });

    // Aktivite kaydı oluştur
    await prisma.activity.create({
      data: {
        type: 'villa_featured_updated',
        title: 'Villa Öne Çıkarma Durumu Güncellendi',
        description: `${villa.name} isimli villa ${updatedVilla.isFeatured ? 'öne çıkarıldı' : 'öne çıkarılanlardan kaldırıldı'}`,
        villaId: villa.id,
        user: user.email
      }
    });

    return NextResponse.json(updatedVilla);
  } catch (error) {
    console.error('Villa öne çıkarma durumu güncellenirken hata:', error);
    return NextResponse.json(
      { error: 'Villa öne çıkarma durumu güncellenemedi' },
      { status: 500 }
    );
  }
} 