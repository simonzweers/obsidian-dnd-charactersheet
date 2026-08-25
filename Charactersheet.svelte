<script lang="ts">
import { type TFile, type App, Notice } from "obsidian";
import type {Attack, Spell, SpellLevel, CharSpells, DndCharacterFrontmatter, DeathSaves, HitDice} from './types'
import { WEAPON_PROPERTIES } from "./types";

const MAX_SPELL_LEVEL = 9;

export let app: App;
export let file: TFile;
export let char_name: string;
export let char_class: string;
export let char_level: number;
export let char_background: string;
export let char_ac: number;
export let char_race: string;
export let char_age: number;
export let char_height: number;
export let char_inspiration: number;
export let char_alignment: string;
export let char_deathsaves: DeathSaves;
export let char_hit_dice: HitDice;
export let char_speed: number;
export let char_abilities: Record<string, number>;
export let char_hp: Record<string, number>;
export let char_proficiency_bonus: number;
export let char_skills: Record<string, boolean>;
export let char_saving_throws: Record<string, boolean>;
export let char_currency: Record<string, number>;
export let char_inventory: string[];
export let char_attacks: Attack[];
export let char_traits: string[];
export let char_proficiencies: string[];
export let char_spells: CharSpells;
export let char_spellcasting: string;
// export let frontmatter: Record<string, any>;

function getAbilityModifier(score: number) {
	return Math.floor((score - 10) / 2);
};
function getSkillModifier(base: number, proficient: boolean, bonus: number) {
	return proficient ? base + bonus: base;
}
const formatModifier = (mod: number) => (mod >= 0 ? `+${mod}` : `${mod}`);

const abilityKeys = ["str", "dex", "con", "int", "wis", "cha"] as const;
const skillKeys = [
{ skill: "Acrobatics", ability: "dex" },
{ skill: "Animal Handling", ability: "wis" },
{ skill: "Arcana", ability: "int" },
{ skill: "Athletics", ability: "str" },
{ skill: "Deception", ability: "cha" },
{ skill: "History", ability: "int" },
{ skill: "Insight", ability: "wis" },
{ skill: "Intimidation", ability: "cha" },
{ skill: "Investigation", ability: "int" },
{ skill: "Medicine", ability: "wis" },
{ skill: "Nature", ability: "int" },
{ skill: "Perception", ability: "wis" },
{ skill: "Performance", ability: "cha" },
{ skill: "Persuasion", ability: "cha" },
{ skill: "Religion", ability: "int" },
{ skill: "Sleight of Hand", ability: "dex" },
{ skill: "Stealth", ability: "dex" },
{ skill: "Survival", ability: "wis" },
] as const;

const currencyKeys = ["cp", "sp", "ep", "gp", "pp"] as const;
let newItemName = "";
let newTrait = "";
let newProficiency = "";

// all possible level keys, 1 through 9
const allLevelKeys = Array.from({ length: MAX_SPELL_LEVEL }, (_, i) => `lvl${i + 1}`);
const emptyLevel: SpellLevel = { total_slots: 0, slots_expended: 0, learned: [] };

// always returns a valid SpellLevel, even if the character has no data for it yet
function getLevel(levelKey: string): SpellLevel {
	return (char_spells[levelKey] as SpellLevel) ?? emptyLevel;
}

$: spellLevelKeys = Object.keys(char_spells)
.filter((k) => k !== "cantrips")
.sort((a, b) => parseInt(a.replace("lvl", "")) - parseInt(b.replace("lvl", "")));

let newCantripName = "";
let newSpellNames: Record<string, string> = {}; // keyed by levelKey

async function updatePrimitiveField<K extends keyof DndCharacterFrontmatter>(
	setter: (value: NonNullable<DndCharacterFrontmatter[K]>) => void,
	field: K,
	value: NonNullable<DndCharacterFrontmatter[K]>
	) {
	setter(value);
	await app.fileManager.processFrontMatter(file, (frontmatter: DndCharacterFrontmatter) => {
		frontmatter[field] = value;
	});
}

