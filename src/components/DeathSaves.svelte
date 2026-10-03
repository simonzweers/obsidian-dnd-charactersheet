<script lang="ts">
	import type { Save } from "../frontmatter";
	import type { DeathSaves } from "../types";

	export let save: Save;
	export let char_deathsaves: DeathSaves;

	async function toggleDeathSave(type: "successes" | "failures", index: number) {
		const updated = char_deathsaves[type].map((v, i) => (i === index ? !v : v));
		char_deathsaves = { ...char_deathsaves, [type]: updated };

		await save((fm) => {
			if (!fm.deathsaves) {
				fm.deathsaves = {
					successes: [false, false, false],
					failures: [false, false, false],
				};
			}
			fm.deathsaves[type][index] = updated[index];
		});
	}
</script>

<div class="deathsaves-block">
	<span class="deathsaves-title">Death Saves</span>

	<div class="deathsaves-row">
		<span class="deathsaves-label">Successes</span>
		{#each char_deathsaves.successes as success, index}
			<input
				type="checkbox"
				checked={success}
				on:change={() => toggleDeathSave("successes", index)}
			/>
		{/each}
	</div>

	<div class="deathsaves-row">
		<span class="deathsaves-label">Failures</span>
		{#each char_deathsaves.failures as failure, index}
			<input
				type="checkbox"
				checked={failure}
				on:change={() => toggleDeathSave("failures", index)}
			/>
		{/each}
	</div>
</div>
