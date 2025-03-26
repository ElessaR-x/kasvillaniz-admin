import { useState, useEffect, useCallback } from 'react';
import { Villa } from '@/types/villa';
import { CalendarEvent } from '@/types/calendar';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { tr } from 'date-fns/locale';
import { CurrencyCode } from '@/utils/currency';

registerLocale('tr', tr);

interface SeasonalPrice {
  id: string;
  startDate: Date;
  endDate: Date;
  price: number;
  currency: CurrencyCode;
}

interface SeasonalPriceResponse {
  id: string;
  startDate: string;
  endDate: string;
  price: number;
  currency: CurrencyCode;
}

interface SeasonalPriceModalProps {
  villa: Villa;
  onClose: () => void;
  onSave: (seasonalPrice: {
    months: number[];
    price: number;
  }, event: CalendarEvent) => void;
  onDelete?: (id: string) => Promise<void>;
}

export default function SeasonalPriceModal({ villa, onClose, onSave }: SeasonalPriceModalProps) {
  const [seasonalPrices, setSeasonalPrices] = useState<SeasonalPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [price, setPrice] = useState<number>(villa.price);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    new Date(),
    new Date(new Date().setDate(new Date().getDate() + 1))
  ]);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(villa.currency);

  const fetchSeasonalPrices = useCallback(async () => {
    try {
      const response = await fetch(`/api/villas/${villa.id}/seasonal-prices`);
      const data: SeasonalPriceResponse[] = await response.json();
      if (response.ok) {
        setSeasonalPrices(data.map((price) => ({
          ...price,
          startDate: new Date(price.startDate),
          endDate: new Date(price.endDate)
        })));
      }
    } catch (error) {
      console.error('Sezonluk fiyatlar yüklenirken hata:', error);
    } finally {
      setIsLoading(false);
    }
  }, [villa.id]);

  useEffect(() => {
    fetchSeasonalPrices();
  }, [villa.id, fetchSeasonalPrices]);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/villas/${villa.id}/seasonal-prices?priceId=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Silme işlemi başarısız oldu');
      }

      // Başarılı silme işleminden sonra listeyi güncelle
      setSeasonalPrices(prices => prices.filter(p => p.id !== id));
      
    } catch (error) {
      console.error('Sezonluk fiyat silinirken hata:', error);
      alert('Fiyat silinirken bir hata oluştu');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!dateRange[0] || !dateRange[1] || !price) return;

    try {
      // Seçilen tarih aralığındaki ayları hesapla
      const startDate = dateRange[0];
      const endDate = dateRange[1];
      const months: number[] = [];
      
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const month = currentDate.getMonth() + 1;
        if (!months.includes(month)) {
          months.push(month);
        }
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      // Seçilen aylar için event oluştur
      const seasonalEvent: CalendarEvent = {
        id: `seasonal-${villa.id}-${Date.now()}`,
        title: `Sezonluk Fiyat`,
        price: Number(price),
        currency: selectedCurrency,
        start: startDate,
        end: endDate,
        status: 'confirmed' as const,
        villaId: villa.id,
        villaName: villa.name,
        villaLocation: villa.location,
        maxGuests: villa.maxGuests,
        contactPerson: {
          fullName: 'Sistem',
          email: 'sistem@villapanel.com',
          phone: '-',
          identityNumber: '-'
        },
        guests: [],
        specialRequests: 'Sezonluk fiyat güncellemesi'
      };

      // onSave fonksiyonunu çağır
      await onSave({ months, price }, seasonalEvent);
      
      // Form'u sıfırla
      setPrice(villa.price);
      setDateRange([
        new Date(),
        new Date(new Date().setDate(new Date().getDate() + 1))
      ]);
      setSelectedCurrency(villa.currency);

    } catch (error) {
      console.error('Sezonluk fiyat eklenirken hata:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-[95%] p-6 animate-modal max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-semibold">Sezon Fiyatı Ekle</h3>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-gray-500">{villa.name}</p>
              <span className="px-2 py-1 bg-red-50 text-red-600 text-sm rounded border border-red-100">
                {villa.originalName}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-gray-500 text-sm">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{villa.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Maksimum {villa.maxGuests} Kişi</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-6">
          <div className="space-y-6">
            {/* Mevcut Sezonluk Fiyatlar */}
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-gray-700">Mevcut Sezonluk Fiyatlar</h4>
                <span className="text-xs text-gray-500">{seasonalPrices.length} fiyat</span>
              </div>
              
              {isLoading ? (
                <div className="text-center text-gray-500 py-4">Yükleniyor...</div>
              ) : seasonalPrices.length === 0 ? (
                <div className="text-center text-gray-500 py-4">Henüz sezonluk fiyat eklenmemiş</div>
              ) : (
                <div className="space-y-3">
                  {seasonalPrices.map((price) => (
                    <div key={price.id} className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-semibold text-gray-900">
                              {price.price.toLocaleString('tr-TR')} {price.currency}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                              {price.currency}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(price.startDate).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })} - {new Date(price.endDate).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(price.id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                          title="Sil"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Yeni Fiyat Ekleme Formu */}
            <div className="bg-gray-50 p-6 rounded-xl">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Yeni Sezon Fiyatı</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sezon Fiyatı
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                      {selectedCurrency === 'TRY' ? '₺' : selectedCurrency === 'USD' ? '$' : selectedCurrency === 'EUR' ? '€' : '£'}
                    </div>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                      required
                      min="0"
                    />
                  </div>
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value as CurrencyCode)}
                    className="px-3 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white text-gray-700"
                  >
                    <option value="TRY">TRY</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seçilen Tarih Aralığı
                </label>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">Başlangıç:</p>
                  <p className="font-medium mb-2">
                    {dateRange[0]?.toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) || '---'}
                  </p>
                  <p className="text-sm text-gray-600">Bitiş:</p>
                  <p className="font-medium">
                    {dateRange[1]?.toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }) || '---'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ Panel - Takvim */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-x-auto">
            <DatePicker
              selectsRange={true}
              startDate={dateRange[0]}
              endDate={dateRange[1]}
              onChange={(update: [Date | null, Date | null]) => setDateRange(update)}
              locale="tr"
              dateFormat="dd MMMM yyyy"
              monthsShown={6}
              inline
              calendarClassName="!w-full"
              wrapperClassName="!w-full"
              minDate={new Date()}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sezon Fiyatı Ekle
          </button>
        </div>
      </div>

      <style jsx global>{`
        .react-datepicker {
          border: none !important;
          display: grid !important;
          width: 100% !important;
          font-family: inherit !important;
          gap: 1rem !important;
          grid-template-columns: repeat(3, 1fr) !important;
        }
        .react-datepicker__month-container {
          float: none !important;
          flex: 1 !important;
          min-width: 280px !important;
        }
        .react-datepicker__header {
          background: white !important;
          border-bottom: none !important;
          padding-top: 0 !important;
        }
        .react-datepicker__day-name, .react-datepicker__day {
          width: 2.2rem !important;
          line-height: 2.2rem !important;
          margin: 0.2rem !important;
        }
        .react-datepicker__day--selected,
        .react-datepicker__day--in-range {
          background-color: #2563eb !important;
          color: white !important;
        }
        .react-datepicker__day--in-selecting-range {
          background-color: #93c5fd !important;
        }
        .react-datepicker__day:hover {
          background-color: #bfdbfe !important;
        }
        .react-datepicker__day--keyboard-selected {
          background-color: #dbeafe !important;
          color: #2563eb !important;
        }
        @media (max-width: 1536px) {
          .react-datepicker {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 1024px) {
          .react-datepicker {
            grid-template-columns: repeat(1, 1fr) !important;
          }
          .react-datepicker__month-container {
            margin-bottom: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
} 