async function toggleDeathSave(type: "successes" | "failures", index: number) {
  const updated = char_deathsaves[type].map((v, i) => (i === index ? !v : v));
  char_deathsaves = { ...char_deathsaves, [type]: updated };

  await app.fileManager.processFrontMatter(file, (frontmatter: DndCharacterFrontmatter) => {
    if (!frontmatter.deathsaves) {
      frontmatter.deathsaves = { successes: [false, false, false], failures: [false, false, false] };
    }
    frontmatter.deathsaves[type][index] = updated[index];
  });
}

async function updateHitDice(field: keyof HitDice, value: string | number) {
  char_hit_dice = { ...char_hit_dice, [field]: value };

  await app.fileManager.processFrontMatter(file, (frontmatter: DndCharacterFrontmatter) => {
    if (!frontmatter.hit_dice) frontmatter.hit_dice = { total: 1, used: 0, die: "d8" };
    frontmatter.hit_dice[field] = value as never;
  });
}

async function updateAbility(ability: string, level: number) {
	char_abilities = { ...char_abilities, [ability]: level };
	await app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (!frontmatter.abilities) frontmatter.abilities = {};
			frontmatter.abilities = char_abilities;
			})
}

async function updateSkill(skill: string, proficiency: boolean) {
	char_skills = { ...char_skills, [skill]: proficiency };

	await app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (!frontmatter.skills) frontmatter.skills = {};
			frontmatter.skills[skill] = proficiency;
			});
}

async function updateSavingThrow(ability: string, proficiency: boolean) {
	char_saving_throws = { ...char_saving_throws, [ability]: proficiency};

	await app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (!frontmatter.saving_throws) frontmatter.saving_throws = {};
			frontmatter.saving_throws = char_saving_throws;
			})
}

async function updateHP(hpType: "current" | "max" | "temp", newHP: number) {
	char_hp[hpType] = newHP;

	await app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (!frontmatter.hp) frontmatter.hp = {};
			frontmatter.hp[hpType] = newHP;
			})
}

async function updateMoney(currency: string, value: number) {
	char_currency = { ...char_currency, [currency]: value };

	await app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (!frontmatter.currency) frontmatter.currency = {};
			frontmatter.currency[currency] = value;
			});
}

async function addInventoryItem() {
	const item = newItemName.trim();
	if (!item) return;

	char_inventory = [...char_inventory, item];
	newItemName = "";

	await app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (!frontmatter.inventory) frontmatter.inventory = [];
			frontmatter.inventory.push(item);
			});
}

async function removeInventoryItem(index: number) {
	char_inventory = char_inventory.filter((_, i) => i !== index);

	await app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (!frontmatter.inventory) return;
			frontmatter.inventory.splice(index, 1);
			});
}

async function moveInventoryItemUp(index: number) {
	if (index === 0) return; // already at the top, nothing to do

	const updated = [...char_inventory];
	[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
	char_inventory = updated;

	await app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (!frontmatter.inventory) return;
			const fmInv = frontmatter.inventory;
			[fmInv[index - 1], fmInv[index]] = [fmInv[index], fmInv[index - 1]];
			});
}

function getAttackBonus(attack: Attack) {
	const isFinesse = attack.properties?.includes("finesse") ?? false;

  const abilityKeysToCheck = isFinesse ? ["str", "dex"] : [attack.ability?.toLowerCase()];
  const best = Math.max(
    ...abilityKeysToCheck.map((a) =>
    char_abilities[a] !== undefined ? getAbilityModifier(char_abilities[a]) : -Infinity
  ));
  const base = best === -Infinity ? 0 : best;
	const proficient = String(attack.proficient).toLowerCase() === "true";
	return proficient ? base + char_proficiency_bonus : base;
}

async function updateAttackField(index: number, field: keyof Attack, value: string | boolean) {
	char_attacks = char_attacks.map((atk, i) =>
			i === index ? { ...atk, [field]: value } : atk
			);

	await app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (!frontmatter.attacks) return;
			frontmatter.attacks[index][field] = value;
			});
}

