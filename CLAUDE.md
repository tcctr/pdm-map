# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A single-page web app that visualizes PDM (Plano Diretor Municipal) zoning data and land-use restrictions for Sintra and Cascais municipalities in Portugal. Renders interactive zoning polygons on a Leaflet + OpenStreetMap map with live GPS, address search, and a unified layer selector.

## Architecture

The entire app lives in `index.html` — no build step, no bundler, no dependencies to install (~1530 lines).

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

**Sintra zoning (GeoJSON, paginated):**
- Urban: `SINTRA_BASE/55/query` — field `CAT` → `URBAN_COLORS`
- Rural: `SINTRA_BASE/54/query` — field `Ord_Categ` → `RURAL_COLORS`
- `SINTRA_BASE` = `https://sig.cm-sintra.pt/arcgis/rest/services/WMS_Inspire/WMS_PDM20_Ordenamento/MapServer`

**Cascais zoning (tile layer — geometry blocked by AML server):**
- `CASCAIS_BASE/2` via `L.esri.dynamicMapLayer` with `maxZoom: 17`
- Click info via `identifyFeatures` — field `Categoria` → `CASCAIS_COLORS`
- `CASCAIS_BASE` = `https://sig.aml.pt/arcgis/rest/services/PlaneamentoOrdenamento/pdm_revisao/MapServer`

**Overlay / Condicionantes layers — two servers:**
- `REN_RAN_BASE` = `https://sig.cm-sintra.pt/arcgis/rest/services/WMS_Inspire/WMS_SRUP_REN_RAN/MapServer`
- `CONDICIONANTES_BASE` = `https://sig.cm-sintra.pt/arcgis/rest/services/WMS_Inspire/WMS_PDM20_Condicionantes/MapServer`

> **Known outage:** `WMS_SRUP_REN_RAN` is frequently down on Sintra's server (HTTP 500 "Service not started"). All RAN/REN/risk layers sourced from it will fail until Sintra's GIS team restarts it.

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

| id | Name | Server | Layer ID | Style |
|----|------|--------|----------|-------|
| `ran` | RAN — Reserva Agrícola | REN_RAN_BASE + CASCAIS_BASE/12 | 2 + 12 | brown hatch (`hatch-ran`) |
| `ren-cascais` | REN — Reserva Ecológica | CASCAIS_BASE | 11 | green hatch (`hatch-ren`) |
| `faixa` | Faixa Costeira | REN_RAN_BASE | 6 | blue fill |
| `praias` | Praias | REN_RAN_BASE | 7 | yellow fill |
| `vertentes` | Instabilidade de Vertentes | REN_RAN_BASE | 16 | red hatch (`hatch-risk-red`) |
| `erosao` | Erosão Hídrica | REN_RAN_BASE | 17 | orange hatch (`hatch-risk-orange`) |
| `mar` | Ameaça Costeira (Mar) | REN_RAN_BASE | 15 | blue fill |
| `cheias` | Zonas de Cheias | REN_RAN_BASE | 14 | dark blue fill |
| `incendio` | Perigosidade de Incêndio | CONDICIONANTES_BASE | 371 | dynamicMapLayer; CLASSE field → `FIRE_COLORS` |
| `patrimonio` | Bens Imóveis Classificados | CONDICIONANTES_BASE | 299 | purple fill |
| `zep` | Zona Especial de Proteção | CONDICIONANTES_BASE | 302 | violet fill |
| `perigosos` | Equipamentos Perigosos | CONDICIONANTES_BASE | 368 | gray fill |

**RAN loads from two servers** via `def.sintraSource` / `def.cascaisSource`: Sintra layer 2 + Cascais layer 12. Only the active municipality's source is loaded.

**SVG hatch patterns** are defined in a hidden `<svg>` element in the HTML body: `hatch-ran`, `hatch-ren`, `hatch-risk-red`, `hatch-risk-orange`.

---

## Auto-Retry

