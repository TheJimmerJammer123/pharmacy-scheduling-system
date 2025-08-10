.PHONY: up down ps logs-backend logs-frontend logs-n8n restart-backend restart-frontend restart-db health db-shell db-tables sms-status build-backend test-backend lint build-frontend ci smoke ai-chat

up:
	docker compose up -d

down:
	docker compose down

ps:
	docker compose ps

logs-backend:
	docker compose logs -f backend

logs-frontend:
	docker compose logs -f frontend

logs-n8n:
	docker compose logs -f n8n

restart-backend:
	docker compose restart backend

restart-frontend:
	docker compose restart frontend

restart-db:
	docker compose restart db

health:
	@echo "Backend health:" && curl -sSf http://localhost:3001/api/health | jq || true
	@echo "DB NOW():" && docker compose exec db psql -U postgres -d pharmacy -c "SELECT NOW();" || true

build-backend:
	docker compose build backend

db-shell:
	docker compose exec db psql -U postgres -d pharmacy

db-tables:
	docker compose exec db psql -U postgres -d pharmacy -c "\\dt"

sms-status:
	curl -sSf http://100.126.232.47:8080/status || curl -sSf http://100.126.232.47:8080/state || true

test-backend:
	cd backend && npm ci && npm test

lint:
	cd backend && npm ci && npm run quality

build-frontend:
	cd frontend && npm ci && npm run build

ci:
	$(MAKE) lint && $(MAKE) test-backend && $(MAKE) build-frontend

smoke:
	bash scripts/smoke.sh

ai-chat:
	bash scripts/ai-chat.sh "$(m)"
