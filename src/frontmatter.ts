import type { App, TFile } from "obsidian";
import type { DndCharacterFrontmatter } from "./types";

export type Frontmatter = DndCharacterFrontmatter;
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
