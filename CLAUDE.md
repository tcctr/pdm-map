# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Mapear** — a single-page web app that visualizes PDM (Plano Diretor Municipal) zoning data and land-use restrictions for six municipalities in the Lisbon metro area (Sintra, Cascais, Oeiras, Loures, Amadora, Almada). Renders interactive zoning polygons on a Leaflet + OpenStreetMap map with live GPS, address search, and a unified layer selector.

## Architecture

No build step, no bundler. Pure ES modules loaded directly by the browser.

**File structure:**
- `js/config.js` — all constants, color maps, `OVERLAY_DEFS`, `MUNICIPALITIES`, base URLs
- `js/map.js` — Leaflet map init, base layers, municipality switching, layer visibility, map event handlers
- `js/layers.js` — `loadLayerData`, `fetchAllFeatures`, overlay lazy-loading, retry logic
- `js/ui.js` — detail panel, chips, layers sheet, cache date indicator, swipe gestures
- `js/search.js` — Nominatim address search and reverse geocode
- `js/main.js` — entry point, wires all modules together, GPS tracking, event listeners
- `css/style.css` — all styles
- `index.html` — HTML skeleton only, CDN imports, `<script type="module" src="js/main.js">`

**`package.json`** exists with `"type": "module"` — required for the sync script's ES module imports. No external runtime dependencies.

**External dependencies (CDN):**
- Leaflet 1.9.4 — map rendering and GeoJSON layer management
- esri-leaflet 3.0.12 — `dynamicMapLayer` (tile rendering) and `identifyFeatures` (click queries) for tile-rendered municipalities and fire risk layers

**Running locally:**
```bash
npx serve .
python3 -m http.server 8080
```

---

## Data Sources

**Sintra zoning (GeoJSON, cache-first with live fallback):**
- Urban: `data/sintra-urban.geojson` → fallback `SINTRA_BASE/55/query` — field `CAT` → `URBAN_COLORS`
- Rural: `data/sintra-rural.geojson` → fallback `SINTRA_BASE/54/query` — field `Ord_Categ` → `RURAL_COLORS`
- `SINTRA_BASE` = `https://sig.cm-sintra.pt/arcgis/rest/services/WMS_Inspire/WMS_PDM20_Ordenamento/MapServer`

**Cascais zoning (tile layer — geometry blocked by AML server, always live):**
- `CASCAIS_BASE/2` via `L.esri.dynamicMapLayer` with `maxZoom: 15` (tiles go blank above zoom 15)
- Click info via `identifyFeatures` — field `Categoria` → `CASCAIS_COLORS`
- `CASCAIS_BASE` = `https://sig.aml.pt/arcgis/rest/services/PlaneamentoOrdenamento/pdm_revisao/MapServer`

**Oeiras zoning (tile layer — same AML server as Cascais, always live):**
- `CASCAIS_BASE/3` via `L.esri.dynamicMapLayer` with `maxZoom: 15`
- Click info via `identifyFeatures` — field `Categoria` → `OEIRAS_COLORS`

**Loures zoning (tile layer — same AML server as Cascais, always live):**
- `CASCAIS_BASE/6` via `L.esri.dynamicMapLayer` with `maxZoom: 15`
- Click info via `identifyFeatures` — field `Categoria` → `LOURES_COLORS`

**Amadora zoning (GeoJSON, cache-first with DGT WFS live fallback):**
- `data/amadora-zoning.geojson` → fallback `AMADORA_WFS` (DGT CRUS public OGC WFS, 82 features)
- Field `Categoria_2021` → `AMADORA_COLORS`. Rendered client-side like Sintra (not tiles).
- `AMADORA_WFS` = `https://servicos.dgterritorio.pt/SDISNITWFSCRUS_1115_1/WFService.aspx?...`
- Amadora's own ArcGIS server is auth-protected; not on AML pdm_revisao (PDM revision in progress).

**Almada zoning (tile layer — AML PDM_I_GERACAO 1st-gen server, always live):**
- `AML_PDM1_BASE/2` via `L.esri.dynamicMapLayer` with `maxZoom: 14` — server's `maxScale:25000` makes tiles blank above zoom ~14; chip shows "recuar zoom" warning above zoom 14
- Click info via `identifyFeatures` using `'all:2'` — field `Classe` → `ALMADA_COLORS`
- `AML_PDM1_BASE` = `https://sig.aml.pt/arcgis/rest/services/PlaneamentoOrdenamento/PDM_I_GERACAO/MapServer`
- Almada's own server is down/firewalled; not on AML pdm_revisao.