async function removeAttack(index: number) {
	char_attacks = char_attacks.filter((_, i) => i !== index);

	await app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (!frontmatter.attacks) return;
			frontmatter.attacks.splice(index, 1);
			});
}

let newAttack: Attack = { name: "", ability: "", proficient: false, damage: "", damage_type: "" };

async function addAttack() {
	if (!newAttack.name.trim()) return;

	const attackToAdd: Attack = { ...newAttack, properties: newAttackProperties };
	char_attacks = [...char_attacks, attackToAdd];
	newAttack = { name: "", ability: "", proficient: false, damage: "", damage_type: "" };
  newAttackProperties = [];

	await app.fileManager.processFrontMatter(file, (frontmatter) => {
		if (!frontmatter.attacks) frontmatter.attacks = [];
		frontmatter.attacks.push(attackToAdd);
	});
}

async function toggleAttackProperty(index: number, property: string) {
  const attack = char_attacks[index];
  const current = attack.properties ?? [];
  const updatedProperties = current.includes(property)
    ? current.filter((p) => p !== property)
    : [...current, property];

  char_attacks = char_attacks.map((atk, i) =>
    i === index ? { ...atk, properties: updatedProperties } : atk
  );

  await app.fileManager.processFrontMatter(file, (frontmatter: DndCharacterFrontmatter) => {
    if (!frontmatter.attacks) return;
    frontmatter.attacks[index].properties = updatedProperties;
  });
}

let newAttackProperties: string[] = [];

function toggleNewAttackProperty(property: string) {
  newAttackProperties = newAttackProperties.includes(property)
    ? newAttackProperties.filter((p) => p !== property)
    : [...newAttackProperties, property];
}

async function moveTraitUp(index: number) {
	if (index === 0) return; // already at the top, nothing to do

	const updated = [...char_traits];
	[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
	char_traits = updated;

	await app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (!frontmatter.traits) return;
			const fmInv = frontmatter.trats;
			[fmInv[index - 1], fmInv[index]] = [fmInv[index], fmInv[index - 1]];
			});
}

async function removeTrait(index: number) {
	char_traits = char_traits.filter((_, i) => i !== index);

	await app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (!frontmatter.traits) return;
			frontmatter.traits.splice(index, 1);
			});
}

async function addTrait() {
	const item = newTrait.trim();
	if (!item) return;

	char_traits = [...char_traits, item];
	newTrait = "";

	await app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (!frontmatter.traits) frontmatter.traits = [];
			frontmatter.traits.push(item);
			});
}

async function updateTrait(index: number, value: string) {
  char_traits = char_traits.map((t, i) => (i === index ? value : t));
  await app.fileManager.processFrontMatter(file, (frontmatter) => {
    if (!frontmatter.traits) return;
    frontmatter.traits[index] = value;
  })
}

async function moveProficiencyUp(index: number) {
	if (index === 0) return; // already at the top, nothing to do

	const updated = [...char_proficiencies];
	[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
	char_proficiencies = updated;

	await app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (!frontmatter.proficiencies) return;
			const fmInv = frontmatter.proficiencies;
			[fmInv[index - 1], fmInv[index]] = [fmInv[index], fmInv[index - 1]];
			});
}

async function removeProficiency(index: number) {
	char_proficiencies = char_proficiencies.filter((_, i) => i !== index);

	await app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (!frontmatter.proficiencies) return;
			frontmatter.proficiencies.splice(index, 1);
			});
}

async function addProficiency() {
	const item = newProficiency.trim();
	if (!item) return;

	char_proficiencies = [...char_proficiencies, item];
	newProficiency = "";

	await app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (!frontmatter.proficiencies) frontmatter.proficiencies = [];
			frontmatter.proficiencies.push(item);
			});
}

