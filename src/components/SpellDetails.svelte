<script lang="ts">
	import { type App, Component, MarkdownRenderer } from "obsidian";
	import { onDestroy } from "svelte";
	import { findDice } from "../rules";
	import { getSpellDetails, type SpellDetails } from "../spellLookup";
	import type { Spell } from "../types";

	// Expanded info panel for one spell, loaded from Open5e.
	export let app: App;
	export let spell: Spell;

	// Owns the markdown renderers' child components, unloaded with this panel.
	const renderOwner = new Component();
	renderOwner.load();
	onDestroy(() => renderOwner.unload());

	$: request = getSpellDetails(spell);

	function levelLine(d: SpellDetails) {
		const school = d.school.name;
		const base = d.level === 0 ? `${school} cantrip` : `Level ${d.level} ${school}`;
		return d.ritual ? `${base} (ritual)` : base;
	}

	function components(d: SpellDetails) {
		const parts = [d.verbal && "V", d.somatic && "S", d.material && "M"].filter(Boolean);
		const text = parts.join(", ");
		return d.material && d.material_specified ? `${text} (${d.material_specified})` : text;
	}

	const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

	function castingTime(d: SpellDetails) {
		const time = capitalize(d.casting_time);
		return d.reaction_condition ? `${time}, ${d.reaction_condition}` : time;
	}

	function duration(d: SpellDetails) {
		return d.concentration ? `Concentration, ${d.duration}` : capitalize(d.duration);
	}

	// Wraps dice expressions ("8d6", "1d8 + 4") in the rendered text in a highlight span.
	function highlightDice(root: HTMLElement) {
		const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
		const textNodes: Text[] = [];
		while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

		for (const node of textNodes) {
			if (node.parentElement?.closest("code, pre, .spell-dice")) continue;
			const text = node.data;
			const matches = findDice(text);
			if (matches.length === 0) continue;

			const fragment = document.createDocumentFragment();
			let last = 0;
			for (const match of matches) {
				const start = match.index ?? 0;
				fragment.append(text.slice(last, start));
				fragment.createSpan({ cls: "spell-dice", text: match[0] });
				last = start + match[0].length;
			}
			fragment.append(text.slice(last));
			node.replaceWith(fragment);
		}
	}

	// Svelte action: render Open5e's markdown text with Obsidian's renderer.
	function markdown(el: HTMLElement, text: string) {
		const render = async (md: string) => {
			el.empty();
			await MarkdownRenderer.render(app, md, el, "", renderOwner);
			highlightDice(el);
		};
		void render(text);
		return { update: (md: string) => void render(md) };
	}
</script>

<div class="spell-details">
	{#await request}
		<span class="spell-details-status">Loading from Open5e…</span>
	{:then d}
		{#if d}
			<div class="spell-details-level">{levelLine(d)}</div>
			<dl class="spell-details-grid">
				<dt>Casting time</dt>
				<dd>{castingTime(d)}</dd>
				<dt>Range</dt>
				<dd>{d.range_text}</dd>
				<dt>Components</dt>
				<dd>{components(d)}</dd>
				<dt>Duration</dt>
				<dd>{duration(d)}</dd>
				{#if d.classes.length > 0}
					<dt>Classes</dt>
					<dd>{d.classes.map((c) => c.name).join(", ")}</dd>
				{/if}
			</dl>
			<div class="spell-details-desc" use:markdown={d.desc}></div>
			{#if d.higher_level}
				<div class="spell-details-desc" use:markdown={`**At higher levels.** ${d.higher_level}`}></div>
			{/if}
			<div class="spell-details-source">Source: {d.document.display_name} (Open5e)</div>
		{:else}
			<span class="spell-details-status"
				>No unique Open5e match for "{spell.name}". Use 🔍 to pick one.</span
			>
		{/if}
	{:catch}
		<span class="spell-details-status">Couldn't load spell info from Open5e.</span>
	{/await}
</div>
