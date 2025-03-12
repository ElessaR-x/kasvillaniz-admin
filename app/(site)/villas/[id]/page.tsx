"use client";
import { Villa } from "@/types/villa";
import { useParams } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import Modal from '@/components/Modal';
import VillaForm from '@/components/VillaForm';

export default function VillaPage() {
  const params = useParams();
  const id = params?.id as string;
  const [villa, setVilla] = useState<Villa | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Villa verilerini getir
  useEffect(() => {
    const fetchVilla = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/villas/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Villa detayları alınamadı');
        }

        setVilla(data);
      } catch (err) {
        console.error('Villa detay hatası:', err);
        setError(err instanceof Error ? err.message : 'Villa detayları alınamadı');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchVilla();
    }
  }, [id]);

  const handleEditSubmit = async (updatedVilla: Omit<Villa, "id">) => {
    try {
      const response = await fetch(`/api/villas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedVilla),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Villa güncellenemedi');
      }

      setVilla(data);
      setIsEditModalOpen(false);
      alert('Villa başarıyla güncellendi!');
    } catch (err) {
      console.error('Villa güncelleme hatası:', err);
      alert(err instanceof Error ? err.message : 'Villa güncellenirken bir hata oluştu!');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !villa) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600">{error || 'Villa bulunamadı'}</div>
      </div>
    );
  }

  return (
    <main className="p-8">
      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {villa.images && villa.images.length > 0 ? (
            villa.images.map((image, index) => (
              <div key={index} className="relative w-full h-64">
                <Image
                  src={image}
                  alt={`${villa.name} image ${index + 1}`}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-lg"
                />
              </div>
            ))
          ) : (
            <div className="relative w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Resim bulunamadı</p>
            </div>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{villa.name}</h1>
        <p className="text-gray-600">{villa.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Villa Özellikleri</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Konum</p>
              <p className="font-medium">{villa.location}</p>
            </div>
            <div>
              <p className="text-gray-600">Gecelik Fiyat</p>
              <p className="font-medium">{villa.currency} {villa.price}</p>
            </div>
            <div>
              <p className="text-gray-600">Yatak Odası</p>
              <p className="font-medium">{villa.bedrooms}</p>
            </div>
            <div>
              <p className="text-gray-600">Banyo</p>
              <p className="font-medium">{villa.bathrooms}</p>
            </div>
            <div>
              <p className="text-gray-600">Maksimum Misafir</p>
              <p className="font-medium">{villa.maxGuests}</p>
            </div>
            <div>
              <p className="text-gray-600">Minimum Konaklama</p>
              <p className="font-medium">{villa.minStayDays} gece</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Mesafeler</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Mini Market</p>
              <p className="font-medium">{villa.distances.miniMarket}m</p>
            </div>
            <div>
              <p className="text-gray-600">Restaurant</p>
              <p className="font-medium">{villa.distances.restaurant}m</p>
            </div>
            <div>
              <p className="text-gray-600">Toplu Taşıma</p>
              <p className="font-medium">{villa.distances.publicTransport}m</p>
            </div>
            <div>
              <p className="text-gray-600">Plaj</p>
              <p className="font-medium">{villa.distances.beach}m</p>
            </div>
            <div>
              <p className="text-gray-600">Havalimanı</p>
              <p className="font-medium">{villa.distances.airport}m</p>
            </div>
            <div>
              <p className="text-gray-600">Şehir Merkezi</p>
              <p className="font-medium">{villa.distances.cityCenter}m</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Özellikler</h2>
          <div className="flex flex-wrap gap-2">
            {villa.features.map((feature, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Edit butonu */}
      <div className="flex justify-end mt-8">
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
            />
          </svg>
          Villayı Düzenle
        </button>
      </div>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Villa Düzenle - ${villa.name}`}
      >
        <VillaForm
          initialData={villa}
          onSubmit={handleEditSubmit}
          onCancel={() => setIsEditModalOpen(false)}
          isEdit={true}
        />
      </Modal>
    </main>
  );
}

// Stilleri layout.tsx veya global.css'e taşıyın 