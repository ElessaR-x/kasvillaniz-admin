import { Villa } from "@/types/villa";
import { formatPrice, currencies } from '@/utils/currency';

interface MinimalVillaCardProps {
  villa: Villa;
  isSelected: boolean;
  onClick: () => void;
}

export default function MinimalVillaCard({ villa, isSelected, onClick }: MinimalVillaCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 sm:p-4 rounded-lg transition-all w-full
        ${isSelected 
          ? 'bg-blue-600 text-white shadow-lg' 
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}
      `}
    >
      {/* Villa Görseli */}
      <div className={`
        w-20 sm:w-16 h-20 sm:h-16 rounded-lg flex-shrink-0 flex items-center justify-center
        ${isSelected ? 'bg-blue-500' : 'bg-blue-50'}
      `}>
        <svg 
          className={`w-8 h-8 ${isSelected ? 'text-white' : 'text-blue-500'}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 22V12h6v10" />
        </svg>
      </div>

      {/* Villa Bilgileri */}
      <div className="flex-1 min-w-0">
        {/* Villa Adı */}
        <h3 className={`font-medium truncate ${isSelected ? 'text-white' : 'text-gray-900'}`}>
          {villa.name}
        </h3>

        {/* Orijinal Villa Adı */}
        {villa.originalName && (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1
            bg-gradient-to-r from-red-50 to-rose-50 
            border border-red-100 rounded-md
            shadow-sm shadow-red-100/50"
          >
            <span className="text-xs font-medium text-red-700 truncate max-w-[150px]">
              {villa.originalName}
            </span>
          </div>
        )}

        {/* Lokasyon ve Fiyat */}
        <div className="flex flex-wrap items-start gap-x-4 gap-y-2 mt-2">
          <span className={`text-xs sm:text-sm flex items-center gap-1.5 font-medium
            ${isSelected ? 'text-white' : 'text-gray-700'}`}
          >
            <svg className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-100' : 'text-gray-400'}`} 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
              />
            </svg>
            <span className="truncate max-w-[120px]">{villa.location}</span>
          </span>
          <span className={`text-xs sm:text-sm flex items-center gap-1.5 font-medium whitespace-nowrap
            ${isSelected ? 'text-white' : 'text-gray-700'}`}
          >
            <svg className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-100' : 'text-gray-400'}`} 
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            {formatPrice(villa.price, villa.currency as keyof typeof currencies)}/gece
          </span>
        </div>
      </div>

      {/* Sağ Taraf İkonları */}
      <div className="flex items-center gap-1.5 ml-auto">
        <span className={`text-xs sm:text-sm flex items-center gap-1 font-medium
          ${isSelected ? 'text-white' : 'text-gray-700'}`}
        >
          <svg className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-100' : 'text-gray-400'}`} 
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" 
            />
          </svg>
          {villa.maxGuests}
        </span>
      </div>
    </button>
  );
} 