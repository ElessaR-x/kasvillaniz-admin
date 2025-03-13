import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUser } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const { id } = await context.params;
    const bodyText = await request.text();
    let body;
    
    try {
      body = JSON.parse(bodyText);
    } catch {
      return NextResponse.json({
        error: 'Geçersiz istek formatı',
        details: 'Request body JSON formatında olmalıdır'
      }, { status: 400 });
    }

    // Villa kontrolü
    const villa = await prisma.villa.findUnique({
      where: { id }
    });

    if (!villa) {
      return NextResponse.json({ error: 'Villa bulunamadı' }, { status: 404 });
    }

    // Tarih çakışması kontrolü
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);

    // Çakışan sezonluk fiyatları kontrol et
    const existingPrices = await prisma.seasonalPrice.findMany({
      where: {
        villaId: id,
        OR: [
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: startDate } }
            ]
          },
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: endDate } }
            ]
          },
          {
            AND: [
              { startDate: { gte: startDate } },
              { endDate: { lte: endDate } }
            ]
          }
        ]
      }
    });

    // Eğer çakışan fiyat varsa, hata döndür
    if (existingPrices.length > 0) {
      const formattedDates = existingPrices.map(price => ({
        startDate: price.startDate.toLocaleDateString('tr-TR'),
        endDate: price.endDate.toLocaleDateString('tr-TR'),
        price: price.price,
        currency: price.currency
      }));

      return NextResponse.json({
        error: 'Tarih çakışması',
        details: 'Bu tarih aralığında zaten sezonluk fiyat bulunmaktadır',
        existingPrices: formattedDates
      }, { status: 409 }); // 409 Conflict
    }

    // Yeni sezonluk fiyat ekleme
    const seasonalPrice = await prisma.seasonalPrice.create({
      data: {
        startDate: startDate,
        endDate: endDate,
        price: Number(body.price),
        currency: String(body.currency),
        months: Array.isArray(body.months) ? body.months : [],
        villaId: id
      }
    });

    // Aktivite kaydı
    await prisma.activity.create({
      data: {
        type: 'price_updated',
        title: 'Sezonluk Fiyat Eklendi',
        description: `${villa.name} için yeni sezonluk fiyat eklendi`,
        villaId: id,
        user: user.email
      }
    });

    return NextResponse.json({
      message: 'Sezonluk fiyat başarıyla eklendi',
      data: seasonalPrice
    });

  } catch (error) {
    console.error('Sezonluk fiyat ekleme hatası:', error);
    return NextResponse.json({
      error: 'Sezonluk fiyat eklenemedi',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const { id } = await context.params;

    const seasonalPrices = await prisma.seasonalPrice.findMany({
      where: { villaId: id },
      orderBy: { startDate: 'asc' }
    });

    return NextResponse.json(seasonalPrices);

  } catch (error) {
    console.error('Sezonluk fiyatlar getirilirken hata:', error);
    return NextResponse.json({ error: 'Sezonluk fiyatlar getirilemedi' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const priceId = searchParams.get('priceId');

    if (!priceId) {
      return NextResponse.json({ error: 'Fiyat ID\'si gerekli' }, { status: 400 });
    }

    const seasonalPrice = await prisma.seasonalPrice.findUnique({
      where: { id: priceId }
    });

    if (!seasonalPrice || seasonalPrice.villaId !== id) {
      return NextResponse.json({ error: 'Geçersiz fiyat ID\'si' }, { status: 404 });
    }

    await prisma.seasonalPrice.delete({
      where: { id: priceId }
    });

    return NextResponse.json({ message: 'Sezonluk fiyat başarıyla silindi' });

  } catch (error) {
    console.error('Sezonluk fiyat silinirken hata:', error);
    return NextResponse.json({ error: 'Sezonluk fiyat silinemedi' }, { status: 500 });
  }
} 