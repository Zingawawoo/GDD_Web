package guesser

import "time"

// Core game data as stored in web/guesser/games.json
type Game struct {
	ID     int    `json:"id"`
	Name   string `json:"name"`
	Year   int    `json:"year"`
	Series string `json:"series"`

	ProtagonistType     string `json:"protagonist_type"`
	ProtagonistIdentity string `json:"protagonist_identity"`
	ProtagonistGender   string `json:"protagonist_gender"`
	ProtagonistRole     string `json:"protagonist_role"`

	WorldType       string `json:"world_type"`
	WorldSetting    string `json:"world_setting"`
	WorldOrigin     string `json:"world_origin"`
	TimePeriod      string `json:"time_period"`
	EnvironmentType string `json:"environment_type"`
	WorldTone       string `json:"world_tone"`

	StoryPresence        string   `json:"story_presence"`
	StoryStructure       string   `json:"story_structure"`
	StoryThemes          []string `json:"story_themes"`
	DialogueType         string   `json:"dialogue_type"`
	ChoicesImpact        string   `json:"choices_impact"`
	NarrativePerspective string   `json:"narrative_perspective"`

	PrimaryGenre string   `json:"primary_genre"`
	SubGenres    []string `json:"sub_genres"`
	Platforms    []string `json:"platforms"`

	CombatStyle      string   `json:"combat_style"`
	CombatPacing     string   `json:"combat_pacing"`
	CombatComplexity string   `json:"combat_complexity"`
	MovementType     string   `json:"movement_type"`
	EnemyTypes       []string `json:"enemy_types"`

	CameraView      string `json:"camera_view"`
	CameraBehavior  string `json:"camera_behavior"`
	VisualStyle     string `json:"visual_style"`
	ColorPalette    string `json:"color_palette"`
	GameStructure   string `json:"game_structure"`
	ProgressionType string `json:"progression_type"`
	CraftingSystem  string `json:"crafting_system"`
	LootSystem      string `json:"loot_system"`
	EconomicSystem  string `json:"economic_system"`
	PuzzlePresence  string `json:"puzzle_presence"`

	MultiplayerPresence string `json:"multiplayer_presence"`
	MultiplayerType     string `json:"multiplayer_type"`
	OnlineRequirement   string `json:"online_requirement"`
	CoopScale           string `json:"coop_scale"`
	PvpScale            string `json:"pvp_scale"`

	OverallTone   string   `json:"overall_tone"`
	PlayerEmotion string   `json:"player_emotion"`
	VibeTags      []string `json:"vibe_tags"`

	DifficultyStyle string `json:"difficulty_style"`
	ChallengeType   string `json:"challenge_type"`
	AveragePlaytime string `json:"average_playtime"`

	Pace          string `json:"pace"`
	ImmersionType string `json:"immersion_type"`
	RewardStyle   string `json:"reward_style"`

	ViolenceLevel string   `json:"violence_level"`
	MaturityLevel string   `json:"maturity_level"`
	MajorThemes   []string `json:"major_themes"`

	SpecialMechanics []string `json:"special_mechanics"`
	IconicFeatures   []string `json:"iconic_features"`
	WorldFeatures    []string `json:"world_features"`

	// Optional field: keep for compatibility if future datasets include images.
	ImageURL string `json:"imageUrl"`
}

// ----------------------------
// Session
// ----------------------------
type Session struct {
	ID            string
	CreatedAt     time.Time
	MysteryGameID int

	Lives         int
	MaxReveals    int
	RevealedCount int

	UsedCategories map[string]bool

	BlurPath string
}

type GameSummary struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	ImageURL string `json:"imageUrl"`
}
