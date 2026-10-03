<script lang="ts">
	import type { Save } from "../frontmatter";
	import {
		ABILITY_KEYS,
		formatModifier,
		getAbilityModifier,
		getSkillModifier,
	} from "../rules";

	export let save: Save;
	export let char_saving_throws: Record<string, boolean>;
	export let char_abilities: Record<string, number>;
	export let char_proficiency_bonus: number;

	async function updateSavingThrow(ability: string, proficiency: boolean) {
		char_saving_throws = { ...char_saving_throws, [ability]: proficiency };

		await save((fm) => {
			fm.saving_throws = char_saving_throws;
		});
	}
</script>

<div>
	<h2>Saving Throws</h2>
	{#each ABILITY_KEYS as key}
		<div class="skill-box">
			<input
				id={key}
				type="checkbox"
				checked={char_saving_throws[key] ?? false}
				on:change={(e) => updateSavingThrow(key, e.currentTarget.checked)}
			/>
			<span class="mod"
				>{formatModifier(
					getSkillModifier(
						getAbilityModifier(char_abilities[key]),
						char_saving_throws[key],
						char_proficiency_bonus,
					),
				)}</span
			>
			<label for={key}>{key.toUpperCase()}</label>
		</div>
	{/each}
</div>