**Overlay / Condicionantes layers — three servers:**
- `RAN_BASE` = `https://sig.cm-sintra.pt/arcgis/rest/services/WMS_Inspire/WMS_SRUP_REN_RAN/MapServer` (Sintra RAN only — frequently offline)
- `REN_BASE` = `https://sig.cm-sintra.pt/arcgis/rest/services/WMS_Inspire/WMS_SRUP_REN_CMS/MapServer` (Sintra REN + risk layers)
- `CONDICIONANTES_BASE` = `https://sig.cm-sintra.pt/arcgis/rest/services/WMS_Inspire/WMS_PDM20_Condicionantes/MapServer`

> **Known outage:** `WMS_SRUP_REN_RAN` (`RAN_BASE`) is frequently down on Sintra's server — only `ran-sintra` now depends on it.

---

## Layer System

### Base zoning layers (always on by default)
Six `L.layerGroup()` instances, one per municipality. Only visible at zoom ≥ `MIN_DATA_ZOOM` (1) and only when that municipality is active.

| Layer | Type | Source |
|-------|------|--------|
| `urbanLayer` | GeoJSON (SVG renderer) | Sintra urban zones |
| `ruralLayer` | GeoJSON (SVG renderer) | Sintra rural zones |
| `cascaisLayer` | dynamicMapLayer tiles | CASCAIS_BASE/2 |
| `oeirasLayer` | dynamicMapLayer tiles | CASCAIS_BASE/3 |
| `louresLayer` | dynamicMapLayer tiles | CASCAIS_BASE/6 |
| `amadoraLayer` | GeoJSON (SVG renderer) | DGT CRUS WFS |
| `almadaLayer` | dynamicMapLayer tiles | AML_PDM1_BASE/2 |

### Overlay layers (`OVERLAY_DEFS` array)
Radio-button selection — only one layer active at a time. Selecting any overlay hides the zoning. Selecting "Qualificação do Solo" restores it. Layers are **lazy-loaded** on first selection and cached in `ovlState`.

`activeLayer` variable tracks what's selected: `'zoning'`, a def id, or `'none'` (all layers hidden — basemap only).

