<script lang="ts">
	import { Notice } from "obsidian";
	import { swapUp, type Frontmatter, type Save } from "../frontmatter";
	import {
		MAX_SPELL_LEVEL,
		formatModifier,
		getSpellAttackBonus,
		getSpellSaveDC,
	} from "../rules";
	import type { CharSpells, Spell, SpellLevel } from "../types";

	export let save: Save;
	export let char_spells: CharSpells;
	export let char_spellcasting: string;
	export let char_abilities: Record<string, number>;
	export let char_proficiency_bonus: number;

	// all possible level keys, 1 through 9
	const allLevelKeys = Array.from({ length: MAX_SPELL_LEVEL }, (_, i) => `lvl${i + 1}`);
	const emptyLevel = (): SpellLevel => ({
		total_slots: 0,
		slots_expended: 0,
		learned: [],
	});

	let newCantripName = "";
	let newSpellNames: Record<string, string> = {}; // keyed by levelKey

	// always returns a valid SpellLevel, even if the character has no data for it yet
	function getLevel(spells: CharSpells, levelKey: string): SpellLevel {
		return (spells[levelKey] as SpellLevel | undefined) ?? emptyLevel();
	}

	// "cantrips" or a level key like "lvl3" -> the list of spells it holds
	function getList(levelKey: string): Spell[] {
		return levelKey === "cantrips"
			? char_spells.cantrips
			: getLevel(char_spells, levelKey).learned;
	}

	function getFmList(fm: Frontmatter, levelKey: string): Spell[] | undefined {
		return levelKey === "cantrips"
			? fm.spells?.cantrips
			: fm.spells?.[levelKey]?.learned;
	}

	// Replaces the list for `levelKey` in the local state.
	function setList(levelKey: string, list: Spell[]) {
		if (levelKey === "cantrips") {
			char_spells = { ...char_spells, cantrips: list };
		} else {
			const level = getLevel(char_spells, levelKey);
			char_spells = { ...char_spells, [levelKey]: { ...level, learned: list } };
		}
	}

	// Makes sure fm.spells[levelKey] exists before writing to it.
	function ensureFmLevel(fm: Frontmatter, levelKey: string) {
		if (!fm.spells) fm.spells = {};
		if (!fm.spells[levelKey]) fm.spells[levelKey] = emptyLevel();
		return fm.spells[levelKey];
	}

	// --- Prepare toggle (leveled spells only) ---
	async function toggleSpellPrepared(levelKey: string, index: number) {
		const updated = getList(levelKey).map((s, i) =>
			i === index ? { ...s, prepared: !s.prepared } : s,
		);
		setList(levelKey, updated);

		await save((fm) => {
			const list = getFmList(fm, levelKey);
			if (list) list[index].prepared = updated[index].prepared;
		});
	}

	// --- Clipboard: paste link into a spell ---
	async function pasteSpellLink(levelKey: string, index: number) {
		let text: string;
		try {
			text = await navigator.clipboard.readText();
		} catch (err) {
			new Notice("Couldn't read from clipboard");
			console.log(err);
			return;
		}

		setList(
			levelKey,
			getList(levelKey).map((s, i) => (i === index ? { ...s, link: text } : s)),
		);
		await save((fm) => {
			const list = getFmList(fm, levelKey);
			if (list) list[index].link = text;
		});

		new Notice("Pasted link");
	}

	// --- Clipboard: copy link from a spell ---
	async function copySpellLink(levelKey: string, index: number) {
		const spell = getList(levelKey)[index];
		if (!spell.link) {
			new Notice("This spell has no link set");
			return;
		}

		try {
			await navigator.clipboard.writeText(spell.link);
			new Notice("Copied link to clipboard");
		} catch (err) {
			new Notice("Couldn't write to clipboard");
		}
	}

	function openSpellInBrowser(levelKey: string, index: number) {
		const spell = getList(levelKey)[index];
		if (!spell.link) {
			new Notice("This spell has no link set");
			return;
		}
		new Notice("Opening Spell in Browser");
		window.open(spell.link, "_blank");
	}

	// --- Move within its own level/cantrip list ---
	async function moveSpellUp(levelKey: string, index: number) {
		if (index === 0) return;

		const updated = [...getList(levelKey)];
		swapUp(updated, index);
		setList(levelKey, updated);

		await save((fm) => {
			const list = getFmList(fm, levelKey);
			if (list) swapUp(list, index);
		});
	}

	// --- Remove ---
	async function removeSpell(levelKey: string, index: number) {
		setList(
			levelKey,
			getList(levelKey).filter((_, i) => i !== index),
		);

		await save((fm) => {
			getFmList(fm, levelKey)?.splice(index, 1);
		});
	}

	// --- Add new ---
	async function addCantrip() {
		const name = newCantripName.trim();
		if (!name) return;

		const spell: Spell = { name, link: "" };
		setList("cantrips", [...char_spells.cantrips, spell]);
		newCantripName = "";

		await save((fm) => {
			if (!fm.spells) fm.spells = {};
			if (!fm.spells.cantrips) fm.spells.cantrips = [];
			fm.spells.cantrips.push(spell);
		});
	}

	async function addSpell(levelKey: string) {
		const name = (newSpellNames[levelKey] ?? "").trim();
		if (!name) return;

		const spell: Spell = { name, prepared: false, link: "" };
		setList(levelKey, [...getList(levelKey), spell]);
		newSpellNames = { ...newSpellNames, [levelKey]: "" };

		await save((fm) => {
			ensureFmLevel(fm, levelKey).learned.push(spell);
		});
	}

	// --- Slot counters ---
	async function updateSlots(
		levelKey: string,
		field: "total_slots" | "slots_expended",
		value: number,
	) {
		const level = getLevel(char_spells, levelKey);
		char_spells = { ...char_spells, [levelKey]: { ...level, [field]: value } };

		await save((fm) => {
			ensureFmLevel(fm, levelKey)[field] = value;
		});
	}

	async function updateSpellcasting(newSpellcasting: string) {
		char_spellcasting = newSpellcasting;
		await save((fm) => {
			fm.spellcasting = newSpellcasting;
		});
	}
