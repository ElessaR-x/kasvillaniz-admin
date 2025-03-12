"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  IconHome, 
  IconDashboard, 
  IconCalendar, 
  IconCurrency, 
  IconBooking,
  IconLogout,
  IconChevronLeft,
  IconMessage,
} from '@/components/Icons';

const menuItems = [
  { title: 'Dashboard', icon: <IconDashboard className="w-5 h-5" />, href: '/' },
  { title: 'Villalar', icon: <IconHome className="w-5 h-5" />, href: '/villas' },
  { title: 'Müsaitlik', icon: <IconCalendar className="w-5 h-5" />, href: '/availability' },
  { title: 'Fiyatlandırma', icon: <IconCurrency className="w-5 h-5" />, href: '/pricing' },
  { title: 'Rezervasyonlar', icon: <IconBooking className="w-5 h-5" />, href: '/bookings' },
  { title: 'AI Asistan', icon: <IconMessage className="w-5 h-5" />, href: '/ai-assistant' },
];

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-navy-600 rounded-lg flex items-center justify-center">
        <span className="text-white font-bold">V</span>
      </div>
      <span className="text-lg font-semibold text-white">Villa Panel</span>
    </div>
  );
}

interface NavbarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (value: boolean) => void;
}

export default function Navbar({ isCollapsed, setIsCollapsed, isMobileMenuOpen, setIsMobileMenuOpen }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        router.push('/login');
        router.refresh();
      } else {
        console.error('Çıkış yapılırken bir hata oluştu');
      }
    } catch (error) {
      console.error('Çıkış yapılırken bir hata oluştu:', error);
    }
  };

  return (
    <nav className="h-full relative">
      {/* Hamburger Menü Butonu - Sadece navbar kapalıyken göster */}
      {!isMobileMenuOpen && (
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="absolute top-1/2 left-full transform -translate-y-1/2 z-50 lg:hidden w-6 h-14 p-0.5 rounded-r-lg bg-navy-800 shadow-md"
        >
          <svg 
            className="w-5 h-5 text-gray-300" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      )}

      <div className="h-full flex flex-col bg-navy-800">
        {/* Logo ve Toggle Butonu */}
        <div className="flex items-center justify-between p-4 border-b border-navy-700">
          {!isCollapsed && <Logo />}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-navy-700 rounded-lg lg:block hidden"
            title={isCollapsed ? "Menüyü Genişlet" : "Menüyü Daralt"}
          >
            <IconChevronLeft className={`w-5 h-5 text-gray-300 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
          {/* Mobil Kapatma Butonu */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 hover:bg-navy-700 rounded-lg lg:hidden"
          >
            <svg 
              className="w-6 h-6 text-gray-300" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        </div>

        {/* Menü Öğeleri */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-3">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors relative group
                    ${isActive 
                      ? 'bg-navy-600 text-white'
                      : 'text-gray-300 hover:bg-navy-700 hover:text-white'
                    }`}
                >
                  <div className="flex-shrink-0">{item.icon}</div>
                  {!isCollapsed && (
                    <span className={`${isActive ? 'font-medium' : ''}`}>
                      {item.title}
                    </span>
                  )}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-navy-900 text-white text-sm 
                      rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                      transition-all whitespace-nowrap z-50">
                      {item.title}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Alt Menü - Çıkış */}
        <div className="p-4 border-t border-navy-700">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 rounded-lg text-gray-300 hover:bg-navy-700 
              hover:text-white transition-colors w-full relative group"
          >
            <IconLogout className="w-5 h-5" />
            {!isCollapsed && <span>Çıkış Yap</span>}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-navy-900 text-white text-sm 
                rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible 
                transition-all whitespace-nowrap z-50">
                Çıkış Yap
              </div>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