// --- Prepare toggle (leveled spells only) ---
async function toggleSpellPrepared(levelKey: string, index: number) {
	const level = char_spells[levelKey] as SpellLevel;
	const updatedLearned = level.learned.map((s, i) =>
			i === index ? { ...s, prepared: !s.prepared } : s
			);
	char_spells = { ...char_spells, [levelKey]: { ...level, learned: updatedLearned } };

	await app.fileManager.processFrontMatter(file, (fm) => {
			if (!fm.spells?.[levelKey]?.learned) return;
			fm.spells[levelKey].learned[index].prepared = updatedLearned[index].prepared;
			});
}

// --- Clipboard: paste link into a spell ---
async function pasteSpellLink(levelKey: string, index: number) {
	let text: string;
	try {
		text = await navigator.clipboard.readText();
	} catch (err) {
		new Notice("Couldn't read from clipboard");
		console.log(err)
			return;
	}

	if (levelKey === "cantrips") {
		const updated = char_spells.cantrips.map((s, i) => (i === index ? { ...s, link: text } : s));
		char_spells = { ...char_spells, cantrips: updated };

		await app.fileManager.processFrontMatter(file, (fm) => {
				if (!fm.spells?.cantrips) return;
				fm.spells.cantrips[index].link = text;
				});
	} else {
		const level = char_spells[levelKey] as SpellLevel;
		const updatedLearned = level.learned.map((s, i) => (i === index ? { ...s, link: text } : s));
		char_spells = { ...char_spells, [levelKey]: { ...level, learned: updatedLearned } };

		await app.fileManager.processFrontMatter(file, (fm) => {
				if (!fm.spells?.[levelKey]?.learned) return;
				fm.spells[levelKey].learned[index].link = text;
				});
	}

	new Notice("Pasted link");
}

