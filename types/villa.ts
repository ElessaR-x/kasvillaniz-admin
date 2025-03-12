import { CurrencyCode } from '@/utils/currency';
import { CalendarEvent } from './calendar';

export interface SeasonalPrice {
  id?: string;
  startDate: string | number | Date;
  endDate: string | number | Date;
  price: number;
  currency: CurrencyCode;
  months: number[];
  villaId?: string;
}

// Amenity tipi için interface
export interface Amenity {
  icon: string;
  name: string;
}

export interface Villa {
  id: string;
  name: string;
  originalName: string;
  code: string;
  description: string;
  price: number;
  currency: CurrencyCode;
  images: string[];
  features: string[];
  location: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  
  // Yeni eklenen alanlar
  rating?: number;
  reviews?: number;
  amenities: Amenity[];
  size?: string;
  tags: string[];
  discount?: string;
  isActive: boolean;
  isFeatured: boolean;
  
  // Mevcut alanlar
  seasonalPrices?: SeasonalPrice[];
  ownerName: string;
  identityNumber: string;
  phoneNumber: string;
  ibanOwner: string;
  ibanNumber: string;
  email: string;
  tourismLicenseNumber: string;
  minStayDays: number;
  distances: {
    miniMarket: number;    // metre
    restaurant: number;    // metre
    publicTransport: number; // metre
    beach: number;        // metre
    airport: number;      // metre
    cityCenter: number;   // metre
  };
  mapLink?: string;
  events?: CalendarEvent[];
} 