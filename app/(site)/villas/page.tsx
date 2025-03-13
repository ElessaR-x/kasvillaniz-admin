"use client";
import { Villa } from "@/types/villa";
import VillaCard from "@/components/VillaCard";
import { useState, useEffect } from "react";
import { IconSearch } from "@/components/Icons";
import Modal from "@/components/Modal";
import VillaForm from "@/components/VillaForm";
import { SortOption } from "@/components/SearchFilters";



export default function VillasPage() {
  const [villas, setVillas] = useState<Villa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVilla, setSelectedVilla] = useState<Villa | null>(null);

  // Villaları getir
  const fetchVillas = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/villas');
      if (!response.ok) {
        throw new Error('Villalar alınırken bir hata oluştu');
      }
      const data = await response.json();
      setVillas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      console.error('Villa getirme hatası:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVillas();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu villayı silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/villas/${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Villa silinirken bir hata oluştu');
        }

        // Başarılı silme işleminden sonra listeyi güncelle
        setVillas(prevVillas => prevVillas.filter(villa => villa.id !== id));
        alert('Villa başarıyla silindi!');
      } catch (err) {
        console.error('Villa silme hatası:', err);
        alert('Villa silinirken bir hata oluştu!');
      }
    }
  };

  const handleEdit = async (id: string) => {
    try {
      const response = await fetch(`/api/villas/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Villa detayları alınamadı');
      }

      // Villaları güncelle
      setVillas(prevVillas => 
        prevVillas.map(villa => 
          villa.id === id ? data : villa
        )
      );

      // Modal'ı aç ve seçili villayı güncelle
      setSelectedVilla(data);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Villa detay hatası:', err);
      alert(err instanceof Error ? err.message : 'Villa detayları alınırken bir hata oluştu!');
    }
  };

  const handleSubmit = async (villaData: Omit<Villa, "id">) => {
    try {
      const url = selectedVilla 
        ? `/api/villas/${selectedVilla.id}` 
        : '/api/villas';
      
      const method = selectedVilla ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(villaData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Villa işlemi başarısız oldu');
      }

      // Villa listesini güncelle
      await fetchVillas(); // Tüm listeyi yeniden çek

      setIsModalOpen(false);
      setSelectedVilla(null);
      
      alert(selectedVilla ? 'Villa başarıyla güncellendi!' : 'Villa başarıyla eklendi!');
    } catch (err) {
      console.error('Villa işlem hatası:', err);
      alert(err instanceof Error ? err.message : 'İşlem sırasında bir hata oluştu!');
    }
  };

  const filteredVillas = villas
    .filter(villa => {
      if (!villa) return false;

      return (
        villa.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        villa.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (villa.originalName?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (!a || !b) return 0;

      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "status":
          return (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0);
        default:
          return 0;
      }
    });

  // Yeni villa ekleme modalını açma fonksiyonu
  const handleAddNewVilla = () => {
    setSelectedVilla(null); // Seçili villa'yı temizle
    setIsModalOpen(true);   // Modal'ı aç
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  function handleCalendar(): void {
    throw new Error("Function not implemented.");
  }

  // Render JSX aynı kalacak...
  return (
    <div className="h-full flex flex-col">
      {/* Üst Bar */}
      <div className="sticky top-0 z-20 bg-white border-b w-full">
        <div className="px-4 lg:px-8 py-4">
          <div className="flex flex-col gap-4">
            {/* Arama ve Butonlar */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="relative">
                  <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Villa ara..."
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  />
                </div>
              </div>
              <button 
                onClick={handleAddNewVilla}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap flex-shrink-0"
              >
                + Yeni Villa
              </button>
            </div>

            {/* Sıralama Seçeneği */}
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
              >
                <option value="name-asc">İsim (A-Z)</option>
                <option value="name-desc">İsim (Z-A)</option>
                <option value="price-asc">Fiyat (Düşük-Yüksek)</option>
                <option value="price-desc">Fiyat (Yüksek-Düşük)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Ana İçerik */}
      <div className="flex-1 overflow-auto">
        <div className="flex h-full">
          {/* Villa Listesi */}
          <div className="flex-1 p-4 lg:p-8 overflow-y-auto modern-scrollbar hover-scrollbar">
            <div className="mb-4">
              <p className="text-sm text-gray-500">
                {filteredVillas.length} villa bulundu
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              {filteredVillas.map(villa => (
                villa && ( // Null check ekleyelim
                  <VillaCard
                    key={villa.id}
                    villa={villa}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onCalendar={handleCalendar}
                  />
                )
              ))}
            </div>

            {filteredVillas.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Arama kriterlerinize uygun villa bulunamadı.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedVilla(null);
        }}
        title={selectedVilla ? "Villa Düzenle" : "Yeni Villa Ekle"}
      >
        <VillaForm
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedVilla(null);
          }}
          initialData={selectedVilla || undefined}
          isEdit={!!selectedVilla}
        />
      </Modal>
    </div>
  );
} 