package guesser

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
)

// StartSessionHandler handles POST /api/session/start.
func StartSessionHandler(idx *Index, templates map[string]QuestionTemplate, store *SessionStore) http.Handler {
	_ = templates // templates kept for potential future use
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
		if mystery != nil {
			EnsureImageURL(mystery)
		}

		resp := struct {
			SessionID       string      `json:"sessionId"`
			DatasetSize     int         `json:"datasetSize"`
			CandidatesCount int         `json:"candidatesCount"`
			MaxQuestions    int         `json:"maxQuestions"`
			MysteryGame     GameSummary `json:"mysteryGame"`
		}{
			SessionID:       session.ID,
			DatasetSize:     idx.DatasetSize(),
			CandidatesCount: len(session.CandidateIDs),
			MaxQuestions:    20, // legacy question limit; kept for compatibility
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

// SessionHandler handles POST /api/session/<id>/ask | /guess | /mystery.
func SessionHandler(idx *Index, templates map[string]QuestionTemplate, store *SessionStore) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Path: /api/session/<id>/ask, /guess, /mystery
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

	var resp GuessResponse

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

// GetCategoriesHandler returns the current lottery options (up to 5 categories)
// for a given session/game.
//   GET /api/session/categories?sessionId=XXX
func GetCategoriesHandler(idx *Index, store *SessionStore) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		sessionID := r.URL.Query().Get("sessionId")
		if strings.TrimSpace(sessionID) == "" {
			http.Error(w, "missing sessionId", http.StatusBadRequest)
			return
		}

		sess, ok := store.GetSession(sessionID)
		if !ok {
			http.Error(w, "invalid session", http.StatusBadRequest)
			return
		}

		game := idx.GameByID(sess.MysteryGameID)
		if game == nil {
			http.Error(w, "mystery game not found", http.StatusInternalServerError)
			return
		}

		cats := RandomCategories(game, sess.UsedCategories)

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(struct {
			Categories    []string `json:"categories"`
			RevealedCount int      `json:"revealedCount"`
		}{
			Categories:    cats,
			RevealedCount: sess.RevealedCount,
		})
	})
}

// RevealHandler applies a single reveal:
//   POST /api/session/reveal { "sessionId": "...", "category": "genres" }
func RevealHandler(idx *Index, store *SessionStore) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req RevealRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}

		req.Category = strings.TrimSpace(req.Category)
		if req.Category == "" {
			http.Error(w, "missing category", http.StatusBadRequest)
			return
		}

		var (
			value      interface{}
			next       []string
			revealed   int
			categoryID string
		)

		err := store.WithSession(req.SessionID, func(sess *Session) error {
			if sess.RevealedCount >= 10 {
				return Err("maximum number of reveals reached")
			}

			game := idx.GameByID(sess.MysteryGameID)
			if game == nil {
				return Err("mystery game not found")
			}

			val := ExtractCategoryValue(game, req.Category)
			if val == nil {
				return Err("no data for category")
			}

			// Update session state
			sess.UsedCategories[req.Category] = true
			sess.RevealedCount++

			// Capture data for response
			value = val
			next = RandomCategories(game, sess.UsedCategories)
			revealed = sess.RevealedCount
			categoryID = req.Category

			return nil
		})

		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(struct {
			Category       string      `json:"category"`
			Value          interface{} `json:"value"`
			NextCategories []string    `json:"nextCategories"`
			RevealedCount  int         `json:"revealedCount"`
		}{
			Category:       categoryID,
			Value:          value,
			NextCategories: next,
			RevealedCount:  revealed,
		})
	})
}
