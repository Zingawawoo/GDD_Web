package guesser

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
)

// StartSessionHandler handles POST /api/session/start.
func StartSessionHandler(idx *Index, templates map[string]QuestionTemplate, store *SessionStore) http.Handler {
	_ = templates // templates not used here (kept for future extension)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		session, err := store.createSession()
		if err != nil {
			log.Printf("start session: %v", err)
			http.Error(w, "failed to start session", http.StatusInternalServerError)
			return
		}

		mystery := idx.GameByID(session.MysteryGameID)
		if mystery == nil {
			EnsureImageURL(mystery)
		}

		resp := struct {
			SessionID       string `json:"sessionId"`
			DatasetSize     int    `json:"datasetSize"`
			CandidatesCount int    `json:"candidatesCount"`
			MaxQuestions    int    `json:"maxQuestions"`
			MysteryGame    GameSummary `json:"mysteryGame"`
		}{
			SessionID:       session.ID,
			DatasetSize:     idx.DatasetSize(),
			CandidatesCount: len(session.CandidateIDs),
			MaxQuestions:    20,
			MysteryGame: GameSummary{
				ID:       mystery.ID,
				Name:     mystery.Name,
				ImageURL: mystery.ImageURL,
    		},
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
	})
}

// SessionHandler handles POST /api/session/<id>/ask and /guess.
func SessionHandler(idx *Index, templates map[string]QuestionTemplate, store *SessionStore) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Path: /api/session/<id>/ask   or /guess
		trimmed := strings.TrimPrefix(r.URL.Path, "/api/session/")
		parts := strings.Split(trimmed, "/")
		if len(parts) != 2 {
			http.Error(w, "bad session path", http.StatusBadRequest)
			return
		}
		sessionID := parts[0]
		action := parts[1]

		switch action {
		case "ask":
			handleAsk(w, r, idx, templates, store, sessionID)
		case "guess":
			handleGuess(w, r, idx, store, sessionID)
		case "mystery":
			handleMystery(w, r, idx, store, sessionID)
		default:
			http.Error(w, "unknown action", http.StatusBadRequest)
		}
	})
}

// handleAsk -> /api/session/<id>/ask
func handleAsk(
	w http.ResponseWriter,
	r *http.Request,
	idx *Index,
	templates map[string]QuestionTemplate,
	store *SessionStore,
	sessionID string,
) {
	var req QuestionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "bad request body", http.StatusBadRequest)
		return
	}

	tmpl, ok := templates[req.QuestionTypeID]
	if !ok {
		http.Error(w, "unknown question type", http.StatusBadRequest)
		return
	}

	var resp QuestionResponse

	err := store.WithSession(sessionID, func(sess *Session) error {
		mystery := idx.GameByID(sess.MysteryGameID)
		if mystery == nil {
			return Err("mystery game not found")
		}

		if sess.QuestionAsked >= 20 {
			return Err("maximum number of questions reached")
		}
		sess.QuestionAsked++

		// Determine the "true" answer based on the actual mystery game.
		yes := tmpl.Match(mystery, req.Option)
		if yes {
			resp.Answer = AnswerYes
		} else {
			resp.Answer = AnswerNo
		}

		// Filter candidates to only those consistent with this answer.
		for id := range sess.CandidateIDs {
			game := idx.GameByID(id)
			if game == nil {
				delete(sess.CandidateIDs, id)
				continue
			}
			gameYes := tmpl.Match(game, req.Option)
			if gameYes != yes {
				delete(sess.CandidateIDs, id)
			}
		}

		resp.CandidatesCount = len(sess.CandidateIDs)
		return nil
	})

	if err != nil {
		log.Printf("handleAsk: %v", err)
		http.Error(w, "session error", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(resp)
}

func normalizeName(s string) string {
    s = strings.ToLower(strings.TrimSpace(s))

    // Remove symbols
    replacers := []string{
        "™", "", "®", "", ":", "", "-", "",
        "'", "", `"`, "", ",", "", ".", "",
        "•", "", "–", "", "—", "",
        "edition", "", "remastered", "", "definitive", "",
    }

    for i := 0; i < len(replacers); i += 2 {
        s = strings.ReplaceAll(s, replacers[i], replacers[i+1])
    }

    return s
}

func handleGuess(
    w http.ResponseWriter,
    r *http.Request,
    idx *Index,
    store *SessionStore,
    sessionID string,
) {
    var req GuessRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "bad request body", http.StatusBadRequest)
        return
    }

    guessName := strings.TrimSpace(req.Guess)
    if guessName == "" {
        http.Error(w, "empty guess", http.StatusBadRequest)
        return
    }

    normalizedGuess := normalizeName(guessName)

    var resp struct {
        Correct bool        `json:"correct"`
        Lives   int         `json:"lives"`
        Lose    bool        `json:"lose"`
        Win     bool        `json:"win"`
        Game    GameSummary `json:"game"`
    }

    err := store.WithSession(sessionID, func(sess *Session) error {
        g := idx.GameByID(sess.MysteryGameID)
        if g == nil {
            return Err("mystery not found")
        }

        EnsureImageURL(g)

        normalizedMystery := normalizeName(g.Name)
        isCorrect := (normalizedGuess == normalizedMystery)

        resp.Game = GameSummary{
            ID:       g.ID,
            Name:     g.Name,
            ImageURL: g.ImageURL,
        }

        if isCorrect {
            // WIN
            resp.Correct = true
            resp.Win = true
            resp.Lives = sess.Lives
            return nil
        }

        // WRONG GUESS
        sess.Lives--

        resp.Correct = false
        resp.Lives = sess.Lives

        if sess.Lives <= 0 {
            // LOSE
            resp.Lose = true
        }

        return nil
    })

    if err != nil {
        http.Error(w, "failed to resolve guess", http.StatusBadRequest)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    _ = json.NewEncoder(w).Encode(resp)
}

