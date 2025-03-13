import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUser } from '@/lib/auth';

const prisma = new PrismaClient();

// Tüm rezervasyonları getir
export async function GET() {
  try {
    const user = await getUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      include: {
        villa: true,
        contactPerson: true,
        guests: true
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Rezervasyonlar alınırken hata:', error);
    return NextResponse.json(
      { error: 'Rezervasyonlar alınamadı' },
      { status: 500 }
    );
  }
}

// Önce bir Guest interface tanımlayalım
interface GuestInput {
  fullName: string;
  identityNumber: string;
}

// Yeni rezervasyon oluştur
export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const body = await request.json();
    console.log('API - Gelen veri:', body);

    // Zorunlu alanları kontrol et
    if (!body.start || !body.end || !body.villaId) {
      return NextResponse.json({
        error: 'Eksik bilgi',
        details: 'Başlangıç tarihi, bitiş tarihi ve villa ID zorunludur'
      }, { status: 400 });
    }

    try {
      // Önce villa bilgisini al
      const villa = await prisma.villa.findUnique({
        where: { id: body.villaId }
      });

      if (!villa) {
        return NextResponse.json({
          error: 'Villa bulunamadı',
          details: 'Geçersiz villa ID'
        }, { status: 404 });
      }

      // Yeni tarih çakışması kontrolü
      const existingBookings = await prisma.booking.findMany({
        where: {
          villaId: body.villaId,
          NOT: {
            status: 'cancelled'
          }
        }
      });

      const newStart = new Date(body.start);
      const newEnd = new Date(body.end);

      // Tarih çakışması kontrolü
      const hasConflict = existingBookings.some(booking => {
        const bookingStart = new Date(booking.startDate);
        const bookingEnd = new Date(booking.endDate);

        // Yeni rezervasyonun başlangıcı, mevcut rezervasyonun çıkış günüyse izin ver
        if (newStart.getTime() === bookingEnd.getTime()) return false;

        // Yeni rezervasyonun bitişi, mevcut rezervasyonun giriş günüyse izin ver
        if (newEnd.getTime() === bookingStart.getTime()) return false;

        // Diğer durumlar için çakışma kontrolü
        // Yeni rezervasyon mevcut rezervasyonun tarih aralığında mı?
        const isOverlapping = (
          (newStart < bookingEnd && newEnd > bookingStart) &&
          // Giriş/çıkış günleri hariç
          !(newStart.getTime() === bookingEnd.getTime() || newEnd.getTime() === bookingStart.getTime())
        );

        return isOverlapping;
      });

      if (hasConflict) {
        return NextResponse.json({
          error: 'Tarih çakışması',
          details: 'Seçilen tarihler için başka bir rezervasyon bulunmaktadır'
        }, { status: 400 });
      }

      // Rezervasyonu oluştur
      const booking = await prisma.booking.create({
        data: {
          startDate: newStart,
          endDate: newEnd,
          status: body.status || 'pending',
          price: body.price || villa.price,
          currency: body.currency || villa.currency,
          title: body.title || 'Yeni Rezervasyon',
          specialRequests: body.specialRequests || '',
          villaId: villa.id,
          villaName: villa.name,
          villaLocation: villa.location,
          maxGuests: villa.maxGuests || body.guests.length,
          contactPerson: {
            create: {
              fullName: body.contactPerson.fullName,
              email: body.contactPerson.email,
              phone: body.contactPerson.phone,
              identityNumber: body.contactPerson.identityNumber
            }
          },
          guests: {
            create: body.guests.map((guest: GuestInput) => ({
              fullName: guest.fullName,
              identityNumber: guest.identityNumber
            }))
          }
        },
        include: {
          villa: true,
          contactPerson: true,
          guests: true
        }
      });

      // Aktivite kaydı oluştur
      await prisma.activity.create({
        data: {
          type: 'booking_added',
          title: 'Yeni Rezervasyon',
          description: `${villa.name} için yeni rezervasyon oluşturuldu`,
          villaId: villa.id,
          bookingId: booking.id,
          user: user.email
        }
      });

      return NextResponse.json({ success: true, data: booking });

    } catch (prismaError) {
      console.error('API - Prisma hatası:', prismaError);
      return NextResponse.json({
        error: 'Rezervasyon oluşturulamadı',
        details: prismaError instanceof Error ? prismaError.message : 'Veritabanı hatası'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('API - Genel hata:', error);
    return NextResponse.json({ 
      error: 'Rezervasyon oluşturulamadı',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    }, { status: 500 });
  }
} 