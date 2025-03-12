import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUser } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const user = await getUser();
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    const activities = await prisma.activity.findMany({
      orderBy: {
        date: 'desc'
      },
      include: {
        villa: true,
        booking: true
      },
      take: 10 // Son 10 aktiviteyi getir
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Aktiviteler alınırken hata:', error);
    return NextResponse.json(
      { error: 'Aktiviteler alınamadı' },
      { status: 500 }
    );
  }
} 