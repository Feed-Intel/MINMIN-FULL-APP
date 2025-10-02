.PHONY: dev:up dev:down dev:logs db:migrate db:seed

dev:up:
	docker compose up -d

dev:down:
	docker compose down

dev:logs:
	docker compose logs -f api

db:migrate:
	docker compose exec api python manage.py migrate

db:seed:
	docker compose exec api python manage.py seed_full

db:seed:restaurants:
	docker compose exec api python manage.py seed_full --no-customers

db:seed:customers:
	docker compose exec api python manage.py seed_full --no-restaurants
