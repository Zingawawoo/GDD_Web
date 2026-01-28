package main

import (
	"flag"
	"log"
	"path/filepath"

	"tubtub/internal/guesser/dataset_builder"
)

func main() {
	// Where to write the final games.json
	outPathFlag := flag.String(
		"out",
		filepath.Join("web", "guesser", "games.json"),
		"path to output games.json",
	)

	// Where to cache images (dataset_builder will mkdir -p this)
	imageDirFlag := flag.String(
		"images",
		filepath.Join("web", "guesser", "images"),
		"directory to cache game images",
	)

	flag.Parse()

	outPath := filepath.Clean(*outPathFlag)
	imageDir := filepath.Clean(*imageDirFlag)

	log.Printf("Building RAWG dataset...\n  out   = %s\n  imgs  = %s\n", outPath, imageDir)

	// First argument (inputPath) is ignored by your new builder, so we pass "".
	err := dataset_builder.RunDatasetBuilder("", outPath, imageDir)
	if err != nil {
		log.Fatalf("dataset build failed: %v", err)
	}

	log.Println("✅ Dataset build complete")
}
