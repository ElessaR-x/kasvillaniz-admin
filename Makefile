# Değişkenler
APP_NAME = villapanel
DOCKER_IMAGE = $(APP_NAME):latest

# Ana komutlar
.PHONY: all build run stop clean

all: build run

# Docker image'ı oluştur
build:
	@echo "$$GITHUB_ENV_VARS" > .env
	docker build -t $(DOCKER_IMAGE) .

# Uygulamayı çalıştır
run:
	docker run -d -p 8000:8000 --name $(APP_NAME) $(DOCKER_IMAGE)

# Uygulamayı durdur
stop:
	docker stop $(APP_NAME)
	docker rm $(APP_NAME)

# Temizlik
clean:
	docker rmi $(DOCKER_IMAGE)

# Development komutları
.PHONY: dev install

# Development modunda çalıştır
dev:
	npm run dev

# Bağımlılıkları yükle
install:
	npm install

# Prisma ve build
.PHONY: prisma-generate build-local

prisma-generate:
	npx prisma generate

build-local:
	npm run build

# Github Secrets'tan env oluştur
.PHONY: create-env
create-env:
	@echo "$$GITHUB_ENV_VARS" > .env 