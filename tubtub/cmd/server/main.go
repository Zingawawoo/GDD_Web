package main

import (
	"log"
	"net/http"
	"tubtub/internal/chat"
	"tubtub/internal/game"
	"tubtub/internal/webutil"
)

func main() {

	chatHub := chat.NewHub()
	gameHub := game.NewHub() // placeholder for now

	mux := http.NewServeMux()

	// --- WebSocket endpoints
	mux.HandleFunc("/ws/chat", chatHub.HandleWS)
	mux.HandleFunc("/ws/game", gameHub.HandleWS)

	// --- Static sites
	// Root site (homepage) → web/hub/*
	mux.Handle("/", http.FileServer(http.Dir("web/hub")))

	// Sub-sites. IMPORTANT: StripPrefix uses "/path/" (with trailing slash)
	mux.Handle("/chat/", http.StripPrefix("/chat/", http.FileServer(http.Dir("web/chat"))))
	mux.Handle("/game/", http.StripPrefix("/game/", http.FileServer(http.Dir("web/game"))))
	mux.Handle("/roadmap/", http.StripPrefix("/roadmap/", http.FileServer(http.Dir("web/roadmap"))))

	// --- APIs
	mux.HandleFunc("/api/events", eventsHandler)

	// --- Diagnostics (optional)
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) { w.Write([]byte("ok")) })
	// If you want /stats JSON, add a Count() method on your hub and expose it here.

	srv := &http.Server{
		Addr:    ":9000",
		Handler: webutil.WithSecurityHeaders(mux),
	}

	log.Println("Tubtub server listening on :9000")
	log.Fatal(srv.ListenAndServe())
}
