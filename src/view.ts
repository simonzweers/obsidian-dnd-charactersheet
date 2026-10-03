import { ItemView, WorkspaceLeaf, TFile, Notice } from 'obsidian';
import { mount, unmount } from 'svelte'

import CharacterSheet from './components/CharacterSheet.svelte';
import { normalizeCharacter } from './character';
import type { DndCharacterFrontmatter } from './types'

export const VIEW_TYPE_CHARACTERSHEET = 'dnd-charactersheet';

export class CharacterSheetView extends ItemView {
	private component: ReturnType<typeof mount> | null = null;

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
			this.app.vault.on("rename", (file) => {
				if (file.path === this.app.workspace.getActiveFile()?.path) {
					void this.refresh();
				}
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
				void unmount(this.component);
				this.component = null;
			}
			container.empty();

			if (!file) {
				container.createEl("p", { text: "No Active File."});
				return;
			}

			const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
			if (!frontmatter) {
				container.createEl("p", { text: "This note has no frontmatter."});
				const createButton = container.createEl("button", {
					text: "Create Character Sheet"
				});
				createButton.addEventListener("click", () => {
					void this.handleCreateCharacterSheet(file);
				});
				return;
			}

			this.component = mount(CharacterSheet, {
				target: container,
				props: {
					app: this.app,
					file,
					...normalizeCharacter(file, frontmatter as DndCharacterFrontmatter),
				}
			});
		} catch (err) {
			console.error(err);
			new Notice("Failed to load character sheet");
		}
	}

	async onClose() {
		if (this.component) {
			void unmount(this.component);
		}
	}
}
