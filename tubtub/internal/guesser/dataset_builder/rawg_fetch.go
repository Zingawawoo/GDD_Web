package dataset_builder

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

var rawgKey = os.Getenv("RAWG_API_KEY")

// --- RAWG search response (minimal) ---
type rawgSearchResponse struct {
	Results []struct {
		ID              int    `json:"id"`
		Name            string `json:"name"`
		BackgroundImage string `json:"background_image"`
		Released        string `json:"released"`
	} `json:"results"`
}

// --- RAWG detail response (expanded subset) ---
type rawgDetail struct {
	ID              int    `json:"id"`
	DescriptionRaw  string `json:"description_raw"`
	Playtime        int    `json:"playtime"`
	Metacritic      int    `json:"metacritic"`
	Released        string `json:"released"`

	Developers []struct {
		Name string `json:"name"`
	} `json:"developers"`

	Publishers []struct {
		Name string `json:"name"`
	} `json:"publishers"`

	Genres []struct {
		Name string `json:"name"`
	} `json:"genres"`

	Tags []struct {
		Name string `json:"name"`
	} `json:"tags"`

	EsrbRating *struct {
		Name string `json:"name"`
	} `json:"esrb_rating"`

	ParentPlatforms []struct {
		Platform struct {
			Name string `json:"name"`
		} `json:"platform"`
	} `json:"parent_platforms"`

	Stores []struct {
		Store struct {
			Name string `json:"name"`
		} `json:"store"`
	} `json:"stores"`
}

func searchRAWGByName(name string) (*rawgSearchResponse, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 4*time.Second)
	defer cancel()

	q := url.Values{}
	q.Set("key", rawgKey)
	q.Set("search", name)
	q.Set("page_size", "1")

	u := fmt.Sprintf("https://api.rawg.io/api/games?%s", q.Encode())

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("RAWG search failed: %w", err)
	}
	defer resp.Body.Close()

	var data rawgSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("decode RAWG search: %w", err)
	}

	if len(data.Results) == 0 {
		return &data, nil
	}

	return &data, nil
}

func fetchRAWGDetails(id int) (*rawgDetail, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 4*time.Second)
	defer cancel()

	q := url.Values{}
	q.Set("key", rawgKey)

	u := fmt.Sprintf("https://api.rawg.io/api/games/%d?%s", id, q.Encode())

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("RAWG detail failed: %w", err)
	}
	defer resp.Body.Close()

	var data rawgDetail
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("decode RAWG detail: %w", err)
	}

	return &data, nil
}
