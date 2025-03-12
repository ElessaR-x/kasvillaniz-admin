'use client';

import { useState, useRef, useEffect } from 'react';
import { IconSend, IconBot } from '@/components/Icons';
import { v4 as uuidv4 } from 'uuid';
import DOMPurify from 'dompurify';

// ChatMessage tipini tanımlayalım
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatPage() {
  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
  }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const storedSessionId = localStorage.getItem('chatSessionId');
    const newSessionId = storedSessionId || uuidv4();
    
    if (!storedSessionId) {
      localStorage.setItem('chatSessionId', newSessionId);
    }
    
    setSessionId(newSessionId);
    fetchChatHistory(newSessionId);
  }, []);

  const fetchChatHistory = async (sid: string) => {
    try {
      const response = await fetch(`/api/ai-chat?sessionId=${sid}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.map((msg: ChatMessage) => ({
          role: msg.role,
          content: msg.content
        })));
      }
    } catch (error) {
      console.error('Chat geçmişi alınırken hata:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, newMessage],
          sessionId
        }),
      });

      if (!response.ok) {
        throw new Error('API yanıt hatası');
      }

      const data = await response.json();
      setMessages(prev => [...prev, data.message]);
    } catch (error) {
      console.error('Mesaj gönderilirken hata oluştu:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const suggestions = [
    "4 kişilik, 15-20 Temmuz arası müsait villa var mı?",
    "Havuzlu ve denize yakın villaları gösterir misin?",
    "5000-10000 TL arası fiyata sahip villaları listeler misin?",
    "Önümüzdeki hafta için müsait villaları gösterir misin?",
    "8 kişilik, jakuzili villa önerir misin?"
  ];

  // Yeni özellik: Yeni oturum başlatma
  const startNewSession = () => {
    const newSessionId = uuidv4();
    localStorage.setItem('chatSessionId', newSessionId);
    setSessionId(newSessionId);
    setMessages([]);
  };

  // Yeni özellik: Mesajları temizleme
  const clearMessages = () => {
    if (window.confirm('Tüm mesaj geçmişini silmek istediğinize emin misiniz?')) {
      setMessages([]);
      startNewSession();
    }
  };

  // HTML içeriğini güvenli bir şekilde render eden bileşen
  const SafeHTML = ({ content }: { content: string }) => {
    const sanitizedContent = DOMPurify.sanitize(content);
    return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
  };

  // Mesaj bileşenini güncelle
  const Message = ({ message }: { message: { role: string; content: string } }) => (
    <div
      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
    >
      {message.role === 'assistant' && (
        <div className="w-8 h-8 rounded-full bg-navy-600/10 flex items-center justify-center flex-shrink-0">
          <IconBot className="w-5 h-5 text-navy-600" />
        </div>
      )}
      <div
        className={`group relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 ${
          message.role === 'user'
            ? 'bg-navy-600 text-white rounded-br-none'
            : 'bg-gray-100 text-gray-900 rounded-bl-none'
        }`}
      >
        {message.role === 'assistant' ? (
          <SafeHTML content={message.content} />
        ) : (
          <div className="whitespace-pre-wrap text-sm sm:text-base">
            {message.content}
          </div>
        )}
      </div>
    </div>
  );

  // BookingData arayüzünü tanımlayalı


  // Stil tanımlamalarına eklemeler
  const styles = `
    .villa-card {
      @apply bg-white rounded-lg shadow-md p-4 mb-4;
    }
    .villa-name {
      @apply text-lg font-semibold text-navy-600 mb-3;
    }
    .villa-details {
      @apply space-y-2 mb-4;
    }
    .detail-item {
      @apply flex items-center gap-2 text-gray-600;
    }
    .icon {
      @apply text-lg;
    }
    .features {
      @apply mt-4;
    }
    .features h4 {
      @apply font-medium text-gray-700 mb-2;
    }
    .features ul {
      @apply list-disc list-inside text-gray-600;
    }
    .distances {
      @apply mt-4;
    }
    .distances h4 {
      @apply font-medium text-gray-700 mb-2;
    }
    .distances ul {
      @apply space-y-1 text-gray-600;
    }
    .availability-check {
      @apply bg-white rounded-lg p-4 mb-4 border border-gray-200;
    }
    .status.available {
      @apply text-green-600;
    }
    .status.unavailable {
      @apply text-red-600;
    }
    .booking-form {
      @apply bg-white rounded-lg p-4 mb-4 border border-gray-200;
    }
    .form-fields {
      @apply space-y-4;
    }
    .form-field {
      @apply flex flex-col gap-2;
    }
    .form-field label {
      @apply text-sm font-medium text-gray-700;
    }
    .form-field input {
      @apply p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-navy-500;
    }
    .submit-booking {
      @apply w-full mt-4 px-4 py-2 bg-navy-600 text-white rounded-lg 
      hover:bg-navy-700 transition-colors;
    }
    .booking-confirmation {
      @apply bg-green-50 border border-green-200 rounded-lg p-4 mb-4;
    }
    .confirmation-details {
      @apply mt-2 space-y-2 text-green-700;
    }
  `;

  // Stilleri sayfaya ekleyin
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 to-white">
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-4 sm:px-6 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-navy-600/10 flex items-center justify-center">
                <IconBot className="w-6 h-6 text-navy-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">AI Asistan</h1>
                <p className="text-sm text-gray-500">
                  Villa yönetimi konusunda size yardımcı olabilirim
                </p>
              </div>
            </div>
            
            {/* Yeni: Kontrol butonları */}
            <div className="flex gap-2">
              <button
                onClick={startNewSession}
                className="px-3 py-2 text-sm rounded-lg text-navy-600 hover:bg-navy-50 transition-colors"
                title="Yeni oturum başlat"
              >
                Yeni Oturum
              </button>
              <button
                onClick={clearMessages}
                className="px-3 py-2 text-sm rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                title="Mesaj geçmişini temizle"
              >
                Temizle
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="h-full overflow-y-auto">
            <div className="space-y-6">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto rounded-full bg-navy-600/10 flex items-center justify-center mb-4">
                    <IconBot className="w-8 h-8 text-navy-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Villa Asistanına Hoş Geldiniz!
                  </h3>
                  <p className="text-gray-500 max-w-sm mx-auto mb-8">
                    Size en uygun villayı bulmak için buradayım. Müsaitlik durumu, fiyat aralığı ve özel istekleriniz konusunda yardımcı olabilirim.
                  </p>
                  
                  <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setInput(suggestion);
                          textareaRef.current?.focus();
                        }}
                        className="px-4 py-2 rounded-full bg-navy-50 text-navy-700 text-sm hover:bg-navy-100 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {messages.map((message, index) => (
                <Message key={index} message={message} />
              ))}
              
              {isLoading && (
                <div className="flex justify-start items-end gap-2">
                  <div className="w-8 h-8 rounded-full bg-navy-600/10 flex items-center justify-center">
                    <IconBot className="w-5 h-5 text-navy-600" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200 px-4 py-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  adjustTextareaHeight();
                }}
                onKeyDown={handleKeyDown}
                placeholder="Mesajınızı yazın... (Enter ile gönder, Shift + Enter ile yeni satır)"
                className="block w-full rounded-xl border-gray-200 bg-white shadow-sm 
                  focus:border-navy-500 focus:ring-navy-500 resize-none py-3 px-4
                  transition-all duration-200 ease-in-out"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl 
                bg-navy-600 text-white shadow-sm hover:bg-navy-700 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-navy-500 
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 ease-in-out"
            >
              <IconSend className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}