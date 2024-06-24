up:
	docker compose --file docker-compose.yml --file docker-compose.core.yml up -d
up-build:
	docker compose --file docker-compose.yml --file docker-compose.core.yml up -d --build
down:
	docker compose down
show-logs:
	docker compose logs -f
enter:
	docker compose exec app bash
# rs:
# 	docker compose restart app
restart:
	docker compose restart
r: # restart-all
	docker compose restart
build:
	docker build -t ejnshtein/trash-taste-bot:latest .
publish:
	docker push ejnshtein/trash-taste-bot:latest
