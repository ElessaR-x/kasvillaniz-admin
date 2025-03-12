"use client";
import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import { DateSelectArg, EventClickArg, EventInput } from '@fullcalendar/core';
import trLocale from '@fullcalendar/core/locales/tr';
import { CalendarEvent } from '@/types/calendar';
import { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { tr } from 'date-fns/locale';

registerLocale('tr', tr);

interface SeasonalCalendarProps {
  events: CalendarEvent[];
  onEventAdd: (event: Omit<CalendarEvent, 'id'>) => void;
  onEventUpdate: (event: CalendarEvent) => void;
  onEventDelete: (eventId: string) => void;
  dateRange: [Date | null, Date | null];
  onDateRangeChange: (range: [Date | null, Date | null]) => void;
}

const statusColors = {
  confirmed: {
    background: '#3b82f6',
    text: '#ffffff',
    border: '#2563eb'
  }
};

export default function SeasonalCalendar({
  events,
  onEventDelete,
  onDateRangeChange
}: SeasonalCalendarProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    onDateRangeChange([selectInfo.start, selectInfo.end]);
    selectInfo.view.calendar.unselect();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = events.find(e => e.id === clickInfo.event.id);
    if (event) {
      setSelectedEvent(event);
      setShowEventModal(true);
    }
  };

  const calendarEvents: EventInput[] = events.map(event => ({
    id: event.id,
    title: `₺${event.price}`,
    start: event.start,
    end: event.end,
    backgroundColor: statusColors.confirmed.background,
    borderColor: statusColors.confirmed.border,
    textColor: statusColors.confirmed.text,
    extendedProps: {
      price: event.price,
    }
  }));

  return (
    <div className="villa-calendar">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth'
        }}
        initialView="dayGridMonth"
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        events={calendarEvents}
        select={handleDateSelect}
        eventClick={handleEventClick}
        locale={trLocale}
        height="auto"
        selectOverlap={false}
        selectConstraint={{
          start: new Date().toISOString().split('T')[0],
        }}
        businessHours={{
          daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
          startTime: '08:00',
          endTime: '24:00',
        }}
      />

      {/* Event Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 animate-modal">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Sezon Fiyatı</h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Tarih Aralığı</p>
                <p className="font-medium">
                  {new Date(selectedEvent.start).toLocaleDateString('tr-TR')} - 
                  {new Date(selectedEvent.end).toLocaleDateString('tr-TR')}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Fiyat</p>
                <p className="font-medium">₺{selectedEvent.price}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
              <button
                onClick={() => {
                  onEventDelete(selectedEvent.id);
                  setShowEventModal(false);
                }}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Sil
              </button>
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

      <style jsx global>{`
        .villa-calendar .fc {
          width: 100%;
          height: 100%;
          --fc-border-color: #e5e7eb;
          --fc-button-text-color: #374151;
          --fc-button-bg-color: #ffffff;
          --fc-button-border-color: #d1d5db;
          --fc-button-hover-bg-color: #f3f4f6;
          --fc-button-hover-border-color: #9ca3af;
          --fc-button-active-bg-color: #e5e7eb;
          --fc-button-active-border-color: #6b7280;
        }

        .villa-calendar .fc .fc-button {
          padding: 0.5rem 1rem;
          font-weight: 500;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .villa-calendar .fc .fc-button:focus {
          box-shadow: none;
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        .villa-calendar .fc .fc-toolbar-title {
          font-size: 1.25rem;
          font-weight: 600;
        }

        .villa-calendar .fc .fc-day-today {
          background-color: #eff6ff !important;
        }

        .villa-calendar .fc .fc-highlight {
          background-color: #dbeafe !important;
        }

        .villa-calendar .fc-event {
          cursor: pointer;
          padding: 0.25rem 0.5rem;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
} 