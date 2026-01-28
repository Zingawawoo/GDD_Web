package guesser

// Disable pixelation — simply return the original image URL.
func GeneratePixelated(sessionID string, rawURL string) (string, error) {
    return rawURL, nil
}
