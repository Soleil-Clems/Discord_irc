.PHONY: help build start stop test test-back test-front

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
test-back:
	@echo "=== Tests unitaires Backend ==="
	@npm run test:cov

test-front:
	@echo "=== Tests unitaires Frontend ==="
	@cd ../../lezom_front/client && npm run test:coverage

test: test-back test-front
	@echo "=== Tous les tests sont passés ==="

help:
	@echo "Utilisation :"
	@echo "  make build       - Construit l'image Docker"
	@echo "  make up          - Démarre les services"
	@echo "  make stop        - Arrête les services"
	@echo "  make test        - Lance tous les tests (back + front)"
	@echo "  make test-back   - Tests backend uniquement"
	@echo "  make test-front  - Tests frontend uniquement"
	@echo "  make help        - Affiche ce message"