<script lang="ts">
	import { Notice } from "obsidian";
	import type { Save } from "../frontmatter";

	export let save: Save;
	export let char_hp: Record<string, number>;

	async function updateHP(hpType: "current" | "max" | "temp", newHP: number) {
		char_hp = { ...char_hp, [hpType]: newHP };

		await save((fm) => {
			if (!fm.hp) fm.hp = { current: 0, max: 0, temp: 0 };
			fm.hp[hpType] = newHP;
		});
	}

	let damage: number | null = null;

	// Damage is taken from temporary HP first; the rest comes off current HP.
	async function applyDamage() {
		if (!damage || damage <= 0) return;

		const fromTemp = Math.min(char_hp.temp ?? 0, damage);
		const temp = (char_hp.temp ?? 0) - fromTemp;
		const current = Math.max(
			0,
			(char_hp.current ?? 0) - (damage - fromTemp),
		);
		char_hp = { ...char_hp, temp, current };
		damage = null;

		await save((fm) => {
			if (!fm.hp) fm.hp = { current: 0, max: 0, temp: 0 };
			fm.hp.temp = temp;
			fm.hp.current = current;
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
			on:change={(e) =>
				updateHP("current", Number(e.currentTarget.value))}
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
	<div class="hp-damage-row">
		<span class="hitdice-remaining">APPLY DAMAGE</span>
		<input
			type="number"
			class="num-input"
			min="0"
			bind:value={damage}
			on:keydown={(e) => e.key === "Enter" && applyDamage()}
		/>
		<button on:click={applyDamage}>Apply</button>
	</div>
</div>
