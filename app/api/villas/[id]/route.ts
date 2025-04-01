import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUser } from '@/lib/auth';

const prisma = new PrismaClient();


// Villa detayını getir
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const { id } = await params;

    const villa = await prisma.villa.findUnique({
      where: { id },
      include: {
        distances: true,
        seasonalPrices: true,
        bookings: {
          include: {
            contactPerson: true,
            guests: true
          }
        }
      }
    });

    if (!villa) {
      return NextResponse.json(
        { error: 'Villa bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(villa);
  } catch (error) {
    console.error('Villa detayı alınırken hata:', error);
    return NextResponse.json(
      { error: 'Villa detayı alınamadı' },
      { status: 500 }
    );
  }
}

// Villa güncelle
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
    const bodyText = await request.text();
    let body;
    
    try {
      body = JSON.parse(bodyText);
      console.log('Update request body:', JSON.stringify(body, null, 2));
    } catch (e) {
      console.error('JSON parse hatası:', e);
      return NextResponse.json({
        success: false,
        error: 'Geçersiz istek formatı',
        details: 'Request body JSON formatında olmalıdır'
      }, { status: 400 });
    }

    const existingVilla = await prisma.villa.findUnique({
      where: { id },
      include: {
        distances: true,
        seasonalPrices: true
      }
    });

    if (!existingVilla) {
      return NextResponse.json({ 
        success: false, 
        error: 'Villa bulunamadı' 
      }, { status: 404 });
    }

    // Veriyi Prisma formatına dönüştür
    const updateData = {
      name: body.name,
      originalName: body.originalName,
      code: body.code,
      description: body.description,
      price: Number(body.price),
      currency: body.currency,
      images: body.images || [],
      features: body.features || [],
      location: body.location,
      bedrooms: Number(body.bedrooms),
      bathrooms: Number(body.bathrooms),
      maxGuests: Number(body.maxGuests),
      minStayDays: Number(body.minStayDays),
      ownerName: body.ownerName,
      identityNumber: body.identityNumber,
      phoneNumber: body.phoneNumber,
      ibanOwner: body.ibanOwner,
      ibanNumber: body.ibanNumber,
      email: body.email,
      tourismLicenseNumber: body.tourismLicenseNumber,
      mapLink: body.mapLink,
      lat: body.lat ? Number(body.lat) : null,
      lng: body.lng ? Number(body.lng) : null,
      rating: body.rating ? Number(body.rating) : null,
      reviewCount: body.reviews ? Number(body.reviews) : null,
      amenities: body.amenities || [],
      size: body.size,
      tags: body.tags || [],
      discount: body.discount,
      isActive: body.isActive,
      isFeatured: body.isFeatured,
      distances: {
        upsert: {
          create: {
            miniMarket: Number(body.distances?.miniMarket || 0),
            restaurant: Number(body.distances?.restaurant || 0),
            publicTransport: Number(body.distances?.publicTransport || 0),
            beach: Number(body.distances?.beach || 0),
            airport: Number(body.distances?.airport || 0),
            cityCenter: Number(body.distances?.cityCenter || 0)
          },
          update: {
            miniMarket: Number(body.distances?.miniMarket || 0),
            restaurant: Number(body.distances?.restaurant || 0),
            publicTransport: Number(body.distances?.publicTransport || 0),
            beach: Number(body.distances?.beach || 0),
            airport: Number(body.distances?.airport || 0),
            cityCenter: Number(body.distances?.cityCenter || 0)
          }
        }
      }
    } as const;

    console.log('Prisma update işlemi başlıyor...');
    const updatedVilla = await prisma.villa.update({
      where: { id },
      data: updateData,
      include: {
        distances: true,
        seasonalPrices: true,
        bookings: {
          include: {
            contactPerson: true,
            guests: true
          }
        }
      }
    });
    console.log('Villa başarıyla güncellendi:', updatedVilla.id);

    return NextResponse.json({ 
      success: true, 
      data: updatedVilla 
    });

  } catch (error) {
    console.error('Villa güncelleme hatası:', {
      message: error instanceof Error ? error.message : 'Bilinmeyen hata',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });

    return NextResponse.json({
      success: false,
      error: 'Villa güncellenemedi',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 });
  }
}

// Villa sil
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const { id } = await params;

    // Villa'nın var olup olmadığını kontrol et
    const existingVilla = await prisma.villa.findUnique({
      where: { id }
    });

    if (!existingVilla) {
      return NextResponse.json(
        { error: 'Villa bulunamadı' },
        { status: 404 }
      );
    }

    // Villa'yı sil
    const villa = await prisma.villa.delete({
      where: { id }
    });

    // Aktivite kaydı oluştur
    await prisma.activity.create({
      data: {
        type: 'villa_deleted',
        title: 'Villa Silindi',
        description: `${villa.name} isimli villa silindi`,
        villaId: villa.id,
        user: user.email
      }
    });

    return NextResponse.json({ message: 'Villa başarıyla silindi' });
  } catch (error) {
    console.error('Villa silinirken hata:', error);
    return NextResponse.json(
      { error: 'Villa silinemedi' },
      { status: 500 }
    );
  }
}