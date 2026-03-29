# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Mapear** — a single-page web app that visualizes PDM (Plano Diretor Municipal) zoning data and land-use restrictions for eighteen municipalities in the Lisbon metro area (Sintra, Cascais, Oeiras, Loures, Amadora, Almada, Barreiro, Lisboa, Vila Franca de Xira, Mafra, Odivelas, Alcochete, Moita, Montijo, Palmela, Seixal, Sesimbra, Setúbal), plus a **Grande Lisboa** region view that renders all eighteen simultaneously. Renders interactive zoning polygons on a Leaflet + OpenStreetMap map with live GPS, address search, and a unified layer selector.

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

### Overlay layers (`OVERLAY_DEFS` array)
Radio-button selection — only one layer active at a time. Selecting any overlay hides the zoning. Selecting "Qualificação do Solo" restores it. Layers are **lazy-loaded** on first selection and cached in `ovlState`.

`activeLayer` variable tracks what's selected: `'zoning'`, a def id, or `'none'` (all layers hidden — basemap only).

**Renderers:**
- All GeoJSON municipality zoning layers (Sintra, Amadora, Lisboa, Mafra, Montijo, Palmela, Seixal, Sesimbra, Setúbal): `renderer = L.svg({ padding: 1 })`
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
| `ren-lisboa` | REN — Reserva Ecológica | lisboa | CASCAIS_BASE | 11 | `ren-cascais.geojson` | green hatch (`hatch-ren`) |
| `ren-vfxira` | REN — Reserva Ecológica | vfxira | CASCAIS_BASE | 11 | `ren-cascais.geojson` | green hatch (`hatch-ren`) |
| `ren-mafra` | REN — Reserva Ecológica | mafra | CASCAIS_BASE | 11 | `ren-cascais.geojson` | green hatch (`hatch-ren`) |
| `ren-odivelas` | REN — Reserva Ecológica | odivelas | CASCAIS_BASE | 11 | `ren-cascais.geojson` | green hatch (`hatch-ren`) |
| `ren-alcochete` | REN — Reserva Ecológica | alcochete | CASCAIS_BASE | 11 | `ren-cascais.geojson` | green hatch (`hatch-ren`) |
| `ren-barreiro` | REN — Reserva Ecológica | barreiro | CASCAIS_BASE | 11 | `ren-cascais.geojson` | green hatch (`hatch-ren`) |
| `ren-moita` | REN — Reserva Ecológica | moita | CASCAIS_BASE | 11 | `ren-cascais.geojson` | green hatch (`hatch-ren`) |
| `ren-montijo` | REN — Reserva Ecológica | montijo | CASCAIS_BASE | 11 | `ren-cascais.geojson` | green hatch (`hatch-ren`) |
| `ren-palmela` | REN — Reserva Ecológica | palmela | CASCAIS_BASE | 11 | `ren-cascais.geojson` | green hatch (`hatch-ren`) |
| `ren-seixal` | REN — Reserva Ecológica | seixal | CASCAIS_BASE | 11 | `ren-cascais.geojson` | green hatch (`hatch-ren`) |
| `ren-sesimbra` | REN — Reserva Ecológica | sesimbra | CASCAIS_BASE | 11 | `ren-cascais.geojson` | green hatch (`hatch-ren`) |
| `ren-setubal` | REN — Reserva Ecológica | setubal | CASCAIS_BASE | 11 | `ren-cascais.geojson` | green hatch (`hatch-ren`) |
| `ren-grande-lisboa` | REN — Reserva Ecológica | grande-lisboa | CASCAIS_BASE | 11 | `ren-cascais.geojson` | green hatch (`hatch-ren`) |
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
| `cadastro` | Cadastro Predial | both | CADASTRO_WMS_URL (SNIC GeoServer) | `cadastralparcel` | — (always live WMS) | `L.tileLayer.wms` v1.3.0; bounds clipped to AML `[38.55,-9.55]→[39.00,-8.68]`; click → WMS GetFeatureInfo |

