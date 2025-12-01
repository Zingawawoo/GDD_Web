package guesser

import (
	"encoding/json"
	"fmt"
	"os"
)

type Index struct {
	Games []*Game
	byID  map[int]*Game
}

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
		byID:  make(map[int]*Game),
	}

	for _, g := range raw {
		idx.byID[g.ID] = g
	}

	return idx, nil
}

func (i *Index) GameByID(id int) *Game {
	return i.byID[id]
}

func (i *Index) Size() int {
	return len(i.Games)
}
