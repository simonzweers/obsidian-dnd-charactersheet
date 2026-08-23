<script lang="ts">
  import { type TFile, type App, Notice } from "obsidian";
  interface Attack {
    name: string;
    ability: string;
    proficient: boolean;
    damage: string;
    damage_type: string;
  }
  export let app: App;
  export let file: TFile;
  export let char_name: string;
  export let char_class: string;
  export let char_level: number;
  export let char_background: string;
  export let char_ac: number;
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

  async function updateLevel(newLevel: number) {
    char_level = newLevel;
    await app.fileManager.processFrontMatter(file, (frontmatter) => {
      frontmatter.level = newLevel;
    })
  }

  async function updateBackground(newLevel: string) {
    char_background = newLevel;
    await app.fileManager.processFrontMatter(file, (frontmatter) => {
      frontmatter.background = newLevel;
    })
  }

  async function updateClass(newClass: string) {
    char_class = newClass;
    await app.fileManager.processFrontMatter(file, (frontmatter) => {
      frontmatter.class = newClass;
    })
  }

  async function updateAc(newAc: number) {
    char_ac = newAc;
    await app.fileManager.processFrontMatter(file, (frontmatter) => {
      frontmatter.ac = newAc;
    })
  }

  async function updateSpeed(newSpeed: number) {
    char_speed = newSpeed;
    await app.fileManager.processFrontMatter(file, (frontmatter) => {
      frontmatter.speed = newSpeed;
    })
  }

  async function updateProficiencyBonus(newBonus: number) {
    char_proficiency_bonus = newBonus;
    await app.fileManager.processFrontMatter(file, (frontmatter) => {
      frontmatter.proficiency_bonus = newBonus;
    })
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
    const ability = attack.ability?.toLowerCase();
    const base = char_abilities[ability] !== undefined ? getAbilityModifier(char_abilities[ability]) : 0;
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

  let newAttack: { name: string; ability: string; proficient: boolean; damage: string; damage_type: string } = { name: "", ability: "", proficient: false, damage: "", damage_type: "" };

  async function addAttack() {
    if (!newAttack.name.trim()) return;

    const attackToAdd = { ...newAttack };
    char_attacks = [...char_attacks, attackToAdd];
    newAttack = { name: "", ability: "", proficient: false, damage: "", damage_type: "" };

    await app.fileManager.processFrontMatter(file, (frontmatter) => {
      if (!frontmatter.attacks) frontmatter.attacks = [];
      frontmatter.attacks.push(attackToAdd);
    });
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
      on:change={(e) => updateClass(String(e.currentTarget.value))}
      />
    </div>

    <div class="stat-row">
      <span>Lvl</span>
      <input
      class="num-input"
      type="number"
      value={char_level}
      on:change={(e) => updateLevel(Number(e.currentTarget.value))}
      />
    </div>

    <div class="stat-row">
      <span>Background</span>
      <input
      class="text-input"
      type="text"
      value={char_background}
      on:change={(e) => updateBackground(String(e.currentTarget.value))}
      />
    </div>

    <div class="stat-row">
      <span>Proficiency Bonus</span>
      <input
      class="num-input"
      type="number"
      value={char_proficiency_bonus}
      on:change={(e) => updateProficiencyBonus(Number(e.currentTarget.value))}
      />
    </div>

    <div class="stat-row">
      <span>Armor Class</span>
      <input
      class="num-input"
      type="number"
      value={char_ac}
      on:change={(e) => updateAc(Number(e.currentTarget.value))}
      />
    </div>

    <div class="stat-row">
      <span>Speed</span>
      <input
      class="num-input"
      type="number"
      value={char_speed}
      on:change={(e) => updateSpeed(Number(e.currentTarget.value))}
      />
    </div>

    <div class="stat-row">
      <span>Initiative</span>
      <span class="mod">{formatModifier(getAbilityModifier(char_abilities["dex"]))}</span>
    </div>
  </div>

  <!-- HP -->
  <div class="hp-block">
    <h2>HP</h2>
    <label>
      HP
      <input
        type="number"
        class="num-input"
        value={char_hp.current}
        on:change={(e) => updateHP("current", Number(e.currentTarget.value))}
      />
      <span style="font-weight: bold">+</span>
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

  <!-- MONEY -->
  <div>
    <h2>Money</h2>
    <div class="currency-row">
      {#each currencyKeys as coin}
        <label class="stat-row">
          <span>{coin.toUpperCase()}</span>
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
  <div>
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

    <div class="stat-row">
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
            on:change={(e) => updateAttackField(index, "proficient", e.currentTarget.checked)}
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
      {/each}

      <div class="attack-row attack-new">
        <input class="text-input" type="text" placeholder="Name" bind:value={newAttack.name} />
        <input class="text-input small" type="text" placeholder="str/dex/..." bind:value={newAttack.ability} />
        <input class="" type="checkbox" placeholder="true/false" bind:value={newAttack.proficient} />
        <input class="text-input small" type="text" placeholder="1d6" bind:value={newAttack.damage} />
        <input class="text-input small" type="text" placeholder="slashing" bind:value={newAttack.damage_type} />
        <span></span>
        <button on:click={addAttack}>Add</button>
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
          <span class="item-name">{trait}</span>
          <button class="icon-btn" on:click={() => removeInventoryItem(index)}>✕</button>
        </li>
      {/each}
    </ul>
    <div class="stat-row">
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

</div>

<style>
  .sheet-container {
    /* display: flex;
    flex-direction: column; */
    gap: 9px;
  }

  .num-input {
    width: 50px !important;
  }
  .text-input {
    width: 100px !important;
  }

  .stat-grid {
    display: grid !important;
    !!!/* grid-template-columns: auto auto; */
    row-gap: 300px 300px;
    align-items: center;
    gap: 10px;
    /* max-width: 400px; */
  }

  .stat-row {
    display: flex;
    align-items: left;
    text-align: left;
  }

  .stat-row span {
    padding-right: 10px;
  }

  .abilities-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }
  .ability-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 110px;
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    padding: 0.4rem;
  }
  .mod {
    font-weight: bold;
    color: var(--text-accent);
  }

  .currency-row {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .inventory-list {
    list-style: none;
    padding: 0;
    margin: 4px 0;
  }

  .inventory-list li {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 0;
  }

  .item-name {
    flex: 1;
  }

  .icon-btn {
    width: 24px;
    height: 24px;
    padding: 0;
    line-height: 1;
  }
  .attack-table {
    /* display: grid;
    grid-template-columns: repeat(6, max-content) auto;
    gap: 4px;
    justify-content: start; */
    list-style: none;
    padding: 0;
    margin: 4px 0
  }

  .attack-row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 2px 0;
  }

  .attack-row button {
    margin-left: auto;
  }

  .attack-header {
    font-weight: bold;
    font-size: 0.85em;
    color: var(--text-muted);
  }

  .text-input.small {
    width: 60px !important;
  }
</style>
