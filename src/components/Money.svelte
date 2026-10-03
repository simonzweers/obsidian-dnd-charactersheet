<script lang="ts">
	import type { Save } from "../frontmatter";
	import { CURRENCY_KEYS } from "../rules";

	export let save: Save;
	export let char_currency: Record<string, number>;

	async function updateMoney(currency: string, value: number) {
		char_currency = { ...char_currency, [currency]: value };

		await save((fm) => {
			if (!fm.currency) fm.currency = {};
			fm.currency[currency] = value;
		});
	}
</script>

<div class="money-section">
	<h2>Money</h2>
	<div class="currency-row">
		{#each CURRENCY_KEYS as coin}
			<label class="stat-row">
				<span class="coin-label coin-{coin}">{coin.toUpperCase()}</span>
				<input
					class="num-input"
					type="number"
					value={char_currency[coin]}
					on:change={(e) => updateMoney(coin, Number(e.currentTarget.value))}
				/>
			</label>
		{/each}
	</div>
</div>
