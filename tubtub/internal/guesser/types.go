package guesser

import (
	"math/rand"
	"strings"
	"time"
)

// Answer is a yes/no answer for a question.
type Answer string

const (
	AnswerYes Answer = "yes"
	AnswerNo  Answer = "no"
)

// Game mirrors the structure of your games.json entries.
type Game struct {
	// -------------------------
	// Core Identity
	// -------------------------
	ID       int    `json:"id"`        // Your own ID
	RawgID   int    `json:"rawg_id"`   // RAWG numeric ID
	Slug     string `json:"slug"`      // RAWG slug
	Name     string `json:"name"`
	Year     int    `json:"year"`      // Parsed from RAWG.released
	Released string `json:"released"`  // "YYYY-MM-DD"

	// -------------------------
	// Platforms & Distribution
	// -------------------------
	Platforms       []string `json:"platforms"`         // Your simpler list
	ParentPlatforms []string `json:"parent_platforms"` // RAWG PC/Console/Mobile grouping
	Stores          []string `json:"stores"`           // Steam, Epic, PSN, etc.

	// -------------------------
	// Genres, Tags, Themes
	// -------------------------
	Genres           []string `json:"genres"`         // Your list
	MainGenre        string   `json:"main_genre"`
	Tags             []string `json:"tags"`           // RAWG "tags"
	Theme            string   `json:"theme"`
	Tone             []string `json:"tone"`
	VisualStyle      []string `json:"visual_style"`
	CombatStyle      []string `json:"combat_style"`
	StructureFeatures []string `json:"structure_features"`
	Mood             []string `json:"mood"`
	Setting          []string `json:"setting"`

	// -------------------------
	// Gameplay Characteristics
	// -------------------------
	Perspective   string `json:"perspective"`
	WorldType     string `json:"world_type"`
	Camera        string `json:"camera"`
	Difficulty    string `json:"difficulty"`
	Replayability string `json:"replayability"`

	// -------------------------
	// Developers / Production
	// -------------------------
	DeveloperBucket string   `json:"developer_bucket"`
	DeveloperRegion string   `json:"developer_region"`
	Developers      []string `json:"developers"`
	Publishers      []string `json:"publishers"`
	Franchise       string   `json:"franchise"`
	FranchiseEntry  string   `json:"franchise_entry"`

	// -------------------------
	// Ratings
	// -------------------------
	ESRB          string `json:"esrb"`
	AgeRating     string `json:"age_rating"`
	ViolenceLevel string `json:"violence_level"`
	RawgESRB      string `json:"rawg_esrb"` // RAWG official ESRB name
	Metacritic    int    `json:"metacritic"`
	Playtime      int    `json:"playtime"` // RAWG average playtime

	// -------------------------
	// Modes & Multiplayer
	// -------------------------
	Multiplayer     bool   `json:"multiplayer"`
	CoOp            bool   `json:"co_op"`
	OnlineOnly      bool   `json:"online_only"`
	MultiplayerMode string `json:"multiplayer_mode"`

	// -------------------------
	// Monetization
	// -------------------------
	Monetization []string `json:"monetization"`

	// -------------------------
	// Images / Media
	// -------------------------
	ImageURL           string   `json:"imageUrl,omitempty"`
	AdditionalImageURL string   `json:"image_additional,omitempty"`
	Screenshots        []string `json:"screenshots,omitempty"` // RAWG short_screenshots

	// -------------------------
	// Scoring / Internal Use
	// -------------------------
	ScoreBucket string `json:"score_bucket"`
}

// RevealCategories is the full pool of possible reveal categories.
// The lottery will pick from these, filtered per-game so only categories
// with real data are offered.
var RevealCategories = []string{
	// Identity / release
	"year",

	// Platforms / distribution
	"platforms",
	"parent_platforms",
	"stores",

	// Genres / tags / style
	"genres",
	"main_genre",
	"tags",
	"theme",
	"tone",
	"visual_style",
	"combat_style",
	"structure_features",
	"mood",
	"setting",

	// Gameplay
	"camera",
	"perspective",
	"world_type",
	"difficulty",
	"replayability",

	// Dev / production
	"developers",
	"publishers",
	"developer_region",
	"franchise",
	"franchise_entry",

	// Ratings / quality
	"esrb",
	"age_rating",
	"violence_level",
	"metacritic",
	"playtime",
	"score_bucket",

	// Modes & multiplayer
	"multiplayer",
	"co_op",
	"online_only",
	"multiplayer_mode",

	// Monetization
	"monetization",
}

// GameSummary is what we send back to the frontend when we reveal a game.
type GameSummary struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	ImageURL string `json:"imageUrl,omitempty"`
}