// --- Clipboard: copy link from a spell ---
async function copySpellLink(levelKey: string, index: number) {
	const spell =
		levelKey === "cantrips"
		? char_spells.cantrips[index]
		: (char_spells[levelKey] as SpellLevel).learned[index];

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

async function openSpellInBrowser(levelKey:string, index: number) {
	const spell =
		levelKey === "cantrips"
		? char_spells.cantrips[index]
		: (char_spells[levelKey] as SpellLevel).learned[index];

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

	if (levelKey === "cantrips") {
		const updated = [...char_spells.cantrips];
		[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
		char_spells = { ...char_spells, cantrips: updated };

		await app.fileManager.processFrontMatter(file, (fm) => {
				if (!fm.spells?.cantrips) return;
				const arr = fm.spells.cantrips;
				[arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
				});
	} else {
		const level = char_spells[levelKey] as SpellLevel;
		const updatedLearned = [...level.learned];
		[updatedLearned[index - 1], updatedLearned[index]] = [updatedLearned[index], updatedLearned[index - 1]];
		char_spells = { ...char_spells, [levelKey]: { ...level, learned: updatedLearned } };

		await app.fileManager.processFrontMatter(file, (fm) => {
				if (!fm.spells?.[levelKey]?.learned) return;
				const arr = fm.spells[levelKey].learned;
				[arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
				});
	}
}

// --- Remove ---
async function removeSpell(levelKey: string, index: number) {
	if (levelKey === "cantrips") {
		char_spells = { ...char_spells, cantrips: char_spells.cantrips.filter((_, i) => i !== index) };

		await app.fileManager.processFrontMatter(file, (fm) => {
				if (!fm.spells?.cantrips) return;
				fm.spells.cantrips.splice(index, 1);
				});
	} else {
		const level = char_spells[levelKey] as SpellLevel;
		const updatedLearned = level.learned.filter((_, i) => i !== index);
		char_spells = { ...char_spells, [levelKey]: { ...level, learned: updatedLearned } };

		await app.fileManager.processFrontMatter(file, (fm) => {
				if (!fm.spells?.[levelKey]?.learned) return;
				fm.spells[levelKey].learned.splice(index, 1);
				});
	}
}

// --- Add new ---
async function addCantrip() {
	const name = newCantripName.trim();
	if (!name) return;

	const spell: Spell = { name, link: "" };
	char_spells = { ...char_spells, cantrips: [...char_spells.cantrips, spell] };
	newCantripName = "";

	await app.fileManager.processFrontMatter(file, (fm) => {
			if (!fm.spells) fm.spells = {};
			if (!fm.spells.cantrips) fm.spells.cantrips = [];
			fm.spells.cantrips.push(spell);
			});
}

async function addSpell(levelKey: string) {
	const name = (newSpellNames[levelKey] ?? "").trim();
	if (!name) return;

	const spell: Spell = { name, prepared: false, link: "" };
	const level = getLevel(levelKey);
	char_spells = { ...char_spells, [levelKey]: { ...level, learned: [...level.learned, spell] } };
	newSpellNames = { ...newSpellNames, [levelKey]: "" };

	await app.fileManager.processFrontMatter(file, (fm) => {
			if (!fm.spells) fm.spells = {};
			if (!fm.spells[levelKey]) fm.spells[levelKey] = { total_slots: 0, slots_expended: 0, learned: [] };
			fm.spells[levelKey].learned.push(spell);
			});
}

// --- Slot counters ---
async function updateSlots(levelKey: string, field: "total_slots" | "slots_expended", value: number) {
	const level = getLevel(levelKey);
	char_spells = { ...char_spells, [levelKey]: { ...level, [field]: value } };

	await app.fileManager.processFrontMatter(file, (fm) => {
			if (!fm.spells) fm.spells = {};
			if (!fm.spells[levelKey]) fm.spells[levelKey] = { total_slots: 0, slots_expended: 0, learned: [] };
			fm.spells[levelKey][field] = value;
			});
}

async function updateSpellcasting(newSpellcasting: string) {
	char_spellcasting = newSpellcasting;
	await app.fileManager.processFrontMatter(file, (frontmatter) => {
			if (!frontmatter.spellcasting) frontmatter.spellcasting = {}
			frontmatter.spellcasting = newSpellcasting;
			})
}

function getSpellsaveDC(proficiencyBonus: number, scAbility: string) {
	let spellSaveDC = 8 + proficiencyBonus + getAbilityModifier(char_abilities[scAbility]);
	return spellSaveDC;
}

function getSpellAttackBonus(proficiencyBonus: number, scAbility: string) {
	let spellAttackBonus = proficiencyBonus + getAbilityModifier(char_abilities[scAbility]);
	return spellAttackBonus;
}
</script>

<div class="sheet-container">
  <h1>Character Name: {char_name}</h1>
  <div class="stat-grid">
    <div class="stat-row">
      <span>Class</span>
      <input
      class="text-input"
      type="text"
      value={char_class}
      on:change={(e) => updatePrimitiveField( (v) => (char_class = v), "class", e.currentTarget.value)}
      >
    </div>

    <div class="stat-row">
      <span>Lvl</span>
      <input
      class="num-input"
      type="number"
      value={char_level}
      on:change={(e) => updatePrimitiveField( (v) => (char_level = v), "level", Number(e.currentTarget.value))}
      />
    </div>

    <div class="stat-row">
      <span>Background</span>
      <input
      class="text-input"
      type="text"
      value={char_background}
      on:change={(e) => updatePrimitiveField( (v) => (char_background = v), "background", String(e.currentTarget.value))}
      />
    </div>

    <div class="stat-row">
      <span>Proficiency Bonus</span>
      <input
      class="num-input"
      type="number"
      value={char_proficiency_bonus}
      on:change={(e) => updatePrimitiveField( (v) => (char_proficiency_bonus = v), "proficiency_bonus", Number(e.currentTarget.value))}
      />
    </div>

    <div class="stat-row">
      <span>Armor Class</span>
      <input
      class="num-input"
      type="number"
      value={char_ac}
      on:change={(e) => updatePrimitiveField( (v) => (char_ac = v), "ac", Number(e.currentTarget.value))}
      />
    </div>

    <div class="stat-row">
      <span>Speed</span>
      <input
      class="num-input"
      type="number"
      value={char_speed}
      on:change={(e) => updatePrimitiveField( (v) => (char_speed = v), "speed", Number(e.currentTarget.value))}
      />
    </div>

	
    <div class="stat-row">
      <span>Race</span>
      <input
      class="text-input"
      type="text"
      value={char_race}
      on:change={(e) => updatePrimitiveField( (v) => (char_race = v), "race", String(e.currentTarget.value))}
      />
    </div>

    <div class="stat-row">
      <span>Age</span>
      <input
      class="num-input"
      type="number"
      value={char_age}
      on:change={(e) => updatePrimitiveField( (v) => (char_age = v), "age", Number(e.currentTarget.value))}
      />
    </div>
    <div class="stat-row">
      <span>Height (cm)</span>
      <input
      class="num-input"
      type="number"
      value={char_height}
      on:change={(e) => updatePrimitiveField( (v) => (char_height = v), "height", Number(e.currentTarget.value))}
      />
    </div>
    <div class="stat-row">
      <span>Inspiration</span>
      <input
      class="num-input"
      type="number"
      value={char_inspiration}
      on:change={(e) => updatePrimitiveField( (v) => (char_inspiration = v), "inspiration", Number(e.currentTarget.value))}
      />
    </div>
    <div class="stat-row">
      <span>Alignment</span>
      <input
      class="num-input"
      type="text"
      value={char_alignment}
      on:change={(e) => updatePrimitiveField( (v) => (char_alignment = v), "alignment", String(e.currentTarget.value))}
      />
    </div>
    <div class="stat-row">
      <span>Initiative</span>
      <span class="mod">{formatModifier(getAbilityModifier(char_abilities["dex"]))}</span>
    </div>
  </div>

<!-- HIT DICE -->
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
    Remaining: <span class="mod">{char_hit_dice.total - char_hit_dice.used}{char_hit_dice.die}</span>
  </div>

</div>

  <!-- DEATH SAVES -->  
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

  <!-- HP -->
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

  <!-- ABILITIES -->
  <h2>Abilities</h2>
  <div class="abilities-grid">
    {#each abilityKeys as key}
      <div class="ability-box">
        <label for={key}>{key.toUpperCase()}</label>
        <input
          class="num-input"
          id={key}
          type="number"
          value={char_abilities[key]}
          on:change={(e) => updateAbility(key, Number(e.currentTarget.value))}
        />
        <span class="mod">{formatModifier(getAbilityModifier(Number(char_abilities[key])))}</span>
      </div>
    {/each}
  </div>

  <!-- SKILLS -->
  <div>
    <h2>Skills</h2>
    {#each skillKeys as {skill, ability}}
      <div class="skill-box">
        <input
          id={skill}
          type="checkbox"
          checked={char_skills[skill] ?? false}
          value={char_skills[skill]}
          on:change={(e) => updateSkill(skill, Boolean(e.currentTarget.checked))}
        />
        <!-- This needs to have an expanded function call because the element does not reload without referencing char_abilities and char_skills -->
        <span class="mod">{formatModifier(getSkillModifier(getAbilityModifier(char_abilities[ability]), char_skills[skill], char_proficiency_bonus))}</span>
        <label for={skill}>{skill}</label>
        <span class="mod"> {ability.toUpperCase()}</span>
      </div>
    {/each}
  </div>

  <!-- SAVING THROWS -->
  <div>
    <h2>Saving Throws</h2>
    {#each abilityKeys as key}
    <div class="skill-box">
      <input
        id={key}
        type="checkbox"
        checked={char_saving_throws[key] ?? false}
        value={char_saving_throws[key]}
        on:change={(e) => updateSavingThrow(key, Boolean(e.currentTarget.checked))}
        />
        <span class="mod">{formatModifier(getSkillModifier(getAbilityModifier(char_abilities[key]), char_saving_throws[key], char_proficiency_bonus))}</span>
        <label for={key}>{key.toUpperCase()}</label>
    </div>
    {/each}
  </div>

  <!-- OTHER SKILLS & PROFICIENCIES -->
  <div>
    <h2>Other Skills & Proficiencies</h2>
    <ul class="inventory-list">
      {#each char_proficiencies as proficiency, index}
        <li>
          <button
            class="icon-btn"
            disabled={index === 0}
            on:click={() => moveProficiencyUp(index)}
          >↑</button>
          <span class="item-name">{proficiency}</span>
          <button class="icon-btn" on:click={() => removeProficiency(index)}>✕</button>
        </li>
      {/each}
    </ul>
    <div class="add-listitem-row">
      <input
        class="text-input"
        type="text"
        placeholder="New Proficiency"
        bind:value={newProficiency}
        on:keydown={(e) => e.key === "Enter" && addProficiency()}
      />
      <button on:click={addProficiency}>Add</button>
    </div>
  </div>

  <div class="money-inventory-row">
  <!-- MONEY -->
    <div class="money-section">
      <h2>Money</h2>
      <div class="currency-row">
        {#each currencyKeys as coin}
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
  
    <!-- INVENTORY -->
    <div class="inventory-section">
      <h2>Inventory</h2>
      <ul class="inventory-list">
        {#each char_inventory as item, index}
          <li>
            <button
              class="icon-btn"
              disabled={index === 0}
              on:click={() => moveInventoryItemUp(index)}
            >↑</button>
            <span class="item-name">{item}</span>
            <button class="icon-btn" on:click={() => removeInventoryItem(index)}>✕</button>
          </li>
        {/each}
      </ul>
  
      <div class="add-listitem-row">
        <input
          class="text-input"
          type="text"
          placeholder="New item"
          bind:value={newItemName}
          on:keydown={(e) => e.key === "Enter" && addInventoryItem()}
        />
        <button on:click={addInventoryItem}>Add</button>
      </div>
    </div>
  </div>

  <!-- ATTACKS & SPELLCASTING -->
  <div>
    <h2>Attacks & Spellcasting</h2>

    <div class="attack-table">
      <!-- <div class="attack-row attack-header">
        <span>Name</span>
        <span>Ability</span>
        <span>Proficient</span>
        <span>Damage</span>
        <span>Type</span>
        <span>Bonus</span>
        <span></span>
      </div> -->

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
            on:change={(e) => updateAttackField(index, "ability", e.currentTarget.value)}
          />
          <input
            class=""
            checked={attack.proficient ?? false}
            type="checkbox"
            value={String(attack.proficient)}
            on:change={(e) => updateAttackField(index, "proficient", Boolean(e.currentTarget.checked))}
          />
          <input
            class="text-input small"
            type="text"
            value={attack.damage}
            on:change={(e) => updateAttackField(index, "damage", e.currentTarget.value)}
          />
          <input
            class="text-input small"
            type="text"
            value={attack.damage_type}
            on:change={(e) => updateAttackField(index, "damage_type", e.currentTarget.value)}
          />
          <span class="mod">{formatModifier(getAttackBonus(attack))}</span>
          <button class="icon-btn" on:click={() => removeAttack(index)}>✕</button>
        </div>

        <div class="attack-properties-row">
          {#each WEAPON_PROPERTIES as prop}
            <label class="property-tag" class:active={attack.properties?.includes(prop) ?? false}>
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
        <input class="text-input" type="text" placeholder="Name" bind:value={newAttack.name} />
        <input class="text-input small" type="text" placeholder="str/dex/..." bind:value={newAttack.ability} />
        <input class="" type="checkbox" placeholder="true/false" bind:checked={newAttack.proficient} />
        <input class="text-input small" type="text" placeholder="1d6" bind:value={newAttack.damage} />
        <input class="text-input small" type="text" placeholder="slashing" bind:value={newAttack.damage_type} />
        <span></span>
        <button on:click={addAttack}>Add</button>
      </div>
      <div class="attack-properties-row">
        {#each WEAPON_PROPERTIES as prop}
          <label class="property-tag" class:active={newAttackProperties.includes(prop)}>
            <input
              type="checkbox"
              checked={newAttackProperties.includes(prop)}
              on:change={() => toggleNewAttackProperty(prop)}
            />
            {prop}
          </label>
        {/each}
      </div>
    </div>
  </div>

  <!-- FEATURES & TRAITS -->
  <div>
    <h2>Features & Traits</h2>
    <ul class="inventory-list">
      {#each char_traits as trait, index}
        <li>
          <button
          class="icon-btn"
          disabled={index === 0}
          on:click={() => moveTraitUp(index)}
          >↑</button>
          <!-- <span class="item-name">{trait}</span> -->
           <input
             class="text-input item-name-input"
             type="text"
             value={trait}
             on:change={(e) => updateTrait(index, String(e.currentTarget.value))}
           />
          <button class="icon-btn" on:click={() => removeTrait(index)}>✕</button>
        </li>
      {/each}
    </ul>
    <div class="add-listitem-row">
      <input
        class="text-input"
        type="text"
        placeholder="New trait"
        bind:value={newTrait}
        on:keydown={(e) => e.key === "Enter" && addInventoryItem()}
      />
      <button on:click={addTrait}>Add</button>
    </div>
  </div>

  <!-- SPELLS -->
  <div>
    <h2>Spells</h2>
    
    <div class="sc-extra-grid">
      <div class="sc-extra-item">
        <span>Spellcasting Ability</span>
        <select id="sc-menu" name="sc-menu" value={char_spellcasting} on:change={(e) => updateSpellcasting(e.currentTarget.value)}>
          <option value="int">INT</option>
          <option value="wis">WIS</option>
          <option value="cha">CHA</option>
        </select>
      </div>
      <div class="sc-extra-item">
        <span>Spell save DC: </span>
        <span class="mod">{getSpellsaveDC(char_proficiency_bonus, char_spellcasting)}</span>
      </div>
      <div class="sc-extra-item">
        <span>Spell attack bonus: </span>
        <span class="mod">{formatModifier(getSpellAttackBonus(char_proficiency_bonus, char_spellcasting))}</span>
      </div>
    </div>

    <!-- CANTRIPS -->
    <h3>Cantrips</h3>
    <ul class="spell-list">
      {#each char_spells.cantrips as cantrip, index}
        <li class="spell-row">
          <span class="spell-name">{cantrip.name}</span>
          <div class="spell-actions">
            <button class="icon-btn" title="Paste link" on:click={() => pasteSpellLink("cantrips", index)}>📋</button>
            <button class="icon-btn" title="Copy link" on:click={() => copySpellLink("cantrips", index)}>🔗</button>
		 	<button class="icon-btn" title="Open in browser" on:click={() => openSpellInBrowser("cantrips", index)}>🌐</button>
            <button class="icon-btn" title="Move up" disabled={index === 0} on:click={() => moveSpellUp("cantrips", index)}>↑</button>
            <button class="icon-btn" title="Remove" on:click={() => removeSpell("cantrips", index)}>✕</button>
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
      {@const level = char_spells[levelKey] ?? emptyLevel}
      <h3>Level {levelKey.replace("lvl", "")}</h3>

      <div class="slots-row">
        <label class="stat-row">
          <span>Total slots</span>
          <input
            class="num-input"
            type="number"
            value={level.total_slots}
            on:change={(e) => updateSlots(levelKey, "total_slots", Number(e.currentTarget.value))}
          />
        </label>
        <label class="stat-row">
          <span>Expended</span>
          <input
            class="num-input"
            type="number"
            value={level.slots_expended}
            on:change={(e) => updateSlots(levelKey, "slots_expended", Number(e.currentTarget.value))}
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
              <button class="icon-btn" title="Paste link" on:click={() => pasteSpellLink(levelKey, index)}>📋</button>
              <button class="icon-btn" title="Copy link" on:click={() => copySpellLink(levelKey, index)}>🔗</button>
			  <button class="icon-btn" title="Open in browser" on:click={() => openSpellInBrowser(levelKey, index)}>🌐</button>
              <button class="icon-btn" disabled={index === 0} title="Move up" on:click={() => moveSpellUp(levelKey, index)}>↑</button>
              <button class="icon-btn" title="Remove" on:click={() => removeSpell(levelKey, index)}>✕</button>
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

</div>

