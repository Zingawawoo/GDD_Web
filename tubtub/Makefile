.PHONY: run tunnel dev
include .env
export $(shell sed 's/=.*//' .env)

run:
	go run ./cmd/server

tunnel:
	cloudflared tunnel run gdd

dev:
	$(MAKE) -j2 run tunnel
