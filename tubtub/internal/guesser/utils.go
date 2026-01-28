package guesser

import (
	"strings"
)

var placeholderTokens = map[string]bool{
	"null":    true,
	"n/a":     true,
	"na":      true,
	"unknown": true,
	"unk":     true,
	"tbd":     true,
	"-":       true,
	"?":       true,
	"other":   true,
	"n\\a":    true,
	"n/a.":    true,
	"not set": true,
	"n/a ":    true,
}

func isPlaceholder(s string) bool {
	ls := strings.ToLower(strings.TrimSpace(s))
	return placeholderTokens[ls]
}

// CleanString returns "" if the value is empty or a placeholder like "null".
func CleanString(in string) string {
	in = strings.TrimSpace(in)
	if in == "" {
		return ""
	}
	if isPlaceholder(in) {
		return ""
	}
	return in
}

func CleanList(in []string, max int) []string {
	if len(in) == 0 {
		return nil
	}

	seen := map[string]bool{}
	out := []string{}

	for _, v := range in {
		t := strings.TrimSpace(v)
		if t == "" || isPlaceholder(t) {
			continue
		}
		l := strings.ToLower(t)
		if seen[l] {
			continue
		}
		seen[l] = true
		out = append(out, t)
		if max > 0 && len(out) >= max {
			break
		}
	}

	if len(out) == 0 {
		return nil
	}
	return out
}

func CategoryHasValue(g *Game, cat string) bool {
	if g == nil {
		return false
	}
	v := ExtractCategoryValue(g, cat)
	return v != nil
}