</script>

<div>
	<h2>Spells</h2>

	<div class="sc-extra-grid">
		<div class="sc-extra-item">
			<span>Spellcasting Ability</span>
			<select
				id="sc-menu"
				name="sc-menu"
				value={char_spellcasting}
				on:change={(e) => updateSpellcasting(e.currentTarget.value)}
			>
				<option value="int">INT</option>
				<option value="wis">WIS</option>
				<option value="cha">CHA</option>
			</select>
		</div>
		<div class="sc-extra-item">
			<span>Spell save DC: </span>
			<span class="mod"
				>{getSpellSaveDC(char_abilities, char_proficiency_bonus, char_spellcasting)}</span
			>
		</div>
		<div class="sc-extra-item">
			<span>Spell attack bonus: </span>
			<span class="mod"
				>{formatModifier(
					getSpellAttackBonus(char_abilities, char_proficiency_bonus, char_spellcasting),
				)}</span
			>
		</div>
	</div>

	<!-- CANTRIPS -->
	<h3>Cantrips</h3>
	<ul class="spell-list">
		{#each char_spells.cantrips as cantrip, index}
			<li class="spell-row">
				<span class="spell-name">{cantrip.name}</span>
				<div class="spell-actions">
					<button
						class="icon-btn"
						title="Paste link"
						on:click={() => pasteSpellLink("cantrips", index)}>📋</button
					>
					<button
						class="icon-btn"
						title="Copy link"
						on:click={() => copySpellLink("cantrips", index)}>🔗</button
					>
					<button
						class="icon-btn"
						title="Open in browser"
						on:click={() => openSpellInBrowser("cantrips", index)}>🌐</button
					>
					<button
						class="icon-btn"
						title="Move up"
						disabled={index === 0}
						on:click={() => moveSpellUp("cantrips", index)}>↑</button
					>
					<button
						class="icon-btn"
						title="Remove"
						on:click={() => removeSpell("cantrips", index)}>✕</button
					>
				</div>
			</li>
		{/each}
	</ul>
	<div class="spell-row">
		<input
			class="text-input"
			type="text"
			placeholder="New cantrip"
			bind:value={newCantripName}
			on:keydown={(e) => e.key === "Enter" && addCantrip()}
		/>
		<button on:click={addCantrip}>Add</button>
	</div>

	<!-- LEVELED SPELLS -->
	{#each allLevelKeys as levelKey}
		{@const level = getLevel(char_spells, levelKey)}
		<h3>Level {levelKey.replace("lvl", "")}</h3>

		<div class="slots-row">
			<label class="stat-row">
				<span>Total slots</span>
				<input
					class="num-input"
					type="number"
					value={level.total_slots}
					on:change={(e) =>
						updateSlots(levelKey, "total_slots", Number(e.currentTarget.value))}
				/>
			</label>
			<label class="stat-row">
				<span>Expended</span>
				<input
					class="num-input"
					type="number"
					value={level.slots_expended}
					on:change={(e) =>
						updateSlots(levelKey, "slots_expended", Number(e.currentTarget.value))}
				/>
			</label>
		</div>

		<ul class="spell-list">
			{#each level.learned as spell, index}
				<li class="spell-row">
					<input
						type="checkbox"
						title="Prepared"
						checked={spell.prepared ?? false}
						on:change={() => toggleSpellPrepared(levelKey, index)}
					/>
					<span class="spell-name">{spell.name}</span>
					<div class="spell-actions">
						<button
							class="icon-btn"
							title="Paste link"
							on:click={() => pasteSpellLink(levelKey, index)}>📋</button
						>
						<button
							class="icon-btn"
							title="Copy link"
							on:click={() => copySpellLink(levelKey, index)}>🔗</button
						>
						<button
							class="icon-btn"
							title="Open in browser"
							on:click={() => openSpellInBrowser(levelKey, index)}>🌐</button
						>
						<button
							class="icon-btn"
							disabled={index === 0}
							title="Move up"
							on:click={() => moveSpellUp(levelKey, index)}>↑</button
						>
						<button
							class="icon-btn"
							title="Remove"
							on:click={() => removeSpell(levelKey, index)}>✕</button
						>
					</div>
				</li>
			{/each}
		</ul>

		<div class="spell-row">
			<input
				class="text-input"
				type="text"
				placeholder="New Spell"
				bind:value={newSpellNames[levelKey]}
				on:keydown={(e) => e.key === "Enter" && addSpell(levelKey)}
			/>
			<button on:click={() => addSpell(levelKey)}>Add</button>
		</div>
	{/each}
</div>
