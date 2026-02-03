.PHONY: help build start stop

up:
			@echo "=== Demarrage du conteneur... ==="
			docker compose -f .docker/compose.yml up 

down:
		@echo "=== Arret du conteneur... ==="
		docker compose -f .docker/compose.yml down -v && clear

build:
			@echo "=== Construction de l'image... ==="
			docker compose -f .docker/compose.yml build --no-cache

stopall:
	@echo "=== Arret de tous les containers actifs... ==="
	@if [ -n "$$(docker ps -q)" ]; then \
		docker stop $$(docker ps -q); \
	else \
		echo "Aucun container actif."; \
	fi

prune:
			docker system prune -a
help:
	@echo "Utilisation :"
	@echo "  make build    - Construit l'image"
	@echo "  make start    - Démarre les services"
	@echo "  make stop     - Arrête les services"
	@echo "  make help     - Affiche ce message"