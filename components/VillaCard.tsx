import { Villa } from "@/types/villa";
import Image from "next/image";
import { useState, useEffect } from "react";
import Modal from "./Modal";
import VillaCalendar from "./VillaCalendar";
import { CalendarEvent } from "@/types/calendar";
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/utils/currency';
import { currencies } from '@/utils/currency';
import VillaForm from "./VillaForm";

interface VillaCardProps {
  villa: Villa;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCalendar: () => void;
}

// Feature ikonları için mapping
const featureIcons = {
  'sea-view': (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16m-7 5h7" />
    </svg>
  ),
  'infinity-pool': (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  'jacuzzi': (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  'secure': (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  'pet': (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
    </svg>
  ),
  'kids-pool': (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  'winter': (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  'sauna': (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
    </svg>
  )
} as const;

type FeatureType = keyof typeof featureIcons;

export default function VillaCard({ villa, onEdit, onDelete }: VillaCardProps) {
  const router = useRouter();
  const [showCalendar, setShowCalendar] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    setEvents(villa.events || []);
  }, [villa.events]);

  if (!villa) {
    return null;
  }

  if (!villa.images || !Array.isArray(villa.images)) {
    villa.images = [];
  }

  const handleEventAdd = (event: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: Date.now().toString(),
      villaId: villa.id,
      status: 'confirmed' as const,
      price: event.price || villa.price,
      villaName: villa.name,
      villaLocation: villa.location,
      maxGuests: villa.maxGuests
    };
    setEvents([...events, newEvent]);
  };

  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    setEvents(events.map(event => 
      event.id === updatedEvent.id ? updatedEvent : event
    ));
  };

  const handleEventDelete = (eventId: string) => {
    setEvents(events.filter(event => event.id !== eventId));
  };

  const handleClick = () => {
    router.push(`/villas/${villa.id}`);
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleEditSubmit = async (updatedVilla: Omit<Villa, "id">) => {
    try {
      const response = await fetch(`/api/villas/${villa.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updatedVilla,
          id: villa.id
        })
      });

      if (!response.ok) {
        throw new Error('Villa güncellenirken bir hata oluştu');
      }
      
      const updatedData = await response.json();
      
      // Parent component'e güncel veriyi gönder
      onEdit(villa.id);
      
      // Modalı kapat
      setShowEditModal(false);
      
      // Villa state'ini güncelle
      setEvents(updatedData.events || []);
      
      // Başarı mesajı göster
      alert('Villa başarıyla güncellendi!');
    } catch (error) {
      console.error('Villa güncellenirken hata:', error);
      alert('Villa güncellenirken bir hata oluştu!');
    }
  };

 
  

  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden border 
      ${!villa.isActive ? 'opacity-60' : ''} 
      ${villa.isActive ? 'border-gray-100' : 'border-red-100'}`}
    >
      <div onClick={handleClick} className="cursor-pointer">
        <div className="relative h-40 sm:h-48">
          {villa.isFeatured && (
            <div className="absolute top-2 left-2 bg-yellow-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1 shadow-lg">
              <span className="text-xs sm:text-sm">⭐</span>
              Öne Çıkan
            </div>
          )}
          {villa.images[0] ? (
            <Image
              src={villa.images[0]}
              alt={villa.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-8 h-8 sm:w-12 sm:h-12 text-blue-300 mx-auto mb-1 sm:mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 22V12h6v10" />
                </svg>
                <span className="text-xs sm:text-sm text-blue-400">Villa Görseli</span>
              </div>
            </div>
          )}
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium text-blue-600">
            {formatPrice(villa.price, villa.currency as keyof typeof currencies)}/gece
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center p-2 sm:p-3 bg-gradient-to-t from-black/60 to-transparent text-white">
            <span className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm">
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span className="truncate max-w-[100px] sm:max-w-none">{villa.location}</span>
            </span>
            <span className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm">
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {villa.maxGuests} Misafir
            </span>
          </div>
        </div>
        <div className="p-3 sm:p-5 flex flex-col">
          <div className="flex-1 flex flex-col items-center text-center">
            <div className="mb-2 sm:mb-3">
              <h3 className="font-semibold text-base sm:text-lg mb-1">Kaşvillanız - {villa.code}</h3>
              {villa.originalName && (
                <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 
                  bg-gradient-to-r from-red-50 to-rose-50 
                  border border-red-100 rounded-md
                  shadow-sm shadow-red-100/50
                  animate-pulse-slow"
                >
                  <span className="text-[10px] sm:text-xs font-semibold text-red-500 normal-case">
                    Orjinal villa ismi:
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-red-700 truncate max-w-[150px]">
                    {villa.originalName}
                  </span>
                </div>
              )}
            </div>

            <div className="mb-3 sm:mb-4">
              <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center">
                {villa.features.map((feature, index) => (
                  <span key={index} className="inline-flex items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-0.5 sm:py-1 
                    bg-gradient-to-r from-blue-50 to-indigo-50 
                    text-[10px] sm:text-xs font-medium text-blue-700
                    border border-blue-100/50 rounded-lg
                    shadow-sm shadow-blue-100/50
                    transition-all duration-200
                    hover:shadow-md hover:shadow-blue-100/50
                    hover:border-blue-200/50"
                  >
                    {featureIcons[feature as FeatureType] || (
                      <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {feature}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="p-3 sm:p-5 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowCalendar(true)}
            className="flex items-center gap-1.5 sm:gap-2 text-blue-800 hover:text-blue-900 p-1.5 sm:p-2 rounded-lg hover:bg-blue-50 transition-all"
          >
            <span className="text-xs sm:text-sm font-medium">Rezervasyon Ekle</span>
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={handleEdit}
              className="p-1.5 sm:p-2 text-blue-800 hover:text-blue-900 rounded-lg hover:bg-blue-50 transition-all"
              title="Düzenle"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            <button
              onClick={() => onDelete(villa.id)}
              className="p-1.5 sm:p-2 text-blue-800 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all"
              title="Sil"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {showCalendar && (
        <VillaCalendar
          events={events}
          onEventAdd={handleEventAdd}
          onEventUpdate={handleEventUpdate}
          onEventDelete={handleEventDelete}
          villa={villa}
          title={`${villa.name} - Rezervasyonlar`}
          subtitle={`${villa.location} • Maksimum ${villa.maxGuests} Misafir`}
          defaultPrice={villa.price}
          showNewEventModal={showCalendar}
          onNewEventModalClose={() => setShowCalendar(false)}
        />
      )}

      {showEditModal && (
        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Villa Düzenle"
          className="max-h-[90vh] overflow-hidden"
        >
          <VillaForm
            initialData={villa}
            onSubmit={handleEditSubmit}
            onCancel={() => setShowEditModal(false)}
          />
        </Modal>
      )}
    </div>
  );
} 
