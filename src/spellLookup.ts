import { requestUrl } from "obsidian";

// Looks up spells in the Open5e API (https://api.open5e.com) to find a page to link to.

const API = "https://api.open5e.com/v2/spells/";
const PAGE = "https://open5e.com/spells/";
// Only the official SRD documents, in order of preference: 2014 rules (SRD 5.1) first, then 2024 (SRD 5.2).
const DOCUMENTS = ["srd-2014", "srd-2024"];
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

export interface SpellDetails {
	key: string;
	name: string;
	level: number;
	school: { name: string };
	classes: { name: string }[];
	casting_time: string;
	reaction_condition: string | null;
	range_text: string;
	verbal: boolean;
	somatic: boolean;
	material: boolean;
	material_specified: string;
	duration: string;
	concentration: boolean;
	ritual: boolean;
	desc: string;
	higher_level: string;
	document: { display_name: string; key: string };
}

const DETAIL_FIELDS = [
	"key", "name", "level", "school", "classes", "casting_time", "reaction_condition",
	"range_text", "verbal", "somatic", "material", "material_specified", "duration",
	"concentration", "ritual", "desc", "higher_level", "document",
].join(",");

// Spell details never change, so keep them for the rest of the session.
const detailsCache = new Map<string, Promise<SpellDetails | null>>();

/** The Open5e spell key in a link like https://open5e.com/spells/srd_fireball, if any. */
function keyFromLink(link: string | undefined) {
	return link?.match(/^https?:\/\/(?:www\.)?open5e\.com\/spells\/([^/?#]+)\/?$/)?.[1] ?? null;
}

async function fetchDetails(key: string): Promise<SpellDetails | null> {
	const params = new URLSearchParams({ fields: DETAIL_FIELDS });
	const res = await requestUrl({
		url: `${API}${encodeURIComponent(key)}/?${params.toString()}`,
		throw: false,
	});
	return res.status === 200 ? (res.json as SpellDetails) : null;
}

/**
 * Details for a spell from the character sheet. Uses the spell's Open5e link when it
 * has one, otherwise looks it up by name (only when the name matches a single spell).
 */
export function getSpellDetails(spell: { name: string; link?: string }) {
	const cacheKey = keyFromLink(spell.link) ?? `name:${spell.name.trim().toLowerCase()}`;
	let details = detailsCache.get(cacheKey);
	if (!details) {
		details = (async () => {
			let key = keyFromLink(spell.link);
			if (!key) {
				const matches = await findSpell(spell.name);
				const sameSpell = matches.every(
					(m) => m.name.toLowerCase() === matches[0].name.toLowerCase(),
				);
				if (matches.length === 0 || !sameSpell) return null;
				key = matches[0].key;
			}
			return fetchDetails(key);
		})();
		// Don't cache failures (e.g. offline), so opening the panel again retries.
		details.catch(() => detailsCache.delete(cacheKey));
		detailsCache.set(cacheKey, details);
	}
	return details;
}
