package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"tubtub/internal/chat"
	"tubtub/internal/guesser"
	"tubtub/internal/webutil"
)

func projectRoot() string {
	candidates := []string{
		".",
		"..",
		"../..",
	}

	for _, c := range candidates {
		try := filepath.Join(c, "web", "hub")
		if _, err := os.Stat(try); err == nil {
			return c
		}
	}
	return "."
}

func getStaticDir(root string) string {
	return filepath.Join(root, "web", "hub")
}

func getGuesserStaticDir(root string) string {
	return filepath.Join(root, "web", "guesser")
}

func getChatStaticDir(root string) string {
	return filepath.Join(root, "web", "chat")
}

func getRoadmapStaticDir(root string) string {
	return filepath.Join(root, "web", "roadmap")
}

func getGuesserDatasetPath(root string) string {
	return filepath.Join(root, "web", "guesser", "games.json")
}

func main() {
	root := projectRoot()
	log.Printf("Using project root: %s\n", root)

	datasetPath := getGuesserDatasetPath(root)
	log.Printf("Loading games dataset from: %s", datasetPath)

	idx, err := guesser.LoadDataset(datasetPath)
	if err != nil {
		log.Fatalf("failed to load dataset: %v", err)
	}

	templates := guesser.DefaultTemplates()
	sessionStore := guesser.NewSessionStore(idx)

	chatHub := chat.NewHub()

	mux := http.NewServeMux()

	// WebSocket endpoints
	mux.HandleFunc("/ws/chat", chatHub.HandleWS)

	// Static sites
	mux.Handle("/",
		http.FileServer(http.Dir(getStaticDir(root))),
	)

	mux.Handle("/chat/",
		http.StripPrefix("/chat/",
			http.FileServer(http.Dir(getChatStaticDir(root))),
		),
	)

	mux.Handle("/guesser/",
		http.StripPrefix("/guesser/",
			http.FileServer(http.Dir(getGuesserStaticDir(root))),
		),
	)

	mux.Handle("/roadmap/",
		http.StripPrefix("/roadmap/",
			http.FileServer(http.Dir(getRoadmapStaticDir(root))),
		),
	)

	// Serve dataset at /games.json so the frontend can fetch it.
	mux.Handle("/games.json",
		http.FileServer(http.Dir(getGuesserStaticDir(root))),
	)

	// Guesser API
	mux.Handle("/api/session/start",
		guesser.StartSessionHandler(idx, templates, sessionStore),
	)
	mux.Handle("/api/session/",
		guesser.SessionHandler(idx, templates, sessionStore),
	)

	// New reveal/lottery endpoints
	mux.Handle("/api/session/categories",
		guesser.GetCategoriesHandler(idx, sessionStore),
	)
	mux.Handle("/api/session/reveal",
		guesser.RevealHandler(idx, sessionStore),
	)

	// Health
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte("ok"))
	})

	srv := &http.Server{
		Addr:    ":9000",
		Handler: webutil.WithSecurityHeaders(mux),
	}

	log.Println("Tubtub server listening on :9000")
	log.Fatal(srv.ListenAndServe())
}
