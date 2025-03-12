"use client";
import { useState, useEffect } from 'react';
import { useVilla } from '@/store/VillaContext';
import MinimalVillaCard from '@/components/MinimalVillaCard';
import SeasonalPriceModal from '@/components/SeasonalPriceModal';
import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import { CalendarEvent } from '@/types/calendar';
import { IconArrowLeft } from '@/components/Icons';
import LoadingSpinner from '@/components/LoadingSpinner';
import AlertModal from '@/components/AlertModal';
import { useSearchParams } from 'next/navigation';

type AlertType = 'error' | 'success' | 'warning' | 'info';

interface AlertState {
  show: boolean;
  message: string;
  type: AlertType;
}

interface SeasonalPrice {
  startDate: string;
  endDate: string;
  price: number;
  currency: string;
}

export default function PricingPage() {
  const { villas, events, loading, fetchEvents } = useVilla();
  const searchParams = useSearchParams();
  const [selectedVilla, setSelectedVilla] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewPriceModal, setShowNewPriceModal] = useState(false);
  const [seasonalEvents, setSeasonalEvents] = useState<CalendarEvent[]>([]);
  const [alertState, setAlertState] = useState<AlertState>({
    show: false,
    message: '',
    type: 'error'
  });

  // URL parametrelerini kontrol et
  useEffect(() => {
    if (!searchParams) return; // searchParams null ise işlemi sonlandır
    
    const refreshParam = searchParams.get('refresh');
    
    if (refreshParam) {
      setSelectedVilla(null);
      setShowNewPriceModal(false);
      setSearchTerm('');
    }
  }, [searchParams]);

  // Filtreleme
  const filteredVillas = villas.filter(villa =>
    villa.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    villa.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Seçili villanın rezervasyonları
  const villaEvents = selectedVilla 
    ? events.filter(event => event.villaId === selectedVilla)
    : [];

  // Seçili villa verisi
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

  const handleSaveSeasonalPrice = async (seasonalPrice: {
    months: number[];
    price: number;
  }, event: CalendarEvent) => {
    if (!selectedVilla || !selectedVillaData) return;

    try {
      // Mevcut villa verisini al
      const currentVilla = villas.find(v => v.id === selectedVilla);
      if (!currentVilla) throw new Error('Villa bulunamadı');

      // Sezonluk fiyat verisi
      const seasonalPriceData = {
        startDate: event.start,
        endDate: event.end,
        price: Number(seasonalPrice.price),
        currency: currentVilla.currency,
        months: seasonalPrice.months.map(Number)
      };

      // Yeni API endpoint'i kullan
      const response = await fetch(`/api/villas/${selectedVilla}/seasonal-prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(seasonalPriceData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error === 'Tarih çakışması') {
            const prices = errorData.existingPrices.map((p: SeasonalPrice) => 
              `${p.startDate} - ${p.endDate} (${p.price} ${p.currency})`
            ).join('\n');
            errorMessage = `Bu tarih aralığında zaten fiyat tanımlanmış:\n${prices}`;
          } else {
            errorMessage = errorData.error || errorData.details || 'Sezonluk fiyat eklenemedi';
          }
        } catch {
          errorMessage = errorText || 'Sezonluk fiyat eklenemedi';
        }
        throw new Error(errorMessage);
      }

      
      
      // Calendar event'i güncelle
      setSeasonalEvents(prev => [...prev, {
        id: `seasonal-${Date.now()}`,
        title: `${seasonalPrice.price} ${currentVilla.currency}/gece`,
        start: event.start,
        end: event.end,
        status: 'confirmed',
        villaId: selectedVilla,
        price: seasonalPrice.price,
        currency: currentVilla.currency,
        villaName: currentVilla.name,
        villaLocation: currentVilla.location,
        maxGuests: currentVilla.maxGuests,
        contactPerson: {
          fullName: 'Sistem',
          email: 'sistem@villapanel.com',
          phone: '-',
          identityNumber: '-'
        },
        guests: [],
        specialRequests: 'Sezonluk fiyat'
      }]);
      
      setShowNewPriceModal(false);
      
      setAlertState({
        show: true,
        message: 'Sezonluk fiyat başarıyla eklendi',
        type: 'success'
      });

      // Events'leri yeniden yükle
      await fetchEvents();

    } catch (error) {
      console.error('Sezonluk fiyat eklenirken hata:', error);
      setAlertState({
        show: true,
        message: error instanceof Error ? error.message : 'Sezonluk fiyat eklenirken bir hata oluştu',
        type: 'error'
      });
    }
  };

  return (
    <main className="p-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          {selectedVilla ? (
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setSelectedVilla(null);
                  setShowNewPriceModal(false);
                  setSearchTerm('');
                }}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 
                  hover:bg-gray-100 rounded-lg transition-colors"
              >
                <IconArrowLeft className="w-5 h-5" />
                <span>Geri</span>
              </button>
              <h1 className="text-2xl font-bold">Villa Fiyatlandırma</h1>
            </div>
          ) : (
            <h1 className="text-2xl font-bold">Villa Fiyatlandırma</h1>
          )}
          
          <button
            onClick={() => {
              if (!selectedVilla) {
                const villaListElement = document.querySelector('.villa-list');
                villaListElement?.scrollIntoView({ behavior: 'smooth' });
                alert('Lütfen önce bir villa seçin');
              } else {
                setShowNewPriceModal(true);
              }
            }}
            className={`
              px-3 py-2 text-sm sm:px-4 sm:py-2.5 sm:text-base rounded-lg transition-all flex items-center gap-1.5 sm:gap-2
              ${selectedVilla 
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
            `}
            disabled={!selectedVilla}
            title={selectedVilla ? 'Sezonluk fiyat ekle' : 'Lütfen önce bir villa seçin'}
          >
            <span className="text-lg">+</span>
            Sezonluk Fiyat Ekle
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
            events={[...villaEvents, ...seasonalEvents]}
            numberOfMonths={3}
            useSeasonalPrices={true}
          />
        </div>
      )}

      {/* Sezonluk Fiyat Modal'ı */}
      {showNewPriceModal && selectedVilla && (
        <SeasonalPriceModal
          villa={villas.find(v => v.id === selectedVilla)!}
          onClose={() => setShowNewPriceModal(false)}
          onSave={handleSaveSeasonalPrice}
        />
      )}

      {/* Alert Modal'ı ekle */}
      <AlertModal 
        isOpen={alertState.show}
        onClose={() => setAlertState(prev => ({ ...prev, show: false }))}
        message={alertState.message}
        type={alertState.type}
      />
    </main>
  );
} 