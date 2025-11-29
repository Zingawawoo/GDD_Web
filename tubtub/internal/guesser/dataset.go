package guesser

import (
	"encoding/json"
	"fmt"
	"os"
)

// Index is a simple in-memory index over all games.
type Index struct {
	Games []*Game
	byID  map[int]*Game
}

// LoadDataset reads games.json and builds an Index.
func LoadDataset(path string) (*Index, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("open dataset: %w", err)
	}
	defer f.Close()

	var raw []*Game
	dec := json.NewDecoder(f)
	if err := dec.Decode(&raw); err != nil {
		return nil, fmt.Errorf("decode dataset: %w", err)
	}

	idx := &Index{
		Games: raw,
		byID:  make(map[int]*Game, len(raw)),
	}
	for _, g := range raw {
		idx.byID[g.ID] = g
	}
	return idx, nil
}

// GameByID returns the game with that ID, or nil.
func (idx *Index) GameByID(id int) *Game {
	return idx.byID[id]
}

// DatasetSize returns how many games are in the index.
func (idx *Index) DatasetSize() int {
	return len(idx.Games)
}
