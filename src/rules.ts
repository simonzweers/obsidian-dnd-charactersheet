import type { Attack } from "./types";

// Pure D&D 5e rules and constants. No Obsidian or Svelte dependencies.

export const MAX_SPELL_LEVEL = 9;

export const ABILITY_KEYS = ["str", "dex", "con", "int", "wis", "cha"] as const;

export const SKILLS = [
	{ skill: "Acrobatics", ability: "dex" },
	{ skill: "Animal Handling", ability: "wis" },
	{ skill: "Arcana", ability: "int" },
	{ skill: "Athletics", ability: "str" },
	{ skill: "Deception", ability: "cha" },
	{ skill: "History", ability: "int" },
	{ skill: "Insight", ability: "wis" },
	{ skill: "Intimidation", ability: "cha" },
	{ skill: "Investigation", ability: "int" },
	{ skill: "Medicine", ability: "wis" },
	{ skill: "Nature", ability: "int" },
	{ skill: "Perception", ability: "wis" },
	{ skill: "Performance", ability: "cha" },
	{ skill: "Persuasion", ability: "cha" },
	{ skill: "Religion", ability: "int" },
	{ skill: "Sleight of Hand", ability: "dex" },
	{ skill: "Stealth", ability: "dex" },
	{ skill: "Survival", ability: "wis" },
] as const;

export const CURRENCY_KEYS = ["cp", "sp", "ep", "gp", "pp"] as const;

export function getAbilityModifier(score: number) {
	return Math.floor((score - 10) / 2);
}

export function getSkillModifier(base: number, proficient: boolean, bonus: number) {
	return proficient ? base + bonus : base;
}

export const formatModifier = (mod: number) => (mod >= 0 ? `+${mod}` : `${mod}`);

export function getAttackBonus(
	attack: Attack,
	abilities: Record<string, number>,
	proficiencyBonus: number,
) {
	const isFinesse = attack.properties?.includes("finesse") ?? false;

	const abilityKeysToCheck = isFinesse ? ["str", "dex"] : [attack.ability?.toLowerCase()];
	const best = Math.max(
		...abilityKeysToCheck.map((a) =>
			abilities[a] !== undefined ? getAbilityModifier(abilities[a]) : -Infinity,
		),
	);
	const base = best === -Infinity ? 0 : best;
	const proficient = String(attack.proficient).toLowerCase() === "true";
	return proficient ? base + proficiencyBonus : base;
}

export function getSpellSaveDC(
	abilities: Record<string, number>,
	proficiencyBonus: number,
	scAbility: string,
) {
	return 8 + proficiencyBonus + getAbilityModifier(abilities[scAbility]);
}

export function getSpellAttackBonus(
	abilities: Record<string, number>,
	proficiencyBonus: number,
	scAbility: string,
) {
	return proficiencyBonus + getAbilityModifier(abilities[scAbility]);
}

/** All dice expressions in `text`, like "8d6", "d20" or "1d8 + 4". */
export function findDice(text: string): RegExpExecArray[] {
	// A regex literal is a fresh object on every call, so no lastIndex state leaks between calls.
	const regex = /\b\d*d(?:4|6|8|10|12|20|100)\b(?:\s*[+\-−]\s*\d+\b)?/g;
	const matches: RegExpExecArray[] = [];
	let match: RegExpExecArray | null;
	while ((match = regex.exec(text)) !== null) matches.push(match);
	return matches;
}
