"use client";
import { Villa } from "@/types/villa";
import { useState, useEffect } from "react";
import ImageUpload from "./ImageUpload";
import { currencies, CurrencyCode } from '@/utils/currency';
import { useVilla } from '@/store/VillaContext';
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { Editor } from '@tinymce/tinymce-react';
import MapPicker from './MapPicker';



// Villa özellikleri listesi
const villaFeatures = [
  { id: 'Balayı Villası', label: 'Balayı Villası', icon: '❤️' },
  { id: 'Çocuk Havuzu', label: 'Çocuk Havuzu', icon: '🧒' },
  { id: 'Deniz Manzaralı', label: 'Deniz Manzaralı', icon: '🌊' },
  { id: 'Korunaklı & Özel', label: 'Korunaklı & Özel', icon: '🔒' },
  { id: 'Kış Aylarına Uygun', label: 'Kış Aylarına Uygun', icon: '❄️' },
  { id: 'Evcil Hayvan Dostu', label: 'Evcil Hayvan Dostu', icon: '🐾' },
  { id: 'Sonsuzluk Havuzu', label: 'Sonsuzluk Havuzu', icon: '🏊' },
  { id: 'Jakuzi', label: 'Jakuzi', icon: '💦' },
  { id: 'Doğa Manzaralı', label: 'Doğa Manzaralı', icon: '🌳' },
  { id: 'Apart', label: 'Apart', icon: '🏙️' }
];

// Konum seçenekleri
const locations = [
  "Kaş, Antalya",
  "Kalkan, Antalya",
  "Fethiye, Muğla",
  "Demre, Antalya"
];

interface VillaFormProps {
  onSubmit: (villa: Omit<Villa, "id">) => void;
  onCancel: () => void;
  initialData?: Villa; // Düzenleme için mevcut villa verisi
  isEdit?: boolean;
}

const defaultFormData: Omit<Villa, "id"> = {
  name: "",
  originalName: "",
  code: "",
  description: "",
  price: 0,
  currency: 'TRY',
  images: [],
  features: [],
  location: "",
  bedrooms: 1,
  bathrooms: 1,
  maxGuests: 2,
  ownerName: "",
  identityNumber: "",
  phoneNumber: "",
  ibanOwner: "",
  ibanNumber: "",
  email: "",
  tourismLicenseNumber: "",
  minStayDays: 1,
  distances: {
    miniMarket: 0,
    restaurant: 0,
    publicTransport: 0,
    beach: 0,
    airport: 0,
    cityCenter: 0
  },
  mapLink: "",
  seasonalPrices: [],
  rating: 0,
  reviewCount: 0,
  amenities: [],
  size: "",
  tags: [],
  discount: "",
  isActive: false,
  isFeatured: false,
  lat: 36.1993,
  lng: 29.6397,
};

// TinyMCE için ayar

// API anahtarını .env dosyasından alıyoruz


