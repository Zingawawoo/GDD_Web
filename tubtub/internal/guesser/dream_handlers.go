package guesser

import (
	"encoding/json"
	"math/rand"
	"net/http"
)

func DreamRollHandler(idx *Index) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		g := idx.Games[rand.Intn(idx.Size())]

		json.NewEncoder(w).Encode(struct {
			Game *Game `json:"game"`
		}{
			Game: g,
		})
	})
}
