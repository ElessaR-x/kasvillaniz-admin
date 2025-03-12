import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUser } from '@/lib/auth';

const prisma = new PrismaClient();

// Rezervasyon detayını getir
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: (await params).id },
      include: {
        villa: true,
        contactPerson: true,
        guests: true
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Rezervasyon bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Rezervasyon detayı alınırken hata:', error);
    return NextResponse.json(
      { error: 'Rezervasyon detayı alınamadı' },
      { status: 500 }
    );
  }
}

// Rezervasyon güncelle
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const body = await request.json();

    // Rezervasyonu kontrol et
    const existingBooking = await prisma.booking.findUnique({
      where: { id: (await params).id },
      include: {
        contactPerson: true,
        guests: true
      }
    });

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Rezervasyon bulunamadı' },
        { status: 404 }
      );
    }

    // Güncelleme verilerini hazırla
    const updateData: {
      status: string;
      updatedAt: Date;
      specialRequests?: string;
    } = {
      status: body.status,
      updatedAt: new Date()
    };

    if (body.specialRequests !== undefined) {
      updateData.specialRequests = body.specialRequests;
    }

    try {
      // Rezervasyonu güncelle
      const booking = await prisma.booking.update({
        where: { id: (await params).id },
        data: updateData,
        include: {
          villa: true,
          contactPerson: true,
          guests: true
        }
      });

      // Aktivite kaydı oluştur
      await prisma.activity.create({
        data: {
          type: 'booking_updated',
          title: 'Rezervasyon Güncellendi',
          description: `${booking.villaName} için rezervasyon durumu "${body.status}" olarak güncellendi`,
          villaId: booking.villaId,
          bookingId: booking.id,
          user: user.email
        }
      });

      return NextResponse.json(booking);
    } catch (prismaError) {
      throw prismaError;
    }

  } catch {
    return NextResponse.json(
      { error: 'Rezervasyon güncellenemedi' },
      { status: 500 }
    );
  }
}

// Rezervasyon sil
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const booking = await prisma.booking.delete({
      where: { id: (await params).id },
      include: {
        villa: true
      }
    });

    // Aktivite kaydı oluştur
    await prisma.activity.create({
      data: {
        type: 'booking_cancelled',
        title: 'Rezervasyon İptal Edildi',
        description: `${booking.villa.name} için rezervasyon iptal edildi`,
        villaId: booking.villaId,
        bookingId: booking.id,
        user: user.email
      }
    });

    return NextResponse.json({ message: 'Rezervasyon başarıyla silindi' });
  } catch (error) {
    console.error('Rezervasyon silinirken hata:', error);
    return NextResponse.json(
      { error: 'Rezervasyon silinemedi' },
      { status: 500 }
    );
  }
} 