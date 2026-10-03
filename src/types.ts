export interface Attack {
	name: string;
	ability: string;
	proficient: boolean;
	damage: string;
	damage_type: string;
	properties?: string[];
}

export const WEAPON_PROPERTIES = [
  "finesse",
  "light",
  "heavy",
  "reach",
  "thrown",
  "two-handed",
  "versatile",
  "ammunition",
  "loading",
] as const;

export type WeaponProperty = (typeof WEAPON_PROPERTIES)[number];

export interface Spell {
	name: string;
	link: string;
	prepared?: boolean;
}

export interface SpellLevel {
	total_slots: number;
	slots_expended: number;
	learned: Spell[];
}

export interface CharSpells {
	cantrips: Spell[];
	[levelKey: string]: SpellLevel | Spell[];
}

export interface DeathSaves {
	successes: boolean[];
	failures: boolean[];
}

export interface HitDice {
  total: number;
  used: number;
  die: string;
}

export interface DndCharacterFrontmatter {
	dnd_character?: boolean;
	name?: string;
	class?: string;
	level?: number;
	background?: string;
	ac?: number;
	speed?: number;
	race?: string;
	age?: number;
	height?: number;
	inspiration?: number;
	alignment?: string;
	deathsaves?: DeathSaves;
	hit_dice?: HitDice;
	abilities?: Record<string, number>;
	hp?: { current: number; max: number; temp: number };
	proficiency_bonus?: number;
	skills?: Record<string, boolean>;
	saving_throws?: Record<string, boolean>;
	currency?: Record<string, number>;
	inventory?: string[];
	attacks?: Attack[];
	traits?: string[];
	proficiencies?: string[];
	spells?: CharSpells;
	spellcasting?: string;
	[key: string]: unknown; // fallback for any other frontmatter keys not explicitly modeled
};
