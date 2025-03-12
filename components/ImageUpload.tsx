"use client";
import Image from "next/image";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
}

interface UploadingImage {
  id: string;
  file: File;
  progress: number;
  error?: {
    message: string;
    details?: string;
  };
  status: 'uploading' | 'error' | 'success';
}

const ImageUpload = ({ images, onChange }: ImageUploadProps) => {
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = useCallback(async (file: File, uploadingId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append('file', file);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded * 100) / event.total);
          setUploadingImages(prev => prev.map(img => 
            img.id === uploadingId ? { ...img, progress } : img
          ));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            setUploadingImages(prev => prev.map(img => 
              img.id === uploadingId ? { ...img, progress: 100, status: 'success' } : img
            ));
            resolve(response.url);
          } catch {
            setUploadingImages(prev => prev.map(img => 
              img.id === uploadingId 
                ? { 
                    ...img, 
                    status: 'error',
                    progress: 0,
                    error: {
                      message: 'Sunucu hatası',
                      details: xhr.responseText || 'Beklenmeyen bir hata oluştu'
                    }
                  } 
                : img
            ));
            reject(new Error('Sunucu yanıtı geçersiz'));
          }
        } else {
          try {
            
            setUploadingImages(prev => prev.map(img => 
              img.id === uploadingId 
                ? { 
                    ...img, 
                    status: 'error',
                    progress: 0,
                    error: {
                      message: 'Sunucu hatası',
                      details: xhr.responseText || 'Beklenmeyen bir hata oluştu'
                    }
                  } 
                : img
            ));
            reject(new Error('Sunucu yanıtı geçersiz'));
          } catch {
            reject(new Error('Yükleme başarısız'));
          }
        }
      };

      xhr.onerror = () => {
        setUploadingImages(prev => prev.map(img => 
          img.id === uploadingId 
            ? { 
                ...img, 
                status: 'error',
                progress: 0,
                error: {
                  message: 'Bağlantı hatası',
                  details: 'Sunucuya bağlanırken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin.'
                }
              } 
            : img
        ));
        reject(new Error('Ağ hatası oluştu'));
      };

      xhr.onabort = () => {
        reject(new Error('Yükleme iptal edildi'));
      };

      xhr.open('POST', '/api/upload', true);
      xhr.send(formData);
    });
  }, []);

  const uploadImagesSequentially = useCallback(async (files: File[]) => {
    const results: string[] = [];
    setIsUploading(true);

    for (const file of files) {
      const uploadingImage = {
        id: Math.random().toString(36).substring(7),
        file,
        progress: 0,
        status: 'uploading' as const
      };

      setUploadingImages(prev => [...prev, uploadingImage]);

      try {
        const imageUrl = await uploadImage(file, uploadingImage.id);
        results.push(imageUrl);

        setTimeout(() => {
          setUploadingImages(prev => prev.filter(img => img.id !== uploadingImage.id));
        }, 2000);
      } catch (err) {
        console.error(`Dosya yükleme hatası: ${file.name}`, err);
        continue;
      }
    }

    if (results.length > 0) {
      onChange([...images, ...results]);
    }
    setIsUploading(false);
  }, [images, onChange, uploadImage]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (isUploading) return;
    uploadImagesSequentially(acceptedFiles);
  }, [isUploading, uploadImagesSequentially]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    multiple: true,
    disabled: isUploading
  });

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);

    onChange(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center 
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input {...getInputProps()} />
        {isUploading ? (
          <p className="text-gray-600">Yükleme devam ediyor, lütfen bekleyin...</p>
        ) : (
          <p className="text-gray-600">
            {isDragActive
              ? "Dosyaları buraya bırakın..."
              : "Resim yüklemek için tıklayın veya sürükleyin"}
          </p>
        )}
      </div>

      {/* Yükleme Durumu Göstergeleri */}
      {uploadingImages.length > 0 && (
        <div className="space-y-2">
          {uploadingImages.map((img) => (
            <div key={img.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{img.file.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(img.file.size / (1024 * 1024)).toFixed(2)}MB)
                  </span>
                </div>
                <span className="text-sm text-gray-500">{img.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    img.status === 'error' 
                      ? 'bg-red-500' 
                      : img.status === 'success'
                        ? 'bg-green-500'
                        : 'bg-blue-500'
                  }`}
                  style={{ width: `${img.progress}%` }}
                />
              </div>
              {img.error && (
                <div className="mt-2 text-sm">
                  <p className="text-red-500 font-medium">{img.error.message}</p>
                  {img.error.details && (
                    <p className="text-red-400 text-xs mt-1">{img.error.details}</p>
                  )}
                </div>
              )}
              {img.status === 'success' && (
                <p className="text-green-500 text-sm mt-1">Yükleme başarılı</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Mevcut Resimler */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div
            key={image}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative group aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-move
              ${draggedIndex === index ? 'opacity-50' : ''}`}
          >
            <Image
              src={image}
              alt={`Villa resmi ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => {
                  const newImages = images.filter((_, i) => i !== index);
                  onChange(newImages);
                }}
                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="absolute top-2 left-2 bg-white/80 px-2 py-1 rounded text-sm">
              {index === 0 ? 'Kapak' : `Resim ${index + 1}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageUpload; 