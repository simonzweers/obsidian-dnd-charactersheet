# Obsidian: DnD Character Sheet Tool

This is a simple DnD charactersheet viewer/editor. It enables the creation and viewing of charactersheets directly inside of Obsidian.

## Key features

- Editing fields directly in the charactersheet view
- Automatically calculate "calculated" fields such as Initiative, HP, Skills
- Embed character sheet directly into file properties, to allow for additional writing inside the file
- The ability to add links to saved spells, to allow for easy lookup and opening them in your browser

## Motivation

Before I started writing this, I've wanted a plugin for obsidian which enabled me to interact with charactersheets.
For writing lore, backstory or taking notes, obsidian already works really well, which is why I've already been using it for this.
I was really surprised when I tried to search for a charactersheet plugin and there were none which fit my needs.
I found a couple which were promising, which I didn't use for the following reasons:

* [Character Sheets by Grayvox](https://community.obsidian.md/plugins/character-sheets): This just creates markdown files with no special layout. I wanted a UI to view/edit my stats.
* [DnD Beyond Importer](https://community.obsidian.md/plugins/dndbeyond-importer): Promising, but it needs DnD Beyond to function. I wanted something completely standalone inside obsidian.
* [DnD HP Tracker](https://community.obsidian.md/plugins/dnd-hp-tracker): Really useful tool, but I it does not show full charactersheets.

This is why I built **DnD Character sheet Tool**. A full interface and completely independent tool for creating/viewing/editing character sheets.

## Installation

### Install from Obsidian

1. Open your vault
2. Open Settings > Community plugins > Browse
3. Seach for "DnD Character Sheet Tool"
4. Install the Plugin

### Install from source

You can also install it directly from source.
This also means you need to have `npm` installed.
Execute the following commands inside your vault.

```bash
cd <your-vault>
git clone https://github.com/simonzweers/obsidian-dnd-charactersheet.git .obsidian/plugins/obsidian-dnd-charactersheet
cd .obsidian/plugins/obsidian-dnd-charactersheet
npm install && npm run build
```

## Usage

1. Enable the plugin: Settings > Community Plugins > Installed Plugins > Enable "DnD Character Sheet Tool"
2. Create a file with the name of your character (see the UI preview)
3. Click on the plugin icon "dice".
4. The character sheet view will pop up. It will say "This note has no frontmatter". Click on the "Create Character Sheet" button. This will load the view, and enable you to start editing your character.
5. (Optional) Add lore or other notes through the regular text editor.

## UI Preview

Below you can see an example of the layout with a simple character.

![example_ui](./images/example_ui_v1-2-1.png)


## TODO
- Search web for spell name and add option to automatically add a link
- Add buttons for processing damage
- Add check for `dnd_character: true` to prevent loading UI if frontmatter is not for a DnD character
- Add Github artifact attestations
