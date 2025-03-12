import { getUser } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Veritabanı bağlantı testi
prisma.$connect()
  .then(() => console.log('Veritabanı bağlantısı başarılı'))
  .catch((error) => console.error('Veritabanı bağlantı hatası:', error));

// Error tipi için interface
interface ErrorWithDetails {
  name?: string;
  message?: string;
  stack?: string;
}

export async function GET(request: Request) {
  console.log('GET isteği başladı');
  try {
    const user = await getUser();
    console.log('Kullanıcı bilgisi:', user);
    
    if (!user || !user.userId) {
      console.log('Kullanıcı yetkisiz');
      return new Response(
        JSON.stringify({ error: 'Yetkisiz erişim' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') || 'default';
    console.log('Session ID:', sessionId);

    console.log('Prisma sorgusu başlıyor...');
    try {
      const messages = await prisma.chatMessage.findMany({
        where: {
          userId: user.userId,
          sessionId: sessionId
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      console.log('Bulunan mesaj sayısı:', messages.length);
      if (messages.length > 0) {
        console.log('İlk mesaj örneği:', messages[0]);
      } else {
        console.log('Hiç mesaj bulunamadı');
      }

      // Mesajları dönüştür
      const formattedMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt
      }));

      console.log('Yanıt dönülüyor...');
      return new Response(
        JSON.stringify(formattedMessages),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );

    } catch (dbError) {
      const error = dbError as ErrorWithDetails;
      console.error('Veritabanı hatası:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });

      return new Response(
        JSON.stringify({
          error: 'Veritabanı hatası',
          details: error instanceof Error ? error.message : 'Bilinmeyen hata'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (catchError) {
    const error = catchError as ErrorWithDetails;
    console.error('Genel hata:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });

    return new Response(
      JSON.stringify({
        error: 'Chat geçmişi alınamadı',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function POST(request: Request) {
  console.log('POST isteği başladı');
  try {
    const user = await getUser();
    console.log('Kullanıcı bilgisi:', user);

    if (!user || !user.userId) {
      console.log('Kullanıcı yetkisiz veya userId yok');
      return new Response(
        JSON.stringify({ error: 'Yetkisiz erişim' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { messages, sessionId } = await request.json();
    console.log('Gelen istek:', { sessionId, messageCount: messages?.length });
    
    // Önceki chat geçmişini al
    const chatHistory = await prisma.chatMessage.findMany({
      where: {
        userId: user.userId,
        sessionId: sessionId || 'default'
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log('Chat geçmişi bulundu, mesaj sayısı:', chatHistory.length);

    // Chat geçmişini OpenAI formatına dönüştür
    const previousMessages = chatHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));
    
    // Villa verilerini getir
    const villas = await prisma.villa.findMany({
      include: {
        seasonalPrices: true,
        bookings: {
          where: {
            NOT: {
              status: 'cancelled'
            }
          }
        }
      }
    });

    // Sistem mesajını güncelle
    const systemMessage = {
      role: "system",
      content: `Sen bir villa yönetim asistanısın. Villa bilgileri ve rezervasyon konusunda yardımcı olursun.

      1. Villa Bilgileri Gösterimi:
      <div class="villa-card">
        <div class="villa-header">
          <h3 class="villa-name">🏠 [Villa Adı]</h3>
          <span class="villa-location">📍 [Konum]</span>
        </div>
        
        <div class="villa-details">
          <div class="detail-row">
            <div class="detail-item">
              <span class="icon">💰</span>
              <span>Fiyat: [fiyat] [para birimi]</span>
            </div>
            <div class="detail-item">
              <span class="icon">👥</span>
              <span>Maksimum: [kişi sayısı] kişi</span>
            </div>
          </div>
          
          <div class="detail-row">
            <div class="detail-item">
              <span class="icon">🛏️</span>
              <span>[yatak odası] Yatak Odası</span>
            </div>
            <div class="detail-item">
              <span class="icon">🚿</span>
              <span>[banyo] Banyo</span>
            </div>
          </div>
        </div>

        <div class="villa-features">
          <h4>✨ Özellikler</h4>
          <div class="features-grid">
            [Her özellik için: <span class="feature-item">�� [özellik]</span>]
          </div>
        </div>

        <div class="villa-amenities">
          <h4>🎯 Olanaklar</h4>
          <div class="amenities-grid">
            [Her olanak için: <span class="amenity-item">✓ [olanak]</span>]
          </div>
        </div>

        <div class="villa-distances">
          <h4>📍 Mesafeler</h4>
          <div class="distances-grid">
            <span>🏖️ Plaj: [mesafe]</span>
            <span>🏪 Market: [mesafe]</span>
            <span>🌆 Merkez: [mesafe]</span>
          </div>
        </div>

        <div class="villa-actions">
          <a href="[harita linki]" target="_blank" class="map-link">
            📍 Haritada Gör
          </a>
        </div>
      </div>

      2. Rezervasyon İşlemleri:
      Rezervasyon yapmak isteyen kullanıcılar için şu adımları izle:

      a) Önce müsaitlik kontrolü yap ve şu formatta göster:
      <div class="availability-check">
        <h4>🗓️ Müsaitlik Durumu</h4>
        <div class="status \${isAvailable ? 'available' : 'unavailable'}">
          <span class="icon">\${isAvailable ? '✅' : '❌'}</span>
          <span class="dates">[tarih aralığı] için \${isAvailable ? 'müsait' : 'müsait değil'}</span>
        </div>
      </div>

      b) Müsait ise, rezervasyon formunu göster:
      <div class="booking-form">
        <h4>📝 Rezervasyon Bilgileri</h4>
        <div class="form-fields">
          <div class="form-field">
            <label>📅 Giriş Tarihi:</label>
            <input type="date" name="checkIn" required>
          </div>
          <div class="form-field">
            <label>📅 Çıkış Tarihi:</label>
            <input type="date" name="checkOut" required>
          </div>
          <div class="form-field">
            <label>👥 Misafir Sayısı:</label>
            <input type="number" name="guests" min="1" required>
          </div>
          <div class="form-field">
            <label>👤 İletişim Bilgileri:</label>
            <input type="text" name="contactName" placeholder="Ad Soyad" required>
            <input type="email" name="contactEmail" placeholder="E-posta" required>
            <input type="tel" name="contactPhone" placeholder="Telefon" required>
          </div>
          <button class="submit-booking" onclick="createBooking()">
            ✅ Rezervasyon Yap
          </button>
        </div>
      </div>

      c) Rezervasyon onayı için:
      <div class="booking-confirmation">
        <h4>✅ Rezervasyon Onayı</h4>
        <div class="confirmation-details">
          <p>Villa: [villa adı]</p>
          <p>Tarih: [giriş] - [çıkış]</p>
          <p>Misafir: [misafir sayısı] kişi</p>
          <p>Toplam: [fiyat] [para birimi]</p>
        </div>
      </div>

      Önemli Kurallar:
      1. Her zaman HTML şablonlarını kullan
      2. Müsaitlik kontrolünü doğru yap
      3. Fiyat hesaplamalarını sezonluk fiyatlara göre yap
      4. Maksimum misafir sayısını kontrol et
      5. Minimum konaklama süresini kontrol et
      6. Rezervasyon çakışmalarını kontrol et

      Mevcut villa verileri:
      ${JSON.stringify(villas, null, 2)}

      Kullanıcı rezervasyon yapmak istediğinde:
      1. Önce müsaitlik kontrolü yap
      2. Müsait ise rezervasyon formunu göster
      3. Değilse alternatif tarihler öner
      4. Fiyat bilgisini net olarak belirt
      5. Özel istekleri not al

      Cevaplarını her zaman bu HTML şablonlarını kullanarak ver ve görsel olarak zenginleştir.`
    };

    // Tüm mesajları birleştir: sistem mesajı + geçmiş mesajlar + yeni mesaj
    const allMessages = [
      systemMessage,
      ...previousMessages,
      ...messages
    ];

    console.log('OpenAI isteği gönderiliyor, toplam mesaj sayısı:', allMessages.length);
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: allMessages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const assistantMessage = completion.choices[0].message;
    console.log('AI yanıtı alındı:', {
      role: assistantMessage?.role,
      content: assistantMessage?.content?.substring(0, 100) + '...'
    });

    if (!assistantMessage || !assistantMessage.content) {
      throw new Error('AI yanıtı alınamadı veya geçersiz');
    }

    console.log('Mesajlar kaydediliyor, userId:', user.userId);
    const lastUserMessage = messages[messages.length - 1];
    
    try {
      await prisma.$transaction([
        prisma.chatMessage.create({
          data: {
            role: 'user',
            content: lastUserMessage.content,
            sessionId: sessionId || 'default',
            user: {
              connect: {
                id: user.userId
              }
            }
          }
        }),
        prisma.chatMessage.create({
          data: {
            role: 'assistant',
            content: assistantMessage.content,
            sessionId: sessionId || 'default',
            user: {
              connect: {
                id: user.userId
              }
            }
          }
        })
      ]);
      
      console.log('Mesajlar başarıyla kaydedildi');
      
      const response = {
        message: {
          role: assistantMessage.role,
          content: assistantMessage.content
        }
      };
      
      return new Response(
        JSON.stringify(response),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );

    } catch (dbError) {
      const error = dbError as ErrorWithDetails;
      console.log('Veritabanı kayıt hatası:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n')[0],
        userId: user.userId
      });

      return new Response(
        JSON.stringify({
          error: 'Mesajlar kaydedilemedi',
          details: error instanceof Error ? error.message : 'Veritabanı hatası'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (catchError) {
    const error = catchError as ErrorWithDetails;
    console.log('Genel hata:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n')[0]
    });

    return new Response(
      JSON.stringify({
        error: 'İstek işlenirken bir hata oluştu',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 