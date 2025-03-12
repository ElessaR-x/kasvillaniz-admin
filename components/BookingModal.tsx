import { CalendarEvent } from "@/types/calendar";
import { Villa } from "@/types/villa";
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatPrice } from '@/utils/currency';
import Modal from './Modal';
import { useState } from "react";
import { messageTemplates } from '@/app/(site)/bookings/messageTemplates';

// BookingStatus tipini tanımla
type BookingStatus = 'confirmed' | 'pending' | 'blocked' | 'cancelled';

interface GuestFormData {
  fullName: string;
  identityNumber: string;
  birthDate?: Date;
}

interface ContactFormData {
  fullName: string;
  email: string;
  phone: string;
  identityNumber: string;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: CalendarEvent & { villa: Villa };
  onStatusChange: (status: BookingStatus, message: string) => void;
}

const parseDate = (dateString: string | Date): Date => {
  if (dateString instanceof Date) return dateString;
  return new Date(dateString);
};

export default function BookingModal({ isOpen, onClose, booking, onStatusChange }: BookingModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | null>(null);
  const [message, setMessage] = useState('');
  const [contactInfo, setContactInfo] = useState<ContactFormData>({
    fullName: booking.contactPerson?.fullName || '',
    email: booking.contactPerson?.email || '',
    phone: booking.contactPerson?.phone || '',
    identityNumber: booking.contactPerson?.identityNumber || '',
  });
  const [guests, setGuests] = useState<GuestFormData[]>(
    booking.guests || [{ fullName: '', identityNumber: '' }]
  );
  const [specialRequests, setSpecialRequests] = useState(booking.specialRequests || '');

  const handleStatusSelect = (status: BookingStatus) => {
    setSelectedStatus(status);
    setMessage((messageTemplates as Record<BookingStatus, (booking: CalendarEvent & { villa: Villa }) => string>)[status](booking));
  };

  const handleSubmit = async () => {
    if (!selectedStatus) return;

    try {
      // Form verilerini hazırla
      const formData = {
        contactPerson: contactInfo,
        guests,
        specialRequests,
        status: selectedStatus,
        message
      };

      // API'ye gönder
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Güncelleme başarısız');

      // Başarılı ise callback'i çağır ve modalı kapat
      onStatusChange(selectedStatus, message);
      onClose();
    } catch (error) {
      console.error('Form gönderilirken hata:', error);
      // Hata durumunda parent komponente bilgi ver
      onStatusChange(selectedStatus, message);
      onClose();
    }
  };

  const nights = Math.ceil(
    (parseDate(booking.end).getTime() - parseDate(booking.start).getTime()) / (1000 * 60 * 60 * 24)
  );
  const totalPrice = booking.price * nights;

  const handleGuestAdd = () => {
    setGuests([...guests, { fullName: '', identityNumber: '' }]);
  };

  const handleGuestRemove = (index: number) => {
    setGuests(guests.filter((_, i) => i !== index));
  };

  const handleGuestChange = (index: number, field: keyof GuestFormData, value: string) => {
    const newGuests = [...guests];
    newGuests[index] = { ...newGuests[index], [field]: value };
    setGuests(newGuests);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedStatus ? "Durum Güncelleme" : "Rezervasyon Detayları"}
    >
      <div className="space-y-6">
        {!selectedStatus ? (
          <>
            {/* Rezervasyon Detayları */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Villa Bilgileri */}
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">Villa Bilgileri</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Villa</span>
                    <span className="font-medium">{booking.villaName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Konum</span>
                    <span className="font-medium">{booking.villaLocation}</span>
                  </div>
                </div>
              </div>

              {/* Misafir Bilgileri */}
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">Misafir Bilgileri</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div>
                    <div className="font-medium text-gray-900">{booking.contactPerson.fullName || '-'}</div>
                    <div className="text-sm text-gray-500">{booking.guests.length} Misafir</div>
                  </div>
                </div>
              </div>

              {/* Tarih Bilgileri */}
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">Tarih Bilgileri</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Giriş</span>
                    <span className="font-medium">
                      {format(parseDate(booking.start), 'd MMMM yyyy', { locale: tr })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Çıkış</span>
                    <span className="font-medium">
                      {format(parseDate(booking.end), 'd MMMM yyyy', { locale: tr })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Toplam Gece</span>
                    <span className="font-medium">{nights} Gece</span>
                  </div>
                </div>
              </div>

              {/* Fiyat Bilgileri */}
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900">Fiyat Bilgileri</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gecelik</span>
                    <span className="font-medium">
                      {formatPrice(booking.price, booking.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Toplam</span>
                    <span className="font-medium text-blue-600">
                      {formatPrice(totalPrice, booking.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* İletişim Bilgileri */}
              <div className="col-span-full space-y-2">
                <h3 className="font-medium text-gray-900">İletişim Bilgileri</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ad Soyad
                      </label>
                      <input
                        type="text"
                        value={contactInfo.fullName}
                        onChange={(e) => setContactInfo({ ...contactInfo, fullName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        T.C. Kimlik No
                      </label>
                      <input
                        type="text"
                        value={contactInfo.identityNumber}
                        onChange={(e) => setContactInfo({ ...contactInfo, identityNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        E-posta
                      </label>
                      <input
                        type="email"
                        value={contactInfo.email}
                        onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefon
                      </label>
                      <input
                        type="tel"
                        value={contactInfo.phone}
                        onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Konaklayacak Kişiler */}
              <div className="col-span-full space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-gray-900">Konaklayacak Kişiler</h3>
                  <button
                    onClick={handleGuestAdd}
                    className="text-sm text-blue-600 hover:text-blue-700"
                    disabled={guests.length >= booking.maxGuests}
                  >
                    + Kişi Ekle
                  </button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  {guests.map((guest, index) => (
                    <div key={index} className="relative grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      {index > 0 && (
                        <button
                          onClick={() => handleGuestRemove(index)}
                          className="absolute -top-2 right-0 text-red-500 hover:text-red-600"
                        >
                          ✕
                        </button>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Ad Soyad
                        </label>
                        <input
                          type="text"
                          value={guest.fullName}
                          onChange={(e) => handleGuestChange(index, 'fullName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          T.C. Kimlik No
                        </label>
                        <input
                          type="text"
                          value={guest.identityNumber}
                          onChange={(e) => handleGuestChange(index, 'identityNumber', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Özel İstekler */}
              <div className="col-span-full space-y-2">
                <h3 className="font-medium text-gray-900">Özel İstekler</h3>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Varsa özel isteklerinizi belirtebilirsiniz..."
                />
              </div>
            </div>

            {/* Durum Güncelleme Butonları */}
            <div className="flex flex-col gap-2 pt-4">
              <button
                onClick={() => handleStatusSelect('confirmed')}
                className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 
                  text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 
                  transition-all duration-200 shadow-sm hover:shadow-md font-medium"
              >
                Onayla
              </button>
              
              <button
                onClick={() => handleStatusSelect('pending')}
                className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 
                  text-white rounded-xl hover:from-amber-600 hover:to-amber-700 
                  transition-all duration-200 shadow-sm hover:shadow-md font-medium"
              >
                Beklemeye Al
              </button>

              <button
                onClick={() => handleStatusSelect('cancelled')}
                className="w-full px-4 py-3 bg-gradient-to-r from-rose-500 to-rose-600 
                  text-white rounded-xl hover:from-rose-600 hover:to-rose-700 
                  transition-all duration-200 shadow-sm hover:shadow-md font-medium"
              >
                İptal Et
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Mesaj Düzenleme */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gönderilecek Mesaj
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={12}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 
                    focus:ring-1 focus:ring-blue-500 outline-none font-mono text-sm"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedStatus(null)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl 
                    hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  Geri Dön
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 
                    text-white rounded-xl hover:from-blue-600 hover:to-blue-700 
                    transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                >
                  Gönder ve Güncelle
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
} 