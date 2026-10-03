import type { App, TFile } from "obsidian";

// Frontmatter is loosely typed on purpose: the note may contain anything.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Frontmatter = any;
export type Save = (fn: (frontmatter: Frontmatter) => void) => Promise<void>;

/** Returns a function that applies `fn` to the frontmatter of `file`. */
export function makeSaver(app: App, file: TFile): Save {
	return (fn) => app.fileManager.processFrontMatter(file, fn);
}

/** Swaps arr[index] with arr[index - 1] in place. */
export function swapUp<T>(arr: T[], index: number) {
	if (index <= 0 || index >= arr.length) return;
	[arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
}
