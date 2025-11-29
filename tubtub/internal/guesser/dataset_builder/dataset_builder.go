package dataset_builder

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"

	"tubtub/internal/guesser"
)

func RunDatasetBuilder(inputPath, outputPath, imageDir string) error {
	// Load original dataset
	rawData, err := os.ReadFile(inputPath)
	if err != nil {
		return fmt.Errorf("read input dataset: %w", err)
	}

	var games []*guesser.Game
	if err := json.Unmarshal(rawData, &games); err != nil {
		return fmt.Errorf("decode dataset: %w", err)
	}

	fmt.Println("Loaded:", len(games), "games")

	for _, g := range games {
		fmt.Println("→ Processing", g.Name)

		// SEARCH STEP
		sr, err := searchRAWGByName(g.Name)
		if err != nil || len(sr.Results) == 0 {
			fmt.Println("   RAWG search failed or empty, skipping.")
			continue
		}

		rawgID := sr.Results[0].ID
		g.RawgID = rawgID

		// DETAILS STEP
		detail, err := fetchRAWGDetails(rawgID)
		if err != nil {
			fmt.Println("   RAWG detail fetch failed:", err)
			continue
		}

		// Merge fields into the *normalized* Game struct

		// Release info
		if detail.Released != "" {
			g.Released = detail.Released
			if g.Year == 0 {
				g.Year = parseYear(detail.Released)
			}
		}

		// Ratings
		g.Playtime = detail.Playtime
		g.Metacritic = detail.Metacritic

		// Credit lists
		g.Developers = collectNames(detail.Developers)
		g.Publishers = collectNames(detail.Publishers)
		g.Genres = collectNames(detail.Genres)
		g.Tags = collectNames(detail.Tags)

		if detail.EsrbRating != nil {
			g.RawgESRB = strings.TrimSpace(detail.EsrbRating.Name)
		}

		// Parent platforms as simple strings
		g.ParentPlatforms = g.ParentPlatforms[:0]
		for _, pp := range detail.ParentPlatforms {
			name := strings.TrimSpace(pp.Platform.Name)
			if name != "" {
				g.ParentPlatforms = append(g.ParentPlatforms, name)
			}
		}

		// Stores
		g.Stores = g.Stores[:0]
		for _, st := range detail.Stores {
			name := strings.TrimSpace(st.Store.Name)
			if name != "" {
				g.Stores = append(g.Stores, name)
			}
		}

		// IMAGE CACHING
		rawURL := sr.Results[0].BackgroundImage
		if rawURL != "" {
			imgURL, err := cacheImage(g.ID, rawURL, imageDir)
			if err == nil && imgURL != "" {
				g.ImageURL = imgURL
			}
		}
	}

	// Encode enriched output
	outData, err := json.MarshalIndent(games, "", "  ")
	if err != nil {
		return fmt.Errorf("encode enriched dataset: %w", err)
	}

	if err := os.WriteFile(outputPath, outData, 0644); err != nil {
		return fmt.Errorf("write enriched dataset: %w", err)
	}

	fmt.Println("✓ Dataset enriched and saved to", outputPath)
	return nil
}

func collectNames[T any](list []struct{ Name string }) []string {
	var out []string
	for _, x := range list {
		name := strings.TrimSpace(x.Name)
		if name != "" {
			out = append(out, name)
		}
	}
	return out
}

func parseYear(date string) int {
	if len(date) < 4 {
		return 0
	}
	year := date[:4]
	var y int
	fmt.Sscanf(year, "%d", &y)
	return y
}
