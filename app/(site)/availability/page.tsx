"use client";
import { useState, useEffect } from 'react';
import { useVilla } from '@/store/VillaContext';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import VillaCalendar from '@/components/VillaCalendar';
import MinimalVillaCard from '@/components/MinimalVillaCard';
import { useSearchParams } from 'next/navigation';
import { IconArrowLeft } from '@/components/Icons';
import LoadingSpinner from '@/components/LoadingSpinner';
import { CalendarEvent } from '@/types/calendar';
import AlertModal from '@/components/AlertModal';

type AlertType = 'error' | 'success' | 'warning' | 'info';

interface AlertState {
  show: boolean;
  message: string;
  type: AlertType;
}

export default function AvailabilityPage() {
  const { 
    villas, 
    events, 
    loading, 
    updateEvent, 
    deleteEvent,
    fetchEvents
  } = useVilla();
  const searchParams = useSearchParams();
  const [selectedVilla, setSelectedVilla] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [alertState, setAlertState] = useState<AlertState>({
    show: false,
    message: '',
    type: 'error'
  });
  useEffect(() => {
    const refreshParam = searchParams?.get('refresh');
    
    if (refreshParam) {
      setSelectedVilla(null);
      setShowNewEventModal(false);
      setSearchTerm('');
    }
  }, [searchParams]);

  const filteredVillas = villas.filter(villa =>
    villa.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    villa.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const villaEvents = selectedVilla 
    ? events.filter(event => event.villaId === selectedVilla)
    : [];

  const selectedVillaData = selectedVilla 
    ? villas.find(v => v.id === selectedVilla)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const handleEventAdd = async (event: Omit<CalendarEvent, 'id'>) => {
    if (!selectedVilla || !selectedVillaData) return;

    try {
      const bookingData = {
        title: event.title,
        start: event.start,
        end: event.end,
        status: event.status || 'pending',
        villaId: selectedVilla,
        price: event.price || selectedVillaData.price,
        currency: event.currency || selectedVillaData.currency,
        contactPerson: event.contactPerson || {
          fullName: event.title,
          email: 'beklemede@villapanel.com',
          phone: 'Beklemede',
          identityNumber: 'Beklemede'
        },
        guests: event.guests || [{
          fullName: event.title,
          identityNumber: 'Beklemede'
        }],
        specialRequests: event.specialRequests || ''
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Rezervasyon eklenemedi');
      }

      // Yeni rezervasyonları çek
      await fetchEvents();
      
      setShowNewEventModal(false);
      setAlertState({
        show: true,
        message: 'Rezervasyon başarıyla eklendi',
        type: 'success'
      });
    } catch (error) {
      console.error('Client - Genel hata:', error);
      setAlertState({
        show: true,
        message: error instanceof Error ? error.message : 'Rezervasyon eklenirken bir hata oluştu',
        type: 'error'
      });
    }
  };

  const handleEventUpdate = async (updatedEvent: CalendarEvent) => {
    try {
      await updateEvent(updatedEvent);
      setAlertState({
        show: true,
        message: 'Rezervasyon başarıyla güncellendi',
        type: 'success'
      });
    } catch (error) {
      console.error('Rezervasyon güncelleme hatası:', error);
      setAlertState({
        show: true,
        message: 'Rezervasyon güncellenirken bir hata oluştu',
        type: 'error'
      });
    }
  };

  const handleEventDelete = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      setAlertState({
        show: true,
        message: 'Rezervasyon başarıyla silindi',
        type: 'success'
      });
    } catch (error) {
      console.error('Rezervasyon silme hatası:', error);
      setAlertState({
        show: true,
        message: 'Rezervasyon silinirken bir hata oluştu',
        type: 'error'
      });
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          {selectedVilla ? (
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setSelectedVilla(null);
                  setShowNewEventModal(false);
                  setSearchTerm('');
                }}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 
                  hover:bg-gray-100 rounded-lg transition-colors"
              >
                <IconArrowLeft className="w-5 h-5" />
                <span>Geri</span>
              </button>
              <h1 className="text-2xl font-bold">Villa Müsaitlik Durumları</h1>
            </div>
          ) : (
            <h1 className="text-2xl font-bold">Villa Müsaitlik Durumları</h1>
          )}
          
          <button
            onClick={() => {
              if (!selectedVilla) {
                const villaListElement = document.querySelector('.villa-list');
                villaListElement?.scrollIntoView({ behavior: 'smooth' });
                alert('Lütfen önce bir villa seçin');
              } else {
                setShowNewEventModal(true);
              }
            }}
            className={`
              px-3 py-2 text-sm sm:px-4 sm:py-2.5 sm:text-base rounded-lg transition-all flex items-center gap-1.5 sm:gap-2
              ${selectedVilla 
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
            `}
            disabled={!selectedVilla}
            title={selectedVilla ? 'Yeni rezervasyon ekle' : 'Lütfen önce bir villa seçin'}
          >
            <span className="text-lg">+</span>
            Yeni Rezervasyon
          </button>
        </div>
        
        {/* Villa seçimi için yönlendirme mesajı */}
        {!selectedVilla && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-700 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Lütfen aşağıdan bir villa seçin
            </p>
          </div>
        )}

        {/* Arama ve Filtreleme */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Villa adı veya konum ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Villa Listesi */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 villa-list">
          {filteredVillas.map(villa => (
            <MinimalVillaCard
              key={villa.id}
              villa={villa}
              isSelected={selectedVilla === villa.id}
              onClick={() => setSelectedVilla(villa.id)}
            />
          ))}
        </div>

        {/* Sonuç bulunamadı */}
        {filteredVillas.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Arama kriterlerinize uygun villa bulunamadı.</p>
          </div>
        )}
      </div>

      {/* Seçili Villa Takvimi */}
      {selectedVilla && selectedVillaData && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <AvailabilityCalendar
            villa={selectedVillaData}
            events={villaEvents}
            numberOfMonths={3}
            useSeasonalPrices={false}
          />
        </div>
      )}

      {/* Rezervasyon Modal'ı */}
      {showNewEventModal && selectedVilla && selectedVillaData && (
        <VillaCalendar
          events={villaEvents}
          onEventAdd={handleEventAdd}
          onEventUpdate={handleEventUpdate}
          onEventDelete={handleEventDelete}
          showNewEventModal={showNewEventModal}
          onNewEventModalClose={() => setShowNewEventModal(false)}
          defaultPrice={selectedVillaData.price}
          villa={selectedVillaData}
          title={`${selectedVillaData.name} - Yeni Rezervasyon`}
          subtitle={`${selectedVillaData.location} • Maksimum ${selectedVillaData.maxGuests} Misafir`}
        />
      )}

      <AlertModal 
        isOpen={alertState.show}
        onClose={() => setAlertState(prev => ({ ...prev, show: false }))}
        message={alertState.message}
        type={alertState.type}
      />
    </div>
  );
} 
