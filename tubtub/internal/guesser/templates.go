package guesser

import (
	"strings"
)

// DefaultTemplates returns all supported backend question templates.
// These IDs line up with what the frontend sends (platform, genre, etc.).
func DefaultTemplates() map[string]QuestionTemplate {
	return map[string]QuestionTemplate{
		"platform": {
			ID:    "platform",
			Label: "Platform",
			Match: func(g *Game, option string) bool {
				opt := strings.ToLower(option)
				// "Multi-platform" is special
				if opt == "multi-platform" || opt == "multiplatform" {
					return len(g.Platforms) >= 3
				}
				for _, p := range g.Platforms {
					if strings.Contains(strings.ToLower(p), opt) {
						return true
					}
				}
				return false
			},
		},
		"genre": {
			ID:    "genre",
			Label: "Main Genre",
			Match: func(g *Game, option string) bool {
				opt := strings.ToLower(option)
				if strings.Contains(strings.ToLower(g.MainGenre), opt) {
					return true
				}
				for _, gg := range g.Genres {
					if strings.Contains(strings.ToLower(gg), opt) {
						return true
					}
				}
				return false
			},
		},
		"perspective": {
			ID:    "perspective",
			Label: "Perspective",
			Match: func(g *Game, option string) bool {
				opt := strings.ToLower(option)
				p := strings.ToLower(g.Perspective)
				return strings.Contains(p, opt)
			},
		},
		"world": {
			ID:    "world",
			Label: "World Type",
			Match: func(g *Game, option string) bool {
				opt := strings.ToLower(option)
				w := strings.ToLower(g.WorldType)
				return strings.Contains(w, opt)
			},
		},
		"multiplayer": {
			ID:    "multiplayer",
			Label: "Multiplayer",
			Match: func(g *Game, option string) bool {
				switch strings.ToLower(option) {
				case "single-player", "singleplayer":
					return !g.Multiplayer && !g.CoOp
				case "online multiplayer":
					return g.Multiplayer
				case "local co-op", "local coop":
					return g.CoOp
				default:
					return false
				}
			},
		},
		"rating": {
			ID:    "rating",
			Label: "Age Rating",
			Match: func(g *Game, option string) bool {
				opt := strings.ToLower(option)
				age := strings.ToLower(g.AgeRating)
				esrb := strings.ToLower(g.ESRB)

				switch opt {
				case "everyone":
					return strings.Contains(esrb, "e") ||
						strings.Contains(age, "3+") ||
						strings.Contains(age, "7+")
				case "teen":
					return strings.Contains(esrb, "t") ||
						strings.Contains(age, "12+")
				case "mature":
					return strings.Contains(esrb, "m") ||
						strings.Contains(age, "16+") ||
						strings.Contains(age, "18+")
				default:
					return false
				}
			},
		},
		"style": {
			ID:    "style",
			Label: "Visual Style",
			Match: func(g *Game, option string) bool {
				opt := strings.ToLower(option)
				for _, vs := range g.VisualStyle {
					if strings.Contains(strings.ToLower(vs), opt) {
						return true
					}
				}
				return false
			},
		},
		"theme": {
			ID:    "theme",
			Label: "Theme",
			Match: func(g *Game, option string) bool {
				opt := strings.ToLower(option)
				if strings.Contains(strings.ToLower(g.Theme), opt) {
					return true
				}
				for _, s := range g.Setting {
					if strings.Contains(strings.ToLower(s), opt) {
						return true
					}
				}
				return false
			},
		},
	}
}
