"use client";

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

export default function MapPicker({ onLocationSelect, initialLat = 36.1993, initialLng = 29.6397 }: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [searchBox, setSearchBox] = useState<HTMLInputElement | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string>('');

  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly',
      libraries: ['places']
    });

    loader.load().then(() => {
      if (mapRef.current) {
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat: initialLat, lng: initialLng },
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        });

        const markerInstance = new google.maps.Marker({
          position: { lat: initialLat, lng: initialLng },
          map: mapInstance,
          draggable: true
        });

        setMap(mapInstance);
        setMarker(markerInstance);

        // Marker sürüklendiğinde
        markerInstance.addListener('dragend', () => {
          const position = markerInstance.getPosition();
          if (position) {
            onLocationSelect(position.lat(), position.lng());
            // Adres bilgisini güncelle
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: position }, (results, status) => {
              if (status === 'OK' && results?.[0]) {
                setSelectedAddress(results[0].formatted_address);
              }
            });
          }
        });

        // Haritaya tıklandığında
        mapInstance.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            markerInstance.setPosition(e.latLng);
            onLocationSelect(e.latLng.lat(), e.latLng.lng());
            // Adres bilgisini güncelle
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: e.latLng }, (results, status) => {
              if (status === 'OK' && results?.[0]) {
                setSelectedAddress(results[0].formatted_address);
              }
            });
          }
        });
      }
    });
  }, [initialLat, initialLng, onLocationSelect]);

  useEffect(() => {
    if (map && !autocomplete && searchBox) {
      const autocompleteInstance = new google.maps.places.Autocomplete(searchBox, {
        types: ['address'],
        componentRestrictions: { country: 'tr' }
      });

      autocompleteInstance.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace();
        if (place.geometry && place.geometry.location && marker) {
          marker.setPosition(place.geometry.location);
          map.setCenter(place.geometry.location);
          onLocationSelect(place.geometry.location.lat(), place.geometry.location.lng());
          setSelectedAddress(place.formatted_address || '');
        }
      });

      setAutocomplete(autocompleteInstance);
    }
  }, [map, searchBox, autocomplete, onLocationSelect, marker]);

  return (
    <div className="space-y-4">
      {/* Adres arama kutusu */}
      <div className="relative">
        <input
          type="text"
          ref={(el) => setSearchBox(el)}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Adres ara..."
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Seçili adres gösterimi */}
      {selectedAddress && (
        <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
          <span className="font-medium">Seçili Adres:</span> {selectedAddress}
        </div>
      )}

      {/* Harita */}
      <div 
        ref={mapRef} 
        className="w-full h-[400px] rounded-lg overflow-hidden border border-gray-200"
      />
    </div>
  );
} 