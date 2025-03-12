"use client";
import { useState, useEffect } from 'react';
import { Villa } from "@/types/villa";
import { CalendarEvent } from "@/types/calendar";
import { formatPrice } from '@/utils/currency';
import { Activity } from '@prisma/client';

// Notification interface'i ekleyelim


// State tipleri için interface tanımlayalım
interface DashboardData {
  villas: Villa[];
  bookings: CalendarEvent[];
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
}

export default function DashboardPage() {
  // State tanımlamaları
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    villas: [],
    bookings: [],
    activities: [],
    isLoading: true,
    error: null
  });

  // Verileri API'den çek
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [villasRes, bookingsRes, activitiesRes] = await Promise.all([
          fetch('/api/villas'),
          fetch('/api/bookings'),
          fetch('/api/activities')
        ]);

        if (!villasRes.ok || !bookingsRes.ok || !activitiesRes.ok) {
          throw new Error('Veri çekme hatası');
        }

        const [villas, bookings, activities] = await Promise.all([
          villasRes.json(),
          bookingsRes.json(),
          activitiesRes.json()
        ]);

        setDashboardData({
          villas,
          bookings,
          activities,
          isLoading: false,
          error: null
        });

      } catch{
        setDashboardData(prev => ({
          ...prev,
          isLoading: false,
          error: 'Veriler yüklenirken bir hata oluştu'
        }));
      }
    };

    fetchDashboardData();
  }, []);

  // Loading durumu
  if (dashboardData.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Hata durumu
  if (dashboardData.error) {
    return (
      <div className="p-8 text-center text-red-500">
        <p>{dashboardData.error}</p>
      </div>
    );
  }

  // İstatistikleri hesapla
  const totalVillas = dashboardData.villas.length;
  
  // Bugünün aktif rezervasyonlarını hesapla
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const activeReservations = dashboardData.bookings.filter(booking => {
    const startDate = new Date(booking.start);
    const endDate = new Date(booking.end);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    return (
      booking.status === "confirmed" && 
      startDate <= today &&  // Başlangıç tarihi bugün veya öncesi
      endDate >= today      // Bitiş tarihi bugün veya sonrası
    );
  }).length;

  // Toplam geliri hesapla
  const totalRevenue = dashboardData.bookings
    .filter(e => e.status === "confirmed")
    .reduce((sum, event) => sum + event.price, 0);
  
  // Haftalık doluluk oranını hesapla
  const calculateWeeklyOccupancy = () => {
    // Haftanın başlangıç ve bitiş tarihlerini hesapla
    const today = new Date();
    const startOfWeek = new Date(today);
    const endOfWeek = new Date(today);
    
    // Haftanın başlangıcını Pazartesi olarak ayarla
    const currentDay = today.getDay();
    const diff = currentDay === 0 ? 6 : currentDay - 1;
    startOfWeek.setDate(today.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Haftanın bitişini Pazar olarak ayarla
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Her villa için doluluk hesapla
    const villaOccupancy = dashboardData.villas.map(villa => {
      // Bu villaya ait haftalık rezervasyonları bul
      const villaBookings = dashboardData.bookings.filter(booking => 
        booking.villaId === villa.id && 
        booking.status === "confirmed" &&
        // Rezervasyon tarihleri hafta içinde çakışıyor mu kontrol et
        ((new Date(booking.start) >= startOfWeek && new Date(booking.start) <= endOfWeek) ||
         (new Date(booking.end) >= startOfWeek && new Date(booking.end) <= endOfWeek) ||
         (new Date(booking.start) <= startOfWeek && new Date(booking.end) >= endOfWeek))
      );

      // Her gün için doluluk kontrolü yap
      let occupiedDays = 0;
      const totalDays = 7; // Bir haftadaki gün sayısı

      // Haftanın her günü için kontrol
      for (let d = new Date(startOfWeek); d <= endOfWeek; d.setDate(d.getDate() + 1)) {
        const currentDate = new Date(d);
        
        // O gün için rezervasyon var mı kontrol et
        const isDayOccupied = villaBookings.some(booking => {
          const bookingStart = new Date(booking.start);
          const bookingEnd = new Date(booking.end);
          return currentDate >= bookingStart && currentDate <= bookingEnd;
        });

        if (isDayOccupied) {
          occupiedDays++;
        }
      }

      return {
        villaId: villa.id,
        occupiedDays,
        totalDays
      };
    });

    // Tüm villaların toplam doluluk oranını hesapla
    const totalOccupiedDays = villaOccupancy.reduce((sum, villa) => sum + villa.occupiedDays, 0);
    const totalPossibleDays = villaOccupancy.reduce((sum, villa) => sum + villa.totalDays, 0);
    
    // Doluluk oranını yüzde olarak hesapla
    const occupancyRate = Math.round((totalOccupiedDays / totalPossibleDays) * 100);
    
    return occupancyRate;
  };

  const occupancyRate = calculateWeeklyOccupancy();

  // Son rezervasyonlar (en yeni 5 tanesi)
  const recentBookings = dashboardData.bookings
    .filter(e => e.status === "confirmed")
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
    .slice(0, 5);

  // Lokasyon bazlı villa dağılımı
  const locationDistribution = dashboardData.villas.reduce((acc, villa) => {
    acc[villa.location] = (acc[villa.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Aktivite ikonlarını belirle
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'villa_added':
        return (
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        );
      // ... diğer case'ler aynı ...
    }
  };

  return (
    <div className="p-8 relative">
      {/* Başlık */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Genel istatistikler ve özet bilgiler</p>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Toplam Villa */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-500">Toplam Villa</div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold">{totalVillas}</div>
          <div className="text-sm text-gray-500">villa yönetimde</div>
        </div>

        {/* Aktif Rezervasyon */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-500">Aktif Rezervasyon</div>
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold">{activeReservations}</div>
          <div className="text-sm text-gray-500">aktif rezervasyon</div>
        </div>

        {/* Toplam Gelir */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-500">Toplam Gelir</div>
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold">{formatPrice(totalRevenue, 'GBP')}</div>
          <div className="text-sm text-gray-500">toplam gelir</div>
        </div>

        {/* Doluluk Oranı */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="text-gray-500">Haftalık Doluluk</div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-bold">%{occupancyRate}</div>
          <div className="text-sm text-gray-500">haftalık doluluk</div>
        </div>
      </div>

      {/* Son Rezervasyonlar ve Lokasyon Dağılımı */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Son Rezervasyonlar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold">Son Rezervasyonlar</h2>
          </div>
          <div className="divide-y">
            {recentBookings.map(booking => (
              <div key={booking.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium">{booking.contactPerson.fullName}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(booking.start).toLocaleDateString('tr-TR')}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-600">{booking.villaName}</div>
                  <div className="font-medium text-blue-600">
                    {formatPrice(booking.price, booking.currency)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lokasyon Dağılımı */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold">Lokasyon Dağılımı</h2>
          </div>
          <div className="p-6">
            {Object.entries(locationDistribution).map(([location, count]) => (
              <div key={location} className="mb-4 last:mb-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">{location}</span>
                  <span className="font-medium">{count} villa</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(count / totalVillas) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Son Aktiviteler */}
      <div className="mt-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold">Son Aktiviteler</h2>
          </div>
          <div className="divide-y">
            {dashboardData.activities.map(activity => (
              <div key={activity.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-3">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{activity.title}</h3>
                      <span className="text-sm text-gray-500">
                        {new Date(activity.date).toLocaleDateString('tr-TR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                    {activity.villaId && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
                          {activity.villaId}
                        </span>
                        <span className="text-xs text-gray-500">
                          {activity.user}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
