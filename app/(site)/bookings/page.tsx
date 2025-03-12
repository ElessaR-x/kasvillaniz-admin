"use client";
import { useState, useEffect, useCallback } from 'react';
import { Villa } from "@/types/villa";
import { CalendarEvent } from "@/types/calendar";
import { formatPrice } from '@/utils/currency';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { IconSearch } from '@/components/Icons';
import BookingModal from '@/components/BookingModal';
import AlertModal from '@/components/AlertModal';



// Status type'ını tanımlayalım
type BookingStatus = 'confirmed' | 'pending' | 'blocked' | 'cancelled';

const statusColors: Record<BookingStatus, { bg: string; text: string; dot: string }> = {
  confirmed: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-600' },
  pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-600' },
  blocked: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-600' },
  cancelled: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-600' }
};

const statusLabels: Record<BookingStatus, string> = {
  confirmed: 'Onaylı',
  pending: 'Beklemede',
  blocked: 'Müsait Değil',
  cancelled: 'İptal Edildi'
};

// Durum kontrolü için yardımcı fonksiyon
const getStatusStyle = (status: string) => {
  const defaultStyle = { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-600' };
  return statusColors[status as BookingStatus] || defaultStyle;
};

const getStatusLabel = (status: string) => {
  return statusLabels[status as BookingStatus] || 'Bilinmiyor';
};

// Tarih dönüştürme yardımcı fonksiyonu
const parseDate = (dateString: string | Date): Date => {
  if (dateString instanceof Date) return dateString;
  return new Date(dateString);
};

// Booking tipi için interface tanımlayalım
interface BookingData extends CalendarEvent {
  villa: Villa;
  startDate?: string;
  endDate?: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<(CalendarEvent & { villa: Villa })[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [selectedBooking, setSelectedBooking] = useState<(CalendarEvent & { villa: Villa }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{
    show: boolean;
    message: string;
    type: 'error' | 'success' | 'warning' | 'info';
  }>({
    show: false,
    message: '',
    type: 'info'
  });

  // Rezervasyonları getir
  const fetchBookings = useCallback(async () => {
    try {
      const response = await fetch('/api/bookings');
      if (!response.ok) throw new Error('Rezervasyonlar alınamadı');
      const data = await response.json();
      
      // API'den gelen verileri formatlama
      const formattedBookings = data.map((booking: BookingData) => ({
        ...booking,
        start: parseDate(booking.startDate || booking.start),
        end: parseDate(booking.endDate || booking.end),
        status: booking.status || 'pending'
      }));
      
      setBookings(formattedBookings);
    } catch{
      showAlert('Rezervasyonlar yüklenirken bir hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Alert göster
  const showAlert = (message: string, type: 'error' | 'success' | 'warning' | 'info') => {
    setAlert({ show: true, message, type });
  };

  // Rezervasyon durumu güncelle
  const handleStatusChange = async (status: BookingStatus, message: string) => {
    if (!selectedBooking) return;

    try {
      const response = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          message,
          updatedAt: new Date()
        })
      });

      if (!response.ok) throw new Error('Güncelleme başarısız');

      showAlert('Rezervasyon durumu başarıyla güncellendi', 'success');
      fetchBookings();
      setSelectedBooking(null);
    } catch {
      showAlert('Rezervasyon güncellenirken bir hata oluştu', 'error');
    }
  };

  // Filtreleme
  const filteredBookings = bookings.filter(booking => {
    // Blocked durumundaki rezervasyonları gösterme
    if (booking.status === 'blocked') return false;

    const matchesSearch = searchTerm === '' || [
        booking.title,
        booking.villaName,
        booking.villaLocation,
        booking.contactPerson?.fullName
    ].some(field => field?.toLowerCase().includes(searchTerm.toLowerCase()));

    // Status filtresini güncelle - blocked seçeneğini kaldır
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;

    const today = new Date();
    const matchesDate = dateFilter === 'all' || 
        (dateFilter === 'upcoming' && new Date(booking.start) >= today) ||
        (dateFilter === 'past' && new Date(booking.end) < today);

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Yükleniyor durumu
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      {/* Başlık ve Filtreler */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Rezervasyonlar</h1>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 sm:gap-4">
          {/* Arama - Her zaman tam genişlik */}
          <div className="col-span-1 sm:col-span-2">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rezervasyon, villa adı veya konum ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Filtreler - Mobilde alt alta */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="confirmed">Onaylı</option>
              <option value="pending">Beklemede</option>
              <option value="cancelled">İptal Edildi</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as typeof dateFilter)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="all">Tüm Tarihler</option>
              <option value="upcoming">Gelecek</option>
              <option value="past">Geçmiş</option>
            </select>
          </div>
        </div>
      </div>

      {/* Rezervasyon Listesi */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left py-4 px-6 font-medium text-gray-600">Villa</th>
                <th className="text-left py-4 px-6 font-medium text-gray-600">Misafir</th>
                <th className="text-left py-4 px-6 font-medium text-gray-600">Tarih</th>
                <th className="text-left py-4 px-6 font-medium text-gray-600">Durum</th>
                <th className="text-right py-4 px-6 font-medium text-gray-600">Fiyat</th>
                <th className="text-right py-4 px-6 font-medium text-gray-600">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-gray-900">{booking.villaName}</div>
                      <div className="text-sm text-gray-500">{booking.villaLocation}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-gray-900">{booking.contactPerson.fullName || '-'}</div>
                      {booking.guests && (
                        <div className="text-sm text-gray-500">{booking.guests.length} Misafir</div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-gray-900">
                        {format(parseDate(booking.start), 'd MMM', { locale: tr })} - {format(parseDate(booking.end), 'd MMM', { locale: tr })}
                      </div>
                      <div className="text-sm text-gray-500">
                        {Math.ceil((parseDate(booking.end).getTime() - parseDate(booking.start).getTime()) / (1000 * 60 * 60 * 24))} Gece
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                      ${getStatusStyle(booking.status).bg} ${getStatusStyle(booking.status).text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${getStatusStyle(booking.status).dot}`}></span>
                      {getStatusLabel(booking.status)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900">
                        {formatPrice(booking.price, booking.currency)} / gece
                      </div>
                      <div className="text-sm text-gray-500">
                        Toplam: {formatPrice(
                          booking.price * Math.ceil(
                            (parseDate(booking.end).getTime() - parseDate(booking.start).getTime()) / (1000 * 60 * 60 * 24)
                          ),
                          booking.currency
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        Detay
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Rezervasyon bulunamadı.</p>
          </div>
        )}
      </div>

      {/* Modaller */}
      {selectedBooking && (
        <BookingModal
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          booking={selectedBooking}
          onStatusChange={handleStatusChange}
        />
      )}

      <AlertModal
        isOpen={alert.show}
        onClose={() => setAlert({ ...alert, show: false })}
        message={alert.message}
        type={alert.type}
      />
    </div>
  );
} 