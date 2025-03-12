"use client";
import { useState } from 'react';
import { IconFilter, IconX } from './Icons';
import { currencies } from '@/utils/currency';

interface SearchFiltersProps {
  onSearch: (query: string) => void;
  onFilter: (filters: FilterOptions) => void;
  onSort: (sortBy: SortOption) => void;
  locationOptions: { value: string; label: string; }[];
  isOpen?: boolean;
  onClose?: () => void;
}

export interface FilterOptions {
  minPrice?: number;
  maxPrice?: number;
  currency?: keyof typeof currencies;
  minBedrooms?: number;
  minBathrooms?: number;
  minGuests?: number;
  location?: string;
  features: string[];
}

export type SortOption = "name-asc" | "name-desc" | "price-asc" | "price-desc" | "status";

const commonFeatures = [
  { id: 'honeymoon', label: 'Honeymoon Villa', icon: '❤️' },
  { id: 'kids-pool', label: 'Kids Pool', icon: '🧒' },
  { id: 'sea-view', label: 'Sea View', icon: '🌊' },
  { id: 'secure', label: 'Secure & Private', icon: '🔒' },
  { id: 'winter', label: 'Winter Friendly', icon: '❄️' },
  { id: 'pet', label: 'Pet Friendly', icon: '🐾' },
  { id: 'infinity-pool', label: 'Infinity Pool', icon: '🏊' },
  { id: 'sauna', label: 'Sauna', icon: '🧖' },
  { id: 'jacuzzi', label: 'Jacuzzi', icon: '💦' }
];

