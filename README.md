# Gallery View

Gallery View turns a block of YAML configuration into an interactive grid of note covers—no Dataview or scripts required.

## Usage

1. Install dependencies and build the plugin:
   ```bash
   npm install
   npm run build
   ```
2. Copy `manifest.json` and `main.js` into your vault's `.obsidian/plugins/gallery-view` folder, or develop directly inside that folder.
3. Reload plugins inside Obsidian and enable **Gallery View**.
4. Add a fenced code block with language `gallery` anywhere in your vault and configure it:
````
```gallery
mainTag: films
typePath: types/Film.md
excludeFolder: templates
statusField: watched
cardWidth: 120
```
````

A three-segment pill appears at the end of the tag row (◎/✓/✕). Pick the segment to filter by `all`, truthy, or falsy values respectively—the active segment is highlighted. The control reads the field configured via `statusField` (defaults to `watched`).

## Fancy block examples

### Display recently added albums

````
```gallery
mainTag: albums
typePath: types/Album.md
coverField: artwork
statusField: listened
cardWidth: 140
```
````

### Kanban ideas with status cycle

````
```gallery
mainTag: ideas
typePath: types/Idea.md
excludeFolder: archive
statusField: status
cardWidth: 110
```
````

### Expected note metadata

- `type` (frontmatter key or `type::` inline) – must resolve to the supplied `typePath`.
- `cover` (frontmatter or inline; honors wiki links) – should be a file path or URL to render.
- `tags` – optional; tags other than `mainTag` become chips.
- `statusField` (optional) – controlled by the ◎/✓/✕ segmented control at the end of the tag row. Pick the segment to show all entries, only truthy values, or only falsy values. Defaults to `watched` and accepts booleans or strings such as `true/false`, `yes/no`, or `1/0`.
- `cardWidth` (optional) – base card width in pixels. Defaults to `120`. The grid adapts around this value while remaining responsive.

### Hot reloading

Run `npm run dev` for watch-mode builds while you iterate on the plugin.

## License

MIT © Ian
