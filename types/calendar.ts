import { CurrencyCode } from '@/utils/currency';

export interface GuestInfo {
  fullName: string;
  identityNumber: string;
  birthDate?: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: 'confirmed' | 'pending' | 'blocked';
  price: number;
  currency: CurrencyCode;
  // Rezervasyon yapan kişi bilgileri
  contactPerson: {
    fullName: string;
    email: string;
    phone: string;
    identityNumber: string;
  };
  // Konaklayacak kişiler
  guests: GuestInfo[];
  // Ek bilgiler
  specialRequests?: string;
  // Villa bilgileri
  villaId: string;
  villaName: string;
  villaLocation: string;
  maxGuests: number;
} 