package guesser

import "time"

// Answer is a yes/no answer for a question.
type Answer string

const (
	AnswerYes Answer = "yes"
	AnswerNo  Answer = "no"
)

// Game mirrors the structure of your games.json entries.
// If you add more fields later, just extend this struct.
type Game struct {
	// -------------------------
	// Core Identity
	// -------------------------
	ID        int    `json:"id"`           // Your own ID
	RawgID    int    `json:"rawg_id"`      // RAWG numeric ID
	Slug      string `json:"slug"`         // RAWG slug
	Name      string `json:"name"`
	Year      int    `json:"year"`         // Parsed from RAWG.released
	Released  string `json:"released"`     // "YYYY-MM-DD"

	// -------------------------
	// Platforms & Distribution
	// -------------------------
	Platforms      []string `json:"platforms"`       // Your simpler list
	ParentPlatforms []string `json:"parent_platforms"` // RAWG PC/Console/Mobile grouping
	Stores         []string `json:"stores"`          // Steam, Epic, PSN, etc.

	// -------------------------
	// Genres, Tags, Themes
	// -------------------------
	Genres       []string `json:"genres"`        // Your list
	MainGenre    string   `json:"main_genre"`
	Tags         []string `json:"tags"`          // RAWG “tags” = goldmine
	Theme        string   `json:"theme"`
	Tone         []string `json:"tone"`
	VisualStyle  []string `json:"visual_style"`
	CombatStyle  []string `json:"combat_style"`
	StructureFeatures []string `json:"structure_features"`
	Mood         []string `json:"mood"`
	Setting      []string `json:"setting"`

	// -------------------------
	// Gameplay Characteristics
	// -------------------------
	Perspective   string   `json:"perspective"`
	WorldType     string   `json:"world_type"`
	Camera        string   `json:"camera"`
	Difficulty    string   `json:"difficulty"`
	Replayability string   `json:"replayability"`

	// -------------------------
	// Developers / Production
	// -------------------------
	DeveloperBucket string   `json:"developer_bucket"`
	DeveloperRegion string   `json:"developer_region"`
	Developers      []string `json:"developers"` // RAWG
	Publishers      []string `json:"publishers"` // RAWG
	Franchise       string   `json:"franchise"`
	FranchiseEntry  string   `json:"franchise_entry"`

	// -------------------------
	// Ratings
	// -------------------------
	ESRB       string `json:"esrb"`
	AgeRating  string `json:"age_rating"`
	ViolenceLevel string `json:"violence_level"`
	RawgESRB   string `json:"rawg_esrb"` // RAWG official ESRB
	Metacritic int    `json:"metacritic"`
	Playtime   int    `json:"playtime"` // RAWG average playtime

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


var RevealCategories = []string{
    "theme", "tags", "platforms", "genres", "playtime", "metacritic",
    "developers", "publishers", "camera", "perspective", "world_type",
    "tone", "visual_style", "combat_style", "structure_features",
    "esrb", "age_rating", "developer_region", "multiplayer", "co_op",
}


// GameSummary is what we send back to the frontend.
type GameSummary struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	ImageURL string `json:"imageUrl,omitempty"`
}

// QuestionTemplate represents one backend question type.
type QuestionTemplate struct {
	ID    string
	Label string
	// Match returns true if this game should answer YES
	// to the given option (e.g. "PC", "Fantasy", etc.).
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

type RevealRequest struct {
    SessionID string `json:"sessionId"`
    Category  string `json:"category"`
}

// GuessRequest is the POST body for /guess.
type GuessRequest struct {
	Guess string `json:"guess"`
}

// GuessResponse is the JSON response for /guess.
type GuessResponse struct {
	Correct bool        `json:"correct"`
	Game    GameSummary `json:"game"`
}

// Session is one active game session.
type Session struct {
	ID             string
	CreatedAt      time.Time
	MysteryGameID  int
	CandidateIDs   map[int]bool // set of candidate game IDs
	LastQuestionAt time.Time
	QuestionAsked int `json:"questionAsked"`
	Lives 	   int `json:"lives"`
	RevealedCount int `json:"revealedCount"`
	UsedCategories map[string]bool `json:"usedCategories"`
}


func RandomCategories(used map[string]bool) []string {
    var available []string

    for _, c := range RevealCategories {
        if !used[c] {
            available = append(available, c)
        }
    }

    if len(available) <= 5 {
        return available
    }

    rand.Shuffle(len(available), func(i, j int) {
        available[i], available[j] = available[j], available[i]
    })

    return available[:5]
}

func ExtractCategoryValue(g *Game, cat string) interface{} {
    switch cat {
    case "platforms":
        return g.Platforms
    case "genres":
        return g.Genres
    case "playtime":
        return g.Playtime
    case "metacritic":
        return g.Metacritic
    case "developers":
        return g.Developers
    case "publishers":
        return g.Publishers
    case "camera":
        return g.Camera
    case "perspective":
        return g.Perspective
    case "world_type":
        return g.WorldType
    case "tone":
        return g.Tone
    case "visual_style":
        return g.VisualStyle
    case "combat_style":
        return g.CombatStyle
    case "structure_features":
        return g.StructureFeatures
    case "esrb":
        return g.ESRB
    case "age_rating":
        return g.AgeRating
    case "developer_region":
        return g.DeveloperRegion
    case "multiplayer":
        return g.Multiplayer
    case "co_op":
        return g.CoOp
    case "theme":
        return g.Theme
    case "tags":
        return g.Tags
    default:
        return nil
    }
}
