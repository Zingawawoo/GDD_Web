package guesser

import (
	"encoding/json"
	"net/http"
	"strings"
)

func GuessCategoriesHandler(idx *Index, store *SessionStore) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		sid := strings.TrimSpace(r.URL.Query().Get("sessionId"))
		sess, err := store.GetSession(sid)
		if err != nil {
			http.Error(w, "bad session", 400)
			return
		}

		game := idx.GameByID(sess.MysteryGameID)
		if game == nil {
			http.Error(w, "missing game", 500)
			return
		}

		cats := RandomCategories(game, sess.UsedCategories)

		json.NewEncoder(w).Encode(struct {
			Categories    []string `json:"categories"`
			RevealedCount int      `json:"revealedCount"`
		}{
			Categories:    cats,
			RevealedCount: sess.RevealedCount,
		})
	})
}