**Notes:**
- `ren-sintra` was removed — no unified queryable REN boundary layer exists on Sintra's server.
- `ren-cascais.geojson` is AML-wide and covers all non-Sintra municipalities (Cascais, Oeiras, Loures, Amadora, Almada, Barreiro, Lisboa, Vila Franca de Xira, Mafra, Odivelas, Alcochete). Reused by `ren-grande-lisboa`.
- **RAN** (`muni: 'both'`) uses `sintraSource` / `cascaisSource` fields: Sintra → CONDICIONANTES_BASE/264, all others (including Grande Lisboa) → CASCAIS_BASE/12.
- **SVG hatch patterns** are defined in a hidden `<svg>` in the HTML body: `hatch-ran`, `hatch-ren`, `hatch-risk-red`, `hatch-risk-orange`.
- Overlay panel for Grande Lisboa shows only: Qualificação do Solo + RAN (`muni: 'both'`) + REN (`ren-grande-lisboa`). All Sintra-specific overlays are hidden.

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
- **Favicon:** `favicon.svg` — coral red (`#e63946`) map pin with white inner circle; linked via `<link rel="icon" type="image/svg+xml">`
- **Top bar** (`#topbar`): municipality picker dropdown + address search (Nominatim)
- **Status bar** (`#statusbar`): GPS chip → active municipality chip (one of: `chip-sintra`, `chip-cascais`, `chip-oeiras`, `chip-loures`, `chip-amadora`, `chip-almada`, `chip-barreiro`, `chip-lisboa`, `chip-vfxira`, `chip-mafra`, `chip-odivelas`, `chip-alcochete`, `chip-grande-lisboa`) → Solo overlay chip (`chip-overlay`). In Grande Lisboa mode, `chip-grande-lisboa` replaces all individual municipality chips and always shows 'ok'.
- **Layers button** (`#layers-btn`): bottom-left floating pill labeled **"Mapeamento"** (default); slides up when detail panel is open; opens layers popup
- **Layers popup** (`#layers-sheet`): compact popup anchored above the layers button (positioned dynamically via `getBoundingClientRect`); header row has "Camadas" title (left) + "Limpar" text button (right); contains overlay radio list below
- **Limpar button** (`#layers-clear`): top-right of layers popup; sets `activeLayer = 'none'`, removes all layers, deselects all radios — shows just the basemap
- **Detail panel** (`#detail-panel`): full-width bottom sheet, slides up on polygon tap, swipe-down to close; liquid glass style
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
- In Grande Lisboa mode, clicking fires all tile identify queries in parallel (7 queries: 6 CASCAIS_BASE layers — Cascais/2, Oeiras/3, Moita/4, Loures/6, Odivelas/8, VFXira/10 — + 1 AML_PDM1_BASE layer 2 covering Almada/Barreiro/Alcochete) and shows the first non-empty result. GeoJSON polygon clicks (Sintra, Amadora, Lisboa, Mafra, Montijo, Palmela, Seixal, Sesimbra) also work via Leaflet's built-in feature events. All 18 municipalities are clickable in region view.
- `chip-grande-lisboa` shows 'ok' immediately; all per-municipality chips are hidden.
- `updateZoningOverlayChip` shows `setOverlayChip('ok', 'Solo')` immediately.
- Overlay panel: only **Qualificação do Solo**, **RAN** (`muni: 'both'`, uses `ran-cascais.geojson`), and **REN** (`ren-grande-lisboa`, uses `ren-cascais.geojson`). All Sintra-specific layers are filtered out by `buildOverlayPanel`.

---

## Deferred Features

- **Enhanced detail panel content** (richer property display, additional metadata fields in the bottom sheet) — moved to a feature branch; not planned for main in the near term. Current detail panel shows basic zone code + label only.

---

## Known Limitations

- Cascais/Oeiras/Loures/VFXira zoning geometry is blocked by AML pdm_revisao server — tile rendering only, no GeoJSON export
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
