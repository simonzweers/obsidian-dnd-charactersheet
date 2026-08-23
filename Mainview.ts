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
    // Attach the Svelte component to the ItemViews content element and provide the needed props.
    this.component = mount(Charactersheet, {
      target: container,
      props: {
        app: this.app,
        file,
        char_name: frontmatter.name,
        char_class: frontmatter.class,
        char_level: frontmatter.level,
        char_abilities: frontmatter.abilities,
        char_hp: frontmatter.hp,
        char_proficiency_bonus: frontmatter.proficiency_bonus,
        char_skills: frontmatter.skills,
      }
    });

    // Since the component instance is typed, the exported `increment` method is known to TypeScript.
    this.component.increment();
  }

  async onClose() {
    if (this.component) {
      unmount(this.component);
    }
  }
}
