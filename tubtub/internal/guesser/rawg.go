package guesser

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

var rawgAPIKey string

func init() {
	rawgAPIKey = os.Getenv("RAWG_API_KEY")
}

// rawgSearchResponse is a minimal struct to parse RAWG results.
type rawgSearchResponse struct {
	Results []struct {
		BackgroundImage string `json:"background_image"`
	} `json:"results"`
}

// EnsureImageURL fills g.ImageURL using RAWG if it's empty.
// It will silently do nothing if there is no API key or if the request fails.
func EnsureImageURL(g *Game) {
	if g == nil {
		return
	}
	if g.ImageURL != "" {
		return
	}
	if rawgAPIKey == "" {
		// No key configured; nothing we can do.
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	q := url.Values{}
	q.Set("key", rawgAPIKey)
	q.Set("search", g.Name)
	q.Set("page_size", "1")

	u := url.URL{
		Scheme:   "https",
		Host:     "api.rawg.io",
		Path:     "/api/games",
		RawQuery: q.Encode(),
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		log.Printf("rawg: build request for %q: %v", g.Name, err)
		return
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Printf("rawg: request for %q failed: %v", g.Name, err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Printf("rawg: non-200 for %q: %s", g.Name, resp.Status)
		return
	}

	var parsed rawgSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		log.Printf("rawg: decode response for %q: %v", g.Name, err)
		return
	}

	if len(parsed.Results) == 0 {
		return
	}

	img := strings.TrimSpace(parsed.Results[0].BackgroundImage)
	if img == "" {
		return
	}

	g.ImageURL = img
}
