<script lang="ts">
	import type { App, TFile } from "obsidian";
	import { makeSaver } from "../frontmatter";
	import type { Attack, CharSpells, DeathSaves, HitDice } from "../types";

	import Abilities from "./Abilities.svelte";
	import Attacks from "./Attacks.svelte";
	import BasicInfo from "./BasicInfo.svelte";
	import DeathSavesBlock from "./DeathSaves.svelte";
	import EditableList from "./EditableList.svelte";
	import HitDiceBlock from "./HitDice.svelte";
	import HitPoints from "./HitPoints.svelte";
	import Money from "./Money.svelte";
	import SavingThrows from "./SavingThrows.svelte";
	import Skills from "./Skills.svelte";
	import Spells from "./Spells.svelte";

	// Props come from normalizeCharacter() in src/character.ts.
	export let app: App;
	export let file: TFile;
	export let char_name: string;
	export let char_class: string;
	export let char_level: number;
	export let char_background: string;
	export let char_ac: number;
	export let char_race: string;
	export let char_age: number;
	export let char_height: number;
	export let char_inspiration: number;
	export let char_alignment: string;
	export let char_deathsaves: DeathSaves;
	export let char_hit_dice: HitDice;
	export let char_speed: number;
	export let char_abilities: Record<string, number>;
	export let char_hp: Record<string, number>;
	export let char_proficiency_bonus: number;
	export let char_skills: Record<string, boolean>;
	export let char_saving_throws: Record<string, boolean>;
	export let char_currency: Record<string, number>;
	export let char_inventory: string[];
	export let char_attacks: Attack[];
	export let char_traits: string[];
	export let char_proficiencies: string[];
	export let char_spells: CharSpells;
	export let char_spellcasting: string;

	const save = makeSaver(app, file);
</script>

<div class="sheet-container">
	<h1>Character Name: {char_name}</h1>

	<BasicInfo
		{save}
		bind:char_class
		bind:char_level
		bind:char_background
		bind:char_proficiency_bonus
		bind:char_ac
		bind:char_speed
		bind:char_race
		bind:char_age
		bind:char_height
		bind:char_inspiration
		bind:char_alignment
		{char_abilities}
	/>

	<HitDiceBlock {save} bind:char_hit_dice />
	<DeathSavesBlock {save} bind:char_deathsaves />
	<HitPoints {save} bind:char_hp />
	<Abilities {save} bind:char_abilities />
	<Skills {save} bind:char_skills {char_abilities} {char_proficiency_bonus} />
	<SavingThrows {save} bind:char_saving_throws {char_abilities} {char_proficiency_bonus} />

	<div>
		<h2>Other Skills & Proficiencies</h2>
		<EditableList
			{save}
			field="proficiencies"
			placeholder="New Proficiency"
			bind:items={char_proficiencies}
		/>
	</div>

	<div class="money-inventory-row">
		<Money {save} bind:char_currency />

		<div class="inventory-section">
			<h2>Inventory</h2>
			<EditableList
				{save}
				field="inventory"
				placeholder="New item"
				bind:items={char_inventory}
			/>
		</div>
	</div>

	<Attacks {save} bind:char_attacks {char_abilities} {char_proficiency_bonus} />

	<div>
		<h2>Features & Traits</h2>
		<EditableList
			{save}
			field="traits"
			placeholder="New trait"
			editable
			bind:items={char_traits}
		/>
	</div>

	<Spells
		{save}
		bind:char_spells
		bind:char_spellcasting
		{char_abilities}
		{char_proficiency_bonus}
	/>
</div>