// QuestionTemplate represents one backend question type (legacy /ask system).
type QuestionTemplate struct {
	ID    string
	Label string
	// Match returns true if this game should answer YES to the given option.
	Match func(g *Game, option string) bool
}

// QuestionRequest is the POST body for /ask.
type QuestionRequest struct {
	QuestionTypeID string `json:"questionTypeId"`
	Option         string `json:"option"`
}

// QuestionResponse is the JSON response for /ask.
type QuestionResponse struct {
	Answer          Answer `json:"answer"`
	CandidatesCount int    `json:"candidatesCount"`
}

// RevealRequest is the POST body for /api/session/reveal.
type RevealRequest struct {
	SessionID string `json:"sessionId"`
	Category  string `json:"category"`
}

// GuessRequest is the POST body for /guess (body only carries the guess;
// the session ID comes from the URL path).
type GuessRequest struct {
	Guess string `json:"guess"`
}

// GuessResponse is the JSON response for /guess.
type GuessResponse struct {
	Correct bool        `json:"correct"`
	Lives   int         `json:"lives"`
	Win     bool        `json:"win"`
	Lose    bool        `json:"lose"`
	Game    GameSummary `json:"game"`
}

// Session is one active game session.
type Session struct {
	ID            string
	CreatedAt     time.Time
	MysteryGameID int

	// Legacy question system
	CandidateIDs   map[int]bool
	LastQuestionAt time.Time
	QuestionAsked  int `json:"questionAsked"`

	// New lottery + lives system
	Lives         int               `json:"lives"`
	RevealedCount int               `json:"revealedCount"`
	UsedCategories map[string]bool  `json:"usedCategories"`
}

// RandomCategories returns up to 5 random categories from the global
// RevealCategories pool that:
//
//   - are not in "used"
//   - actually have data for this specific game
func RandomCategories(g *Game, used map[string]bool) []string {
	var available []string

	for _, c := range RevealCategories {
		if used != nil && used[c] {
			continue
		}
		if !CategoryHasValue(g, c) {
			continue
		}
		available = append(available, c)
	}

	if len(available) <= 5 {
		return available
	}

	rand.Shuffle(len(available), func(i, j int) {
		available[i], available[j] = available[j], available[i]
	})

	return available[:5]
}

