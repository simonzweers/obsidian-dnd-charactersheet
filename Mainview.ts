import { ItemView, WorkspaceLeaf, TFile, livePreviewState, Notice } from 'obsidian';

// Import the Charactersheet Svelte component and the `mount` and `unmount` methods.

import Charactersheet from './Charactersheet.svelte';
import {mount, unmount} from 'svelte'
import type {Attack, DndCharacterFrontmatter} from './types'

export const VIEW_TYPE_CHARACTERSHEET = 'dnd-charactersheet';

export class CharacterSheetView extends ItemView {
	private component: ReturnType<typeof mount> | null = null;
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
			this.app.workspace.on("file-open", () => void this.refresh())
		);

		// catch direct edits to frontmatter while the sheet is open
		this.registerEvent(
			this.app.metadataCache.on("changed", (file) => {
				if (file.path === this.app.workspace.getActiveFile()?.path) {
					void this.refresh();
				}
			})
		)

		this.registerEvent(
			this.app.vault.on("rename", (file, oldPath) => {
				new Notice("File Renamed")
				if (file.path === this.app.workspace.getActiveFile()?.path) {
					void this.refresh();
				};
			})
		)

		void this.refresh();
	}

	private async handleCreateCharacterSheet(file: TFile) {
		await this.app.fileManager.processFrontMatter(file, (fm: DndCharacterFrontmatter) => {
			fm.dnd_character = true;
		})
		void this.refresh();
	}

	async refresh() {
		try {
			const file = this.app.workspace.getActiveFile();
			const container = this.contentEl;

			if (this.component) {
				unmount(this.component);
				this.component = null;
			}
			container.empty();

			if (!file) {
				container.createEl("p", { text: "No Active File."});
				return;
			}

			const rawFrontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
			if (!rawFrontmatter) {
				container.createEl("p", { text: "This note has no frontmatter."});
				const createButton = container.createEl("button", {
					text: "Create Character Sheet"
				});
				createButton.addEventListener("click", () => {
					void this.handleCreateCharacterSheet(file);
				});
				return;
			}
			const frontmatter = rawFrontmatter as DndCharacterFrontmatter;

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
			const char_attacks: Attack[] = frontmatter.attacks ?? [];
			const char_traits: string[] = frontmatter.traits ?? [];
			const char_proficiencies: string[] = frontmatter.proficiencies ?? [];
			const char_spells = {
				cantrips: [],
				...(frontmatter.spells ?? {}),
			};

			// Attach the Svelte component to the ItemViews content element and provide the needed props.
			this.component = mount(Charactersheet, {
				target: container,
				props: {
					app: this.app,
					file,
					char_name: file.basename,
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
					char_spells,
					char_spellcasting: frontmatter.spellcasting ?? "int",
				}
			});
		} catch (err) {
			console.error(err);
			new Notice("Failed to load character sheet");
		}
	}

	async onClose() {
		if (this.component) {
			unmount(this.component);
		}
	}
}
