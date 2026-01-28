package guesser

import (
	"encoding/json"
	"net/http"
	"strings"
)

type GuessRevealRequest struct {
	SessionID string `json:"sessionId"`
	Category  string `json:"category"`
}

type GuessRevealResponse struct {
	Category       string      `json:"category"`
	Value          interface{} `json:"value"`
	NextCategories []string    `json:"nextCategories"`
	RevealedCount  int         `json:"revealedCount"`
}

func GuessRevealHandler(idx *Index, store *SessionStore) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		var req GuessRevealRequest

		// ❗ Stop silently ignoring decode errors
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid json", 400)
			return
		}

		// allow sessionId via query/header as a fallback for older clients
		if req.SessionID == "" {
			req.SessionID = r.URL.Query().Get("sessionId")
		}
		if req.SessionID == "" {
			req.SessionID = r.Header.Get("X-Session-Id")
		}

		req.Category = strings.TrimSpace(req.Category)
		req.SessionID = strings.TrimSpace(req.SessionID)
		if req.Category == "" {
			http.Error(w, "missing cat", 400)
			return
		}
		if req.SessionID == "" {
			http.Error(w, "missing session id", 400)
			return
		}

		var out GuessRevealResponse

		err := store.WithSession(req.SessionID, func(sess *Session) error {
			// breadcrumb to trace traffic
			// log.Printf("reveal request session=%q cat=%q", req.SessionID, req.Category)

			if sess.RevealedCount >= sess.MaxReveals {
				return Err("no more reveals")
			}

			game := idx.GameByID(sess.MysteryGameID)
			if game == nil {
				return Err("missing game")
			}
			val := ExtractCategoryValue(game, req.Category)
			if val == nil {
				return Err("no data")
			}

			sess.UsedCategories[req.Category] = true
			sess.RevealedCount++

			next := RandomCategories(game, sess.UsedCategories)

			out = GuessRevealResponse{
				Category:       req.Category,
				Value:          val,
				NextCategories: next,
				RevealedCount:  sess.RevealedCount,
			}

			return nil
		})

		if err != nil {
			http.Error(w, err.Error(), 400)
			return
		}

		json.NewEncoder(w).Encode(out)
	})
}
