package guesser

import (
	"encoding/json"
	"net/http"
	"strings"
)

type GuessSuggestResponse struct {
	Names []string `json:"names"`
}

// GuessSuggestHandler returns up to 15 game names matching the query (case-insensitive substring).
func GuessSuggestHandler(idx *Index) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		q := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("q")))
		max := 15

		var out []string

		// fast path: if no query, return a few random-ish names from the front of the list
		if q == "" {
			for i := 0; i < len(idx.Games) && len(out) < max; i++ {
				out = append(out, idx.Games[i].Name)
			}
		} else {
			for _, g := range idx.Games {
				name := strings.TrimSpace(g.Name)
				if name == "" {
					continue
				}
				if strings.Contains(strings.ToLower(name), q) {
					out = append(out, name)
					if len(out) >= max {
						break
					}
				}
			}
		}

		json.NewEncoder(w).Encode(GuessSuggestResponse{Names: out})
	})
}