Failed layer loads retry automatically via `RETRY_DELAYS = [15000, 30000, 60000]` (15s, 30s, 1min):
- Sintra urban/rural: `attempt` counter passed recursively into `loadSintraUrban(attempt)` / `loadSintraRural(attempt)`
- Cascais: same pattern; layer group cleared before each retry; uses `.once('loaderror')` not `.on()`
- Overlays: retry count stored in `ovlState[id].retries`; timer guard checks `activeLayer === id && !st.loaded` before retrying. Resets to 0 on municipality switch.

---

## Key Functions

| Function | What it does |
|----------|-------------|
| `fetchAllFeatures(url)` | Paginates ArcGIS GeoJSON queries (1000/page, follows `exceededTransferLimit`) |
| `handleLayerSelect(value)` | Switches active layer — hides zoning or overlays accordingly |
| `loadOverlay(id)` | Lazy-loads an overlay layer; uses `sintraSource`/`cascaisSource` for RAN; fire layer uses dynamicMapLayer |
| `updateLayerVisibility()` | Shows/hides zoning layers based on `activeLayer` and zoom level |
| `updateSintraChip()` | Updates Sintra status chip based on load state + zoom |
| `showDetail(props, colorCfg, codeLabel)` | Opens detail panel; shifts layers button up to stay visible |
| `closeDetail()` | Closes detail panel; restores layers button position |
| `showOverlayDetail(def, props)` | Adapts overlay properties for `showDetail` |
| `buildOverlayPanel()` | Generates the layers radio list HTML from `OVERLAY_DEFS` |
| `openLayersSheet()` | Positions popup above button's current screen location (accounts for button shift) |
| `setChipLoaded(id, state, text)` | Saves chip state to `chipLoadedState` so it restores after zoom-out |
| `selectMunicipality(muni)` | Switches municipality, flies map to center, resets overlay cache |

---

## UI Structure

- **Top bar** (`#topbar`): municipality picker pill + address search (Nominatim)
- **Status bar** (`#statusbar`): GPS chip → municipality chip (Sintra OR Cascais) → Solo overlay chip
- **Layers button** (`#layers-btn`): bottom-left floating pill; slides up when detail panel is open; opens layers popup
- **Layers popup** (`#layers-sheet`): compact popup anchored above the layers button (positioned dynamically via `getBoundingClientRect`); contains overlay radio list
- **Detail panel** (`#detail-panel`): full-width bottom sheet, slides up on polygon tap, swipe-down to close; liquid glass style
- **Locate button** (`#locate-btn`): bottom-right, re-centers on GPS

**CSS design system:** `--glass-bg`, `--glass-blur`, `--glass-border`, `--glass-shadow` CSS variables. Apple liquid glass dark mode: `rgba(10,10,20,0.62)` background, `blur(28px) saturate(160%)`. All panels use these tokens.

**Municipality picker:** dropdown in topbar. Selecting a municipality flies the map to its center (`map.flyTo(cfg.center, cfg.zoom)`). Centers defined in `MUNICIPALITIES` array.

---

## Known Limitations

- Cascais zoning geometry is blocked by AML server — only tile rendering possible
- Cascais condicionantes risk layers (fire, floods, erosion) not yet integrated — available at `sig.aml.pt/.../PMAAC_Riscos_Actuais` (layers 60–65) but need testing
- Sintra overlay layers only cover Sintra territory (except RAN which also loads Cascais layer 12)
- Cascais dynamicMapLayer returns blank tiles above zoom 17 — capped with `maxZoom: 17`
- `WMS_SRUP_REN_RAN` server on Sintra's infrastructure is unreliable (frequently "not started")

---

## Migration Plan: Live API → Cached Data

We are migrating GeoJSON-paginated layers from live ArcGIS REST API calls to cached GeoJSON files.
Tile-rendered layers (Cascais zoning, fire risk) and identify-on-click calls stay live.
Nominatim calls stay live.
Phases: sync script → refactor frontend → GitHub Action → fallback logic.
Current status: Phase 2
