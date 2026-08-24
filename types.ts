export interface Attack {
	name: string;
	ability: string;
	proficient: boolean;
	damage: string;
	damage_type: string;
}

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

export interface DndCharacterFrontmatter {
	dnd_character?: boolean;
	name?: string;
	class?: string;
	level?: number;
	background?: string;
	ac?: number;
	speed?: number;
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
