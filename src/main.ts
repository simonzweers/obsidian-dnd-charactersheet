import { CharacterSheetView, VIEW_TYPE_CHARACTERSHEET } from './view';
import { Notice, Plugin, WorkspaceLeaf } from 'obsidian';

interface CharacterSheetSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: CharacterSheetSettings = {
	mySetting: 'default'
}

export default class CharacterSheet extends Plugin {
	settings!: CharacterSheetSettings;

	async onload() {
		await this.loadSettings();

		this.registerView(
			VIEW_TYPE_CHARACTERSHEET,
			(leaf) => new CharacterSheetView(leaf)
		);
		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'DnD Character Sheets', () => {
			void this.activateView();
		});
		ribbonIconEl.addClass('my-plugin-ribbon-class');
	}

	onunload() {

	}

	async loadSettings() {
		const loadedData = (await this.loadData()) as Partial<CharacterSheetSettings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_CHARACTERSHEET);

		if (leaves.length > 0 ) {
			leaf = leaves[0];
		} else {
			leaf = workspace.getRightLeaf(false);
			await leaf?.setViewState({type: VIEW_TYPE_CHARACTERSHEET, active: true});
		}

		if (!leaf) {
			new Notice("Couldn't open the character sheet view.");
			return;
		}

		// Maybe replace void with await?
		void workspace.revealLeaf(leaf);
	}
}
