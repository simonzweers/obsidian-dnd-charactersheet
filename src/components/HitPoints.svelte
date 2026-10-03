<script lang="ts">
	import type { Save } from "../frontmatter";

	export let save: Save;
	export let char_hp: Record<string, number>;

	async function updateHP(hpType: "current" | "max" | "temp", newHP: number) {
		char_hp = { ...char_hp, [hpType]: newHP };

		await save((fm) => {
			if (!fm.hp) fm.hp = {};
			fm.hp[hpType] = newHP;
		});
	}
</script>

<div class="hp-block">
	<h2>HP</h2>
	<label>
		<span class="hitdice-remaining">CURRENT</span>
		<input
			type="number"
			class="num-input"
			value={char_hp.current}
			on:change={(e) => updateHP("current", Number(e.currentTarget.value))}
		/>
		<span style="font-weight: bold">+</span>
		<span class="hitdice-remaining">TEMPORARY</span>
		<input
			type="number"
			class="num-input"
			value={char_hp.temp}
			on:change={(e) => updateHP("temp", Number(e.currentTarget.value))}
		/>
		<span style="font-weight: bold">= </span>
		<span class="mod">{char_hp.current + char_hp.temp}</span>

		<span style="font-weight: bold">/</span>
		<input
			type="number"
			class="num-input"
			value={char_hp.max}
			on:change={(e) => updateHP("max", Number(e.currentTarget.value))}
		/>
	</label>
</div>
