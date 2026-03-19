.PHONY: help build up down logs reload stop stopall prune

COMPOSE_FILE = .docker/compose.yml

up:
	@echo "=== Demarrage du conteneur... ==="
	docker compose -f $(COMPOSE_FILE) up

down:
	@echo "=== Arret du conteneur... ==="
	docker compose -f $(COMPOSE_FILE) down && clear

logs:
	@echo "=== log du serveur... ==="
	docker compose -f $(COMPOSE_FILE) logs -f server

build:
	@echo "=== Construction de l'image... ==="
	docker compose -f $(COMPOSE_FILE) build --no-cache

reload: down up

stopall:
	@echo "=== Arret de tous les containers actifs... ==="
	@if [ -n "$$(docker ps -q)" ]; then \
		docker stop $$(docker ps -q); \
	else \
		echo "Aucun container actif."; \
	fi

stop: down stopall

prune:
	docker system prune -a

help:
	@echo "Utilisation :"
	@echo "  make up       - Demarre les services"
	@echo "  make down     - Arrete les services"
	@echo "  make build    - Construit l'image"
	@echo "  make logs     - Affiche les logs du serveur"
	@echo "  make reload   - Redemarre les services"
	@echo "  make stop     - Arrete tous les containers"
	@echo "  make stopall  - Arrete tous les containers Docker"
	@echo "  make prune    - Nettoie les images/volumes inutilises"
	@echo "  make help     - Affiche ce message"
