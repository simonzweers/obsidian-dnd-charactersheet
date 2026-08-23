import { ItemView, WorkspaceLeaf, TFile, livePreviewState, Notice } from 'obsidian';

// Import the Charactersheet Svelte component and the `mount` and `unmount` methods.

import Charactersheet from './Charactersheet.svelte';
import {mount, unmount} from 'svelte'

export const VIEW_TYPE_CHARACTERSHEET = 'dnd-charactersheet';

export class CharacterSheetView extends ItemView {
  private component: Charactersheet | null = null;
  private currentFile: TFile | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() { return VIEW_TYPE_CHARACTERSHEET; }
  getDisplayText() { return "Character Sheet"; }
  getIcon() { return "dice"; }

  async onOpen() {
    // fires whenever the active file changes, more reliable than active-leaf-change
    this.registerEvent(
      this.app.workspace.on("file-open", () => this.refresh())
    );

    // catch direct edits to frontmatter while the sheet is open
    this.registerEvent(
      this.app.metadataCache.on("changed", (file) => {
        if (file.path === this.app.workspace.getActiveFile()?.path) {
          this.refresh()
        }
      })
    )

    this.refresh();
  }

  async refresh() {
    const file = this.app.workspace.getActiveFile();
    const container = this.contentEl;

    this.component?.$destroy();
    this.component = null;
    container.empty();

    if (!file) {
      container.createEl("p", { text: "No Active File."});
      return
    }

    const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
    if (!frontmatter) {
      container.createEl("p", { text: "This note has no frontmatter."});
      return;
    }

    const char_abilities = {
      str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
      ...(frontmatter.abilities ?? {}),
    }
    const char_hp = {
      current: 0, max: 0, temp: 0,
      ...(frontmatter.hp ?? {}),
    }
    const char_skills = frontmatter.skills ?? {}
    const char_saving_throws = frontmatter.saving_throws ?? {}
    const char_currency = {
      cp: 0, sp: 0, ep: 0, gp: 0, pp: 0,
      ...(frontmatter.currency ?? {}),
    };
    const char_inventory: string[] = frontmatter.inventory ?? [];
    interface Attack {
      name: string;
      ability: string;
      proficient: boolean;
      damage: string;
      damage_type: string;
    }
    const char_attacks: Attack[] = frontmatter.attacks ?? [];
    const char_traits: string[] = frontmatter.traits ?? [];
    const char_proficiencies: string[] = frontmatter.proficiencies ?? [];

    console.log(char_currency)
    console.log(char_inventory)
    console.log(char_attacks)
    console.log(char_traits)

    // Attach the Svelte component to the ItemViews content element and provide the needed props.
    this.component = mount(Charactersheet, {
      target: container,
      props: {
        app: this.app,
        file,
        char_name: frontmatter.name ?? "Unnamed",
        char_class: frontmatter.class ?? "",
        char_level: frontmatter.level ?? 1,
        char_background: frontmatter.background ?? "No Background",
        char_ac: frontmatter.ac ?? 10,
        char_speed: frontmatter.speed ?? 30,
        char_abilities,
        char_hp,
        char_proficiency_bonus: frontmatter.proficiency_bonus ?? 2,
        char_skills,
        char_saving_throws,
        char_currency,
        char_inventory,
        char_attacks,
        char_traits,
        char_proficiencies,
      }
    });
  }

  async onClose() {
    if (this.component) {
      unmount(this.component);
    }
  }
}
