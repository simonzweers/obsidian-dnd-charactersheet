<script lang="ts">
	import { swapUp, type Save } from "../frontmatter";

	// A list of strings stored under `field` in the frontmatter.
	// Used for inventory, proficiencies and traits.
	export let save: Save;
	export let field: "inventory" | "proficiencies" | "traits";
	export let items: string[];
	export let placeholder: string;
	/** Show each item as an input that can be edited in place. */
	export let editable = false;

	let newItem = "";

	async function add() {
		const item = newItem.trim();
		if (!item) return;

		items = [...items, item];
		newItem = "";

		await save((fm) => {
			if (!fm[field]) fm[field] = [];
			fm[field].push(item);
		});
	}

	async function remove(index: number) {
		items = items.filter((_, i) => i !== index);

		await save((fm) => {
			fm[field]?.splice(index, 1);
		});
	}

	async function moveUp(index: number) {
		if (index === 0) return; // already at the top, nothing to do

		const updated = [...items];
		swapUp(updated, index);
		items = updated;

		await save((fm) => {
			if (fm[field]) swapUp(fm[field], index);
		});
	}

	async function update(index: number, value: string) {
		items = items.map((t, i) => (i === index ? value : t));

		await save((fm) => {
			if (fm[field]) fm[field][index] = value;
		});
	}
</script>

<ul class="inventory-list">
	{#each items as item, index}
		<li>
			<button class="icon-btn" disabled={index === 0} on:click={() => moveUp(index)}
				>↑</button
			>
			{#if editable}
				<input
					class="text-input item-name-input"
					type="text"
					value={item}
					on:change={(e) => update(index, e.currentTarget.value)}
				/>
			{:else}
				<span class="item-name">{item}</span>
			{/if}
			<button class="icon-btn" on:click={() => remove(index)}>✕</button>
		</li>
	{/each}
</ul>

<div class="add-listitem-row">
	<input
		class="text-input"
		type="text"
		{placeholder}
		bind:value={newItem}
		on:keydown={(e) => e.key === "Enter" && add()}
	/>
	<button on:click={add}>Add</button>
</div>
