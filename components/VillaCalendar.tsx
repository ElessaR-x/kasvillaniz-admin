"use client";
import { useState, useEffect } from 'react';
import { CalendarEvent } from '@/types/calendar';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { tr } from 'date-fns/locale';
import { Villa } from '@/types/villa';
import Image from 'next/image';
import { currencies, CurrencyCode } from '@/utils/currency';
import { addDays, differenceInDays } from 'date-fns';
import AlertModal from './AlertModal';

// Türkçe lokalizasyonu kaydet
registerLocale('tr', tr);

interface VillaCalendarProps {
  events: CalendarEvent[];
  onEventAdd?: (event: Omit<CalendarEvent, 'id'>) => void;
  onEventUpdate?: (event: CalendarEvent) => void;
  onEventDelete?: (eventId: string) => void;
  showNewEventModal?: boolean;
  onNewEventModalClose?: () => void;
  defaultPrice?: number;
  villa: Villa;
  title?: string;
  subtitle?: string;
  isPriceMode?: boolean;
  isEmbedded?: boolean;
}



// Create a properly typed currencies object
const typedCurrencies = currencies;

export default function VillaCalendar({ 
  onEventAdd, 
  showNewEventModal,
  onNewEventModalClose,
  defaultPrice,
  villa,
  isEmbedded = false,
  events = []
}: VillaCalendarProps) {
  const [showEventModal, setShowEventModal] = useState(false);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;
  const [selectedPrice, setSelectedPrice] = useState<number>(defaultPrice || villa.price);
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('USD');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (showNewEventModal) {
      setDateRange([new Date(), new Date(new Date().setDate(new Date().getDate() + 1))]);
      setSelectedCurrency('USD');
      setGuestName('');
      setError(null);
    }
  }, [showNewEventModal]);

  const handleNewEventModalClose = () => {
    setDateRange([null, null]);
    if (onNewEventModalClose) {
      onNewEventModalClose();
    }
  };

  

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!startDate || !endDate) {
      setError('Lütfen tarih seçiniz');
      return;
    }

    if (!guestName.trim()) {
      setError('Lütfen misafir adını giriniz');
      return;
    }

    // Sadece onEventAdd'i çağır, başka API isteği yapma
    if (onEventAdd) {
      onEventAdd({
        title: guestName,
        start: startDate,
        end: endDate,
        status: 'pending',
        price: selectedPrice,
        currency: selectedCurrency,
        villaId: villa.id,
        villaName: villa.name,
        villaLocation: villa.location,
        maxGuests: villa.maxGuests,
        contactPerson: {
          fullName: guestName,
          email: 'beklemede@villapanel.com',
          phone: 'Beklemede',
          identityNumber: 'Beklemede'
        },
        guests: [{
          fullName: guestName,
          identityNumber: 'Beklemede'
        }],
        specialRequests: ''
      });
    }

    // Modal'ı kapat
    if (onNewEventModalClose) {
      onNewEventModalClose();
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = e.target.value ? Number(e.target.value) : defaultPrice || villa.price;
    setSelectedPrice(newPrice);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCurrency(e.target.value as CurrencyCode);
  };

  const calculateNights = () => {
    if (startDate && endDate) {
      return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    return 0;
  };

  const calculateTotalPrice = () => {
    const nights = calculateNights();
    return `${typedCurrencies[selectedCurrency as CurrencyCode].symbol}${(selectedPrice * nights).toLocaleString('tr-TR')}`;
  };

  

  

  const handleDateRangeChange = (update: [Date | null, Date | null]) => {
    const [start, end] = update;
    
    if (start && end) {
      // Seçilen tarih aralığında rezerve edilmiş gün var mı kontrol et
      const hasReservedDate = excludedDates.some(date => {
        return date >= start && date <= end;
      });

      if (hasReservedDate) {
        setAlertMessage('Seçilen tarih aralığında rezerve edilmiş günler bulunmaktadır.');
        setShowAlert(true);
        return;
      }

      const nights = differenceInDays(end, start);
      
      if (nights < villa.minStayDays) {
        const newEnd = addDays(start, villa.minStayDays);
        setDateRange([start, newEnd]);
        
        setAlertMessage(`Bu villa için minimum kiralama süresi ${villa.minStayDays} gecedir.`);
        setShowAlert(true);
      } else {
        setDateRange(update);
      }
    } else {
      setDateRange(update);
    }
  };

  // Seçilemez tarihleri hesapla
  const excludedDates = events.flatMap(event => {
    const dates = [];
    const currentDate = new Date(event.start);
    const endDate = new Date(event.end);

    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  });

  return (
    <>
      <div className={isEmbedded 
        ? "" 
        : "fixed inset-0 z-50 bg-black/30 backdrop-blur-sm overflow-y-auto"
      }>
        <div className="flex min-h-full items-center justify-center">
          <div className={isEmbedded 
            ? "w-full" 
            : "w-full h-full md:h-auto md:my-8 md:max-w-5xl md:mx-auto md:rounded-2xl bg-white md:shadow-xl animate-modal"
          }>
            <div className="sticky top-0 z-10 bg-white border-b px-4 py-4 md:rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 flex flex-wrap items-center gap-2 sm:gap-3">
                    <span>Kaşvillanız - {villa.code}</span>
                    {villa.originalName && (
                      <div className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5
                        bg-gradient-to-r from-red-50 to-rose-50 
                        border border-red-100 rounded-md
                        shadow-sm shadow-red-100/50"
                      >
                        <span className="text-xs sm:text-sm font-bold text-red-700">
                          {villa.originalName}
                        </span>
                      </div>
                    )}
                    <span className="text-sm sm:text-base">için yeni rezervasyon</span>
                  </h3>
                </div>
                <button
                  onClick={handleNewEventModalClose}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6">
              <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6">
                <div className="order-2 lg:order-1">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900">Tarih Seçimi</h4>
                      <p className="text-sm text-gray-500">Rezervasyon tarih aralığını seçin</p>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4 overflow-x-auto">
                      <div className="min-w-[320px]">
                        <DatePicker
                          selectsRange={true}
                          startDate={startDate}
                          endDate={endDate}
                          onChange={handleDateRangeChange}
                          locale="tr"
                          dateFormat="dd MMMM yyyy"
                          minDate={new Date()}
                          monthsShown={window.innerWidth >= 768 ? 2 : 1}
                          inline
                          excludeDates={excludedDates}
                          dayClassName={(date: Date): string => {
                            const isExcluded = excludedDates.some(
                              excludedDate => 
                                excludedDate.getDate() === date.getDate() &&
                                excludedDate.getMonth() === date.getMonth() &&
                                excludedDate.getFullYear() === date.getFullYear()
                            );
                            return isExcluded ? 'react-datepicker__day--reserved' : '';
                          }}
                          calendarClassName="!w-full !border-0 !shadow-none modern-datepicker"
                          wrapperClassName="!block !w-full"
                          disabledKeyboardNavigation
                          showDisabledMonthNavigation
                          renderCustomHeader={({
                            monthDate,
                            decreaseMonth,
                            increaseMonth,
                          }) => (
                            <div className="flex items-center justify-between px-4 py-2">
                              <button
                                onClick={decreaseMonth}
                                type="button"
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                              <span className="text-base font-semibold text-gray-900">
                                {monthDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
                              </span>
                              <button
                                onClick={increaseMonth}
                                type="button"
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                          )}
                        />
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-white rounded-lg border border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">Seçilen Tarihler</p>
                          <p className="mt-1 font-medium">
                            {startDate && endDate 
                              ? `${startDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} - 
                                 ${endDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}`
                              : "Henüz tarih seçilmedi"
                            }
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">{calculateNights()} Gece</p>
                          <p className="mt-1 text-lg font-semibold text-blue-600">
                            {calculateTotalPrice()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="order-1 lg:order-2 space-y-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="relative aspect-video rounded-lg overflow-hidden mb-4">
                      {villa.images && villa.images[0] ? (
                        <Image
                          src={villa.images[0]}
                          alt={villa.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <div className="bg-white p-3 rounded-lg">
                          <svg className="w-6 h-6 text-blue-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <p className="mt-1 text-sm font-medium">{villa.location}</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="bg-white p-3 rounded-lg">
                          <svg className="w-6 h-6 text-blue-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="mt-1 text-sm font-medium">${villa.price}/gece</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="bg-white p-3 rounded-lg">
                          <svg className="w-6 h-6 text-blue-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <p className="mt-1 text-sm font-medium">{villa.maxGuests} Misafir</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <form 
                    id="reservationForm"
                    onSubmit={handleSubmit}
                    className="bg-gray-50 rounded-xl p-4 space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Misafir Adı
                      </label>
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="Örn: Ahmet Yılmaz"
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        required
                        autoFocus
                      />
                    </div>
                    {error && (
                      <div className="text-red-500 text-sm">{error}</div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gecelik Fiyat
                      </label>
                      <div className="flex gap-2">
                        <select
                          name="currency"
                          defaultValue="USD"
                          onChange={handleCurrencyChange}
                          className="px-3 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                        >
                          {Object.entries(typedCurrencies).map(([code, currency]) => (
                            <option key={code} value={code}>
                              {currency.symbol} {code}
                            </option>
                          ))}
                        </select>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            name="price"
                            min="0"
                            step="0.01"
                            defaultValue={defaultPrice || villa.price}
                            onChange={handlePriceChange}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">Boş bırakılırsa varsayılan fiyat kullanılır</p>
                    </div>
                  </form>
                </div>
              </div>

              <div className="lg:hidden space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    {villa.images && villa.images[0] ? (
                      <Image
                        src={villa.images[0]}
                        alt={villa.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl">
                  <div className="p-4 border-b">
                    <h4 className="font-medium text-gray-900">Tarih Seçimi</h4>
                    <p className="text-sm text-gray-500">Rezervasyon tarih aralığını seçin</p>
                  </div>
                  
                  <DatePicker
                    selectsRange={true}
                    startDate={startDate}
                    endDate={endDate}
                    onChange={handleDateRangeChange}
                    locale="tr"
                    dateFormat="dd MMMM yyyy"
                    minDate={new Date()}
                    monthsShown={2}
                    inline
                    excludeDates={excludedDates}
                    dayClassName={(date: Date): string => {
                      const isExcluded = excludedDates.some(
                        excludedDate => 
                          excludedDate.getDate() === date.getDate() &&
                          excludedDate.getMonth() === date.getMonth() &&
                          excludedDate.getFullYear() === date.getFullYear()
                      );
                      return isExcluded ? 'react-datepicker__day--reserved' : '';
                    }}
                    calendarClassName="!w-full !border-0 !shadow-none modern-datepicker"
                    wrapperClassName="!block !w-full"
                    disabledKeyboardNavigation
                    showDisabledMonthNavigation
                    renderCustomHeader={({
                      monthDate,
                      decreaseMonth,
                      increaseMonth,
                    }) => (
                      <div className="flex items-center justify-between px-4 py-2">
                        <button
                          onClick={decreaseMonth}
                          type="button"
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <span className="text-base font-semibold text-gray-900">
                          {monthDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' })}
                        </span>
                        <button
                          onClick={increaseMonth}
                          type="button"
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  />

                  <style jsx global>{`
                    .modern-datepicker {
                      font-family: inherit;
                      width: 100% !important;
                    }

                    .modern-datepicker .react-datepicker__month-container {
                      width: 100%;
                    }

                    .modern-datepicker .react-datepicker__header {
                      background: white;
                      border: none;
                      padding-top: 0;
                    }

                    .modern-datepicker .react-datepicker__day-names {
                      margin-top: 1rem;
                      border-top: 1px solid #e5e7eb;
                      padding-top: 1rem;
                    }

                    .modern-datepicker .react-datepicker__day-name {
                      color: #6b7280;
                      font-weight: 500;
                      width: 2.5rem;
                      margin: 0.2rem;
                    }

                    .modern-datepicker .react-datepicker__day {
                      width: 2.5rem;
                      height: 2.5rem;
                      line-height: 2.5rem;
                      margin: 0.2rem;
                      border-radius: 0.5rem;
                      color: #374151;
                    }

                    .modern-datepicker .react-datepicker__day:hover {
                      background-color: #f3f4f6;
                    }

                    .modern-datepicker .react-datepicker__day--selected,
                    .modern-datepicker .react-datepicker__day--in-range {
                      background-color: #3b82f6 !important;
                      color: white !important;
                    }

                    .modern-datepicker .react-datepicker__day--keyboard-selected {
                      background-color: #dbeafe;
                      color: #1e40af;
                    }

                    .modern-datepicker .react-datepicker__day--disabled {
                      color: #d1d5db;
                    }

                    .modern-datepicker .react-datepicker__day--in-selecting-range {
                      background-color: #93c5fd;
                      color: white;
                    }

                    .modern-datepicker .react-datepicker__day--today {
                      font-weight: 600;
                    }

                    @media (max-width: 1024px) {
                      .modern-datepicker .react-datepicker__month-container {
                        width: 100% !important;
                        display: block !important;
                      }

                      .modern-datepicker .react-datepicker__month {
                        margin: 0 !important;
                      }

                      .modern-datepicker .react-datepicker__header {
                        padding-top: 0.5rem !important;
                      }

                      .modern-datepicker .react-datepicker__month + .react-datepicker__month {
                        border-top: 1px solid #e5e7eb;
                        padding-top: 1rem;
                      }

                      .modern-datepicker .react-datepicker__day-name,
                      .modern-datepicker .react-datepicker__day {
                        width: 2.5rem !important;
                        height: 2.5rem !important;
                        line-height: 2.5rem !important;
                        margin: 0.2rem !important;
                      }
                    }

                    .react-datepicker__day--reserved {
                      background-color: #fee2e2 !important;
                      color: #ef4444 !important;
                      text-decoration: line-through;
                      cursor: not-allowed !important;
                    }

                    .react-datepicker__day--reserved:hover {
                      background-color: #fee2e2 !important;
                    }

                    .react-datepicker__day--selecting-range-start,
                    .react-datepicker__day--selecting-range-end,
                    .react-datepicker__day--in-selecting-range {
                      background-color: #dbeafe !important;
                      color: #1e40af !important;
                    }

                    .react-datepicker__day--reserved.react-datepicker__day--in-selecting-range {
                      background-color: #fee2e2 !important;
                      color: #ef4444 !important;
                    }
                  `}</style>

                  <div className="p-4 border-t bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Seçilen Tarihler</p>
                        <p className="mt-1 font-medium">
                          {startDate && endDate 
                            ? `${startDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} - 
                               ${endDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}`
                            : "Henüz tarih seçilmedi"
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{calculateNights()} Gece</p>
                        <p className="mt-1 text-lg font-semibold text-blue-600">
                          {calculateTotalPrice()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white p-3 rounded-lg text-center">
                    <svg className="w-6 h-6 text-blue-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <p className="mt-1 text-sm font-medium">{villa.location}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg text-center">
                    <svg className="w-6 h-6 text-blue-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-1 text-sm font-medium">${villa.price}/gece</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg text-center">
                    <svg className="w-6 h-6 text-blue-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p className="mt-1 text-sm font-medium">{villa.maxGuests} Misafir</p>
                  </div>
                </div>

                <form 
                  id="reservationForm"
                  onSubmit={handleSubmit}
                  className="bg-white rounded-xl p-4 space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rezervasyon Başlığı
                    </label>
                    <input
                      type="text"
                      name="title"
                      placeholder="Örn: Ahmet Yılmaz Rezervasyonu"
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      required
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gecelik Fiyat
                    </label>
                    <div className="flex gap-2">
                      <select
                        name="currency"
                        defaultValue="USD"
                        onChange={handleCurrencyChange}
                        className="px-3 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                      >
                        {Object.entries(typedCurrencies).map(([code, currency]) => (
                          <option key={code} value={code}>
                            {currency.symbol} {code}
                          </option>
                        ))}
                      </select>
                      <div className="relative flex-1">
                        <input
                          type="number"
                          name="price"
                          min="0"
                          step="0.01"
                          defaultValue={defaultPrice || villa.price}
                          onChange={handlePriceChange}
                          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Boş bırakılırsa varsayılan fiyat kullanılır</p>
                  </div>
                </form>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t px-4 py-4 md:rounded-b-2xl">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (startDate && endDate && onEventAdd) {
                      onEventAdd({
                        title: 'Müsait Değil',
                        start: startDate,
                        end: endDate,
                        status: 'blocked',
                        villaId: villa.id,
                        villaName: villa.name,
                        villaLocation: villa.location,
                        maxGuests: villa.maxGuests,
                        price: 0,
                        currency: 'USD',
                        contactPerson: {
                          fullName: 'Sistem',
                          email: 'sistem@villapanel.com',
                          phone: '-',
                          identityNumber: '-'
                        },
                        guests: [],
                        specialRequests: 'Manuel bloke'
                      });
                      if (onNewEventModalClose) {
                        onNewEventModalClose();
                      }
                    }
                  }}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Tarihleri Kapat
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleNewEventModalClose}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    form="reservationForm"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Rezervasyon Ekle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEventModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-modal">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Rezervasyon</h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Misafir</p>
                    <p className="font-medium">Ahmet Yılmaz</p>
                    <p className="text-sm text-gray-500 mt-1">
                      1 Misafir
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tarih</p>
                    <p className="font-medium">
                      15 Mayıs - 17 Mayıs
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      2 Gece
                    </p>
                  </div>
                </div>
              </div>

              {/* ... diğer modal içeriği ... */}
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <button
                onClick={() => setShowEventModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertModal
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        message={alertMessage}
      />
    </>
  );
} 
