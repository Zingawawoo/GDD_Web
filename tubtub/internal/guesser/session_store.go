package guesser

import (
	crypto_rand "crypto/rand"
	"encoding/hex"
	"errors"
	"log"
	"math/rand"
	"strings"
	"sync"
	"time"
)

var (
	ErrSessionNotFound = errors.New("session not found")
)

type SessionStore struct {
	mu       sync.RWMutex
	sessions map[string]*Session
	idx      *Index
}

func NewSessionStore(idx *Index) *SessionStore {
	rand.Seed(time.Now().UnixNano())
	return &SessionStore{
		sessions: make(map[string]*Session),
		idx:      idx,
	}
}

func newSessionID() string {
	var b [16]byte
	_, _ = crypto_rand.Read(b[:])
	return hex.EncodeToString(b[:])
}

func (s *SessionStore) CreateSession() (*Session, error) {
	if s.idx.Size() == 0 {
		return nil, errors.New("dataset empty")
	}

	game := s.idx.Games[rand.Intn(s.idx.Size())]

	sess := &Session{
		ID:             newSessionID(),
		CreatedAt:      time.Now(),
		MysteryGameID:  game.ID,
		Lives:          3,
		MaxReveals:     10,
		UsedCategories: make(map[string]bool),
		BlurPath:       "",
	}

	s.mu.Lock()
	s.sessions[sess.ID] = sess
	s.mu.Unlock()

	log.Printf("session created id=%s game=%d (total=%d)\n", sess.ID, game.ID, len(s.sessions))
	return sess, nil
}

func (s *SessionStore) GetSession(id string) (*Session, error) {
	id = strings.TrimSpace(id)
	s.mu.RLock()
	defer s.mu.RUnlock()

	sess, ok := s.sessions[id]
	if !ok {
		log.Printf("session lookup miss id=%q (total=%d)\n", id, len(s.sessions))
		return nil, ErrSessionNotFound
	}
	return sess, nil
}

func (s *SessionStore) WithSession(id string, fn func(*Session) error) error {
	id = strings.TrimSpace(id)
	s.mu.Lock()
	defer s.mu.Unlock()

	sess, ok := s.sessions[id]
	if !ok {
		log.Printf("session lock miss id=%q (total=%d)\n", id, len(s.sessions))
		return ErrSessionNotFound
	}

	return fn(sess)
}
