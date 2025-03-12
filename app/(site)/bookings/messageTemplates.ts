import { CalendarEvent } from "@/types/calendar";
import { Villa } from "@/types/villa";
import { formatPrice } from '@/utils/currency';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

type BookingStatus = 'confirmed' | 'pending' | 'blocked' | 'cancelled';

export const messageTemplates: Record<BookingStatus, (booking: CalendarEvent & { villa: Villa }) => string> = {
  confirmed: (booking: CalendarEvent & { villa: Villa }): string => {
    const nights = Math.ceil((new Date(booking.end).getTime() - new Date(booking.start).getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = booking.price * nights;
    const deposit = totalPrice * 0.3;

    return [
      `Sayın ${booking.contactPerson.fullName},`,
      ``,
      `${booking.villaName} villamız için yapmış olduğunuz rezervasyon talebiniz onaylanmıştır.`,
      ``,
      `📋 Rezervasyon Detayları`,
      `----------------------------`,
      `🏠 Villa: ${booking.villaName}`,
      `📍 Konum: ${booking.villaLocation}`,
      `📅 Giriş: ${format(new Date(booking.start), 'd MMMM yyyy', { locale: tr })}`,
      `📅 Çıkış: ${format(new Date(booking.end), 'd MMMM yyyy', { locale: tr })}`,
      `👥 Misafir: ${booking.guests.length} kişi`,
      `💰 Gecelik: ${formatPrice(booking.price, booking.currency)}`,
      `🌙 Toplam Gece: ${nights}`,
      `💶 Toplam Tutar: ${formatPrice(totalPrice, booking.currency)}`,
      ``,
      `💳 Ödeme Bilgileri`,
      `----------------------------`,
      `Hesap Sahibi: ${booking.villa.ibanOwner}`,
      `IBAN: ${booking.villa.ibanNumber}`,
      ``,
      `⚠️ Önemli: Rezervasyonunuzun tamamlanması için ${formatPrice(deposit, booking.currency)} tutarındaki kaparoyu 24 saat içinde ödemeniz gerekmektedir.`,
      ``,
      `İyi tatiller dileriz.`
    ].join('\n');
  },

  pending: (booking: CalendarEvent & { villa: Villa }): string => {
    return [
      `Sayın ${booking.contactPerson.fullName},`,
      ``,
      `${booking.villaName} villamız için yapmış olduğunuz rezervasyon talebiniz şu an değerlendirme aşamasındadır.`,
      ``,
      `📋 Rezervasyon Detayları`,
      `----------------------------`,
      `🏠 Villa: ${booking.villaName}`,
      `📍 Konum: ${booking.villaLocation}`,
      `📅 Giriş: ${format(new Date(booking.start), 'd MMMM yyyy', { locale: tr })}`,
      `📅 Çıkış: ${format(new Date(booking.end), 'd MMMM yyyy', { locale: tr })}`,
      `👥 Misafir: ${booking.guests.length} kişi`,
      ``,
      `En kısa sürede size dönüş yapacağız.`,
      ``,
      `İyi günler dileriz.`
    ].join('\n');
  },

  blocked: (booking: CalendarEvent & { villa: Villa }): string => {
    return [
      `Sayın ${booking.contactPerson.fullName},`,
      ``,
      `${booking.villaName} villamız için yapmış olduğunuz rezervasyon talebi maalesef onaylanamamıştır.`,
      ``,
      `Anlayışınız için teşekkür ederiz.`,
      ``,
      `İyi günler dileriz.`
    ].join('\n');
  },

  cancelled: (booking: CalendarEvent & { villa: Villa }): string => {
    return [
      `Sayın ${booking.contactPerson.fullName},`,
      ``,
      `${booking.villaName} villamız için yapmış olduğunuz rezervasyon iptal edilmiştir.`,
      ``,
      `İyi günler dileriz.`
    ].join('\n');
  }
}; 