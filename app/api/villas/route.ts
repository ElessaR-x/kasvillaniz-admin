import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUser } from '@/lib/auth';

const prisma = new PrismaClient();

// Villa listesini getir
export async function GET() {
  try {
    // Auth kontrolü
    const user = await getUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const villas = await prisma.villa.findMany({
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

    return NextResponse.json(villas);
  } catch (error) {
    console.error('Villa listesi alınırken hata:', error);
    return NextResponse.json(
      { error: 'Villa listesi alınamadı' },
      { status: 500 }
    );
  }
}

// Yeni villa ekle
export async function POST(request: Request) {
  try {
    // Auth kontrolü
    const user = await getUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    // Request body'yi parse et ve logla
    let body;
    try {
      body = await request.json();
      console.log('Request body:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.error('Request body parse hatası:', parseError);
      return NextResponse.json({
        success: false,
        error: 'Geçersiz request formatı',
        details: 'Request body JSON formatında olmalıdır'
      }, { status: 400 });
    }

    // Veriyi Prisma formatına dönüştür
    const villaData = {
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
      rating: body.rating ? Number(body.rating) : null,
      reviewCount: body.reviews ? Number(body.reviews) : null,
      amenities: body.amenities || [],
      size: body.size,
      tags: body.tags || [],
      discount: body.discount,
      isActive: body.isActive,
      isFeatured: body.isFeatured,
      distances: {
        create: {
          miniMarket: Number(body.distances?.miniMarket || 0),
          restaurant: Number(body.distances?.restaurant || 0),
          publicTransport: Number(body.distances?.publicTransport || 0),
          beach: Number(body.distances?.beach || 0),
          airport: Number(body.distances?.airport || 0),
          cityCenter: Number(body.distances?.cityCenter || 0)
        }
      },
      seasonalPrices: {
        create: Array.isArray(body.seasonalPrices) ? body.seasonalPrices : []
      }
    } as const;

    // Villa oluştur
    console.log('Prisma create işlemi başlıyor...');
    const villa = await prisma.villa.create({
      data: villaData,
      include: {
        distances: true,
        seasonalPrices: true
      }
    });
    console.log('Villa başarıyla oluşturuldu:', villa.id);

    // Aktivite kaydı oluştur
    await prisma.activity.create({
      data: {
        type: 'villa_added',
        title: 'Yeni Villa Eklendi',
        description: `${villa.name} isimli villa eklendi`,
        villaId: villa.id,
        user: user.email
      }
    });
    console.log('Aktivite kaydı oluşturuldu');

    return NextResponse.json({ 
      success: true, 
      data: villa 
    });

  } catch (error) {
    // Hata detaylarını logla
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Bilinmeyen hata',
      stack: error instanceof Error ? error.stack : undefined,
      error
    };
    console.error('Villa eklenirken hata detayı:', errorDetails);

    return NextResponse.json({
      success: false,
      error: 'Villa eklenemedi',
      details: errorDetails.message
    }, { status: 500 });
  }
} 