// ExtractCategoryValue returns the cleaned value for a given category ID.
// It returns:
//   - int, bool, or string for scalar values
//   - []string for multi-valued categories
//   - nil if there is nothing useful to show for this game+category
func ExtractCategoryValue(g *Game, cat string) interface{} {
	switch cat {
	// Identity
	case "year":
		if g.Year > 0 {
			return g.Year
		}
		return nil

	// Platforms
	case "platforms":
		vals := CleanStringList(g.Platforms, 5)
		if len(vals) == 0 {
			return nil
		}
		return vals
	case "parent_platforms":
		vals := CleanStringList(g.ParentPlatforms, 5)
		if len(vals) == 0 {
			return nil
		}
		return vals
	case "stores":
		vals := CleanStringList(g.Stores, 5)
		if len(vals) == 0 {
			return nil
		}
		return vals

	// Genres / tags / style
	case "genres":
		vals := CleanStringList(g.Genres, 5)
		if len(vals) == 0 {
			return nil
		}
		return vals
	case "main_genre":
		if strings.TrimSpace(g.MainGenre) == "" {
			return nil
		}
		return g.MainGenre
	case "tags":
		vals := CleanStringList(g.Tags, 5)
		if len(vals) == 0 {
			return nil
		}
		return vals
	case "theme":
		if strings.TrimSpace(g.Theme) == "" {
			return nil
		}
		return g.Theme
	case "tone":
		vals := CleanStringList(g.Tone, 5)
		if len(vals) == 0 {
			return nil
		}
		return vals
	case "visual_style":
		vals := CleanStringList(g.VisualStyle, 5)
		if len(vals) == 0 {
			return nil
		}
		return vals
	case "combat_style":
		vals := CleanStringList(g.CombatStyle, 5)
		if len(vals) == 0 {
			return nil
		}
		return vals
	case "structure_features":
		vals := CleanStringList(g.StructureFeatures, 5)
		if len(vals) == 0 {
			return nil
		}
		return vals
	case "mood":
		vals := CleanStringList(g.Mood, 5)
		if len(vals) == 0 {
			return nil
		}
		return vals
	case "setting":
		vals := CleanStringList(g.Setting, 5)
		if len(vals) == 0 {
			return nil
		}
		return vals

	// Gameplay
	case "camera":
		if strings.TrimSpace(g.Camera) == "" {
			return nil
		}
		return g.Camera
	case "perspective":
		if strings.TrimSpace(g.Perspective) == "" {
			return nil
		}
		return g.Perspective
	case "world_type":
		if strings.TrimSpace(g.WorldType) == "" {
			return nil
		}
		return g.WorldType
	case "difficulty":
		if strings.TrimSpace(g.Difficulty) == "" {
			return nil
		}
		return g.Difficulty
	case "replayability":
		if strings.TrimSpace(g.Replayability) == "" {
			return nil
		}
		return g.Replayability

	// Dev / production
	case "developers":
		vals := CleanStringList(g.Developers, 5)
		if len(vals) == 0 {
			return nil
		}
		return vals
	case "publishers":
		vals := CleanStringList(g.Publishers, 5)
		if len(vals) == 0 {
			return nil
		}
		return vals
	case "developer_region":
		if strings.TrimSpace(g.DeveloperRegion) == "" {
			return nil
		}
		return g.DeveloperRegion
	case "franchise":
		if strings.TrimSpace(g.Franchise) == "" {
			return nil
		}
		return g.Franchise
	case "franchise_entry":
		if strings.TrimSpace(g.FranchiseEntry) == "" {
			return nil
		}
		return g.FranchiseEntry

	// Ratings / quality
	case "esrb":
		if strings.TrimSpace(g.ESRB) != "" {
			return g.ESRB
		}
		if strings.TrimSpace(g.RawgESRB) != "" {
			return g.RawgESRB
		}
		return nil
	case "age_rating":
		if strings.TrimSpace(g.AgeRating) == "" {
			return nil
		}
		return g.AgeRating
	case "violence_level":
		if strings.TrimSpace(g.ViolenceLevel) == "" {
			return nil
		}
		return g.ViolenceLevel
	case "metacritic":
		if g.Metacritic <= 0 {
			return nil
		}
		return g.Metacritic
	case "playtime":
		if g.Playtime <= 0 {
			return nil
		}
		return g.Playtime
	case "score_bucket":
		if strings.TrimSpace(g.ScoreBucket) == "" {
			return nil
		}
		return g.ScoreBucket

	// Modes & multiplayer
	case "multiplayer":
		// bool is always informative: true or false
		return g.Multiplayer
	case "co_op":
		return g.CoOp
	case "online_only":
		return g.OnlineOnly
	case "multiplayer_mode":
		if strings.TrimSpace(g.MultiplayerMode) == "" {
			return nil
		}
		return g.MultiplayerMode

	// Monetization
	case "monetization":
		vals := CleanStringList(g.Monetization, 4)
		if len(vals) == 0 {
			return nil
		}
		return vals
	}

	return nil
}

// CleanStringList normalises, de-duplicates, filters generic/noisy
// values, and caps the list length. Returns nil if nothing survives.
func CleanStringList(in []string, max int) []string {
	if len(in) == 0 {
		return nil
	}

	seen := make(map[string]bool)
	var out []string

	for _, raw := range in {
		trimmed := strings.TrimSpace(raw)
		if trimmed == "" {
			continue
		}

		lower := strings.ToLower(trimmed)
		if seen[lower] {
			continue
		}
		if shouldSkipGenericTag(lower) {
			continue
		}

		seen[lower] = true
		out = append(out, trimmed)

		if max > 0 && len(out) >= max {
			break
		}
	}

	if len(out) == 0 {
		return nil
	}

	return out
}

// shouldSkipGenericTag removes noisy "every game has this" tags like
// "Singleplayer", "Steam Achievements", "Controller support", etc.
func shouldSkipGenericTag(lower string) bool {
	switch lower {
	case "singleplayer",
		"single-player",
		"multiplayer",
		"co-op",
		"co op",
		"cooperative",
		"online co-op",
		"online coop",
		"steam achievements",
		"achievements":
		return true
	}

	if strings.Contains(lower, "controller support") {
		return true
	}
	if strings.Contains(lower, "full controller support") {
		return true
	}
	if strings.Contains(lower, "steam cloud") {
		return true
	}
	if strings.Contains(lower, "trading cards") {
		return true
	}

	return false
}

// CategoryHasValue decides whether a category has meaningful data for this game.
// This is used to filter the lottery options.
func CategoryHasValue(g *Game, cat string) bool {
	// Bool categories are always informative (true or false).
	switch cat {
	case "multiplayer", "co_op", "online_only":
		return true
	}

	v := ExtractCategoryValue(g, cat)
	if v == nil {
		return false
	}

	switch typed := v.(type) {
	case string:
		return strings.TrimSpace(typed) != ""
	case []string:
		return len(typed) > 0
	case int:
		return typed > 0
	default:
		return true
	}
}
