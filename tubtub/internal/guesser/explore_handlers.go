package guesser

import (
	"encoding/json"
	"net/http"
	"strings"
)

// Group by year
func ExploreByYearHandler(idx *Index) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		out := map[int][]*Game{}

		for _, g := range idx.Games {
			if g.Year > 0 {
				out[g.Year] = append(out[g.Year], g)
			}
		}

		json.NewEncoder(w).Encode(out)
	})
}

// Group by platform
func ExploreByPlatformHandler(idx *Index) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		out := map[string][]*Game{}

		for _, g := range idx.Games {
			for _, p := range g.Platforms {
				if strings.TrimSpace(p) == "" {
					continue
				}
				out[p] = append(out[p], g)
			}
		}

		json.NewEncoder(w).Encode(out)
	})
}

// Group by genre
func ExploreByGenreHandler(idx *Index) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		out := map[string][]*Game{}

		for _, g := range idx.Games {
			if v := strings.TrimSpace(g.PrimaryGenre); v != "" {
				out[v] = append(out[v], g)
			}
			for _, gen := range g.SubGenres {
				if strings.TrimSpace(gen) == "" {
					continue
				}
				out[gen] = append(out[gen], g)
			}
		}

		json.NewEncoder(w).Encode(out)
	})
}
