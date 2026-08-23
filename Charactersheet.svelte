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
  export let char_skills: object;
  // export let frontmatter: Record<string, any>;
  let count = 0;

  const abilityMod = (score: number) => Math.floor((score - 10) / 2);
  const fmtMod = (mod: number) => (mod >= 0 ? `+${mod}` : `${mod}`);

  const abilityKeys = ["str", "dex", "con", "int", "wis", "cha"] as const;

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

  async function updateAbility(ability: string, level: number) {
    char_abilities[ability] = level;
    await app.fileManager.processFrontMatter(file, (frontmatter) => {
      frontmatter.char_abilities = char_abilities;
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
        <span class="mod">{fmtMod(abilityMod(Number(char_abilities[key])))}</span>
      </div>
    {/each}
  </div>

  <div class="hp-block">
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
    border: 1px solid var(--background-modifier-border);
    border-radius: 6px;
    padding: 0.4rem;
  }
  .mod {
    font-weight: bold;
    color: var(--text-accent);
  }
</style>
