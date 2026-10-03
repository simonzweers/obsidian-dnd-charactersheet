import type { TFile } from "obsidian";
import type { Attack, CharSpells, DeathSaves, DndCharacterFrontmatter, HitDice } from "./types";

/** Turns raw frontmatter into the props for CharacterSheet, filling in defaults. */
export function normalizeCharacter(file: TFile, frontmatter: DndCharacterFrontmatter) {
	const char_deathsaves: DeathSaves = frontmatter.deathsaves ?? {
		successes: [false, false, false],
		failures: [false, false, false],
	};
	const char_hit_dice: HitDice = {
		total: 1, used: 0, die: "d8",
		...(frontmatter.hit_dice ?? {}),
	};
	const char_attacks: Attack[] = frontmatter.attacks ?? [];
	const char_spells: CharSpells = {
		cantrips: [],
		...(frontmatter.spells ?? {}),
	};

	return {
		char_name: file.basename,
		char_class: frontmatter.class ?? "",
		char_level: frontmatter.level ?? 1,
		char_background: frontmatter.background ?? "No Background",
		char_ac: frontmatter.ac ?? 10,
		char_speed: frontmatter.speed ?? 30,
		char_race: frontmatter.race ?? "Human",
		char_age: frontmatter.age ?? 18,
		char_height: frontmatter.height ?? 150,
		char_inspiration: frontmatter.inspiration ?? 0,
		char_alignment: frontmatter.alignment ?? "",
		char_deathsaves,
		char_hit_dice,
		char_abilities: {
			str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
			...(frontmatter.abilities ?? {}),
		},
		char_hp: {
			current: 0, max: 0, temp: 0,
			...(frontmatter.hp ?? {}),
		},
		char_proficiency_bonus: frontmatter.proficiency_bonus ?? 2,
		char_skills: frontmatter.skills ?? {},
		char_saving_throws: frontmatter.saving_throws ?? {},
		char_currency: {
			cp: 0, sp: 0, ep: 0, gp: 0, pp: 0,
			...(frontmatter.currency ?? {}),
		},
		char_inventory: frontmatter.inventory ?? [],
		char_attacks,
		char_traits: frontmatter.traits ?? [],
		char_proficiencies: frontmatter.proficiencies ?? [],
		char_spells,
		char_spellcasting: frontmatter.spellcasting ?? "int",
	};
}