func handleMystery(
    w http.ResponseWriter,
    r *http.Request,
    idx *Index,
    store *SessionStore,
    sessionID string,
) {
    var resp GameSummary

    err := store.WithSession(sessionID, func(sess *Session) error {
        g := idx.GameByID(sess.MysteryGameID)
        if g == nil {
            return Err("mystery not found")
        }

        EnsureImageURL(g)

        resp = GameSummary{
            ID:       g.ID,
            Name:     g.Name,
            ImageURL: g.ImageURL,
        }
        return nil
    })

    if err != nil {
        http.Error(w, "session error", http.StatusBadRequest)
        return
    }

    w.Header().Set("Content-Type", "application/json")
    _ = json.NewEncoder(w).Encode(resp)
}

func GetCategoriesHandler(store *SessionStore) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

        sessionID := r.URL.Query().Get("sessionId")
        sess, ok := store.GetSession(sessionID)
        if !ok {
            http.Error(w, "invalid session", http.StatusBadRequest)
            return
        }

        cats := RandomCategories(sess.UsedCategories)

        json.NewEncoder(w).Encode(struct {
            Categories []string `json:"categories"`
			RevealedCount int    `json:"revealedCount"`
        }{
            Categories: cats,
			RevealedCount: sess.RevealedCount,
        })
    })
}
func RevealHandler(idx *Index, store *SessionStore) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

        var req RevealRequest
        if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
            http.Error(w, "bad request", http.StatusBadRequest)
            return
        }

        sess, ok := store.GetSession(req.SessionID)
        if !ok {
            http.Error(w, "invalid session", http.StatusBadRequest)
            return
        }

        // Maximum reveals reached?
        if sess.RevealedCount >= 10 {
            http.Error(w, "no more reveals allowed", http.StatusForbidden)
            return
        }

        // Get the game
        game := idx.GameByID(sess.MysteryGameID)
        if game == nil {
            http.Error(w, "internal error", http.StatusInternalServerError)
            return
        }

        cat := req.Category

        // Get category value
        val := ExtractCategoryValue(game, cat)

        // Update session
        sess.UsedCategories[cat] = true
        sess.RevealedCount++

        // Generate next 5 categories
        next := RandomCategories(sess.UsedCategories)

        // Response
        resp := struct {
            Category      string      `json:"category"`
            Value         interface{} `json:"value"`
            NextCategories []string    `json:"nextCategories"`
            RevealedCount int          `json:"revealedCount"`
        }{
            Category:      cat,
            Value:         val,
            NextCategories: next,
            RevealedCount: sess.RevealedCount,
        }

        json.NewEncoder(w).Encode(resp)
    })
}
