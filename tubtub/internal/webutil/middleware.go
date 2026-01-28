package webutil

import (
	"net/http"
	"strings"
)

func WithSecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// --- Security headers
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "SAMEORIGIN")
		w.Header().Set("Referrer-Policy", "no-referrer")

		// --- Content Security Policy
		// If you don't use Cloudflare Analytics, remove the two cloudflare domains below.
		w.Header().Set("Content-Security-Policy",
			"default-src 'self'; "+
				"connect-src 'self' wss:; "+
				"img-src 'self' data:; "+
				"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "+
				"font-src 'self' https://fonts.gstatic.com; "+
				"script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://static.cloudflareinsights.com; "+
				"base-uri 'self'; form-action 'self'; frame-ancestors 'self';")

		// --- Cache-control by type
		p := r.URL.Path
		switch {
		case strings.HasSuffix(p, ".html") || p == "/" || p == "":
			// HTML: never hard-cache (so layout updates show immediately)
			w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
			w.Header().Set("Pragma", "no-cache")
			w.Header().Set("Expires", "0")
		case strings.HasSuffix(p, ".css") ||
			strings.HasSuffix(p, ".js")  ||
			strings.HasSuffix(p, ".wasm") ||
			strings.HasSuffix(p, ".pck"):

			w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		default:
			// Images/fonts/etc.
			w.Header().Set("Cache-Control", "public, max-age=604800")
		}

		// Continue to the next handler
		if strings.HasSuffix(r.URL.Path, ".wasm") {
			w.Header().Set("Content-Type", "application/wasm")
		}
		next.ServeHTTP(w, r)
	})
}
