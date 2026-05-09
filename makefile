FRONTEND_DIR = ./web/default
FRONTEND_CLASSIC_DIR = ./web/classic
FRONTEND_LLMG_DIR = ./web/llmg
BACKEND_DIR = .
VERSION = $(shell cat VERSION)

.PHONY: all build-frontend build-frontend-classic build-frontend-llmg build-all-frontends start-backend dev dev-default dev-classic dev-llmg dev-local dev-local-default dev-local-classic dev-local-llmg dev-api dev-web dev-web-classic dev-web-llmg stop-dev logs-dev

all: build-all-frontends start-backend

build-frontend:
	@echo "Building default frontend..."
	@cd $(FRONTEND_DIR) && bun install && DISABLE_ESLINT_PLUGIN='true' VITE_REACT_APP_VERSION=$(VERSION) bun run build

build-frontend-classic:
	@echo "Building classic frontend..."
	@cd $(FRONTEND_CLASSIC_DIR) && bun install && VITE_REACT_APP_VERSION=$(VERSION) bun run build

build-frontend-llmg:
	@echo "Building LLMG frontend..."
	@cd $(FRONTEND_LLMG_DIR) && bun install && DISABLE_ESLINT_PLUGIN='true' VITE_REACT_APP_VERSION=$(VERSION) bun run build

build-all-frontends: build-frontend build-frontend-classic build-frontend-llmg

start-backend:
	@echo "Starting backend dev server..."
	@if lsof -ti tcp:3000 -sTCP:LISTEN >/dev/null 2>&1; then \
		echo "Backend already listening on :3000, skipping startup."; \
	else \
		cd $(BACKEND_DIR) && go run main.go & \
	fi

dev-api:
	@echo "Starting backend stack (docker compose)..."
	@docker compose -f docker-compose.dev.yml up -d

dev-web:
	@echo "Starting frontend dev server..."
	@cd $(FRONTEND_DIR) && bun install && bun run dev

dev-web-classic:
	@echo "Starting classic frontend dev server..."
	@cd $(FRONTEND_CLASSIC_DIR) && bun install && bun run dev

dev-web-llmg:
	@echo "Starting LLMG frontend dev server..."
	@cd $(FRONTEND_LLMG_DIR) && bun install && bun run dev

dev: dev-llmg

dev-llmg: dev-api dev-web-llmg

dev-default: dev-api dev-web

dev-classic: dev-api dev-web-classic

dev-local: dev-local-llmg

dev-local-llmg: start-backend dev-web-llmg

dev-local-default: start-backend dev-web

dev-local-classic: start-backend dev-web-classic

stop-dev:
	@echo "Stopping backend stack..."
	@docker compose -f docker-compose.dev.yml down

logs-dev:
	@docker compose -f docker-compose.dev.yml logs -f new-api
