<script lang="ts">
	import type { Save } from "../frontmatter";
	import { SKILLS, formatModifier, getAbilityModifier, getSkillModifier } from "../rules";

	export let save: Save;
	export let char_skills: Record<string, boolean>;
	export let char_abilities: Record<string, number>;
	export let char_proficiency_bonus: number;

	async function updateSkill(skill: string, proficiency: boolean) {
		char_skills = { ...char_skills, [skill]: proficiency };

		await save((fm) => {
			if (!fm.skills) fm.skills = {};
			fm.skills[skill] = proficiency;
		});
	}
</script>

<div>
	<h2>Skills</h2>
	{#each SKILLS as { skill, ability }}
		<div class="skill-box">
			<input
				id={skill}
				type="checkbox"
				checked={char_skills[skill] ?? false}
				on:change={(e) => updateSkill(skill, e.currentTarget.checked)}
			/>
			<span class="mod"
				>{formatModifier(
					getSkillModifier(
						getAbilityModifier(char_abilities[ability]),
						char_skills[skill],
						char_proficiency_bonus,
					),
				)}</span
			>
			<label for={skill}>{skill}</label>
			<span class="mod"> {ability.toUpperCase()}</span>
		</div>
	{/each}
</div>
