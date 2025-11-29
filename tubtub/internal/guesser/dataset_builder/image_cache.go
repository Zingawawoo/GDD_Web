package dataset_builder

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
)

func cacheImage(gameID int, rawURL, outputDir string) (string, error) {
	if rawURL == "" {
		return "", nil
	}

	resp, err := http.Get(rawURL)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", fmt.Errorf("failed to download image: %s", resp.Status)
	}

	os.MkdirAll(outputDir, 0755)

	outPath := path.Join(outputDir, fmt.Sprintf("game_%d.jpg", gameID))

	outFile, err := os.Create(outPath)
	if err != nil {
		return "", err
	}
	defer outFile.Close()

	_, err = io.Copy(outFile, resp.Body)
	if err != nil {
		return "", err
	}

	// return relative URL stored in ImageURL
	return "/images/game_" + fmt.Sprintf("%d.jpg", gameID), nil
}
