"use client";
import { Inter } from "next/font/google";
import "../globals.css";
import Navbar from "@/components/navbar";
import { VillaProvider } from '@/store/VillaContext';
import { useEffect, useState } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Mobil görünümde başlangıçta menüyü gizle
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsMobileMenuOpen(false);
      } else {
        setIsMobileMenuOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className={inter.className}>
      <VillaProvider>
        <div className="flex h-screen overflow-hidden">
          {/* Overlay - Mobilde menü açıkken arka planı karartır */}
          {isMobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}

          {/* Navbar */}
          <div 
            className={`absolute lg:fixed left-0 top-0 h-full bg-navy-800 border-r border-navy-700 z-30 
              transition-all duration-300 transform lg:transform-none
              ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              ${isCollapsed ? 'w-[80px]' : 'w-[280px]'}`}
          >
            <Navbar 
              isCollapsed={isCollapsed}
              setIsCollapsed={setIsCollapsed}
              isMobileMenuOpen={isMobileMenuOpen}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
            />
          </div>

          {/* Ana İçerik */}
          <div 
            className={`flex-1 overflow-auto transition-all duration-300
              ${isCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[280px]'}`}
          >
            {children}
          </div>
        </div>
      </VillaProvider>
    </div>
  );
}