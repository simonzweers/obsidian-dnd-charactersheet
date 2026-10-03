import { requestUrl } from "obsidian";

// Looks up spells in the Open5e API (https://api.open5e.com) to find a page to link to.

const API = "https://api.open5e.com/v2/spells/";
const PAGE = "https://open5e.com/spells/";
// Only the official SRD documents, newest first (srd-2024 is SRD 5.2).
const DOCUMENTS = ["srd-2024", "srd-2014"];
const DOCUMENT_NAMES: Record<string, string> = {
	"srd-2024": "SRD 5.2",
	"srd-2014": "SRD 5.1",
};

export interface SpellMatch {
	key: string;
	name: string;
	document: string;
	url: string;
}

interface ApiSpell {
	key: string;
	name: string;
	document: string | { key: string };
}

export function documentName(document: string) {
	return DOCUMENT_NAMES[document] ?? document;
}

async function query(filter: string, value: string): Promise<SpellMatch[]> {
	const params = new URLSearchParams({
		[filter]: value,
		document__key__in: DOCUMENTS.join(","),
		fields: "key,name,document",
		limit: "50",
	});
	const res = await requestUrl({ url: `${API}?${params.toString()}`, throw: false });
	if (res.status !== 200) return [];

	const results = (res.json as { results?: ApiSpell[] }).results ?? [];
	return results
		.map((r) => {
			const document = typeof r.document === "string" ? r.document : r.document.key;
			return { key: r.key, name: r.name, document, url: PAGE + r.key };
		})
		.sort((a, b) => DOCUMENTS.indexOf(a.document) - DOCUMENTS.indexOf(b.document));
}

/**
 * Finds Open5e spells matching `name`. Tries an exact match first, then without a
 * leading owner ("Melf's Acid Arrow" is "Acid Arrow" in the SRD), then a partial match.
 */
export async function findSpell(name: string): Promise<SpellMatch[]> {
	const trimmed = name.trim();
	const withoutOwner = trimmed.replace(/^\S+['’]s\s+/, "");

	const attempts: [string, string][] = [["name__iexact", trimmed]];
	if (withoutOwner !== trimmed) attempts.push(["name__iexact", withoutOwner]);
	attempts.push(["name__icontains", withoutOwner]);

	for (const [filter, value] of attempts) {
		const matches = await query(filter, value);
		if (matches.length > 0) return matches;
	}
	return [];
}
