<script lang="ts">
	import type { Save } from "../frontmatter";
	import type { HitDice } from "../types";

	export let save: Save;
	export let char_hit_dice: HitDice;

	async function updateHitDice(field: keyof HitDice, value: string | number) {
		char_hit_dice = { ...char_hit_dice, [field]: value };

		await save((fm) => {
			if (!fm.hit_dice) fm.hit_dice = { total: 1, used: 0, die: "d8" };
			fm.hit_dice[field] = value;
		});
	}
</script>

<div class="hitdice-block">
	<span class="hitdice-title">Hit Dice</span>

	<div class="hitdice-row">
		<label class="stat-row">
			<span>Total</span>
			<input
				class="num-input"
				type="number"
				value={char_hit_dice.total}
				on:change={(e) => updateHitDice("total", Number(e.currentTarget.value))}
			/>
		</label>

		<label class="stat-row">
			<span>Used</span>
			<input
				class="num-input"
				type="number"
				value={char_hit_dice.used}
				on:change={(e) => updateHitDice("used", Number(e.currentTarget.value))}
			/>
		</label>

		<label class="stat-row">
			<span>Die</span>
			<input
				class="text-input small"
				type="text"
				value={char_hit_dice.die}
				on:change={(e) => updateHitDice("die", e.currentTarget.value)}
			/>
		</label>
	</div>

	<div class="hitdice-remaining">
		Remaining: <span class="mod"
			>{char_hit_dice.total - char_hit_dice.used}{char_hit_dice.die}</span
		>
	</div>
</div>
