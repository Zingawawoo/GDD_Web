package guesser

import (
	crypto_rand "crypto/rand"
	"encoding/hex"
	"math/rand"
	"sync"
	"time"
)

// SessionStore manages active sessions in memory.
type SessionStore struct {
	mu       sync.RWMutex
	sessions map[string]*Session
	idx      *Index
}

// NewSessionStore creates a store bound to a dataset index.
func NewSessionStore(idx *Index) *SessionStore {
	// Seed math/rand once – used only for picking a random game.
	rand.Seed(time.Now().UnixNano())

	return &SessionStore{
		sessions: make(map[string]*Session),
		idx:      idx,
	}
}

// newSessionID generates a random hex session ID.
func newSessionID() (string, error) {
	var buf [16]byte
	if _, err := crypto_rand.Read(buf[:]); err != nil {
		return "", err
	}
	return hex.EncodeToString(buf[:]), nil
}

// createSession picks a random mystery game and initial candidate set.
func (s *SessionStore) createSession() (*Session, error) {
	if s.idx.DatasetSize() == 0 {
		return nil, ErrEmptyDataset
	}

	id, err := newSessionID()
	if err != nil {
		return nil, err
	}

	// Random mystery game.
	mysteryIdx := rand.Intn(len(s.idx.Games))
	mysteryGame := s.idx.Games[mysteryIdx]

	candidates := make(map[int]bool, len(s.idx.Games))
	for _, g := range s.idx.Games {
		candidates[g.ID] = true
	}

	session := &Session{
		ID:            id,
		CreatedAt:     time.Now(),
		MysteryGameID: mysteryGame.ID,
		CandidateIDs:  candidates,

		// New mechanics
		Lives:          3,
		RevealedCount:  0,
		UsedCategories: make(map[string]bool),
	}

	s.mu.Lock()
	s.sessions[id] = session
	s.mu.Unlock()

	return session, nil
}

// GetSession looks up a session by ID.
func (s *SessionStore) GetSession(id string) (*Session, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	sess, ok := s.sessions[id]
	return sess, ok
}

// WithSession allows safe mutation of a session.
func (s *SessionStore) WithSession(id string, fn func(sess *Session) error) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	sess, ok := s.sessions[id]
	if !ok {
		return ErrSessionNotFound
	}
	return fn(sess)
}

var (
	// ErrEmptyDataset is returned if there are no games.
	ErrEmptyDataset = Err("dataset is empty")
	// ErrSessionNotFound when a session ID is missing.
	ErrSessionNotFound = Err("session not found")
)

// Err is a simple string error type.
type Err string

func (e Err) Error() string { return string(e) }
