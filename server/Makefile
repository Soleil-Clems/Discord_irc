.PHONY: help build start stop

up:
			@echo "=== Demarrage du conteneur... ==="
			docker compose -f .docker/compose.yml up 

down:
		@echo "=== Arret du conteneur... ==="
		docker compose -f .docker/compose.yml down && clear

logs: 
		@echo "=== log  du serveur... ==="
		docker logs -f lezom-server

build:
			@echo "=== Construction de l'image... ==="
			docker compose -f .docker/compose.yml build --no-cache

reload: stop up

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
	@echo "  make build    - Construit l'image"
	@echo "  make start    - Démarre les services"
	@echo "  make stop     - Arrête les services"
	@echo "  make help     - Affiche ce message"