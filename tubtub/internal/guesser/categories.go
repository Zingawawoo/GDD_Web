package guesser

import "math/rand"

// all possible category fields
var allCategories = []string{
	"primary_genre",
	"sub_genres",
	"platforms",
	"series",
	"protagonist_type",
	"protagonist_identity",
	"protagonist_gender",
	"protagonist_role",
	"world_type",
	"world_setting",
	"world_origin",
	"time_period",
	"environment_type",
	"world_tone",
	"story_presence",
	"story_structure",
	"story_themes",
	"dialogue_type",
	"choices_impact",
	"narrative_perspective",
	"combat_style",
	"combat_pacing",
	"combat_complexity",
	"movement_type",
	"enemy_types",
	"camera_view",
	"camera_behavior",
	"visual_style",
	"color_palette",
	"game_structure",
	"progression_type",
	"crafting_system",
	"loot_system",
	"economic_system",
	"puzzle_presence",
	"multiplayer_presence",
	"multiplayer_type",
	"online_requirement",
	"coop_scale",
	"pvp_scale",
	"overall_tone",
	"player_emotion",
	"vibe_tags",
	"difficulty_style",
	"challenge_type",
	"average_playtime",
	"pace",
	"immersion_type",
	"reward_style",
	"violence_level",
	"maturity_level",
	"major_themes",
	"special_mechanics",
	"iconic_features",
	"world_features",
	"year",
}

// return ALL currently available unused categories in random order
func RandomCategories(g *Game, used map[string]bool) []string {
	var available []string

	for _, c := range allCategories {
		if used[c] {
			continue
		}
		if CategoryHasValue(g, c) {
			available = append(available, c)
		}
	}

	rand.Shuffle(len(available), func(i, j int) {
		available[i], available[j] = available[j], available[i]
	})

	// roulette: only return up to 3 fresh options
	if len(available) > 3 {
		return available[:3]
	}
	return available
}
