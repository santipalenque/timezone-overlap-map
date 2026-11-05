# timezone-overlap-map

A web component that shows your timezone next to your visitor's on a world map, and how your working hours overlap. Built with React and TypeScript, shipped as a standard custom element, so it works in any framework or in plain HTML.

- A world map read as your day, 00 to 24: your working hours stay put, the visitor's slide with their zone, and the overlap is labeled with its length ("5 h").
- A dot per city and the live day/night line with the sun's position.
- Both clocks, a zone picker that starts at the visitor's zone, and the overlap in the visitor's own time as text (also for screen readers).

About 15 KB gzipped, map included, plus React.

## Install

```sh
npm install timezone-overlap-map react react-dom
```

React is a peer dependency: your bundler provides it.

## Usage

```js
import 'timezone-overlap-map';
```

```html
<timezone-overlap-map
  home-zone="America/Argentina/Buenos_Aires"
  home-label="Santiago"
></timezone-overlap-map>
```

The visitor's zone comes from the browser (`Intl`), with no IP lookup. A selector lets them pick another one, for example a recruiter hiring for a team in a different zone.

### Attributes

| Attribute | Default | |
|---|---|---|
| `home-zone` | `UTC` | IANA zone you work from |
| `home-label` | city of `home-zone` | Name shown for your side |
| `visitor-zone` | the browser's zone | Starting zone for the visitor |
| `work-start` | `9` | Start of working hours, local time in each zone |
| `work-end` | `18` | End of working hours (a value before `work-start` means a night shift) |
| `lang` | the closest `lang` up the tree | `en` or `es`; any other language falls back to English |

The language is read when the element renders and whenever its own attributes change; if you switch the page's `<html lang>` on the client, set `lang` on the element too.

Offsets are computed with `Intl` for the current date, so daylight saving time on either side is always right.

### Events

`zonechange` fires when the visitor picks another zone:

```js
el.addEventListener('zonechange', (event) => console.log(event.detail.zone));
```

### Theming

Styles live in the shadow DOM. Custom properties cross it, so set them on the element or any ancestor:

```css
timezone-overlap-map {
  --tom-fg: #e8e6e3;
  --tom-muted: #9a9894;
  --tom-track: #ffffff1a;
  --tom-home: #4fd1c5;
  --tom-visitor: #f6ad55;
  --tom-overlap: #68d391;
  --tom-land: #ffffff38;
  --tom-night: #00000066;
  --tom-sun: #fff7d6;
  --tom-radius: 4px;
  --tom-font: 14px/1.5 system-ui;
}
```

The night and the sun have defaults for both light and dark pages, picked through the page's `color-scheme`.

### Server rendering

Importing the package on the server is safe: the element registers only where `customElements` exists.

## Development

```sh
yarn
yarn dev       # demo page at http://localhost:5173
yarn test
yarn build     # dist/: ES module + type declarations
yarn geo       # regenerate src/geo.ts (map outline + zone coordinates)
```

## Releasing

Push a `v*` tag matching `version` in `package.json`; the Release workflow tests, builds and publishes to npm with [provenance](https://docs.npmjs.com/generating-provenance-statements), through npm trusted publishing (no token stored in the repo).

```sh
npm version patch   # bumps package.json and creates the tag
git push --follow-tags
```

## Data

- Land outline: [Natural Earth](https://www.naturalearthdata.com/) 1:110m (public domain), via [world-atlas](https://github.com/topojson/world-atlas).
- Zone locations: [IANA tz database](https://www.iana.org/time-zones) (`zone.tab`, plus links so the names `Intl` returns resolve).

Both are converted once by `scripts/build-geo.mjs` into a compact SVG path and a coordinate table; the package has no runtime dependencies besides React.

## License

MIT
