import { getUser } from '@/lib/auth';
import { PrismaClient, Villa } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const user = await getUser();
    if (!user || !user.userId) {
      return new Response(
        JSON.stringify({ error: 'Yetkisiz erişim' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const body = await request.json();
    const { villaId, checkIn, checkOut, guests, contactInfo } = body;

    // Villa bilgilerini al
    const villa = await prisma.villa.findUnique({
      where: { id: villaId },
      include: {
        bookings: {
          where: {
            NOT: { status: 'cancelled' }
          }
        }
      }
    });

    if (!villa) {
      return new Response(
        JSON.stringify({ error: 'Villa bulunamadı' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Müsaitlik kontrolü
    const isAvailable = await checkAvailability(villa, checkIn, checkOut);
    if (!isAvailable) {
      return new Response(
        JSON.stringify({ error: 'Seçilen tarihler müsait değil' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Misafir sayısı kontrolü
    if (guests > villa.maxGuests) {
      return new Response(
        JSON.stringify({ 
          error: 'Misafir sayısı villa kapasitesini aşıyor',
          maxGuests: villa.maxGuests 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Rezervasyon oluştur
    const booking = await prisma.booking.create({
      data: {
        villaId: villa.id,
        startDate: new Date(checkIn),
        endDate: new Date(checkOut),
        status: 'pending',
        price: calculatePrice(villa, checkIn, checkOut),
        currency: villa.currency,
        maxGuests: guests,
        villaName: villa.name,
        villaLocation: villa.location,
        contactPerson: {
          create: {
            fullName: contactInfo.name,
            email: contactInfo.email,
            phone: contactInfo.phone,
            identityNumber: contactInfo.identityNumber
          }
        }
      },
      include: {
        contactPerson: true
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

    return new Response(
      JSON.stringify({
        success: true,
        booking: {
          id: booking.id,
          checkIn,
          checkOut,
          guests,
          price: booking.price,
          currency: booking.currency,
          status: booking.status
        }
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Rezervasyon hatası:', error);
    return new Response(
      JSON.stringify({
        error: 'Rezervasyon oluşturulamadı',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Yardımcı fonksiyonlar
async function checkAvailability(villa: Villa, checkIn: string, checkOut: string) {
  const startDate = new Date(checkIn);
  const endDate = new Date(checkOut);

  const existingBooking = await prisma.booking.findFirst({
    where: {
      villaId: villa.id,
      NOT: { status: 'cancelled' },
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
        }
      ]
    }
  });

  return !existingBooking;
}

function calculatePrice(villa: Villa, checkIn: string, checkOut: string): number {
  // Burada sezonluk fiyatlandırma mantığı eklenebilir
  const days = Math.ceil(
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)
  );
  return villa.price * days;
} 