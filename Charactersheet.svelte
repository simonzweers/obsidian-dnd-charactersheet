<script lang="ts">
  import { type TFile, type App, Notice } from "obsidian";

  export let app: App;
  export let file: TFile;
  export let char_name: string;
  export let char_class: string;
  export let char_level: number;
  export let char_abilities: Record<string, number>;
  export let char_hp: Record<string, number>;
  export let char_proficiency_bonus: number;
  export let char_skills: Record<string, boolean>;
  export let char_saving_throws: Record<string, boolean>
  // export let frontmatter: Record<string, any>;
  let count = 0;

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

  async function updateLevel(newLevel: number) {
    char_level = newLevel;
    await app.fileManager.processFrontMatter(file, (frontmatter) => {
      frontmatter.level = newLevel;
    })
    new Notice("Updated Level");
  }

  async function updateClass(newClass: string) {
    char_class = newClass;
    await app.fileManager.processFrontMatter(file, (frontmatter) => {
      frontmatter.class = newClass;
    })
    new Notice("Updated Class");
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
  }

  export function increment() {
    count += 1;
  }
</script>

<div class="sheet-container">
  <h1>Character Name: {char_name}</h1>
  <label class="stat-row">
    <span>Lvl</span>
    <input
    class="num-input"
    type="number"
    value={char_level}
    on:change={(e) => updateLevel(Number(e.currentTarget.value))}
    />
  </label>
  <label class="stat-row">
    <span>Class</span>
    <input
    class="text-input"
    type="string"
    value={char_class}
    on:change={(e) => updateClass(String(e.currentTarget.value))}
    />
  </label>

  <label class = "stat-row">
    <span>Proficiency Bonus</span>
    <input
    class="num-input"
    type="number"
    value={char_proficiency_bonus}
    on:change={(e) => updateProficiencyBonus(Number(e.currentTarget.value))}
    />
  </label>

  <!-- ABILITIES -->
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
</div>

<style>
  .sheet-container {
    display: flex;
    flex-direction: column;
    gap: 9px;
  }

  .num-input {
    width: 50px !important;
  }
  .text-input {
    width: 100px !important;
  }

  .stat-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .stat-row span {
    width: 50px;
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
</style>
