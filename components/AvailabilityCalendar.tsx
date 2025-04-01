"use client";
import { useState } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { Villa } from '@/types/villa';
import { format, isSameMonth, isWithinInterval, startOfMonth, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { formatPrice, CurrencyCode } from '@/utils/currency';

interface AvailabilityCalendarProps {
  events: CalendarEvent[];
  villa: Villa;
  numberOfMonths?: number;
  useSeasonalPrices?: boolean;
}

interface DayStatus {
  status: 'confirmed' | 'pending' | 'blocked' | 'available';
  price: number;
  currency: CurrencyCode;
  title: string;
  guestName: string;
  isSeasonalPrice: boolean;
}

export default function AvailabilityCalendar({ events, villa, numberOfMonths = 3}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = new Date();

  const months = Array.from({ length: numberOfMonths }, (_, i) => {
    const date = new Date(currentMonth);
    date.setMonth(currentMonth.getMonth() + i);
    return startOfMonth(date);
  });

  

  const getDayStatus = (date: Date): DayStatus => {
    // Önce rezervasyon kontrolü
    const event = events.find(e => 
      isWithinInterval(date, { start: new Date(e.start), end: new Date(e.end) })
    );

    // Sezonluk fiyat kontrolü
    const seasonalPrice = villa.seasonalPrices?.find(sp => 
      isWithinInterval(date, {
        start: new Date(sp.startDate),
        end: new Date(sp.endDate)
      })
    );

    const price = event?.price || seasonalPrice?.price || villa.price;
    const currency = (event?.currency || seasonalPrice?.currency || villa.currency) as CurrencyCode;
    const status = event?.title === 'Müsait Değil' ? 'blocked' : event?.status || 'available';
    const title = event?.title || (seasonalPrice ? `Sezonluk Fiyat: ${formatPrice(seasonalPrice.price, seasonalPrice.currency as CurrencyCode)}` : '');
    const guestName = event?.contactPerson?.fullName || '';

    return {
      status,
      price,
      currency,
      title,
      guestName,
      isSeasonalPrice: !!seasonalPrice && !event
    };
  };

  return (
    <div className="availability-calendar">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-xl font-bold text-gray-900">
            {villa.name}
          </h2>
          {villa.originalName && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5
              bg-gradient-to-r from-red-50 to-rose-50 
              border border-red-100 rounded-md
              shadow-sm shadow-red-100/50"
            >
              <span className="text-sm font-bold text-red-700">
                {villa.originalName}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>{villa.location}</span>
          <span>•</span>
          <span>Maksimum {villa.maxGuests} Misafir</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 xl:gap-8">
        {months.map((month) => (
          <div key={month.toISOString()} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3">
              <div className="text-base font-semibold text-white">
                {format(month, 'MMMM yyyy', { locale: tr })}
              </div>
            </div>
            <div className="p-2 sm:p-3">
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
                  <div key={day} className="text-center text-[10px] sm:text-xs font-medium text-gray-400 py-1">
                    {day}
                  </div>
                ))}
                
                {Array.from({ length: 42 }, (_, i) => {
                  const date = new Date(month);
                  date.setDate(i - (month.getDay() - 1));
                  const isCurrentMonth = isSameMonth(date, month);
                  const dayStatus = getDayStatus(date);
                  const isToday = isSameDay(date, today);

                  return (
                    <div key={date.toISOString()} className="group relative">
                      <div className={`
                        relative aspect-square flex flex-col justify-between p-0.5
                        ${isCurrentMonth ? '' : 'opacity-40'}
                      `}>
                        <div className={`
                          h-full w-full rounded-lg p-1
                          ${dayStatus.status === 'confirmed' ? 'bg-emerald-100' : 
                            dayStatus.status === 'pending' ? 'bg-amber-100' : 
                            dayStatus.status === 'blocked' ? 'bg-red-100' :
                            isToday ? 'bg-blue-100 ring-2 ring-blue-400' :
                            dayStatus.isSeasonalPrice ? 'bg-purple-100' :
                            'hover:bg-blue-50'}
                          ${isCurrentMonth ? 'cursor-pointer transition-colors' : ''}
                        `}>
                          <div className="flex flex-col h-full">
                            <span className={`
                              text-[10px] sm:text-xs leading-none
                              ${!isCurrentMonth ? 'text-gray-400' : 
                                dayStatus.status === 'confirmed' ? 'text-emerald-800' : 
                                dayStatus.status === 'pending' ? 'text-amber-800' : 
                                dayStatus.status === 'blocked' ? 'text-red-800' :
                                dayStatus.isSeasonalPrice ? 'text-purple-800' :
                                isToday ? 'text-blue-700 font-semibold' : 
                                'text-gray-700'}
                            `}>
                              {date.getDate()}
                            </span>
                            
                            {isCurrentMonth && (
                              <span className={`
                                text-[8px] sm:text-[10px] mt-auto font-medium leading-none
                                ${dayStatus.status === 'confirmed' ? 'text-emerald-700' : 
                                  dayStatus.status === 'pending' ? 'text-amber-700' : 
                                  dayStatus.status === 'blocked' ? 'text-red-700' :
                                  dayStatus.isSeasonalPrice ? 'text-purple-700' :
                                  isToday ? 'text-blue-600' : 
                                  'text-blue-700'}
                              `}>
                                {formatPrice(dayStatus.price, dayStatus.currency)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Tooltip */}
                        {(dayStatus.status !== 'available' || dayStatus.isSeasonalPrice) && isCurrentMonth && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 bg-gray-900 text-white text-[10px] sm:text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
                            <div className="text-center">
                              <p className="font-medium">{dayStatus.title}</p>
                              {dayStatus.guestName && <p className="text-gray-300 text-[9px] sm:text-xs">{dayStatus.guestName}</p>}
                            </div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-6 px-4">
        <button
          onClick={() => {
            const newDate = new Date(currentMonth);
            newDate.setMonth(currentMonth.getMonth() - 1);
            setCurrentMonth(newDate);
          }}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-white/80 transition-all border border-gray-100 shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Önceki</span>
        </button>
        <button
          onClick={() => {
            const newDate = new Date(currentMonth);
            newDate.setMonth(currentMonth.getMonth() + 1);
            setCurrentMonth(newDate);
          }}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-white/80 transition-all border border-gray-100 shadow-sm"
        >
          <span className="font-medium">Sonraki</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
} 