import { type App, SuggestModal } from "obsidian";
import { documentName, type SpellMatch } from "../spellLookup";

/** Lets the user pick one of several Open5e matches. Resolves to null when dismissed. */
export function pickSpellMatch(app: App, matches: SpellMatch[]): Promise<SpellMatch | null> {
	return new Promise((resolve) => new SpellMatchModal(app, matches, resolve).open());
}

class SpellMatchModal extends SuggestModal<SpellMatch> {
	private chosen = false;

	constructor(
		app: App,
		private matches: SpellMatch[],
		private resolve: (match: SpellMatch | null) => void,
	) {
		super(app);
		this.setPlaceholder("Pick the matching spell");
	}

	getSuggestions(query: string) {
		const q = query.toLowerCase();
		return this.matches.filter((m) => m.name.toLowerCase().includes(q));
	}

	renderSuggestion(match: SpellMatch, el: HTMLElement) {
		el.createEl("div", { text: match.name });
		el.createEl("small", { text: documentName(match.document) });
	}

	onChooseSuggestion(match: SpellMatch) {
		this.chosen = true;
		this.resolve(match);
	}

	onClose() {
		// onChooseSuggestion runs after onClose, so wait a tick before treating this as a dismiss.
		setTimeout(() => {
			if (!this.chosen) this.resolve(null);
		}, 0);
	}
}
