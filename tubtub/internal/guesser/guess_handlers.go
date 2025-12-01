package guesser

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
)

// ----------------------------
// GUESS: Start
// ----------------------------
type GuessStartResponse struct {
	SessionID    string `json:"sessionId"`
	Lives        int    `json:"lives"`
	MaxReveals   int    `json:"maxReveals"`
	BlurImageURL string `json:"blurImageUrl"`
}

const defaultBlurDataURI = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=="

func GuessStartHandler(idx *Index, store *SessionStore) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		log.Println("GuessStartHandler HIT")

		sess, err := store.CreateSession()
		if err != nil {
			http.Error(w, "failed to start", 500)
			return
		}
		log.Printf("GuessStart session=%s game=%d\n", sess.ID, sess.MysteryGameID)

		game := idx.GameByID(sess.MysteryGameID)
		if game == nil {
			http.Error(w, "missing game", 500)
			return
		}

		imageURL := strings.TrimSpace(game.ImageURL)
		if imageURL == "" {
			imageURL = defaultBlurDataURI
		}

		// pixelate image
		blur, err := GeneratePixelated(sess.ID, imageURL)
		if err != nil {
			http.Error(w, "blur error", 500)
			return
		}
		sess.BlurPath = blur

		resp := GuessStartResponse{
			SessionID:    sess.ID,
			Lives:        sess.Lives,
			MaxReveals:   sess.MaxReveals,
			BlurImageURL: blur,
		}

		w.Header().Set("Cache-Control", "no-store")
		json.NewEncoder(w).Encode(resp)
	})
}
