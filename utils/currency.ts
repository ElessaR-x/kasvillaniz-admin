// Define valid currency codes
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'TRY';

// Define currency interface
interface CurrencyData {
  symbol: string;
  name: string;
}

// Update currencies object with proper typing
export const currencies: Record<CurrencyCode, CurrencyData> = {
  USD: { symbol: '$', name: 'US Dollar' },
  EUR: { symbol: '€', name: 'Euro' },
  GBP: { symbol: '£', name: 'British Pound' },
  TRY: { symbol: '₺', name: 'Turkish Lira' }
};

// Update formatPrice function with proper typing
export const formatPrice = (price: number, currency: CurrencyCode) => {
  const currencyData = currencies[currency];
  return `${currencyData.symbol}${price.toLocaleString('tr-TR')}`;
}; 