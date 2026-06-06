# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Mapear** — a web app that visualizes PDM (Plano Diretor Municipal) zoning data and land-use restrictions for eighteen municipalities in the Lisbon metro area (Sintra, Cascais, Oeiras, Loures, Amadora, Almada, Barreiro, Lisboa, Vila Franca de Xira, Mafra, Odivelas, Alcochete, Moita, Montijo, Palmela, Seixal, Sesimbra, Setúbal), plus a **Grande Lisboa** region view that renders all eighteen simultaneously. The primary layer is **Cadastro Predial** (national land registry WMS), which the user can toggle on or off. Tapping a parcel shows zoning, REN, RAN, and fire-risk data for that location in a detail panel.

The app is publicly accessible at `/` and `/app` (`app.html`).

## Architecture

No build step, no bundler. The map app uses pure ES modules loaded directly by the browser. The API layer uses Vercel Serverless Functions (Node.js 20).

**File structure:**
- `app.html` — map app HTML skeleton; CDN imports; `<script type="module" src="js/main.js">`; served at `/` and `/app` via `vercel.json` rewrites
- `vercel.json` — rewrites `/` and `/app` → `app.html`
- `js/config.js` — all constants, color maps, `OVERLAY_DEFS`, `MUNICIPALITIES`, base URLs
- `js/map.js` — Leaflet map init, base layers, municipality switching, layer visibility, map event handlers
- `js/layers.js` — `loadLayerData`, `fetchAllFeatures`, overlay lazy-loading, retry logic
- `js/ui.js` — detail panel, chips, cache date indicator, swipe gestures
- `js/search.js` — Nominatim address search and reverse geocode
- `js/main.js` — entry point, wires all modules together, GPS tracking, event listeners
- `css/style.css` — all styles for the map app
- `scripts/sync-data.js` — data sync CLI script

**`package.json`** has `"type": "module"`. The map app has no npm dependencies — it loads Leaflet and esri-leaflet from CDN. `scripts/sync-data.js` is the only Node.js script with runtime dependencies.

**External dependencies (CDN, map app only):**
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
- `AML_PDM1_BASE/2` via `L.esri.dynamicMapLayer` with `maxZoom: 14` and `layerDefs: { 2: "Concelho = 'ALMADA'" }`
- Server's `maxScale:25000` makes tiles blank above zoom 14 — chip warns "recuar zoom", same as Cascais
- Layer 2 covers **18 AML municipalities** — the `layerDefs` filter is required to restrict rendering to Almada only
- Click info via `identifyFeatures` using `'all:2'` (not `'visible:2'`) — field `Classe` → `ALMADA_COLORS`; `'all:2'` required because ArcGIS doesn't mark the layer visible at low zoom scale
- `AML_PDM1_BASE` = `https://sig.aml.pt/arcgis/rest/services/PlaneamentoOrdenamento/PDM_I_GERACAO/MapServer`
- Almada's own server is down/firewalled; not on AML pdm_revisao.

**Barreiro zoning (tile layer — AML PDM_I_GERACAO 1st-gen server, always live):**
- `AML_PDM1_BASE/2` via `L.esri.dynamicMapLayer` with `maxZoom: 14` and `layerDefs: { 2: "Concelho = 'BARREIRO'" }`
- Same server/layer/quirks as Almada/Alcochete: `maxScale:25000`, tiles blank above zoom 14, `'all:2'` for identifyFeatures
- Click info via `identifyFeatures` using `'all:2'` — field `Classe` → `BARREIRO_COLORS` (3 values: `Solo Rural`, `Urbanizado`, `Urbanizável`)
- Barreiro's own server (`sig.cm-barreiro.pt`) is firewalled/unreachable; not on AML pdm_revisao; DGT WFS 1504 exists but returns HTTP 502

