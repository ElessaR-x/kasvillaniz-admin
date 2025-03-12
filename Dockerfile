# Base image
FROM node:20-alpine AS builder

# Çalışma dizinini ayarla
WORKDIR /app

# Package dosyalarını kopyala
COPY package*.json ./
COPY prisma ./prisma/

# Bağımlılıkları yükle
RUN npm install

# Kaynak kodları kopyala
COPY . .

# Build
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

# Sadece gerekli dosyaları kopyala
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

# Environment değişkenlerini ayarla
ENV NODE_ENV=production
ENV PORT=8000

EXPOSE 8000

# Uygulamayı başlat
CMD ["npm", "start"] 