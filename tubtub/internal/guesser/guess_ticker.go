package guesser

import (
	"encoding/json"
	"math/rand"
	"net/http"
	"strings"
)

type GuessTickerItem struct {
	Name     string `json:"name"`
	ImageURL string `json:"imageUrl"`
}

// GuessTickerHandler returns a small shuffled list of games with images for front-end animations.
func GuessTickerHandler(idx *Index) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		limit := 40
		var items []GuessTickerItem

		// collect games that have an image
		for _, g := range idx.Games {
			if strings.TrimSpace(g.Name) == "" {
				continue
			}
			items = append(items, GuessTickerItem{
				Name:     g.Name,
				ImageURL: g.ImageURL,
			})
		}

		// shuffle and trim
		rand.Shuffle(len(items), func(i, j int) {
			items[i], items[j] = items[j], items[i]
		})
		if len(items) > limit {
			items = items[:limit]
		}

		json.NewEncoder(w).Encode(struct {
			Games []GuessTickerItem `json:"games"`
		}{Games: items})
	})
}
