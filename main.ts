import { CharacterSheetView, VIEW_TYPE_CHARACTERSHEET } from 'Mainview';
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf } from 'obsidian';

// Remember to rename these classes and interfaces!

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


		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new CharacterSheetModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new CharacterSheetModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.registerView(
			VIEW_TYPE_CHARACTERSHEET,
			(leaf) => new CharacterSheetView(leaf)
		);
		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'DnD Character Sheets', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			this.activateView();
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
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
		workspace.revealLeaf(leaf);
	}
}

class CharacterSheetModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

// class SampleSettingTab extends PluginSettingTab {
// 	plugin: CharacterSheet;
//
// 	constructor(app: App, plugin: CharacterSheet) {
// 		super(app, plugin);
// 		this.plugin = plugin;
// 	}
//
// 	display(): void {
// 		const {containerEl} = this;
//
// 		containerEl.empty();
//
// 		new Setting(containerEl)
// 			.setName('Setting #1')
// 			.setDesc('This will do something')
// 			.addText(text => text
// 				.setPlaceholder('Enter your secret')
// 				.setValue(this.plugin.settings.mySetting)
// 				.onChange(async (value) => {
// 					this.plugin.settings.mySetting = value;
// 					await this.plugin.saveSettings();
// 				}));
// 	}
// }
