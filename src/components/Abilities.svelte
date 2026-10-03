<script lang="ts">
	import type { Save } from "../frontmatter";
	import { ABILITY_KEYS, formatModifier, getAbilityModifier } from "../rules";

	export let save: Save;
	export let char_abilities: Record<string, number>;

	async function updateAbility(ability: string, score: number) {
		char_abilities = { ...char_abilities, [ability]: score };
		await save((fm) => {
			fm.abilities = char_abilities;
		});
	}
</script>

<h2>Abilities</h2>
<div class="abilities-grid">
	{#each ABILITY_KEYS as key}
		<div class="ability-box">
			<label for={key}>{key.toUpperCase()}</label>
			<input
				class="num-input"
				id={key}
				type="number"
				value={char_abilities[key]}
				on:change={(e) => updateAbility(key, Number(e.currentTarget.value))}
			/>
			<span class="mod"
				>{formatModifier(getAbilityModifier(Number(char_abilities[key])))}</span
			>
		</div>
	{/each}
</div>
