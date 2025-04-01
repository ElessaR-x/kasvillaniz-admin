"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Villa } from '@/types/villa';
import { CalendarEvent } from '@/types/calendar';
import { SeasonalPrice } from '@/types/villa';

interface VillaContextType {
  villas: Villa[];
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  addVilla: (villa: Villa) => Promise<void>;
  updateVilla: (villa: Villa) => Promise<void>;
  deleteVilla: (id: string) => Promise<void>;
  updateEvent: (event: CalendarEvent) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addSeasonalPrice: (villaId: string, seasonalPrice: SeasonalPrice) => Promise<void>;
  fetchVillas: () => Promise<void>;
  fetchEvents: () => Promise<void>;
}

const VillaContext = createContext<VillaContextType | undefined>(undefined);

export function VillaProvider({ children }: { children: ReactNode }) {
  const [villas, setVillas] = useState<Villa[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVillas = async () => {
    try {
      const response = await fetch('/api/villas');
      if (!response.ok) {
        throw new Error('Veri yüklenirken bir hata oluştu');
      }
      const result = await response.json();
      setVillas(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/bookings');
      if (!response.ok) throw new Error('Rezervasyonlar yüklenemedi');
      const data = await response.json();
      // API'den gelen booking verilerini CalendarEvent formatına dönüştür
      const calendarEvents: CalendarEvent[] = data.map((booking: any) => ({
        id: booking.id,
        title: booking.title,
        start: new Date(booking.startDate),
        end: new Date(booking.endDate),
        status: booking.status,
        price: booking.price,
        currency: booking.currency,
        contactPerson: booking.contactPerson,
        guests: booking.guests,
        specialRequests: booking.specialRequests,
        villaId: booking.villaId,
        villaName: booking.villa.name,
        villaLocation: booking.villa.location,
        maxGuests: booking.villa.maxGuests
      }));
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Rezervasyon yükleme hatası:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchVillas(), fetchEvents()]);
    };
    loadData();
  }, []);

  const addVilla = async (villaData: Villa) => {
    try {
      const response = await fetch('/api/villas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(villaData)
      });
      if (!response.ok) throw new Error('Villa eklenemedi');
      const newVilla = await response.json();
      setVillas(prev => [...prev, newVilla]);
    } catch (error) {
      console.error('Villa ekleme hatası:', error);
      throw error;
    }
  };

  const updateVilla = async (updatedVilla: Villa) => {
    try {
      const response = await fetch(`/api/villas/${updatedVilla.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedVilla)
      });
      if (!response.ok) throw new Error('Villa güncellenemedi');
      const villa = await response.json();
      setVillas(villas.map(v => v.id === villa.id ? villa : v));
    } catch (error) {
      console.error('Villa güncelleme hatası:', error);
      throw error;
    }
  };

  const deleteVilla = async (id: string) => {
    try {
      const response = await fetch(`/api/villas/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Villa silinemedi');
      setVillas(villas.filter(villa => villa.id !== id));
      setEvents(events.filter(event => event.villaId !== id));
    } catch (error) {
      console.error('Villa silme hatası:', error);
      throw error;
    }
  };

  const updateEvent = async (updatedEvent: CalendarEvent) => {
    try {
      setEvents(events.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    } catch (error) {
      console.error('Rezervasyon güncelleme hatası:', error);
      throw error;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Rezervasyon silinemedi');
      setEvents(events.filter(event => event.id !== id));
    } catch (error) {
      console.error('Rezervasyon silme hatası:', error);
      throw error;
    }
  };

  const addSeasonalPrice = async (villaId: string, seasonalPrice: SeasonalPrice) => {
    try {
      const villa = villas.find(v => v.id === villaId);
      if (!villa) throw new Error('Villa bulunamadı');
      
      const updatedSeasonalPrice = {
        ...seasonalPrice,
        startDate: new Date(seasonalPrice.startDate),
        endDate: new Date(seasonalPrice.endDate)
      };
      
      const updatedVilla = {
        ...villa,
        seasonalPrices: [...(villa.seasonalPrices || []), updatedSeasonalPrice]
      };
      
      await updateVilla(updatedVilla);
    } catch (error) {
      console.error('Sezonluk fiyat ekleme hatası:', error);
      throw error;
    }
  };

  const value = {
    villas,
    events,
    loading,
    error,
    addVilla,
    updateVilla,
    deleteVilla,
    updateEvent,
    deleteEvent,
    addSeasonalPrice,
    fetchVillas,
    fetchEvents
  };

  return (
    <VillaContext.Provider value={value}>
      {children}
    </VillaContext.Provider>
  );
}

export function useVilla() {
  const context = useContext(VillaContext);
  if (context === undefined) {
    throw new Error('useVilla must be used within a VillaProvider');
  }
  return context;
} 