**Montijo zoning (GeoJSON, cache-first with DGT WFS live fallback):**
- `data/montijo-zoning.geojson` → fallback `MONTIJO_WFS` (DGT CRUS public OGC WFS, 532 features)
- Field `Categoria_2021` → `MONTIJO_COLORS` (8 values). **Urban areas arrive as `Categoria_2021='Não Atribuída'`** — style and click handler fall back to `Classe_2021` (`'Solo Urbano'` → red, `'Solo Urbano (urbanizável – transitório)'` → orange).
- `MONTIJO_WFS` = `https://servicos.dgterritorio.pt/SDISNITWFSCRUS_1507_1/WFService.aspx?...`
- Rendered client-side like Sintra/Amadora/Lisboa/Mafra (not tiles).
- `Designacao_no_plano` field → `Descricao` in detail panel (original 1997 PDM category name from Montijo's native server).
- Montijo's own ArcGIS server (`mtgeo.mun-montijo.pt`) has full geometry export but splits PDM across 35 per-category layers — DGT WFS is simpler and follows the existing pattern.
- DGT WFS INE code: 1507. PDM origin date: 1997-02-01 (1:25000).

**Moita zoning (tile layer — AML pdm_revisao, always live):**
- `CASCAIS_BASE/4` via `L.esri.dynamicMapLayer` with `maxZoom: 15` (same AML server as Cascais/Odivelas)
- AML server blocks geometry export — tile rendering only, no GeoJSON download
- Click info via `identifyFeatures` using `'visible:4'` — field `Categoria` → `MOITA_COLORS`
- No `layerDefs` filter needed (layer 4 is single-municipality)
- No scale restrictions (minScale/maxScale both 0) — tiles show at all zoom levels, same as Odivelas
- 1,327 features; 8 `Categoria` values; `Subcategor` field holds granular 34-value sub-classification
- Moita's own GIS portal (`geomoita.cm-moita.pt`) is offline (ClearOS default page, last modified 2018); DGT WFS 1505_1 returns HTTP 500
- PDM last altered April 14, 2025 — AML server reflects this data

**Palmela zoning (GeoJSON, cache-first with ArcGIS REST live fallback):**
- `data/palmela-zoning.geojson` → fallback `PALMELA_BASE/17/query` (sig.cm-palmela.pt, public ArcGIS REST)
- Field `tipo` (43 values) → `PALMELA_COLORS`. `design` field → `Descricao` in detail panel.
- `PALMELA_BASE` = `https://sig.cm-palmela.pt/arcgis/rest/services/PMOTs/MapServer`
- Rendered client-side like Sintra/Amadora/Lisboa/Mafra/Montijo (not tiles).
- 1,097 features; `maxRecordCount: 50000` — single-page fetch (no pagination needed).
- 1997 PDM (pre-DR 15/2015). Layer mixes zoning + condicionantes: PNA (Parque Natural da Arrábida) and RNES (Reserva Natural do Estuário do Sado) protected-area sub-zones and PGRI flood-risk zones are encoded as `tipo` values within the same layer.
- Blank `tipo` (`' '`) = "Compromissos" (approved plan overlays) — styled gray.
- DGT WFS 1508 exists but has only 57 features (very sparse high-level CRUS); municipality server is the authoritative source.
- AML PDM_I_GERACAO has 244 Palmela features but only 3 coarse classes — not used.
- Actual feature count is 928 (not 1,097 — the server's `returnCountOnly` confirms 928).

**Seixal zoning (GeoJSON, cache-first with ArcGIS FeatureServer live fallback):**
- `data/seixal-zoning.geojson` → fallback `SEIXAL_BASE/27/query` (sig.cm-seixal.pt hosted FeatureServer, public)
- Field `designacao` (9 values after `.trim()`) → `SEIXAL_COLORS`. `layer` field → `Descricao` in detail panel.
- `SEIXAL_BASE` = `https://sig.cm-seixal.pt/arcgis/rest/services/Hosted/PDM_PO_Classificacao_Solo/FeatureServer`
- Rendered client-side like Sintra/Amadora/Lisboa/Mafra/Palmela (not tiles).
- 903 features, WGS84 (EPSG:4326) — single-page fetch (no pagination needed).
- AML pdm_revisao layer 9 blocks geometry export (tile-only) — hosted FeatureServer is the only usable source.
- Whitespace quirks: `designacao` values have trailing spaces/newlines in source data (e.g. `'Espaço Natural '`, `'Espaço de Exploração de Recursos Geológicos\n'`). Pre-handled with `.trim()` in style fn and click handler.
- `'Espaço de OcupaçãoTurística'` has no space between `ção` and `Turística` — data entry error in source; `SEIXAL_COLORS` key matches raw value.

**Sesimbra zoning (GeoJSON, cache-first with DGT WFS live fallback):**
- `data/sesimbra-zoning.geojson` → fallback `SESIMBRA_WFS` (DGT CRUS public OGC WFS, 126 features)
- Field `Categoria_2021` (after `.trim()`) → `SESIMBRA_COLORS`. `Designacao_no_plano` → `Descricao` in detail panel.
- `SESIMBRA_WFS` = `https://servicos.dgterritorio.pt/SDISNITWFSCRUS_1511_1/WFService.aspx?...`
- Rendered client-side like Montijo/Palmela (not tiles).
- 126 features, WGS84 (EPSG:4326) — single-page fetch (no pagination needed).
- PDM origin: 1998-02-02 (1:25000 scale — raster-digitised). INE code 1511.
- `'Não Atribuída'` (55 features: 54 Solo Urbano + 1 Solo Rústico) uses `Classe_2021` fallback — same pattern as Montijo.
- Trailing spaces on `'Espaço de Atividades Industriais '` and `'Espaço de Equipamentos e Infraestruturas '` — pre-handled with `.trim()`.
- 10 `Categoria_2021` values: `Espaço Agrícola`, `Espaço Florestal`, `Espaço Natural e Paisagístico`, `Espaço de Uso Especial - Turístico`, `Espaço de Uso Especial Equipamentos e Infraestruturas`, `Espaço de Equipamentos e Infraestruturas`, `Espaço de Atividades Económicas`, `Espaço de Atividades Industriais`, `Espaço de Exploração de Recursos Energéticos e Geológicos`, `Não Atribuída`.
- `sig.cm-sesimbra.pt` is firewalled/unreachable; AML PDM_I_GERACAO has 59 Sesimbra features but geometry blocked — DGT WFS used instead.

**Setúbal zoning (GeoJSON, cache-first with DGT WFS live fallback):**
- `data/setubal-zoning.geojson` → fallback `SETUBAL_WFS` (DGT CRUS public OGC WFS, 792 features)
- Field `Categoria` (17 values) → `SETUBAL_COLORS`. `Designacao_PlantaOrdenamento` → `Descricao` in detail panel.
- `SETUBAL_WFS` = `https://servicos.dgterritorio.pt/SDISNITWFSCRUS_1512_1/WFService.aspx?...` (uses WFS **2.0.0** with `typeNames`, not `typeName`)
- Rendered client-side like Lisboa/Mafra/Sesimbra (not tiles).
- 792 features, WGS84 (EPSG:4326) — single-page fetch (no pagination needed).
- PDM published 2025-01-28 (most recently published PDM in the dataset). INE code 1512.
- No `'Não Atribuída'` fallback needed — only 2 genuinely unclassified features (`Classe='Espaços não Classificados'`), styled gray.
- No trailing whitespace issues detected in `Categoria` field values.
- `sig.cm-setubal.pt` is unreachable (DNS does not resolve); AML pdm_revisao has no Setúbal zoning layer; AML PDM_I_GERACAO has 327 Setúbal features but only 3 coarse Classe values — DGT WFS used instead.

**Alcochete zoning (tile layer — AML PDM_I_GERACAO 1st-gen server, always live):**
- `AML_PDM1_BASE/2` via `L.esri.dynamicMapLayer` with `maxZoom: 14` and `layerDefs: { 2: "Concelho = 'ALCOCHETE'" }`
- Same server/layer/quirks as Almada: `maxScale:25000`, tiles blank above zoom 14, `'all:2'` for identifyFeatures
- Click info via `identifyFeatures` using `'all:2'` — field `Classe` → `ALCOCHETE_COLORS` (3 values: `Solo Rural`, `Urbanizado`, `Urbanizável`)
- Alcochete's own server (`sig.cm-alcochete.pt`) is unreachable; not on AML pdm_revisao; DGT WFS 1502 exists but has only granular 1997-era `Designacao_no_plano` field (no clean `Categoria`)

**Lisboa zoning (GeoJSON, cache-first with DGT WFS live fallback):**
- `data/lisboa-zoning.geojson` → fallback `LISBOA_WFS` (DGT CRUS public OGC WFS, 861 features)
- Field `Categoria` → `LISBOA_COLORS`. Rendered client-side like Sintra/Amadora (not tiles).
- `LISBOA_WFS` = `https://servicos.dgterritorio.pt/SDISNITWFSCRUS_1106_1/WFService.aspx?...`
- Lisboa's own ArcGIS server is auth-protected; DGT publishes CRUS from the current PDM.
- Categories: `Espaço Habitacional`, `Espaço Verde`, `Espaço de Atividades Económicas`, `Espaço de Uso Especial Equipamentos e Infraestruturas`, `Não Atribuída`
- Descriptor field: `Designacao_PlantaOrdenamento` (mapped → `Descricao` for detail panel display)

**Vila Franca de Xira zoning (tile layer — AML pdm_revisao, always live):**
- `CASCAIS_BASE/10` via `L.esri.dynamicMapLayer` with `maxZoom: 15` (same AML server as Cascais)
- AML server blocks geometry export for all pdm_revisao layers — tile rendering only, no GeoJSON download
- Click info via `identifyFeatures` using `'visible:10'` — field `Classe` → `VFX_COLORS`
- `VFX_COLORS` classes: `Solo Rural`, `Solo Urbano`, `Outras Infraestruturas`, `Valores Culturais`
- VFX's own server (`sig.cm-vfxira.pt`) returned 404; no DGT WFS published for VFX

**Mafra zoning (GeoJSON, cache-first with DGT WFS live fallback):**
- `data/mafra-zoning.geojson` → fallback `MAFRA_WFS` (DGT CRUS public OGC WFS, 1709 features)
- Field `Categoria` → `MAFRA_COLORS`. Rendered client-side like Lisboa (not tiles).
- `MAFRA_WFS` = `https://servicos.dgterritorio.pt/SDISNITWFSCRUS_1109_1/WFService.aspx?...`
- Mafra's own server has TLS issues; AML pdm_revisao layer 5 blocks geometry export.
- DGT publishes CRUS from the current 2023 PDM. 12 Categoria values including `Espaço Habitacional`, `Espaço Agrícola`, `Espaço Florestal`, `Aglomerado Rural`, `Área de Edificação Dispersa`, etc.
- Descriptor field: `Designacao_PlantaOrdenamento` (mapped → `Descricao` for detail panel display)

**Odivelas zoning (tile layer — AML pdm_revisao, always live):**
- `CASCAIS_BASE/8` via `L.esri.dynamicMapLayer` with `maxZoom: 15` (same AML server as Cascais/VFXira)
- AML server blocks geometry export — tile rendering only, no GeoJSON download
- Click info via `identifyFeatures` using `'visible:8'` — field `Categoria` → `ODIVELAS_COLORS`
- No `layerDefs` filter needed (layer 8 is single-municipality)
- Layer has no scale restrictions (minScale/maxScale both 0) — tiles show at all zoom levels
- `ODIVELAS_COLORS` has 21 Categoria values (AML classification, not DR 15/2015)
- Odivelas' own ArcGIS server (`sig.cm-odivelas.pt`) is unreachable; DGT WFS 1116_1 returns HTTP 502

**Overlay / Condicionantes layers — four servers:**
- `RAN_BASE` = `https://sig.cm-sintra.pt/arcgis/rest/services/WMS_Inspire/WMS_SRUP_REN_RAN/MapServer` (Sintra RAN only — frequently offline)
- `REN_BASE` = `https://sig.cm-sintra.pt/arcgis/rest/services/WMS_Inspire/WMS_SRUP_REN_CMS/MapServer` (Sintra REN + risk layers)
- `CONDICIONANTES_BASE` = `https://sig.cm-sintra.pt/arcgis/rest/services/WMS_Inspire/WMS_PDM20_Condicionantes/MapServer`
- `CADASTRO_WMS_URL` = `https://snicws.dgterritorio.gov.pt/geoserver/inspire/ows` (DGT SNIC INSPIRE GeoServer — national cadastral parcels, OGC WMS 1.3.0)

> **Known outage:** `WMS_SRUP_REN_RAN` (`RAN_BASE`) is frequently down on Sintra's server — only `ran-sintra` now depends on it.

---

## Layer System

### Base zoning layers (always on by default)
Nineteen `L.layerGroup()` instances (urbanLayer + ruralLayer for Sintra, one each for the other seventeen municipalities). Only visible at zoom ≥ `MIN_DATA_ZOOM` (1) and only when that municipality is active (or when Grande Lisboa is active, in which case all nineteen show simultaneously).

| Layer | Type | Source |
|-------|------|--------|
| `urbanLayer` | GeoJSON (SVG renderer) | Sintra urban zones |
| `ruralLayer` | GeoJSON (SVG renderer) | Sintra rural zones |
| `cascaisLayer` | dynamicMapLayer tiles | CASCAIS_BASE/2 |
| `oeirasLayer` | dynamicMapLayer tiles | CASCAIS_BASE/3 |
| `louresLayer` | dynamicMapLayer tiles | CASCAIS_BASE/6 |
| `amadoraLayer` | GeoJSON (SVG renderer) | DGT CRUS WFS |
| `almadaLayer` | dynamicMapLayer tiles | AML_PDM1_BASE/2 |
| `barreiroLayer` | dynamicMapLayer tiles | AML_PDM1_BASE/2 |
| `lisboaLayer` | GeoJSON (SVG renderer) | DGT CRUS WFS |
| `vfxiraLayer` | dynamicMapLayer tiles | CASCAIS_BASE/10 |
| `mafraLayer` | GeoJSON (SVG renderer) | DGT CRUS WFS |
| `odivelaLayer` | dynamicMapLayer tiles | CASCAIS_BASE/8 |
| `alcocheteLayer` | dynamicMapLayer tiles | AML_PDM1_BASE/2 |
| `moitaLayer` | dynamicMapLayer tiles | CASCAIS_BASE/4 |
| `montijoLayer` | GeoJSON (SVG renderer) | DGT CRUS WFS |
| `palmelaLayer` | GeoJSON (SVG renderer) | sig.cm-palmela.pt ArcGIS REST |
| `seixalLayer` | GeoJSON (SVG renderer) | sig.cm-seixal.pt hosted FeatureServer |
| `sesimbraLayer` | GeoJSON (SVG renderer) | DGT CRUS WFS |
| `setubalLayer` | GeoJSON (SVG renderer) | DGT CRUS WFS |

### Cadastro Predial (the only user-facing overlay)

`activeLayer` tracks what's active: `'cadastro'` (default) or `'none'` (basemap only). The layers button (`#layers-btn`) in the bottom-left is a simple toggle between these two states — there is no overlay selection panel.

- **Cadastro layer** (`id: 'cadastro'`): `L.tileLayer.wms` on `CADASTRO_WMS_URL` (DGT SNIC INSPIRE GeoServer); `cadastralparcel` layer; OGC WMS 1.3.0; bounds clipped to AML `[38.55,-9.55]→[39.00,-8.68]`; opacity 0.8; rendered in `cadastroPane` (z-index 500). Tiles are always live — DGT GeoServer ignores `SLD_BODY`, so colour cannot be overridden.

**Parcel click flow (map.js):**
1. Panel opens **immediately** (before any network response) with loading `…` indicators — no 1–3 s wait.
2. `AbortController` cancels any in-flight WMS request from the previous click.
3. `_cadastroClickId` (module-level counter) guards against stale results: each click increments the ID; callbacks discard results whose ID no longer matches.
4. WMS `GetFeatureInfo` (`INFO_FORMAT=application/json`, `FEATURE_COUNT=1`) fetches the parcel geometry → adds a white highlight polygon to the map when it arrives.
5. Four queries run in parallel immediately after the panel opens:
   - `queryZoningAtPoint(latlng)` → fills "Qualificação do Solo" row (identifyFeatures for tile munis; async point-in-polygon via `setTimeout(0)` for GeoJSON munis to avoid blocking the main thread)
   - `queryRENAtPoint(latlng)` → CASCAIS_BASE/11; fills "REN" row
   - `queryRANAtPoint(latlng)` → CONDICIONANTES_BASE/264 (Sintra) or CASCAIS_BASE/12 (others); fills "RAN" row
   - `queryFireAtPoint(latlng)` → CONDICIONANTES_BASE/371; fills "Perigosidade de Incêndio" row (Sintra only)

**`OVERLAY_DEFS` array** (config.js) still defines all overlay configs (RAN, REN, fire, patrimonio, etc.) for use by `loadOverlay()` in layers.js and as a config source for `loadOverlay`; only the `cadastro` entry is user-facing. The other defs are retained for potential future use.

**Renderers:**
- All GeoJSON municipality zoning layers (Sintra, Amadora, Lisboa, Mafra, Montijo, Palmela, Seixal, Sesimbra, Setúbal): `renderer = L.svg({ padding: 1 })`
- Fire risk + tile municipalities: `L.esri.dynamicMapLayer` (server tiles, no GeoJSON download)
- SVG hatch patterns (`hatch-ran`, `hatch-ren`, `hatch-risk-red`, `hatch-risk-orange`) remain defined in the HTML body `<svg>` in case overlays are re-enabled in future.

---

## Data Loading — Cache-First with Live Fallback

GeoJSON layers use `loadLayerData(cachedFile, fallbackUrl)`:
1. Fetch `/data/{cachedFile}` — if 404, empty, or error → `console.warn` and continue
2. Fetch live — if this also fails → `console.error`, return `null`
3. `null` = both failed → layer shows error chip state

All GeoJSON municipalities use dedicated custom loaders (`loadAmadora()`, `loadLisboa()`, `loadMafra()`, `loadMontijo()`, `loadPalmela()`, `loadSeixal()`, `loadSesimbra()`, `loadSetubal()`) that fetch from the cached file first, then fall back to the live source directly (not via `loadLayerData` since WFS/REST endpoints need a different fetch path). Each custom loader takes an `attempt` parameter for auto-retry.

**What stays live-only (never cached):**
- Cascais, Oeiras, Loures, Almada, Barreiro, Vila Franca de Xira, Odivelas, Alcochete zoning tiles (`L.esri.dynamicMapLayer`)
- Fire risk tiles (`L.esri.dynamicMapLayer`)
- All `identifyFeatures` click queries
- Nominatim address search + reverse geocode

**Fallback tracking:** `liveFallbackCount` increments each time a layer falls back to live. The `#cache-date` indicator shows `"Dados: DD/MM/YYYY (alguns em direto)"` if any fallback occurred.

**Cached files** live in `data/` at the repo root (served at `/data/` by Vercel). Currently cached: `sintra-urban`, `sintra-rural`, `ran-cascais`, `ren-cascais`, `amadora-zoning`, `lisboa-zoning`, `mafra-zoning`, `montijo-zoning`, `palmela-zoning`, `seixal-zoning`, `sesimbra-zoning`, `setubal-zoning`, `odivelas-zoning`, `patrimonio`, `zep`, `perigosos`.

---

## Sync Script — `scripts/sync-data.js`

Downloads all GeoJSON layers to `data/`. Run with:
```bash
node scripts/sync-data.js
```

- Paginates ArcGIS responses (follows `exceededTransferLimit`, 1 s delay between pages)
- Tries `f=geojson` first; falls back to `f=json` + Esri→GeoJSON conversion if server returns HTML
- **WFS support:** Amadora, Lisboa, and Mafra use `fetchWFSAll()` (single-request OGC WFS, no pagination) via `type: 'wfs'` entry
- Never overwrites a cached file with 0-feature data
- Writes `data/sync-metadata.json` with per-layer status and `lastRun` timestamp
- Exits code 1 on any failure (for CI)
- Large layers (`sintra-urban`, `sintra-rural`): `pageSize=500`, `timeout=60s`
- Lisboa WFS: `timeout=60s` (861 features); Mafra WFS: `timeout=90s` (1709 features)

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
- Tile municipality layers (Cascais/Oeiras/Loures/Almada/Barreiro/VFXira/Odivelas/Alcochete): clears layer group before each retry, uses `.once('loaderror')`
- Overlays: retry count in `ovlState[id].retries`; timer guard checks `activeLayer === id && !st.loaded`. Resets on municipality switch.
- All GeoJSON municipalities (Sintra urban/rural, Amadora, Lisboa, Mafra, Montijo, Palmela, Seixal, Sesimbra, Setúbal): retry via `attempt` param; served from local cache so failures are near-instant

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
| `handleLayerSelect(value)` | `map.js` | Switches active layer — meaningful values are `'cadastro'` and `'none'`; `'zoning'` and other overlay ids remain in the code but are not user-reachable |
| `selectMunicipality(muni)` | `map.js` | Switches municipality, resets overlay cache, restores cadastro layer — does NOT pan |
| `queryZoningAtPoint(latlng)` | `map.js` | Queries active municipality's zoning at a point; returns `Promise<{label, fill}\|null>` — uses `identifyFeatures` for tile munis; for GeoJSON munis runs point-in-polygon asynchronously via `setTimeout(0)` to avoid blocking the main thread |
| `queryRENAtPoint(latlng)` | `map.js` | Queries CASCAIS_BASE/11 (AML-wide REN) at point; returns `Promise<boolean>` |
| `queryRANAtPoint(latlng)` | `map.js` | Queries CONDICIONANTES_BASE/264 (Sintra) or CASCAIS_BASE/12 (others) for RAN; returns `Promise<boolean>` |
| `queryFireAtPoint(latlng)` | `map.js` | Queries CONDICIONANTES_BASE/371 for fire risk class; returns `Promise<string\|null>` |
| `updateCacheDateIndicator()` | `ui.js` | Updates `#cache-date` badge; appends "(alguns em direto)" if any fallback occurred |
| `updateSintraChip()` | `ui.js` | Updates Sintra status chip based on load state + zoom |
| `showDetail(props, colorCfg, codeLabel)` | `ui.js` | Opens detail panel; shifts layers button, locate button, AND basemap button up to stay visible |
| `closeDetail()` | `ui.js` | Closes detail panel; restores layers button, locate button, and basemap button position |
| `showOverlayDetail(def, props, muni)` | `ui.js` | Adapts overlay properties for `showDetail`; for cadastro, injects async rows for Qualificação do Solo (with color dot), REN, RAN, and fire risk (Sintra only). Called with empty `{}` props immediately on click; WMS props are unused (no visible fields differ) |
| `updateDetailZoning(result)` | `ui.js` | Updates `#detail-zoning-val`; accepts `{label, fill}` object and renders a color dot, or plain string |
| `updateDetailRow(id, value)` | `ui.js` | Updates `#detail-{id}-val` row; renders "Sim" green / "Não" muted / plain text |
| `buildOverlayPanel()` | `ui.js` | **No-op** — overlay panel removed; function kept as an exported stub so `selectMunicipality` can still call it safely |
| `openLayersSheet()` | `ui.js` | **No-op** — overlay sheet removed; stub kept for compatibility |
| `setChipLoaded(id, state, text)` | `ui.js` | Saves chip state to `chipLoadedState` so it restores after zoom-out |

---

## UI Structure

- **App name / title:** Mapear (`<title>Mapear</title>`)
- **Favicon:** `favicon.svg` — coral red (`#e63946`) map pin with white inner circle; linked via `<link rel="icon" type="image/svg+xml">`
- **Top bar** (`#topbar`): municipality picker dropdown + address search (Nominatim)
- **Status bar** (`#statusbar`): GPS chip → active municipality chip (one of: `chip-sintra`, `chip-cascais`, `chip-oeiras`, `chip-loures`, `chip-amadora`, `chip-almada`, `chip-barreiro`, `chip-lisboa`, `chip-vfxira`, `chip-mafra`, `chip-odivelas`, `chip-alcochete`, `chip-grande-lisboa`) → Solo overlay chip (`chip-overlay`). In Grande Lisboa mode, `chip-grande-lisboa` replaces all individual municipality chips and always shows 'ok'.
- **Cadastro toggle button** (`#layers-btn`): bottom-left floating pill labeled **"Cadastro"**; slides up when detail panel is open; click toggles `activeLayer` between `'cadastro'` and `'none'`; has CSS class `active` when Cadastro is on (full opacity) and no class when off (dimmed)
- **Detail panel** (`#detail-panel`): full-width bottom sheet; opens **immediately** on parcel tap (before WMS response); swipe-down to close; liquid glass style
- **Locate button** (`#locate-btn`): bottom-right, re-centers on GPS; slides up with layers button when detail panel opens
- **Basemap toggle** (`#basemap-btn`): bottom-right, stacked 54px above locate button; swaps street ↔ satellite basemap; satellite is default; slides up when detail panel opens
- **Cache date** (`#cache-date`): subtle fixed label centered at bottom of map; shows sync date from `sync-metadata.json`
- **Search bar** (`#search-input`): magnifying glass icon on left; circle-X clear button on right (visible only when input has text)

**CSS design system:** `--glass-bg`, `--glass-blur`, `--glass-border`, `--glass-shadow` CSS variables. Apple liquid glass dark mode: `rgba(10,10,20,0.62)` background, `blur(28px) saturate(160%)`. All panels use these tokens.

**Municipality picker:** dropdown in topbar. Selecting a municipality pans (no zoom change) to its center and resets overlays. **Exception: Grande Lisboa uses `setView` to also set zoom** (zoom 10, center ~`[38.756, -9.208]`) so the whole region fits in view. GPS auto-detection calls `selectMunicipality()` without panning and never selects Grande Lisboa. Centers/zooms in `MUNICIPALITIES` array.

**Address search:** Nominatim query uses `limit=7`, `countrycodes=pt`. When GPS is available, a `viewbox` (~0.30°×0.20° box) biases results toward the user's location (`bounded=0`). Detects all twelve municipalities in results; zooms to 15 for Cascais, Oeiras, Loures, Amadora, Almada, Barreiro, Lisboa, Vila Franca de Xira, Mafra, Odivelas, Alcochete, and 17 for Sintra. Results outside covered municipalities show "⚠ Sem dados PDM disponíveis". Keyboard navigation: Up/Down arrows, Enter selects, Escape clears. Dropdown fades out (150ms) on selection.

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
| Lisboa | GeoJSON | zoom < MIN_DATA_ZOOM | "Lisboa: zoom" |
| Vila Franca de Xira | tiles (maxZoom:15) | zoom < MIN_DATA_ZOOM | "VF Xira: zoom" |
| Vila Franca de Xira | tiles (maxZoom:15) | zoom > 15 | "VF Xira: recuar zoom" |
| Mafra | GeoJSON | zoom < MIN_DATA_ZOOM | "Mafra: zoom" |
| Odivelas | tiles (maxZoom:15) | zoom > 15 | "Odivelas: recuar zoom" |
| Alcochete | tiles (maxZoom:14) | zoom < MIN_DATA_ZOOM | "Alcochete: zoom" |
| Alcochete | tiles (maxZoom:14) | zoom > 14 | "Alcochete: recuar zoom" |
| Barreiro | tiles (maxZoom:14) | zoom < MIN_DATA_ZOOM | "Barreiro: zoom" |
| Barreiro | tiles (maxZoom:14) | zoom > 14 | "Barreiro: recuar zoom" |
| Moita | tiles (maxZoom:15) | zoom < MIN_DATA_ZOOM | "Moita: zoom" |
| Moita | tiles (maxZoom:15) | zoom > 15 | "Moita: recuar zoom" |
| Montijo | GeoJSON | zoom < MIN_DATA_ZOOM | "Montijo: zoom" |
| Palmela | GeoJSON | zoom < MIN_DATA_ZOOM | "Palmela: zoom" |
| Seixal | GeoJSON | zoom < MIN_DATA_ZOOM | "Seixal: zoom" |
| Sesimbra | GeoJSON | zoom < MIN_DATA_ZOOM | "Sesimbra: zoom" |
| Setúbal | GeoJSON | zoom < MIN_DATA_ZOOM | "Setúbal: zoom" |

---

## Grande Lisboa Region View

`grande-lisboa` is a special entry in `MUNICIPALITIES` (`id: 'grande-lisboa'`, `center: [38.756, -9.208]`, `zoom: 10`). It is not a real municipality — it is a region overlay mode.

**How it works:**
- `updateLayerVisibility` checks `isGL = _activeMunicipality === 'grande-lisboa'` and adds all eighteen `xOn` conditions with `|| isGL`, making every layer group visible simultaneously.
- `updateSintraChip` in `ui.js` extends its `on` check to include `grande-lisboa` so Sintra urban/rural layers are also added to the map. The Sintra chip itself is still hidden (only shown for `activeMunicipality === 'sintra'`).
- `pickMunicipality` uses `map.setView(cfg.center, cfg.zoom)` instead of `panTo` so zoom resets to 10.
- In Grande Lisboa mode with `_activeLayer === 'zoning'`, clicking fires all tile identify queries in parallel (7 queries: 6 CASCAIS_BASE layers — Cascais/2, Oeiras/3, Moita/4, Loures/6, Odivelas/8, VFXira/10 — + 1 AML_PDM1_BASE layer 2 covering Almada/Barreiro/Alcochete) and shows the first non-empty result. GeoJSON polygon clicks (Sintra, Amadora, Lisboa, Mafra, Montijo, Palmela, Seixal, Sesimbra) also work via Leaflet's built-in feature events. All 18 municipalities are clickable. When `_activeLayer === 'cadastro'`, parcel clicks work as normal (panel opens immediately; zoning query identifies which municipality the click falls in).
- `chip-grande-lisboa` shows 'ok' immediately; all per-municipality chips are hidden.
- `updateZoningOverlayChip` shows `setOverlayChip('ok', 'Solo')` immediately.

---

## Deferred Features

- **Enhanced detail panel content** for zoning layers (richer property display beyond zone code + label) — not yet implemented for regular polygon clicks; only the cadastro parcel click has the multi-layer panel.

---

## Known Limitations

- Cascais/Oeiras/Loures/VFXira zoning geometry is blocked by AML pdm_revisao server — tile rendering only. The REST `/query` endpoint returns features but **strips all geometry** (no coordinates in response, regardless of `returnGeometry=true`). QGIS hits the same wall. DGT WFS `SDISNITWFSCRUS_1104_1` (Cascais) returns HTTP 502 — not functional.
- Almada tiles go blank above zoom 14 (ArcGIS `maxScale:25000`) — same behaviour as Cascais; see data source notes for `layerDefs` and `identifyFeatures` quirks
- Sintra overlay layers only cover Sintra territory (except RAN and ren-* which load AML-wide data)
- `WMS_SRUP_REN_RAN` (`RAN_BASE`) server on Sintra's infrastructure is unreliable — only `ran-sintra` now depends on it
- `ren-sintra` removed — no unified queryable REN boundary layer exists on Sintra's server
- Cascais condicionantes risk layers not yet integrated — available at `sig.aml.pt/.../PMAAC_Riscos_Actuais` (layers 60–65) but need testing
- No DGT WFS published for Vila Franca de Xira — tile-only source
- Odivelas' own ArcGIS server (`sig.cm-odivelas.pt`) is unreachable; DGT WFS 1116_1 returns HTTP 502 — AML pdm_revisao layer 8 tile rendering used instead
- Alcochete's own server (`sig.cm-alcochete.pt`) is unreachable; not on AML pdm_revisao; DGT WFS 1502 exists but has only granular 1997-era `Designacao_no_plano` field — AML PDM_I_GERACAO tiles used instead
- Barreiro's own server (`sig.cm-barreiro.pt`) is firewalled/unreachable; not on AML pdm_revisao; DGT WFS 1504 returns HTTP 502 — AML PDM_I_GERACAO tiles used instead
- Mafra's own ArcGIS server (`sig.cm-mafra.pt`) has TLS certificate issues
- Grande Lisboa tile clicks fire 7 parallel identify queries (6 CASCAIS_BASE layers including Moita + 1 AML_PDM1_BASE) and show the first result — in practice each AML layer only has features for its own territory
- Moita's own GIS portal (`geomoita.cm-moita.pt`) is offline; DGT WFS 1505_1 returns HTTP 500 — AML pdm_revisao layer 4 tile rendering used instead
- Montijo's DGT WFS (`SDISNITWFSCRUS_1507_1`) maps all urban areas to `Categoria_2021='Não Atribuída'` — style falls back to `Classe_2021` for coloring (1997 PDM classification predates DR 15/2015)
- Palmela DGT WFS (1508) has only 57 features (very sparse) — municipality's own ArcGIS server (`sig.cm-palmela.pt/arcgis/rest/services/PMOTs/MapServer/17`) used instead (928 features)
- Palmela's 1997 PDM embeds PNA/RNES protected-area sub-zones and PGRI flood-risk zones as `tipo` values within the main zoning layer — they are colored distinctly but appear in the same layer as regular zoning
- Seixal's AML pdm_revisao layer 9 blocks geometry export (tile-only) — hosted FeatureServer (`sig.cm-seixal.pt`) used instead (903 features)
- Seixal `designacao` field values have trailing whitespace/newlines in source data — handled with `.trim()` in style fn and click handler
- Sesimbra's own server (`sig.cm-sesimbra.pt`) is firewalled/unreachable; AML PDM_I_GERACAO has 59 features but geometry blocked — DGT WFS 1511_1 used instead (126 features)
- Sesimbra `Categoria_2021` values have trailing spaces (`'Espaço de Atividades Industriais '`) — handled with `.trim()`
- Setúbal's own server (`sig.cm-setubal.pt`) is unreachable (DNS does not resolve); AML PDM_I_GERACAO has 327 Setúbal features but only 3 coarse Classe values — DGT WFS 1512_1 used instead (792 features, 2025-01-28 PDM)
- Setúbal WFS requires **WFS 2.0.0** (`typeNames` parameter, not `typeName`) — unlike other DGT WFS endpoints which use 1.1.0
- Cadastro WMS tile color cannot be overridden — DGT GeoServer (`snicws.dgterritorio.gov.pt`) ignores `SLD_BODY` parameter in WMS GetMap requests; tiles are always rendered in the server's default grey-with-black-borders style

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
