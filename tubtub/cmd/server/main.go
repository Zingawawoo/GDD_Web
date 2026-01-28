package main

import (
	"log"
	"mime"
	"net/http"
	"os"
	"path/filepath"

	"tubtub/internal/guesser"
	"tubtub/internal/webutil"
)

func projectRoot() string {
	candidates := []string{".", "..", "../.."}
	dirsToCheck := []string{
		filepath.Join("web", "hub"),
		filepath.Join("web", "gamehub"),
		filepath.Join("web", "guesser"),
		filepath.Join("web", "room"),
	}

	for _, c := range candidates {
		ok := true
		for _, d := range dirsToCheck {
			try := filepath.Join(c, d)
			if _, err := os.Stat(try); err != nil {
				ok = false
				break
			}
		}
		if ok {
			return c
		}
	}
	return "."
}

func main() {
	mime.AddExtensionType(".wasm", "application/wasm")
	root := projectRoot()
	log.Printf("Using project root: %s\n", root)

	datasetPath := filepath.Join(root, "web", "guesser", "games.json")
	idx, err := guesser.LoadDataset(datasetPath)
	if err != nil {
		log.Fatalf("cannot load dataset: %v", err)
	}

	sessionStore := guesser.NewSessionStore(idx)

	mux := http.NewServeMux()

	// -----------------------------
	// STATIC SITES
	// -----------------------------
	mux.Handle("/",
		http.FileServer(http.Dir(filepath.Join(root, "web", "hub"))),
	)

	mux.Handle("/gamehub/",
		http.StripPrefix("/gamehub/",
			http.FileServer(http.Dir(filepath.Join(root, "web", "gamehub"))),
		),
	)

	mux.Handle("/room/",
		http.StripPrefix("/room/",
			http.FileServer(http.Dir(filepath.Join(root, "web", "room"))),
		),
	)

	// Make sure this folder exists for blurred images
	os.MkdirAll(filepath.Join(root, "web", "guesser", "blur_cache"), 0755)

	// -----------------------------
	// API: Guessing game
	// -----------------------------
	mux.Handle("/api/guess/start", guesser.GuessStartHandler(idx, sessionStore))
	mux.Handle("/api/guess/categories", guesser.GuessCategoriesHandler(idx, sessionStore))
	mux.Handle("/api/guess/reveal", guesser.GuessRevealHandler(idx, sessionStore))
	mux.Handle("/api/guess/submit/", guesser.GuessSubmitHandler(idx, sessionStore))
	mux.Handle("/api/guess/suggest", guesser.GuessSuggestHandler(idx))
	mux.Handle("/api/guess/ticker", guesser.GuessTickerHandler(idx))

	// Serve blurred image that was generated
	mux.Handle("/api/blur/", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// images stored in: web/guesser/blur_cache/<session>.jpg
		localPath := filepath.Join(root, "web", "guesser", "blur_cache", filepath.Base(r.URL.Path))
		http.ServeFile(w, r, localPath)
	}))

	// -----------------------------
	// API: Dream Game Builder
	// -----------------------------
	mux.Handle("/api/dream/roll", guesser.DreamRollHandler(idx))

	// -----------------------------
	// API: Explore/Timeline
	// -----------------------------
	mux.Handle("/api/explore/by-year", guesser.ExploreByYearHandler(idx))
	mux.Handle("/api/explore/by-platform", guesser.ExploreByPlatformHandler(idx))
	mux.Handle("/api/explore/by-genre", guesser.ExploreByGenreHandler(idx))

	// -----------------------------
	// FINAL SERVER WRAP
	// -----------------------------
	srv := &http.Server{
		Addr:    ":9000",
		Handler: webutil.WithSecurityHeaders(mux),
	}

	log.Println("Unified Tubtub GameHub Server running on :9000")
	log.Fatal(srv.ListenAndServe())
}