export default function VillaForm({ onSubmit, onCancel, initialData}: VillaFormProps) {
  const { villas, loading } = useVilla();
  const [formData, setFormData] = useState<Omit<Villa, "id">>(defaultFormData);
  const [activeTab, setActiveTab] = useState('details');
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...defaultFormData,
        ...initialData,
        name: initialData.name || "",
        originalName: initialData.originalName || "",
        code: initialData.code || "",
        description: initialData.description || "",
        ownerName: initialData.ownerName || "",
        identityNumber: initialData.identityNumber || "",
        phoneNumber: initialData.phoneNumber || "",
        ibanOwner: initialData.ibanOwner || "",
        ibanNumber: initialData.ibanNumber || "",
        email: initialData.email || "",
        tourismLicenseNumber: initialData.tourismLicenseNumber || "",
        mapLink: initialData.mapLink || "",
        size: initialData.size || "",
        discount: initialData.discount || "",
        amenities: initialData.amenities || [],
        seasonalPrices: initialData.seasonalPrices || [],
        tags: initialData.tags || [],
        price: initialData.price || 0,
        rating: initialData.rating || 0,
        reviewCount: initialData.reviewCount || 0,
        bedrooms: initialData.bedrooms || 1,
        bathrooms: initialData.bathrooms || 1,
        maxGuests: initialData.maxGuests || 2,
        minStayDays: initialData.minStayDays || 1,
        distances: {
          miniMarket: initialData.distances?.miniMarket || 0,
          restaurant: initialData.distances?.restaurant || 0,
          publicTransport: initialData.distances?.publicTransport || 0,
          beach: initialData.distances?.beach || 0,
          airport: initialData.distances?.airport || 0,
          cityCenter: initialData.distances?.cityCenter || 0
        },
        features: initialData.features || [],
        currency: initialData.currency || 'TRY',
        images: initialData.images || [],
        isActive: initialData.isActive || false,
        isFeatured: initialData.isFeatured || false,
        lat: initialData.lat || 36.1993,
        lng: initialData.lng || 29.6397,
      });
      setImages(initialData.images || []);
    }
  }, [initialData]);

  if (loading) return <div>Yükleniyor...</div>;
  if (!villas) return <div>Veri bulunamadı</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        images,
        price: Number(formData.price),
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        maxGuests: Number(formData.maxGuests),
        minStayDays: Number(formData.minStayDays),
        distances: formData.distances || {
          miniMarket: 0,
          restaurant: 0,
          publicTransport: 0,
          beach: 0,
          airport: 0,
          cityCenter: 0
        }
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Form gönderme hatası:', error);
      alert('Villa kaydedilirken bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  

  const handleDistanceChange = (field: keyof NonNullable<Villa['distances']>, value: number) => {
    setFormData(prev => ({
      ...prev,
      distances: {
        ...(prev.distances || {
          miniMarket: 0,
          restaurant: 0,
          publicTransport: 0,
          beach: 0,
          airport: 0,
          cityCenter: 0
        }),
        [field]: value
      }
    }));
  };

  const toggleFeature = (featureId: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(f => f !== featureId)
        : [...prev.features, featureId],
      tags: prev.features.includes(featureId)
        ? prev.tags.filter(t => t !== featureId)
        : [...prev.tags, featureId]
    }));
  };

  const TabButton = ({ id, label }: { id: string; label: string }) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
        ${activeTab === id
          ? 'bg-blue-100 text-blue-600'
          : 'text-gray-600 hover:bg-gray-50'
        }`}
    >
      {label}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tab Navigation - Mobile'da yatay scroll */}
      <div className="sticky top-0 -mt-4 -mx-4 md:-mx-6 px-4 md:px-6 pb-4 bg-white z-10">
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2 p-1 bg-gray-50 rounded-lg min-w-max">
            <TabButton id="details" label="Villa Detayları" />
            <TabButton id="owner" label="Kullanıcı Bilgileri" />
            <TabButton id="distances" label="Konum Mesafe" />
            <TabButton id="features" label="Özellikler" />
            <TabButton id="images" label="Fotoğraflar" />
            <TabButton id="amenities" label="Özellikler ve İmkanlar" />
          </div>
        </div>
      </div>

      {/* Form içeriği */}
      <div className="space-y-6">
        {/* Details Tab */}
        <div className={activeTab === 'details' ? 'block' : 'hidden'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Villa Kodu</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => {
                  const code = e.target.value;
                  setFormData({ 
                    ...formData, 
                    code,
                    name: code ? `Kaşvillanız - ${code}` : "", // Villa koduna göre otomatik isim oluştur
                    originalName: formData.originalName || formData.name // Mevcut orjinal ismi koru
                  });
                }}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                required
                placeholder="Örn: 1, 2, 3..."
              />
              <p className="text-sm text-gray-500">
                Villa kodu girildiğinde otomatik olarak &quot;Kaşvillanız - {formData.code}&quot; şeklinde isim oluşturulacak
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Villa Adı</label>
              <input
                type="text"
                value={formData.name}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                disabled
                placeholder="Villa kodu girildiğinde otomatik oluşturulacak"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Orjinal Villa İsmi</label>
              <input
                type="text"
                value={formData.originalName}
                onChange={(e) => setFormData({ ...formData, originalName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                required
                placeholder="Villanın gerçek ismi"
              />
              <p className="text-sm text-gray-500">
                Villa adı değiştirildiğinde bu alan otomatik güncellenir
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Konum</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                required
              >
                <option value="">Konum Seçin</option>
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Villa Büyüklüğü</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full pl-4 pr-16 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  placeholder="350"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500">
                  m²
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">İndirim</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  className="w-full pl-4 pr-16 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  placeholder="$15"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Değerlendirme Puanı</label>
              <input
                type="number"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                min="0"
                max="5"
                step="0.1"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Değerlendirme Sayısı</label>
              <input
                type="number"
                value={formData.reviewCount}
                onChange={(e) => setFormData({ ...formData, reviewCount: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Gecelik Fiyat</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full pl-4 pr-24 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                    required
                    min="0"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        currency: e.target.value as CurrencyCode 
                      }))}
                      className="h-full rounded-r-lg border-0 bg-blue-600 hover:bg-blue-700 py-0 pl-3 pr-8 
                        text-white font-medium focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors
                        text-sm appearance-none [&>option]:bg-white [&>option]:text-gray-700"
                      style={{
                        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.5rem center',
                        backgroundSize: '1rem'
                      }}
                    >
                      {Object.entries(currencies).map(([code, currency]) => (
                        <option 
                          key={code} 
                          value={code}
                          className="font-medium py-2 px-3 hover:bg-blue-50 cursor-pointer"
                          style={{
                            backgroundColor: 'white',
                            color: '#374151'
                          }}
                        >
                          {currency.symbol} {code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Seçili para birimi: {currencies[formData.currency as CurrencyCode].name}
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Yatak Odası</label>
                  <select
                    value={formData.bedrooms}
                    onChange={(e) => setFormData({ ...formData, bedrooms: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  >
                    {[1,2,3,4,5,6].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Banyo</label>
                  <select
                    value={formData.bathrooms}
                    onChange={(e) => setFormData({ ...formData, bathrooms: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  >
                    {[1,2,3,4,5].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Max Misafir</label>
                  <select
                    value={formData.maxGuests}
                    onChange={(e) => setFormData({ ...formData, maxGuests: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  >
                    {[2,4,6,8,10,12].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📅</span>
                    Minimum Kiralama Süresi
                  </div>
                </label>
                <select
                  value={formData.minStayDays}
                  onChange={(e) => setFormData({ ...formData, minStayDays: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                >
                  {[1,2,3,4,5,6,7].map(num => (
                    <option key={num} value={num}>{num} Gece</option>
                  ))}
                </select>
                <p className="text-sm text-gray-500">
                  Villada minimum kaç gece konaklama yapılabileceğini seçin
                </p>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700">Açıklama</label>
              <Editor
                apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                value={formData.description}
                onEditorChange={(content: string) => setFormData({ ...formData, description: content })}
                init={{
                  height: 400,
                  menubar: false,
                  plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                    'preview', 'searchreplace', 'visualblocks', 'fullscreen',
                    'insertdatetime', 'table', 'wordcount'
                  ],
                  toolbar: 'undo redo | formatselect | ' +
                    'bold italic underline | forecolor backcolor | alignleft aligncenter ' +
                    'alignright alignjustify | bullist numlist outdent indent | ' +
                    'removeformat | help',
                  content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                  // language ayarlarını kaldırdık
                  // ... diğer ayarlar aynı kalacak ...
                }}
              />
              <p className="text-sm text-gray-500 mt-2">
                Villa açıklamasını zengin metin formatında düzenleyebilirsiniz
              </p>
            </div>

            <div className="col-span-1 md:col-span-2 space-y-2">
              <label className="flex items-center gap-4 mb-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Villa Durumu</div>
                  <div className="text-sm text-gray-500">
                    Villa aktif olduğunda sitede görüntülenecektir
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, isActive: checked }))
                    }
                    className="data-[state=checked]:bg-green-500"
                  />
                  <span className="text-sm text-gray-600">
                    {formData.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Öne Çıkan Villa</div>
                  <div className="text-sm text-gray-500">
                    Villa ana sayfada öne çıkan villalar arasında gösterilecektir
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, isFeatured: checked }))
                    }
                    className="data-[state=checked]:bg-yellow-500"
                  />
                  <span className="text-sm text-gray-600">
                    {formData.isFeatured ? 'Öne Çıkan' : 'Normal'}
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Yeni Owner Tab */}
        <div className={activeTab === 'owner' ? 'block' : 'hidden'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">İsim Soyisim</label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">T.C. Kimlik Numarası</label>
              <input
                type="text"
                value={formData.identityNumber}
                onChange={(e) => setFormData({ ...formData, identityNumber: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Telefon Numarası</label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">İban Sahibi</label>
              <input
                type="text"
                value={formData.ibanOwner}
                onChange={(e) => setFormData({ ...formData, ibanOwner: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">İban No</label>
              <input
                type="text"
                value={formData.ibanNumber}
                onChange={(e) => setFormData({ ...formData, ibanNumber: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Email Adresi</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  Turizm İşletme Belgesi
                </div>
              </label>
              <input
                type="text"
                value={formData.tourismLicenseNumber}
                onChange={(e) => setFormData({ ...formData, tourismLicenseNumber: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                required
                placeholder="TR-2023-..."
              />
              <p className="text-sm text-gray-500">
                Turizm işletme belge numarasını giriniz
              </p>
            </div>
          </div>
        </div>

        {/* Yeni Distances Tab */}
        <div className={activeTab === 'distances' ? 'block' : 'hidden'}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Google Maps Picker */}
            <div className="col-span-1 md:col-span-2 space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📍</span>
                  Villa Konumu
                </div>
              </label>
              <MapPicker
                onLocationSelect={(lat, lng) => {
                  setFormData(prev => ({
                    ...prev,
                    lat,
                    lng,
                    mapLink: `https://www.google.com/maps?q=${lat},${lng}`
                  }));
                }}
                initialLat={formData.lat}
                initialLng={formData.lng}
              />
              <p className="text-sm text-gray-500">
                Haritada villanın konumunu seçin veya marker&apos;ı sürükleyerek konumu güncelleyin
              </p>
            </div>

            {/* Mini Market */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏪</span>
                  Mini Market
                </div>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.distances?.miniMarket || 0}
                  onChange={(e) => handleDistanceChange('miniMarket', Number(e.target.value))}
                  className="w-full pl-4 pr-16 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  min="0"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500">
                  metre
                </div>
              </div>
            </div>

            {/* Restaurant */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🍽️</span>
                  Restaurant
                </div>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.distances?.restaurant || 0}
                  onChange={(e) => handleDistanceChange('restaurant', Number(e.target.value))}
                  className="w-full pl-4 pr-16 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  min="0"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500">
                  metre
                </div>
              </div>
            </div>

            {/* Toplu Taşıma */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🚌</span>
                  Toplu Taşıma
                </div>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.distances?.publicTransport || 0}
                  onChange={(e) => handleDistanceChange('publicTransport', Number(e.target.value))}
                  className="w-full pl-4 pr-16 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  min="0"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500">
                  metre
                </div>
              </div>
            </div>

            {/* Deniz */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏖️</span>
                  Deniz
                </div>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.distances?.beach || 0}
                  onChange={(e) => handleDistanceChange('beach', Number(e.target.value))}
                  className="w-full pl-4 pr-16 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  min="0"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500">
                  metre
                </div>
              </div>
            </div>

            {/* Havaalanı */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✈️</span>
                  Havaalanı
                </div>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.distances?.airport || 0}
                  onChange={(e) => handleDistanceChange('airport', Number(e.target.value))}
                  className="w-full pl-4 pr-16 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  min="0"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500">
                  metre
                </div>
              </div>
            </div>

            {/* En yakın Merkez */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏙️</span>
                  En yakın Merkez
                </div>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.distances?.cityCenter || 0}
                  onChange={(e) => handleDistanceChange('cityCenter', Number(e.target.value))}
                  className="w-full pl-4 pr-16 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                  min="0"
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-500">
                  metre
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Tab */}
        <div className={activeTab === 'features' ? 'block' : 'hidden'}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {villaFeatures.map((feature) => (
              <button
                key={feature.id}
                type="button"
                onClick={() => toggleFeature(feature.id)}
                className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-colors w-full
                  ${(formData.features.includes(feature.id) || formData.tags.includes(feature.id))
                    ? 'bg-blue-50 text-blue-600 border border-blue-200'
                    : 'border border-gray-200 hover:bg-gray-50'
                  }`}
              >
                <span className="text-lg">{feature.icon}</span>
                <span className="flex-1 text-left">{feature.label}</span>
                {(formData.features.includes(feature.id) || formData.tags.includes(feature.id)) && (
                  <span className="text-blue-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Images Tab */}
        <div className={activeTab === 'images' ? 'block' : 'hidden'}>
          <ImageUpload
            images={images}
            onChange={setImages}
          />
        </div>

        {/* Yeni amenities tab içeriği */}
        <div className={activeTab === 'amenities' ? 'block' : 'hidden'}>
          <div className="space-y-4">
            {(formData.amenities || []).map((amenity, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={amenity.icon}
                    onChange={(e) => {
                      const newAmenities = [...(formData.amenities || [])];
                      newAmenities[index].icon = e.target.value;
                      setFormData({ ...formData, amenities: newAmenities });
                    }}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                    placeholder="Icon (wifi, pool, etc.)"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={amenity.name}
                    onChange={(e) => {
                      const newAmenities = [...(formData.amenities || [])];
                      newAmenities[index].name = e.target.value;
                      setFormData({ ...formData, amenities: newAmenities });
                    }}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                    placeholder="Name"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newAmenities = (formData.amenities || []).filter((_, i) => i !== index);
                    setFormData({ ...formData, amenities: newAmenities });
                  }}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Sil
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setFormData({
                  ...formData,
                  amenities: [...(formData.amenities || []), { icon: '', name: '' }]
                });
              }}
              className="w-full px-4 py-2.5 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              + Yeni Özellik Ekle
            </button>
          </div>
        </div>
      </div>

      {/* Form Actions - Sticky Bottom */}
      <div className="sticky bottom-0 -mx-4 md:-mx-6 px-4 md:px-6 py-4 bg-white border-t mt-6">
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting 
              ? (initialData ? 'Güncelleniyor...' : 'Ekleniyor...') 
              : (initialData ? 'Güncelle' : 'Villa Ekle')
            }
          </button>
        </div>
      </div>
    </form>
  );
} 