export default function SearchFilters({ 
  onFilter,
  onSort,
  locationOptions,
  isOpen,
  onClose
}: SearchFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    features: [],
    currency: 'USD'
  });
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);


  const handleFilterChange = (
    key: keyof FilterOptions,
    value: FilterOptions[keyof FilterOptions]
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Aktif filtre sayısını hesapla
    const count = Object.entries(newFilters).reduce((acc, [key, value]) => {
      if (key === 'features' && Array.isArray(value)) {
        return acc + (value.length > 0 ? 1 : 0);
      }
      return acc + (value ? 1 : 0);
    }, 0);
    setActiveFiltersCount(count);
    
    onFilter(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = {
      features: []
    };
    setFilters(emptyFilters);
    setActiveFiltersCount(0);
    onFilter(emptyFilters);
  };

  const PriceSection = () => (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Fiyat Aralığı</h3>
      
      <div className="mb-4">
        <select
          value={filters.currency}
          onChange={(e) => {
            const newCurrency = e.target.value as keyof typeof currencies;
            setFilters(prev => ({
              ...prev,
              currency: newCurrency
            }));
          }}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 
            focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
            outline-none transition-colors"
        >
          {Object.entries(currencies).map(([code, currency]) => (
            <option key={code} value={code}>
              {currency.symbol} {code}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Minimum</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {currencies[filters.currency || 'USD'].symbol}
          </span>
          <input
            type="number"
            value={filters.minPrice || ''}
            onChange={(e) => {
              setFilters(prev => ({
                ...prev,
                minPrice: e.target.value ? Number(e.target.value) : undefined
              }));
            }}
            className="w-full pl-8 pr-4 py-2 rounded-lg border border-gray-200 
              focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
              outline-none transition-colors"
            placeholder="Min"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-600 mb-1">Maksimum</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            {currencies[filters.currency || 'USD'].symbol}
          </span>
          <input
            type="number"
            value={filters.maxPrice || ''}
            onChange={(e) => {
              setFilters(prev => ({
                ...prev,
                maxPrice: e.target.value ? Number(e.target.value) : undefined
              }));
            }}
            className="w-full pl-8 pr-4 py-2 rounded-lg border border-gray-200 
              focus:border-blue-500 focus:ring-1 focus:ring-blue-500 
              outline-none transition-colors"
            placeholder="Max"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className={`
      fixed inset-0 z-40 lg:relative lg:z-0
      ${isOpen ? 'visible' : 'invisible lg:visible'}
    `}>
      {/* Overlay - sadece mobilde görünür */}
      <div 
        className={`
          fixed inset-0 bg-black/50 lg:hidden
          ${isOpen ? 'opacity-100' : 'opacity-0'}
          transition-opacity duration-300
        `}
        onClick={onClose}
      />

      {/* Filtre Paneli */}
      <div className={`
        fixed right-0 top-0 bottom-0 w-[320px] bg-white lg:relative lg:w-full
        transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full bg-gray-50/50">
          {/* Filtre Başlığı */}
          <div className="sticky top-0 z-10 bg-white px-4 lg:px-6 py-4 border-b backdrop-blur-lg bg-white/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <IconFilter className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Filtreler</h3>
                  <p className="text-sm text-gray-500">Villa aramanızı daraltın</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-all flex items-center gap-2 shadow-sm"
                  >
                    <IconX className="w-4 h-4" />
                    Temizle
                    <span className="bg-blue-100 text-blue-600 text-xs font-medium px-2 py-0.5 rounded-full">
                      {activeFiltersCount}
                    </span>
                  </button>
                )}
                
                {/* Mobil Kapatma Butonu */}
                <button 
                  onClick={onClose}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <IconX className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Filtre İçeriği */}
          <div className="flex-1 overflow-auto px-4 lg:px-6 py-4">
            <div className="space-y-4">
              <PriceSection />

              {/* Lokasyon - Tek sütun */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Konum</h4>
                  <span className="text-2xl">📍</span>
                </div>
                <div className="flex flex-col gap-2">
                  {locationOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleFilterChange('location', 
                        filters.location === option.value ? '' : option.value
                      )}
                      className={`
                        w-full px-4 py-3 rounded-xl text-sm font-medium transition-all text-left
                        ${filters.location === option.value
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Özellikler - Tek sütun */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Villa Detayları</h4>
                  <span className="text-2xl">🏠</span>
                </div>
                <div className="space-y-4">
                  {/* Yatak Odası */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <span className="text-lg">🛏️</span>
                      Yatak Odası
                    </label>
                    <select
                      value={filters.minBedrooms || ''}
                      onChange={(e) => handleFilterChange('minBedrooms', Number(e.target.value))}
                      className="w-full py-3 px-4 rounded-xl bg-gray-50 border-0 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Tümü</option>
                      {[1,2,3,4,5].map(num => (
                        <option key={num} value={num}>{num}+ Yatak Odası</option>
                      ))}
                    </select>
                  </div>

                  {/* Banyo */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <span className="text-lg">🚿</span>
                      Banyo
                    </label>
                    <select
                      value={filters.minBathrooms || ''}
                      onChange={(e) => handleFilterChange('minBathrooms', Number(e.target.value))}
                      className="w-full py-3 px-4 rounded-xl bg-gray-50 border-0 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Tümü</option>
                      {[1,2,3,4].map(num => (
                        <option key={num} value={num}>{num}+ Banyo</option>
                      ))}
                    </select>
                  </div>

                  {/* Misafir */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <span className="text-lg">👥</span>
                      Misafir Sayısı
                    </label>
                    <select
                      value={filters.minGuests || ''}
                      onChange={(e) => handleFilterChange('minGuests', Number(e.target.value))}
                      className="w-full py-3 px-4 rounded-xl bg-gray-50 border-0 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Tümü</option>
                      {[2,4,6,8,10].map(num => (
                        <option key={num} value={num}>{num}+ Misafir</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Villa Özellikleri */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Villa Özellikleri</h4>
                  <span className="text-2xl">✨</span>
                </div>
                <div className="space-y-2">
                  {commonFeatures.map((feature) => (
                    <button
                      key={feature.id}
                      onClick={() => {
                        const newFeatures = filters.features.includes(feature.id)
                          ? filters.features.filter(f => f !== feature.id)
                          : [...filters.features, feature.id];
                        handleFilterChange('features', newFeatures);
                      }}
                      className={`
                        w-full flex items-center gap-3 p-3 rounded-xl text-sm transition-all
                        ${filters.features.includes(feature.id)
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }
                      `}
                    >
                      <span className="text-lg">{feature.icon}</span>
                      <span className="flex-1 text-left font-medium">{feature.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Özellikler Grid'i */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                <select 
                  onChange={(e) => onSort(e.target.value as SortOption)}
                  className="w-full py-3 px-4 rounded-xl bg-gray-50 border-0 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name-asc">İsim (A-Z)</option>
                  <option value="name-desc">İsim (Z-A)</option>
                  <option value="price-asc">Fiyat (Düşük-Yüksek)</option>
                  <option value="price-desc">Fiyat (Yüksek-Düşük)</option>
                  <option value="status">Durum (Aktif-Pasif)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 