**Renderers:**
- Sintra + Amadora zoning: `renderer = L.svg({ padding: 1 })`
- Overlay GeoJSON with hatch patterns: `renderer` (SVG — canvas can't render `url()` fills)
- Overlay GeoJSON without hatch: `overlayRenderer = L.canvas({ padding: 0.5 })`
- Fire risk + tile municipalities: `L.esri.dynamicMapLayer` (server tiles, no GeoJSON download)

**Current overlay layers:**

| id | Name | muni | Server | Layer ID | Cached file | Style |
|----|------|------|--------|----------|-------------|-------|
| `ran` | RAN — Reserva Agrícola | both | CONDICIONANTES_BASE (Sintra) / CASCAIS_BASE (others) | 264 / 12 | `ran-sintra.geojson`, `ran-cascais.geojson` | brown hatch (`hatch-ran`) |
| `ren-cascais` | REN — Reserva Ecológica | cascais | CASCAIS_BASE | 11 | `ren-cascais.geojson` | green hatch (`hatch-ren`) |
| `ren-oeiras` | REN — Reserva Ecológica | oeiras | CASCAIS_BASE | 11 | `ren-cascais.geojson` | green hatch (`hatch-ren`) |
| `ren-loures` | REN — Reserva Ecológica | loures | CASCAIS_BASE | 11 | `ren-cascais.geojson` | green hatch (`hatch-ren`) |
| `ren-amadora` | REN — Reserva Ecológica | amadora | CASCAIS_BASE | 11 | `ren-cascais.geojson` | green hatch (`hatch-ren`) |
| `ren-almada` | REN — Reserva Ecológica | almada | CASCAIS_BASE | 11 | `ren-cascais.geojson` | green hatch (`hatch-ren`) |
| `faixa` | Faixa Costeira | sintra | REN_BASE | 2 | `faixa.geojson` | blue fill |
| `praias` | Praias | sintra | REN_BASE | 3 | `praias.geojson` | yellow fill |
| `vertentes` | Instabilidade de Vertentes | sintra | REN_BASE | 12 | `vertentes.geojson` | red hatch (`hatch-risk-red`) |
| `erosao` | Erosão Hídrica | sintra | REN_BASE | 13 | `erosao.geojson` | orange hatch (`hatch-risk-orange`) |
| `mar` | Ameaça Costeira (Mar) | sintra | REN_BASE | 11 | `mar.geojson` | blue fill |
| `cheias` | Zonas de Cheias | sintra | REN_BASE | 10 | `cheias.geojson` | dark blue fill |
| `incendio` | Perigosidade de Incêndio | sintra | CONDICIONANTES_BASE | 371 | — (always live tiles) | dynamicMapLayer; CLASSE field → `FIRE_COLORS` |
| `patrimonio` | Bens Imóveis Classificados | sintra | CONDICIONANTES_BASE | 299 | `patrimonio.geojson` | purple fill |
| `zep` | Zona Especial de Proteção | sintra | CONDICIONANTES_BASE | 302 | `zep.geojson` | violet fill |
| `perigosos` | Equipamentos Perigosos | sintra | CONDICIONANTES_BASE | 368 | `perigosos.geojson` | gray fill |

**Notes:**
- `ren-sintra` was removed — no unified queryable REN boundary layer exists on Sintra's server.
- `ren-cascais.geojson` is AML-wide and covers Cascais, Oeiras, Loures, Amadora, and Almada territory.
- **RAN** (`muni: 'both'`) uses `sintraSource` / `cascaisSource` fields: Sintra → CONDICIONANTES_BASE/264, all others → CASCAIS_BASE/12.
- **SVG hatch patterns** are defined in a hidden `<svg>` in the HTML body: `hatch-ran`, `hatch-ren`, `hatch-risk-red`, `hatch-risk-orange`.

---

## Data Loading — Cache-First with Live Fallback

GeoJSON layers use `loadLayerData(cachedFile, fallbackUrl)`:
1. Fetch `/data/{cachedFile}` — if 404, empty, or error → `console.warn` and continue
2. Fetch live — if this also fails → `console.error`, return `null`
3. `null` = both failed → layer shows error chip state

Amadora uses a custom `loadAmadora()` that fetches from `/data/amadora-zoning.geojson` first, then falls back to the DGT WFS directly (not via `loadLayerData` since WFS needs a different fetch path).

**What stays live-only (never cached):**
- Cascais, Oeiras, Loures, Almada zoning tiles (`L.esri.dynamicMapLayer`)
- Fire risk tiles (`L.esri.dynamicMapLayer`)
- All `identifyFeatures` click queries
- Nominatim address search + reverse geocode

**Fallback tracking:** `liveFallbackCount` increments each time a layer falls back to live. The `#cache-date` indicator shows `"Dados: DD/MM/YYYY (alguns em direto)"` if any fallback occurred.

**Cached files** live in `data/` at the repo root (served at `/data/` by Vercel). Currently cached: `sintra-urban`, `sintra-rural`, `ran-cascais`, `ren-cascais`, `amadora-zoning`, `patrimonio`, `zep`, `perigosos`.

---

## Sync Script — `scripts/sync-data.js`

Downloads all GeoJSON layers to `data/`. Run with:
```bash
node scripts/sync-data.js
```

- Paginates ArcGIS responses (follows `exceededTransferLimit`, 1 s delay between pages)
- Tries `f=geojson` first; falls back to `f=json` + Esri→GeoJSON conversion if server returns HTML
- **WFS support:** Amadora uses `fetchWFSAll()` (single-request OGC WFS, no pagination) via `type: 'wfs'` entry
- Never overwrites a cached file with 0-feature data
- Writes `data/sync-metadata.json` with per-layer status and `lastRun` timestamp
- Exits code 1 on any failure (for CI)
- Large layers (`sintra-urban`, `sintra-rural`): `pageSize=500`, `timeout=60s`

---

## GitHub Actions — `.github/workflows/sync-data.yml`

Runs every Monday at 06:00 UTC (+ manual `workflow_dispatch`). Steps:
1. Checkout repo
2. Set up Node.js 22
3. `npm ci`
4. `node scripts/sync-data.js` (`continue-on-error: true` — partial failures still commit)
5. `git add data/` → check `git diff --staged`
6. If changed: commit `"chore: sync PDM data [automated]"` + push → triggers Vercel deploy
7. If no changes: log and skip

Pushes with `github-actions[bot]` identity. Push failures are warnings, not fatal.

---

## Auto-Retry

Failed overlay loads retry automatically via `RETRY_DELAYS = [15000, 30000, 60000]` (15s, 30s, 1min):
- Tile municipality layers (Cascais/Oeiras/Loures/Almada): clears layer group before each retry, uses `.once('loaderror')`
- Overlays: retry count in `ovlState[id].retries`; timer guard checks `activeLayer === id && !st.loaded`. Resets on municipality switch.
- Sintra urban/rural + Amadora: no retry — served from local cache, failures are near-instant

---

## Key Functions

| Function | File | What it does |
|----------|------|-------------|
| `loadLayerData(cachedFile, fallbackUrl)` | `layers.js` | Cache-first loader: tries local file, falls back to live ArcGIS, returns `{ features, fromCache }` or `null` |
| `fetchAllFeatures(url)` | `layers.js` | Paginates ArcGIS GeoJSON queries (1000/page, follows `exceededTransferLimit`) |
| `loadOverlay(id, muni)` | `layers.js` | Lazy-loads an overlay layer via `loadLayerData`; fire layer uses dynamicMapLayer |
| `initMap(containerId)` | `map.js` | Creates Leaflet map, tile layer (OSM street, stored in `_baseLayer`), attribution; returns map instance |
| `initBasemapToggle(map)` | `map.js` | Wires `#basemap-btn` to swap street ↔ satellite basemap; satellite is default on load |
| `initMapHandlers(options)` | `map.js` | Wires zoom and click handlers after layers/UI are ready |
| `updateLayerVisibility()` | `map.js` | Shows/hides zoning layers based on `activeLayer` and zoom level; handles per-municipality chip zoom warnings |
| `handleLayerSelect(value)` | `map.js` | Switches active layer — handles `'zoning'`, `'none'`, and overlay def ids |
| `selectMunicipality(muni)` | `map.js` | Switches municipality, resets overlay cache, rebuilds overlay panel — does NOT pan |
| `updateCacheDateIndicator()` | `ui.js` | Updates `#cache-date` badge; appends "(alguns em direto)" if any fallback occurred |
| `updateSintraChip()` | `ui.js` | Updates Sintra status chip based on load state + zoom |
| `showDetail(props, colorCfg, codeLabel)` | `ui.js` | Opens detail panel; shifts layers button, locate button, AND basemap button up to stay visible |
| `closeDetail()` | `ui.js` | Closes detail panel; restores layers button, locate button, and basemap button position |
| `showOverlayDetail(def, props)` | `ui.js` | Adapts overlay properties for `showDetail` |
| `buildOverlayPanel()` | `ui.js` | Generates the layers radio list HTML from `OVERLAY_DEFS`, filtered by active municipality |
| `openLayersSheet()` | `ui.js` | Positions popup above button's current screen location (accounts for button shift) |
| `setChipLoaded(id, state, text)` | `ui.js` | Saves chip state to `chipLoadedState` so it restores after zoom-out |

---

## UI Structure

- **App name / title:** Mapear (`<title>Mapear</title>`)
- **Top bar** (`#topbar`): municipality picker dropdown + address search (Nominatim)
- **Status bar** (`#statusbar`): GPS chip → active municipality chip (one of: `chip-sintra`, `chip-cascais`, `chip-oeiras`, `chip-loures`, `chip-amadora`, `chip-almada`) → Solo overlay chip (`chip-overlay`)
- **Layers button** (`#layers-btn`): bottom-left floating pill labeled **"Mapeamento"** (default); slides up when detail panel is open; opens layers popup
- **Layers popup** (`#layers-sheet`): compact popup anchored above the layers button (positioned dynamically via `getBoundingClientRect`); header row has "Camadas" title (left) + "Limpar" text button (right); contains overlay radio list below
- **Limpar button** (`#layers-clear`): top-right of layers popup; sets `activeLayer = 'none'`, removes all layers, deselects all radios — shows just the basemap
- **Detail panel** (`#detail-panel`): full-width bottom sheet, slides up on polygon tap, swipe-down to close; liquid glass style
- **Locate button** (`#locate-btn`): bottom-right, re-centers on GPS; slides up with layers button when detail panel opens
- **Basemap toggle** (`#basemap-btn`): bottom-right, stacked 54px above locate button; swaps street ↔ satellite basemap; satellite is default; slides up when detail panel opens
- **Cache date** (`#cache-date`): subtle fixed label centered at bottom of map; shows sync date from `sync-metadata.json`
- **Search bar** (`#search-input`): magnifying glass icon on left; circle-X clear button on right (visible only when input has text)

**CSS design system:** `--glass-bg`, `--glass-blur`, `--glass-border`, `--glass-shadow` CSS variables. Apple liquid glass dark mode: `rgba(10,10,20,0.62)` background, `blur(28px) saturate(160%)`. All panels use these tokens.

**Municipality picker:** dropdown in topbar. Selecting a municipality pans (no zoom change) to its center and resets overlays. GPS auto-detection calls `selectMunicipality()` without panning. Centers/zooms in `MUNICIPALITIES` array.

**Address search:** Nominatim query uses `limit=7`, `countrycodes=pt`. When GPS is available, a `viewbox` (~0.30°×0.20° box) biases results toward the user's location (`bounded=0`). Detects all six municipalities in results; zooms to 15 for tile-rendered municipalities (Cascais, Oeiras, Loures, Amadora, Almada), 17 for Sintra. Results outside covered municipalities show "⚠ Sem dados PDM disponíveis". Keyboard navigation: Up/Down arrows, Enter selects, Escape clears. Dropdown fades out (150ms) on selection.

---

## Chip Zoom Warnings Per Municipality

| Municipality | Layer type | Zoom warning condition | Warning text |
|---|---|---|---|
| Sintra | GeoJSON | zoom < MIN_DATA_ZOOM | "Sintra: zoom" |
| Cascais | tiles (maxZoom:15) | zoom < MIN_DATA_ZOOM | "Cascais: zoom" |
| Cascais | tiles (maxZoom:15) | zoom > 15 | "Cascais: recuar zoom" |
| Oeiras | tiles (maxZoom:15) | zoom > 15 | "Oeiras: recuar zoom" |
| Loures | tiles (maxZoom:15) | zoom > 15 | "Loures: recuar zoom" |
| Amadora | GeoJSON | zoom < MIN_DATA_ZOOM | "Amadora: zoom" |
| Almada | tiles (maxZoom:14) | zoom > 14 | "Almada: recuar zoom" |

---

## Known Limitations

- Cascais/Oeiras/Loures zoning geometry is blocked by AML server — tile rendering only, no GeoJSON export
- Almada tiles go blank above zoom 14 (ArcGIS `maxScale:25000`) — chip warns "recuar zoom", same as Cascais
- Almada `identifyFeatures` uses `'all:2'` (not `'visible:2'`) because ArcGIS doesn't mark the layer visible at low zoom scale
- Sintra overlay layers only cover Sintra territory (except RAN and ren-* which load AML-wide data)
- `WMS_SRUP_REN_RAN` (`RAN_BASE`) server on Sintra's infrastructure is unreliable — only `ran-sintra` now depends on it
- `ren-sintra` removed — no unified queryable REN boundary layer exists on Sintra's server
- Cascais condicionantes risk layers not yet integrated — available at `sig.aml.pt/.../PMAAC_Riscos_Actuais` (layers 60–65) but need testing

---

## Migration Plan: Live API → Cached Data

Migrating GeoJSON-paginated layers from live ArcGIS REST API calls to cached GeoJSON files.
Tile-rendered layers and identify-on-click calls stay live. Nominatim stays live.

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Audit all live API calls | ✅ Done |
| 2 | Sync script (`scripts/sync-data.js`) | ✅ Done |
| 3 | Refactor frontend to load from cache | ✅ Done |
| 4 | GitHub Action for weekly auto-sync | ✅ Done |
| 5 | Fallback logic (cache → live on failure) | ✅ Done |
