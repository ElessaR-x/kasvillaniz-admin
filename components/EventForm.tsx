"use client";
import { useState } from 'react';
import { CalendarEvent } from '@/types/calendar';

interface EventFormProps {
  villaId: string;
  startDate: Date;
  endDate: Date;
  onSubmit: (event: Omit<CalendarEvent, 'id'>) => void;
  onCancel: () => void;
}

const EventForm = ({ villaId, startDate, endDate, onSubmit, onCancel }: EventFormProps) => {
  const [formData, setFormData] = useState<{
    title: string;
    guestName: string;
    guestCount: number;
    price: number;
    status: CalendarEvent['status'];
  }>({
    title: '',
    guestName: '',
    guestCount: 1,
    price: 0,
    status: 'pending'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      villaId,
      start: startDate,
      end: endDate,
      ...formData,
      currency: 'GBP',
      maxGuests: 0,
      guests: [],
      contactPerson: {
        fullName: '',
        email: '',
        phone: '',
        identityNumber: ''
      },
      villaName: '',
      villaLocation: ''
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Rezervasyon Başlığı</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Misafir Adı</label>
        <input
          type="text"
          value={formData.guestName}
          onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Misafir Sayısı</label>
        <input
          type="number"
          value={formData.guestCount}
          onChange={(e) => setFormData({ ...formData, guestCount: Number(e.target.value) })}
          min="1"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Fiyat ($)</label>
        <input
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
          min="0"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Durum</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as CalendarEvent['status'] })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          required
        >
          <option value="pending">Beklemede</option>
          <option value="confirmed">Onaylı</option>
          <option value="blocked">Müsait Değil</option>
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          İptal
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Kaydet
        </button>
      </div>
    </form>
  );
};

export default EventForm; 