func ExtractCategoryValue(g *Game, cat string) interface{} {
	switch cat {
	case "year":
		if g.Year > 0 {
			return g.Year
		}
		return nil

	case "primary_genre":
		if v := CleanString(g.PrimaryGenre); v != "" {
			return v
		}
		return nil
	case "sub_genres":
		return CleanList(g.SubGenres, 10)
	case "platforms":
		return CleanList(g.Platforms, 10)
	case "series":
		if v := CleanString(g.Series); v != "" {
			return v
		}
		return nil

	case "protagonist_type":
		if v := CleanString(g.ProtagonistType); v != "" {
			return v
		}
		return nil
	case "protagonist_identity":
		if v := CleanString(g.ProtagonistIdentity); v != "" {
			return v
		}
		return nil
	case "protagonist_gender":
		if v := CleanString(g.ProtagonistGender); v != "" {
			return v
		}
		return nil
	case "protagonist_role":
		if v := CleanString(g.ProtagonistRole); v != "" {
			return v
		}
		return nil

	case "world_type":
		if v := CleanString(g.WorldType); v != "" {
			return v
		}
		return nil
	case "world_setting":
		if v := CleanString(g.WorldSetting); v != "" {
			return v
		}
		return nil
	case "world_origin":
		if v := CleanString(g.WorldOrigin); v != "" {
			return v
		}
		return nil
	case "time_period":
		if v := CleanString(g.TimePeriod); v != "" {
			return v
		}
		return nil
	case "environment_type":
		if v := CleanString(g.EnvironmentType); v != "" {
			return v
		}
		return nil
	case "world_tone":
		if v := CleanString(g.WorldTone); v != "" {
			return v
		}
		return nil

	case "story_presence":
		if v := CleanString(g.StoryPresence); v != "" {
			return v
		}
		return nil
	case "story_structure":
		if v := CleanString(g.StoryStructure); v != "" {
			return v
		}
		return nil
	case "story_themes":
		return CleanList(g.StoryThemes, 10)
	case "dialogue_type":
		if v := CleanString(g.DialogueType); v != "" {
			return v
		}
		return nil
	case "choices_impact":
		if v := CleanString(g.ChoicesImpact); v != "" {
			return v
		}
		return nil
	case "narrative_perspective":
		if v := CleanString(g.NarrativePerspective); v != "" {
			return v
		}
		return nil

	case "combat_style":
		if v := CleanString(g.CombatStyle); v != "" {
			return v
		}
		return nil
	case "combat_pacing":
		if v := CleanString(g.CombatPacing); v != "" {
			return v
		}
		return nil
	case "combat_complexity":
		if v := CleanString(g.CombatComplexity); v != "" {
			return v
		}
		return nil
	case "movement_type":
		if v := CleanString(g.MovementType); v != "" {
			return v
		}
		return nil
	case "enemy_types":
		return CleanList(g.EnemyTypes, 10)

	case "camera_view":
		if v := CleanString(g.CameraView); v != "" {
			return v
		}
		return nil
	case "camera_behavior":
		if v := CleanString(g.CameraBehavior); v != "" {
			return v
		}
		return nil
	case "visual_style":
		if v := CleanString(g.VisualStyle); v != "" {
			return v
		}
		return nil
	case "color_palette":
		if v := CleanString(g.ColorPalette); v != "" {
			return v
		}
		return nil
	case "game_structure":
		if v := CleanString(g.GameStructure); v != "" {
			return v
		}
		return nil
	case "progression_type":
		if v := CleanString(g.ProgressionType); v != "" {
			return v
		}
		return nil
	case "crafting_system":
		if v := CleanString(g.CraftingSystem); v != "" {
			return v
		}
		return nil
	case "loot_system":
		if v := CleanString(g.LootSystem); v != "" {
			return v
		}
		return nil
	case "economic_system":
		if v := CleanString(g.EconomicSystem); v != "" {
			return v
		}
		return nil
	case "puzzle_presence":
		if v := CleanString(g.PuzzlePresence); v != "" {
			return v
		}
		return nil

	case "multiplayer_presence":
		if v := CleanString(g.MultiplayerPresence); v != "" {
			return v
		}
		return nil
	case "multiplayer_type":
		if v := CleanString(g.MultiplayerType); v != "" {
			return v
		}
		return nil
	case "online_requirement":
		if v := CleanString(g.OnlineRequirement); v != "" {
			return v
		}
		return nil
	case "coop_scale":
		if v := CleanString(g.CoopScale); v != "" {
			return v
		}
		return nil
	case "pvp_scale":
		if v := CleanString(g.PvpScale); v != "" {
			return v
		}
		return nil

	case "overall_tone":
		if v := CleanString(g.OverallTone); v != "" {
			return v
		}
		return nil
	case "player_emotion":
		if v := CleanString(g.PlayerEmotion); v != "" {
			return v
		}
		return nil
	case "vibe_tags":
		return CleanList(g.VibeTags, 10)

	case "difficulty_style":
		if v := CleanString(g.DifficultyStyle); v != "" {
			return v
		}
		return nil
	case "challenge_type":
		if v := CleanString(g.ChallengeType); v != "" {
			return v
		}
		return nil
	case "average_playtime":
		if v := CleanString(g.AveragePlaytime); v != "" {
			return v
		}
		return nil

	case "pace":
		if v := CleanString(g.Pace); v != "" {
			return v
		}
		return nil
	case "immersion_type":
		if v := CleanString(g.ImmersionType); v != "" {
			return v
		}
		return nil
	case "reward_style":
		if v := CleanString(g.RewardStyle); v != "" {
			return v
		}
		return nil

	case "violence_level":
		if v := CleanString(g.ViolenceLevel); v != "" {
			return v
		}
		return nil
	case "maturity_level":
		if v := CleanString(g.MaturityLevel); v != "" {
			return v
		}
		return nil
	case "major_themes":
		return CleanList(g.MajorThemes, 10)

	case "special_mechanics":
		return CleanList(g.SpecialMechanics, 10)
	case "iconic_features":
		return CleanList(g.IconicFeatures, 10)
	case "world_features":
		return CleanList(g.WorldFeatures, 10)

	default:
		return nil
	}
}
