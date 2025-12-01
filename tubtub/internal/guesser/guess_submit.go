package guesser

import (
	"encoding/json"
	"net/http"
	"strings"
)

type GuessSubmitRequest struct {
	Guess string `json:"guess"`
}

type GuessSubmitResponse struct {
	Correct bool        `json:"correct"`
	Win     bool        `json:"win"`
	Lose    bool        `json:"lose"`
	Lives   int         `json:"lives"`
	Game    GameSummary `json:"game"`
}

func norm(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	replace := []string{"™", "", "®", "", ":", "", "-", "", ",", "", ".", ""}
	for i := 0; i < len(replace); i += 2 {
		s = strings.ReplaceAll(s, replace[i], replace[i+1])
	}
	return s
}

func GuessSubmitHandler(idx *Index, store *SessionStore) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		sid := strings.TrimPrefix(r.URL.Path, "/api/guess/submit/")
		if sid == "" {
			sid = r.URL.Query().Get("sessionId")
		}
		sid = strings.TrimSpace(sid)
		var req GuessSubmitRequest
		_ = json.NewDecoder(r.Body).Decode(&req)

		var out GuessSubmitResponse

		err := store.WithSession(sid, func(sess *Session) error {

			game := idx.GameByID(sess.MysteryGameID)
			if game == nil {
				return Err("missing game")
			}

			guess := norm(req.Guess)
			actual := norm(game.Name)

			out.Game = GameSummary{
				ID:       game.ID,
				Name:     game.Name,
				ImageURL: game.ImageURL,
			}

			if guess == actual {
				out.Correct = true
				out.Win = true
				out.Lives = sess.Lives
				return nil
			}

			// wrong guess
			sess.Lives--
			out.Correct = false
			out.Lives = sess.Lives

			if sess.Lives <= 0 {
				out.Lose = true
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
