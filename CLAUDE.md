# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A single-page web app that visualizes PDM (Plano Diretor Municipal) zoning data and land-use restrictions for Sintra and Cascais municipalities in Portugal. Renders interactive zoning polygons on a Leaflet + OpenStreetMap map with live GPS, address search, and a unified layer selector.

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
- esri-leaflet 3.0.12 — `dynamicMapLayer` (tile rendering) and `identifyFeatures` (click queries) for Cascais and fire risk layers

**Running locally:**
```bash
npx serve .
python3 -m http.server 8080
```

---

## Data Sources

**Sintra zoning (served from local cache, live fallback):**
- Urban: `data/sintra-urban.geojson` → fallback `SINTRA_BASE/55/query` — field `CAT` → `URBAN_COLORS`
- Rural: `data/sintra-rural.geojson` → fallback `SINTRA_BASE/54/query` — field `Ord_Categ` → `RURAL_COLORS`
- `SINTRA_BASE` = `https://sig.cm-sintra.pt/arcgis/rest/services/WMS_Inspire/WMS_PDM20_Ordenamento/MapServer`

**Cascais zoning (tile layer — geometry blocked by AML server, always live):**
- `CASCAIS_BASE/2` via `L.esri.dynamicMapLayer` with `maxZoom: 17`
- Click info via `identifyFeatures` — field `Categoria` → `CASCAIS_COLORS`
- `CASCAIS_BASE` = `https://sig.aml.pt/arcgis/rest/services/PlaneamentoOrdenamento/pdm_revisao/MapServer`

**Overlay / Condicionantes layers — three servers:**
- `RAN_BASE` = `https://sig.cm-sintra.pt/arcgis/rest/services/WMS_Inspire/WMS_SRUP_REN_RAN/MapServer` (Sintra RAN only — frequently offline)
- `REN_BASE` = `https://sig.cm-sintra.pt/arcgis/rest/services/WMS_Inspire/WMS_SRUP_REN_CMS/MapServer` (Sintra REN + risk layers — confirmed working)
- `CONDICIONANTES_BASE` = `https://sig.cm-sintra.pt/arcgis/rest/services/WMS_Inspire/WMS_PDM20_Condicionantes/MapServer`

> **Known outage:** `WMS_SRUP_REN_RAN` (`RAN_BASE`) is frequently down on Sintra's server — only `ran-sintra` layer depends on it now.

---

## Layer System

### Base zoning (always on by default)
`urbanLayer`, `ruralLayer`, `cascaisLayer` — three `L.layerGroup()` instances. Only visible at zoom ≥ `MIN_DATA_ZOOM` (1). Sintra layers load on init; Cascais is a dynamic tile layer.

### Overlay layers (`OVERLAY_DEFS` array)
Radio-button selection — only one layer active at a time. Selecting any overlay hides the zoning. Selecting "Qualificação do Solo" restores it. Layers are **lazy-loaded** on first selection and cached in `ovlState`.

`activeLayer` variable tracks what's selected (`'zoning'` or a def id).

