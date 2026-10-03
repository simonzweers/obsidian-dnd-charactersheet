<script lang="ts">
	import type { Save } from "../frontmatter";
	import { formatModifier, getAbilityModifier } from "../rules";

	export let save: Save;
	export let char_class: string;
	export let char_level: number;
	export let char_background: string;
	export let char_proficiency_bonus: number;
	export let char_ac: number;
	export let char_speed: number;
	export let char_race: string;
	export let char_age: number;
	export let char_height: number;
	export let char_inspiration: number;
	export let char_alignment: string;
	export let char_abilities: Record<string, number>;

	function write(field: string, value: string | number) {
		return save((fm) => {
			fm[field] = value;
		});
	}
</script>

<div class="stat-grid">
	<div class="stat-row">
		<span>Class</span>
		<input
			class="text-input"
			type="text"
			value={char_class}
			on:change={(e) => write("class", (char_class = e.currentTarget.value))}
		/>
	</div>

	<div class="stat-row">
		<span>Lvl</span>
		<input
			class="num-input"
			type="number"
			value={char_level}
			on:change={(e) =>
				write("level", (char_level = Number(e.currentTarget.value)))}
		/>
	</div>

	<div class="stat-row">
		<span>Background</span>
		<input
			class="text-input"
			type="text"
			value={char_background}
			on:change={(e) =>
				write("background", (char_background = e.currentTarget.value))}
		/>
	</div>

	<div class="stat-row">
		<span>Proficiency Bonus</span>
		<input
			class="num-input"
			type="number"
			value={char_proficiency_bonus}
			on:change={(e) =>
				write(
					"proficiency_bonus",
					(char_proficiency_bonus = Number(e.currentTarget.value)),
				)}
		/>
	</div>

	<div class="stat-row">
		<span>Armor Class</span>
		<input
			class="num-input"
			type="number"
			value={char_ac}
			on:change={(e) => write("ac", (char_ac = Number(e.currentTarget.value)))}
		/>
	</div>

	<div class="stat-row">
		<span>Speed</span>
		<input
			class="num-input"
			type="number"
			value={char_speed}
			on:change={(e) =>
				write("speed", (char_speed = Number(e.currentTarget.value)))}
		/>
	</div>

	<div class="stat-row">
		<span>Race</span>
		<input
			class="text-input"
			type="text"
			value={char_race}
			on:change={(e) => write("race", (char_race = e.currentTarget.value))}
		/>
	</div>

	<div class="stat-row">
		<span>Age</span>
		<input
			class="num-input"
			type="number"
			value={char_age}
			on:change={(e) => write("age", (char_age = Number(e.currentTarget.value)))}
		/>
	</div>

	<div class="stat-row">
		<span>Height (cm)</span>
		<input
			class="num-input"
			type="number"
			value={char_height}
			on:change={(e) =>
				write("height", (char_height = Number(e.currentTarget.value)))}
		/>
	</div>

	<div class="stat-row">
		<span>Inspiration</span>
		<input
			class="num-input"
			type="number"
			value={char_inspiration}
			on:change={(e) =>
				write("inspiration", (char_inspiration = Number(e.currentTarget.value)))}
		/>
	</div>

	<div class="stat-row">
		<span>Alignment</span>
		<input
			class="num-input"
			type="text"
			value={char_alignment}
			on:change={(e) =>
				write("alignment", (char_alignment = e.currentTarget.value))}
		/>
	</div>

	<div class="stat-row">
		<span>Initiative</span>
		<span class="mod">{formatModifier(getAbilityModifier(char_abilities["dex"]))}</span>
	</div>
</div>
