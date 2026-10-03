<script lang="ts">
	import type { Save } from "../frontmatter";
	import { formatModifier, getAttackBonus } from "../rules";
	import { WEAPON_PROPERTIES, type Attack } from "../types";

	export let save: Save;
	export let char_attacks: Attack[];
	export let char_abilities: Record<string, number>;
	export let char_proficiency_bonus: number;

	const emptyAttack = (): Attack => ({
		name: "",
		ability: "",
		proficient: false,
		damage: "",
		damage_type: "",
	});

	let newAttack: Attack = emptyAttack();
	let newAttackProperties: string[] = [];

	async function updateAttackField(
		index: number,
		field: keyof Attack,
		value: string | boolean,
	) {
		char_attacks = char_attacks.map((atk, i) =>
			i === index ? { ...atk, [field]: value } : atk,
		);

		await save((fm) => {
			if (!fm.attacks) return;
			fm.attacks[index] = { ...fm.attacks[index], [field]: value };
		});
	}

	async function removeAttack(index: number) {
		char_attacks = char_attacks.filter((_, i) => i !== index);

		await save((fm) => {
			fm.attacks?.splice(index, 1);
		});
	}

	async function addAttack() {
		if (!newAttack.name.trim()) return;

		const attackToAdd: Attack = { ...newAttack, properties: newAttackProperties };
		char_attacks = [...char_attacks, attackToAdd];
		newAttack = emptyAttack();
		newAttackProperties = [];

		await save((fm) => {
			if (!fm.attacks) fm.attacks = [];
			fm.attacks.push(attackToAdd);
		});
	}

	function toggle(list: string[], property: string) {
		return list.includes(property)
			? list.filter((p) => p !== property)
			: [...list, property];
	}

	async function toggleAttackProperty(index: number, property: string) {
		const updatedProperties = toggle(char_attacks[index].properties ?? [], property);

		char_attacks = char_attacks.map((atk, i) =>
			i === index ? { ...atk, properties: updatedProperties } : atk,
		);

		await save((fm) => {
			if (!fm.attacks) return;
			fm.attacks[index].properties = updatedProperties;
		});
	}
</script>

<div>
	<h2>Attacks & Spellcasting</h2>

	<div class="attack-table">
		{#each char_attacks as attack, index}
			<div class="attack-row">
				<input
					class="text-input"
					type="text"
					value={attack.name}
					on:change={(e) => updateAttackField(index, "name", e.currentTarget.value)}
				/>
				<input
					class="text-input small"
					type="text"
					value={attack.ability}
					on:change={(e) =>
						updateAttackField(index, "ability", e.currentTarget.value)}
				/>
				<input
					checked={attack.proficient ?? false}
					type="checkbox"
					on:change={(e) =>
						updateAttackField(index, "proficient", e.currentTarget.checked)}
				/>
				<input
					class="text-input small"
					type="text"
					value={attack.damage}
					on:change={(e) =>
						updateAttackField(index, "damage", e.currentTarget.value)}
				/>
				<input
					class="text-input small"
					type="text"
					value={attack.damage_type}
					on:change={(e) =>
						updateAttackField(index, "damage_type", e.currentTarget.value)}
				/>
				<span class="mod"
					>{formatModifier(
						getAttackBonus(attack, char_abilities, char_proficiency_bonus),
					)}</span
				>
				<button class="icon-btn" on:click={() => removeAttack(index)}>✕</button>
			</div>

			<div class="attack-properties-row">
				{#each WEAPON_PROPERTIES as prop}
					<label
						class="property-tag"
						class:active={attack.properties?.includes(prop) ?? false}
					>
						<input
							type="checkbox"
							checked={attack.properties?.includes(prop) ?? false}
							on:change={() => toggleAttackProperty(index, prop)}
						/>
						{prop}
					</label>
				{/each}
			</div>
		{/each}

		<div class="attack-row attack-new">
			<input
				class="text-input"
				type="text"
				placeholder="Name"
				bind:value={newAttack.name}
			/>
			<input
				class="text-input small"
				type="text"
				placeholder="str/dex/..."
				bind:value={newAttack.ability}
			/>
			<input type="checkbox" bind:checked={newAttack.proficient} />
			<input
				class="text-input small"
				type="text"
				placeholder="1d6"
				bind:value={newAttack.damage}
			/>
			<input
				class="text-input small"
				type="text"
				placeholder="slashing"
				bind:value={newAttack.damage_type}
			/>
			<span></span>
			<button on:click={addAttack}>Add</button>
		</div>
		<div class="attack-properties-row">
			{#each WEAPON_PROPERTIES as prop}
				<label class="property-tag" class:active={newAttackProperties.includes(prop)}>
					<input
						type="checkbox"
						checked={newAttackProperties.includes(prop)}
						on:change={() => (newAttackProperties = toggle(newAttackProperties, prop))}
					/>
					{prop}
				</label>
			{/each}
		</div>
	</div>
</div>