**Renderers:**
- Sintra zoning: `renderer = L.svg({ padding: 1 })`
- Overlay GeoJSON with hatch patterns: `renderer` (SVG — canvas can't render `url()` fills)
- Overlay GeoJSON without hatch: `overlayRenderer = L.canvas({ padding: 0.5 })`
- Fire risk + Cascais: `L.esri.dynamicMapLayer` (server tiles, no GeoJSON download)

**Current overlay layers:**

| id | Name | Server | Layer ID | Cached file | Style |
|----|------|--------|----------|-------------|-------|
| `ran` | RAN — Reserva Agrícola | RAN_BASE (Sintra) + CASCAIS_BASE/12 (Cascais) | 2 + 12 | `ran-sintra.geojson`, `ran-cascais.geojson` | brown hatch (`hatch-ran`) |
| `ren-sintra` | REN — Reserva Ecológica | REN_BASE | 1 (APL group — needs field testing) | `ren-sintra.geojson` | green hatch (`hatch-ren`) |
| `ren-cascais` | REN — Reserva Ecológica | CASCAIS_BASE | 11 | `ren-cascais.geojson` | green hatch (`hatch-ren`) |
| `faixa` | Faixa Costeira | REN_BASE | 2 | `faixa.geojson` | blue fill |
| `praias` | Praias | REN_BASE | 3 | `praias.geojson` | yellow fill |
| `vertentes` | Instabilidade de Vertentes | REN_BASE | 12 | `vertentes.geojson` | red hatch (`hatch-risk-red`) |
| `erosao` | Erosão Hídrica | REN_BASE | 13 | `erosao.geojson` | orange hatch (`hatch-risk-orange`) |
| `mar` | Ameaça Costeira (Mar) | REN_BASE | 11 | `mar.geojson` | blue fill |
| `cheias` | Zonas de Cheias | REN_BASE | 10 | `cheias.geojson` | dark blue fill |
| `incendio` | Perigosidade de Incêndio | CONDICIONANTES_BASE | 371 | — (always live tiles) | dynamicMapLayer; CLASSE field → `FIRE_COLORS` |
| `patrimonio` | Bens Imóveis Classificados | CONDICIONANTES_BASE | 299 | `patrimonio.geojson` | purple fill |
| `zep` | Zona Especial de Proteção | CONDICIONANTES_BASE | 302 | `zep.geojson` | violet fill |
| `perigosos` | Equipamentos Perigosos | CONDICIONANTES_BASE | 368 | `perigosos.geojson` | gray fill |

**RAN loads from two servers** via `def.sintraSource` / `def.cascaisSource`: Sintra layer 2 + Cascais layer 12. Only the active municipality's source is loaded.

**SVG hatch patterns** are defined in a hidden `<svg>` element in the HTML body: `hatch-ran`, `hatch-ren`, `hatch-risk-red`, `hatch-risk-orange`.

---

## Data Loading — Cache-First with Live Fallback

All 14 GeoJSON-paginated layers use `loadLayerData(cachedFile, fallbackUrl)`:
1. Fetch `/data/{cachedFile}` — if 404, empty, or error → `console.warn` and continue
2. Fetch live via `fetchAllFeatures(fallbackUrl)` — if this also fails → `console.error`, return `null`
3. `null` = both failed → layer shows error chip state

**Tested and verified (2026-03-19):** Removing `sintra-rural.geojson` locally produced a 404, the cache warn fired, and the layer loaded successfully from the live ArcGIS endpoint. `#cache-date` badge updated to show "(alguns em direto)". If both cache and live fail (e.g. Sintra server down during test), the layer simply doesn't appear — expected behaviour.

**What stays live-only (never cached):**
- Cascais zoning tiles (`L.esri.dynamicMapLayer`)
- Fire risk tiles (`L.esri.dynamicMapLayer`)
- Cascais click identify (`L.esri.identifyFeatures`)
- Fire risk click identify (`L.esri.identifyFeatures`)
- Nominatim address search + reverse geocode

**Fallback tracking:** `liveFallbackCount` increments each time a layer falls back to live. The `#cache-date` indicator shows `"Dados: DD/MM/YYYY (alguns em direto)"` if any fallback occurred.

**Cached files** live in `data/` at the repo root (served at `/data/` by Vercel). Currently cached: `sintra-urban`, `sintra-rural`, `ran-cascais`, `ren-cascais`, `patrimonio`, `zep`, `perigosos`. Not yet cached: `ran-sintra` (RAN_BASE unreliable), `ren-sintra`, `faixa`, `praias`, `vertentes`, `erosao`, `mar`, `cheias` (now on working REN_BASE — run sync to cache).

---

## Sync Script — `scripts/sync-data.js`

Downloads all 15 GeoJSON-paginated layers to `data/`. Run with:
```bash
node scripts/sync-data.js
```

- Paginates ArcGIS responses (follows `exceededTransferLimit`, 1 s delay between pages)
- Tries `f=geojson` first; falls back to `f=json` + Esri→GeoJSON conversion if server returns HTML
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
- Cascais tile layer: clears layer group before each retry, uses `.once('loaderror')`
- Overlays: retry count in `ovlState[id].retries`; timer guard checks `activeLayer === id && !st.loaded`. Resets on municipality switch.
- Sintra urban/rural: no retry — served from local cache, failures are near-instant

---

## Key Functions

| Function | File | What it does |
|----------|------|-------------|
| `loadLayerData(cachedFile, fallbackUrl)` | `layers.js` | Cache-first loader: tries local file, falls back to live ArcGIS, returns `{ features, fromCache }` or `null` |
| `fetchAllFeatures(url)` | `layers.js` | Paginates ArcGIS GeoJSON queries (1000/page, follows `exceededTransferLimit`) |
| `loadOverlay(id, muni)` | `layers.js` | Lazy-loads an overlay layer via `loadLayerData`; fire layer uses dynamicMapLayer |
| `initMap(containerId)` | `map.js` | Creates Leaflet map, tile layer, attribution; returns map instance |
| `initMapHandlers(options)` | `map.js` | Wires zoom and click handlers after layers/UI are ready |
| `updateLayerVisibility()` | `map.js` | Shows/hides zoning layers based on `activeLayer` and zoom level |
| `handleLayerSelect(value)` | `map.js` | Switches active layer — hides zoning or overlays accordingly |
| `selectMunicipality(muni)` | `map.js` | Switches municipality, flies map to center, resets overlay cache |
| `updateCacheDateIndicator()` | `ui.js` | Updates `#cache-date` badge; appends "(alguns em direto)" if any fallback occurred |
| `updateSintraChip()` | `ui.js` | Updates Sintra status chip based on load state + zoom |
| `showDetail(props, colorCfg, codeLabel)` | `ui.js` | Opens detail panel; shifts layers button up to stay visible |
| `closeDetail()` | `ui.js` | Closes detail panel; restores layers button position |
| `showOverlayDetail(def, props)` | `ui.js` | Adapts overlay properties for `showDetail` |
| `buildOverlayPanel()` | `ui.js` | Generates the layers radio list HTML from `OVERLAY_DEFS` |
| `openLayersSheet()` | `ui.js` | Positions popup above button's current screen location (accounts for button shift) |
| `setChipLoaded(id, state, text)` | `ui.js` | Saves chip state to `chipLoadedState` so it restores after zoom-out |

---

## UI Structure

- **Top bar** (`#topbar`): municipality picker pill + address search (Nominatim)
- **Status bar** (`#statusbar`): GPS chip → municipality chip (Sintra OR Cascais) → Solo overlay chip
- **Layers button** (`#layers-btn`): bottom-left floating pill; slides up when detail panel is open; opens layers popup
- **Layers popup** (`#layers-sheet`): compact popup anchored above the layers button (positioned dynamically via `getBoundingClientRect`); contains overlay radio list
- **Detail panel** (`#detail-panel`): full-width bottom sheet, slides up on polygon tap, swipe-down to close; liquid glass style
- **Locate button** (`#locate-btn`): bottom-right, re-centers on GPS
- **Cache date** (`#cache-date`): subtle fixed label centered at bottom of map; shows sync date from `sync-metadata.json`

**CSS design system:** `--glass-bg`, `--glass-blur`, `--glass-border`, `--glass-shadow` CSS variables. Apple liquid glass dark mode: `rgba(10,10,20,0.62)` background, `blur(28px) saturate(160%)`. All panels use these tokens.

**Municipality picker:** dropdown in topbar. Selecting a municipality flies the map to its center (`map.flyTo(cfg.center, cfg.zoom)`). Centers defined in `MUNICIPALITIES` array.

---

## Known Limitations

- Cascais zoning geometry is blocked by AML server — only tile rendering possible
- Cascais condicionantes risk layers (fire, floods, erosion) not yet integrated — available at `sig.aml.pt/.../PMAAC_Riscos_Actuais` (layers 60–65) but need testing
- Sintra overlay layers only cover Sintra territory (except RAN which also loads Cascais layer 12)
- Cascais dynamicMapLayer returns blank tiles above zoom 17 — capped with `maxZoom: 17`
- `WMS_SRUP_REN_RAN` (`RAN_BASE`) server on Sintra's infrastructure is unreliable — only `ran-sintra` now depends on it
- `ren-sintra` layerId 1 is the APL group layer on `REN_BASE` — needs field testing to confirm features are returned

---

## Migration Plan: Live API → Cached Data

Migrating GeoJSON-paginated layers from live ArcGIS REST API calls to cached GeoJSON files.
Tile-rendered layers (Cascais zoning, fire risk) and identify-on-click calls stay live. Nominatim stays live.

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Audit all live API calls | ✅ Done |
| 2 | Sync script (`scripts/sync-data.js`) | ✅ Done |
| 3 | Refactor frontend to load from cache | ✅ Done |
| 4 | GitHub Action for weekly auto-sync | ✅ Done |
| 5 | Fallback logic (cache → live on failure) | ✅ Done |
