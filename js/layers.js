// ============================================================
// LAYERS — data loading, GeoJSON rendering, overlay management
// ============================================================

import {
  SINTRA_BASE, CASCAIS_BASE, CONDICIONANTES_BASE, AMADORA_WFS, AML_PDM1_BASE, LISBOA_WFS, MAFRA_WFS, MONTIJO_WFS, SESIMBRA_WFS, SETUBAL_WFS, PALMELA_BASE, SEIXAL_BASE,
  OVERLAY_DEFS, URBAN_COLORS, RURAL_COLORS, AMADORA_COLORS, ALMADA_COLORS, BARREIRO_COLORS, LISBOA_COLORS, MAFRA_COLORS, MONTIJO_COLORS, SESIMBRA_COLORS, SETUBAL_COLORS, PALMELA_COLORS, SEIXAL_COLORS, ODIVELAS_COLORS, ALCOCHETE_COLORS, FIRE_COLORS, RETRY_DELAYS,
} from './config.js';

// ── Module-level state (set by initLayers) ─────────────────
let _map             = null;
let _renderer        = null;
let _overlayRenderer = null;
let _callbacks       = {};

// Exported live bindings — assigned inside initLayers, visible to importers.
export let urbanLayer   = null;
export let ruralLayer   = null;
export let cascaisLayer = null;
export let oeirasLayer  = null;
export let louresLayer  = null;
export let amadoraLayer = null;
export let almadaLayer  = null;
export let lisboaLayer  = null;
export let vfxiraLayer    = null;
export let mafraLayer     = null;
export let odivelaLayer   = null;
export let alcocheteLayer = null;
export let barreiroLayer  = null;
export let moitaLayer     = null;
export let montijoLayer   = null;
export let palmelaLayer   = null;
export let seixalLayer    = null;
export let sesimbraLayer  = null;
export let setubalLayer   = null;

// Exported overlay state — same object reference shared with index.html.
export const ovlState = {};

// In-memory cache for overlay GeoJSON that is reused across municipality switches
// (e.g. ren-cascais.geojson is shared by all ren-* overlays). Keyed by cachedFile name.
const _overlayDataCache = {};

let _cascaisReady     = false;
export function getCascaisReady()    { return _cascaisReady; }

let _oeirasReady      = false;
export function getOeirasReady()     { return _oeirasReady; }

let _louresReady      = false;
export function getLouresReady()     { return _louresReady; }

let _amadoraReady     = false;
export function getAmadoraReady()    { return _amadoraReady; }

let _almadaReady      = false;
export function getAlmadaReady()     { return _almadaReady; }

let _lisboaReady      = false;

let _vfxiraReady      = false;
export function getVfxiraReady()     { return _vfxiraReady; }

let _mafraReady       = false;

let _odivelaReady     = false;
export function getOdivelasReady()   { return _odivelaReady; }

let _alcocheteReady   = false;
export function getAlcocheteReady()  { return _alcocheteReady; }

let _barreiroReady    = false;
export function getBarreiroReady()   { return _barreiroReady; }

let _moitaReady       = false;
export function getMoitaReady()      { return _moitaReady; }

let _palmelaReady     = false;
let _seixalReady      = false;

let liveFallbackCount = 0;
export function getLiveFallbackCount() { return liveFallbackCount; }

// ── Fetch helpers ───────────────────────────────────────────

async function fetchGeoJSONPage(url, offset, count = 1000) {
  const sep  = url.includes('?') ? '&' : '?';
  const full = `${url}${sep}resultOffset=${offset}&resultRecordCount=${count}&f=geojson`;
  const res  = await fetch(full, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchAllFeatures(baseQueryUrl) {
  const features = [];
  let offset = 0;
  const pageSize = 1000;
  while (true) {
    const data  = await fetchGeoJSONPage(baseQueryUrl, offset, pageSize);
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
    const batch = data.features || [];
    features.push(...batch);
    if (!data.exceededTransferLimit || batch.length === 0) break;
    offset += batch.length;
  }
  return features;
}

// ── Unified loader: cache first, live ArcGIS fallback ──────
// Returns { features, fromCache } or null if both fail.

export async function loadLayerData(cachedFile, fallbackUrl) {
  // 1. Try local cache
  if (cachedFile) {
    try {
      const res = await fetch(`/data/${cachedFile}`, { signal: AbortSignal.timeout(15000) });
      if (res.ok) {
        const data     = await res.json();
        const features = data.features || [];
        if (features.length > 0) return { features, fromCache: true };
        console.warn(`[cache] ${cachedFile} returned 0 features — falling back to live`);
      } else {
        console.warn(`[cache] ${cachedFile} → HTTP ${res.status} — falling back to live`);
      }
    } catch (e) {
      console.warn(`[cache] ${cachedFile} failed (${e.message}) — falling back to live`);
    }
  }

  // 2. Try live ArcGIS endpoint
  if (fallbackUrl) {
    try {
      const features = await fetchAllFeatures(fallbackUrl);
      if (features.length > 0) {
        liveFallbackCount++;
        _callbacks.onFallback?.();
        return { features, fromCache: false };
      }
      console.error(`[live] ${fallbackUrl} returned 0 features`);
    } catch (e) {
      console.error(`[live] ${fallbackUrl} failed:`, e.message);
    }
  }

  // 3. Both failed
  return null;
}

// ── Style helpers (used by Sintra layer loaders) ────────────

function makeStyle(fill, opacity = 0.42) {
  return { fillColor: fill, fillOpacity: opacity, color: fill, weight: 1, opacity: 0.75 };
}

function getUrbanStyle(props) {
  const cat = props.CAT || '';
  const cfg = URBAN_COLORS[cat];
  return makeStyle(cfg ? cfg.fill : '#888888');
}

function getRuralStyle(props) {
  const cat = props.Ord_Categ || '';
  const cfg = RURAL_COLORS[cat];
  return makeStyle(cfg ? cfg.fill : '#888888');
}

// ── Overlay helpers ─────────────────────────────────────────

export function overlayShortName(def) {
  return def.name.includes('\u2014') ? def.name.split('\u2014')[0].trim() : def.name;
}

function makeOverlayStyle(def) {
  if (def.hatch) {
    return { fillColor: `url(#${def.hatch})`, fillOpacity: 1, color: def.color, weight: 1.2, opacity: 0.6 };
  }
  return { fillColor: def.color, fillOpacity: def.fillOpacity ?? 0.35, color: def.color, weight: 1, opacity: 0.75 };
}

// ── Sintra layer loaders ────────────────────────────────────

async function loadSintraUrban() {
  _callbacks.onSintraStatus?.({ urban: 'loading' });
  const fallbackUrl = `${SINTRA_BASE}/55/query?where=1%3D1&outFields=CAT%2CDescricao%2CRegulamento%2CPag_Regulamento%2CGuiao%2CPag_Guiao%2CRelatorio%2CPag_relatorio%2Carea_ha&outSR=4326`;
  const result = await loadLayerData('sintra-urban.geojson', fallbackUrl);
  if (!result) {
    _callbacks.onSintraStatus?.({ urban: 'error', urbanText: 'erro' });
    return;
  }
  L.geoJSON({ type: 'FeatureCollection', features: result.features }, {
    renderer: _renderer,
    style: f => getUrbanStyle(f.properties),
    onEachFeature(feature, layer) {
      layer.on('click', e => {
        L.DomEvent.stopPropagation(e);
        const p   = feature.properties;
        const cat = p.CAT || '';
        const cfg = URBAN_COLORS[cat] || { fill: '#888', label: cat };
        _callbacks.onFeatureClick?.(p, cfg, cat + (cfg.label ? ' — ' + cfg.label : ''));
      });
    },
  }).addTo(urbanLayer);
  _callbacks.onSintraStatus?.({ urban: 'ok', urbanText: `Urbano (${result.features.length})` });
}

async function loadSintraRural() {
  _callbacks.onSintraStatus?.({ rural: 'loading' });
  const fallbackUrl = `${SINTRA_BASE}/54/query?where=1%3D1&outFields=Ord_Categ%2CDescricao%2CRegulamento%2CPag_Regulamento%2CGuiao%2CPag_Guiao%2CRelatorio%2CPag_relatorio%2CArea_Ha&outSR=4326`;
  const result = await loadLayerData('sintra-rural.geojson', fallbackUrl);
  if (!result) {
    _callbacks.onSintraStatus?.({ rural: 'error', ruralText: 'erro' });
    return;
  }
  L.geoJSON({ type: 'FeatureCollection', features: result.features }, {
    renderer: _renderer,
    style: f => getRuralStyle(f.properties),
    onEachFeature(feature, layer) {
      layer.on('click', e => {
        L.DomEvent.stopPropagation(e);
        const p   = feature.properties;
        const cat = p.Ord_Categ || '';
        const cfg = RURAL_COLORS[cat] || { fill: '#888', label: cat };
        _callbacks.onFeatureClick?.(p, cfg, cat + (cfg.label ? ' — ' + cfg.label : ''));
      });
    },
  }).addTo(ruralLayer);
  _callbacks.onSintraStatus?.({ rural: 'ok', ruralText: `Rústico (${result.features.length})` });
}

// ── Cascais layer loader ─────────────────────────────────────

function loadCascais(attempt = 0) {
  cascaisLayer.clearLayers();
  _callbacks.onCascaisStatus?.('loading', 'Cascais…');
  try {
    const layer = L.esri.dynamicMapLayer({ url: CASCAIS_BASE, layers: [2], opacity: 0.55, maxZoom: 15 });
    layer.addTo(cascaisLayer);
    layer.once('load', () => {
      _cascaisReady = true;
      _callbacks.onCascaisLoaded?.('ok', 'Cascais');
    });
    layer.once('loaderror', () => {
      _callbacks.onCascaisStatus?.('error', 'Cascais: erro');
      if (attempt < RETRY_DELAYS.length) setTimeout(() => loadCascais(attempt + 1), RETRY_DELAYS[attempt]);
    });
    _cascaisReady = true;
  } catch (e) {
    console.error('Cascais error:', e);
    _callbacks.onCascaisStatus?.('error', 'Cascais: indisponível');
    if (attempt < RETRY_DELAYS.length) setTimeout(() => loadCascais(attempt + 1), RETRY_DELAYS[attempt]);
  }
}

// ── Oeiras layer loader ──────────────────────────────────────

function loadOeiras(attempt = 0) {
  oeirasLayer.clearLayers();
  _callbacks.onOeirasStatus?.('loading', 'Oeiras\u2026');
  try {
    const layer = L.esri.dynamicMapLayer({ url: CASCAIS_BASE, layers: [3], opacity: 0.55, maxZoom: 15 });
    layer.addTo(oeirasLayer);
    layer.once('load', () => {
      _oeirasReady = true;
      _callbacks.onOeirasLoaded?.('ok', 'Oeiras');
    });
    layer.once('loaderror', () => {
      _callbacks.onOeirasStatus?.('error', 'Oeiras: erro');
      if (attempt < RETRY_DELAYS.length) setTimeout(() => loadOeiras(attempt + 1), RETRY_DELAYS[attempt]);
    });
    _oeirasReady = true;
  } catch (e) {
    console.error('Oeiras error:', e);
    _callbacks.onOeirasStatus?.('error', 'Oeiras: indispon\u00edvel');
    if (attempt < RETRY_DELAYS.length) setTimeout(() => loadOeiras(attempt + 1), RETRY_DELAYS[attempt]);
  }
}

// ── Loures layer loader ──────────────────────────────────────

function loadLoures(attempt = 0) {
  louresLayer.clearLayers();
  _callbacks.onLouresStatus?.('loading', 'Loures\u2026');
  try {
    const layer = L.esri.dynamicMapLayer({ url: CASCAIS_BASE, layers: [6], opacity: 0.55, maxZoom: 15 });
    layer.addTo(louresLayer);
    layer.once('load', () => {
      _louresReady = true;
      _callbacks.onLouresLoaded?.('ok', 'Loures');
    });
    layer.once('loaderror', () => {
      _callbacks.onLouresStatus?.('error', 'Loures: erro');
      if (attempt < RETRY_DELAYS.length) setTimeout(() => loadLoures(attempt + 1), RETRY_DELAYS[attempt]);
    });
    _louresReady = true;
  } catch (e) {
    console.error('Loures error:', e);
    _callbacks.onLouresStatus?.('error', 'Loures: indispon\u00edvel');
    if (attempt < RETRY_DELAYS.length) setTimeout(() => loadLoures(attempt + 1), RETRY_DELAYS[attempt]);
  }
}

// ── Amadora layer loader ─────────────────────────────────────

function getAmadoraStyle(props) {
  const cat = props.Categoria_2021 || '';
  const cfg = AMADORA_COLORS[cat];
  if (cfg) return makeStyle(cfg.fill);
  const cls = props.Classe_2021 || '';
  if (cls.includes('R\u00fastico')) return makeStyle('#74c69d');
  return makeStyle('#adb5bd');
}

async function fetchAmadoraFeatures() {
  const res = await fetch(AMADORA_WFS, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.features || [];
}

async function loadAmadora(attempt = 0) {
  _callbacks.onAmadoraStatus?.('loading', 'Amadora\u2026');

  let features = null;

  // 1. Try cached file
  try {
    const res = await fetch('/data/amadora-zoning.geojson', { signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      const data = await res.json();
      const f = data.features || [];
      if (f.length > 0) features = f;
      else console.warn('[cache] amadora-zoning.geojson returned 0 features — falling back to live');
    } else {
      console.warn(`[cache] amadora-zoning.geojson \u2192 HTTP ${res.status} — falling back to live`);
    }
  } catch (e) {
    console.warn('[cache] amadora-zoning.geojson failed (' + e.message + ') — falling back to live');
  }

  // 2. Try DGT WFS live
  if (!features) {
    try {
      features = await fetchAmadoraFeatures();
      if (features.length > 0) {
        liveFallbackCount++;
        _callbacks.onFallback?.();
      } else {
        console.error('[live] Amadora WFS returned 0 features');
        features = null;
      }
    } catch (e) {
      console.error('[live] Amadora WFS failed:', e.message);
    }
  }

  if (!features || features.length === 0) {
    _callbacks.onAmadoraStatus?.('error', 'Amadora: erro');
    if (attempt < RETRY_DELAYS.length) {
      setTimeout(() => loadAmadora(attempt + 1), RETRY_DELAYS[attempt]);
    }
    return;
  }

  L.geoJSON({ type: 'FeatureCollection', features }, {
    renderer: _renderer,
    style: f => getAmadoraStyle(f.properties),
    onEachFeature(feature, layer) {
      layer.on('click', e => {
        L.DomEvent.stopPropagation(e);
        const p   = feature.properties;
        const cat = p.Categoria_2021 || '';
        const cfg = AMADORA_COLORS[cat] || { fill: '#adb5bd', label: cat };
        const displayProps = {
          ...p,
          Descricao: p.Designacao_no_plano,
          Area_Ha:   p.AREA_HA,
          Classe:    p.Classe_2021,
        };
        _callbacks.onFeatureClick?.(displayProps, cfg, cat + (cfg.label ? ' \u2014 ' + cfg.label : ''));
      });
    },
  }).addTo(amadoraLayer);

  _amadoraReady = true;
  _callbacks.onAmadoraLoaded?.('ok', 'Amadora');
}

// ── Almada layer loader ──────────────────────────────────────

function loadAlmada(attempt = 0) {
  almadaLayer.clearLayers();
  _callbacks.onAlmadaStatus?.('loading', 'Almada\u2026');
  try {
    const layer = L.esri.dynamicMapLayer({ url: AML_PDM1_BASE, layers: [2], opacity: 0.55, maxZoom: 14, layerDefs: { 2: "Concelho = 'ALMADA'" } });
    layer.addTo(almadaLayer);
    layer.once('load', () => {
      _almadaReady = true;
      _callbacks.onAlmadaLoaded?.('ok', 'Almada');
    });
    layer.once('loaderror', () => {
      _callbacks.onAlmadaStatus?.('error', 'Almada: erro');
      if (attempt < RETRY_DELAYS.length) setTimeout(() => loadAlmada(attempt + 1), RETRY_DELAYS[attempt]);
    });
    _almadaReady = true;
  } catch (e) {
    console.error('Almada error:', e);
    _callbacks.onAlmadaStatus?.('error', 'Almada: indispon\u00edvel');
    if (attempt < RETRY_DELAYS.length) setTimeout(() => loadAlmada(attempt + 1), RETRY_DELAYS[attempt]);
  }
}

// ── Lisboa layer loader ──────────────────────────────────────

function getLisboaStyle(props) {
  const cat = props.Categoria || '';
  const cfg = LISBOA_COLORS[cat];
  if (cfg) return makeStyle(cfg.fill);
  return makeStyle('#adb5bd');
}

async function fetchLisboaFeatures() {
  const res = await fetch(LISBOA_WFS, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.features || [];
}

async function loadLisboa(attempt = 0) {
  _callbacks.onLisboaStatus?.('loading', 'Lisboa\u2026');

  let features = null;

  // 1. Try cached file
  try {
    const res = await fetch('/data/lisboa-zoning.geojson', { signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      const data = await res.json();
      const f = data.features || [];
      if (f.length > 0) features = f;
      else console.warn('[cache] lisboa-zoning.geojson returned 0 features — falling back to live');
    } else {
      console.warn(`[cache] lisboa-zoning.geojson \u2192 HTTP ${res.status} — falling back to live`);
    }
  } catch (e) {
    console.warn('[cache] lisboa-zoning.geojson failed (' + e.message + ') — falling back to live');
  }

  // 2. Try DGT WFS live
  if (!features) {
    try {
      features = await fetchLisboaFeatures();
      if (features.length > 0) {
        liveFallbackCount++;
        _callbacks.onFallback?.();
      } else {
        console.error('[live] Lisboa WFS returned 0 features');
        features = null;
      }
    } catch (e) {
      console.error('[live] Lisboa WFS failed:', e.message);
    }
  }

  if (!features || features.length === 0) {
    _callbacks.onLisboaStatus?.('error', 'Lisboa: erro');
    if (attempt < RETRY_DELAYS.length) {
      setTimeout(() => loadLisboa(attempt + 1), RETRY_DELAYS[attempt]);
    }
    return;
  }

  L.geoJSON({ type: 'FeatureCollection', features }, {
    renderer: _renderer,
    style: f => getLisboaStyle(f.properties),
    onEachFeature(feature, layer) {
      layer.on('click', e => {
        L.DomEvent.stopPropagation(e);
        const p   = feature.properties;
        const cat = p.Categoria || '';
        const cfg = LISBOA_COLORS[cat] || { fill: '#adb5bd', label: cat };
        const displayProps = {
          ...p,
          Descricao: p.Designacao_PlantaOrdenamento,
          area_ha:   p.Area_Ha,
        };
        _callbacks.onFeatureClick?.(displayProps, cfg, cat + (cfg.label ? ' \u2014 ' + cfg.label : ''));
      });
    },
  }).addTo(lisboaLayer);

  _lisboaReady = true;
  _callbacks.onLisboaLoaded?.('ok', 'Lisboa');
}

// ── Vila Franca de Xira layer loader ────────────────────────
// AML pdm_revisao layer 10 — geometry blocked by server, tile rendering only.

function loadVfxira(attempt = 0) {
  vfxiraLayer.clearLayers();
  _callbacks.onVfxiraStatus?.('loading', 'VF Xira\u2026');
  try {
    const layer = L.esri.dynamicMapLayer({ url: CASCAIS_BASE, layers: [10], opacity: 0.55, maxZoom: 15 });
    layer.addTo(vfxiraLayer);
    layer.once('load', () => {
      _vfxiraReady = true;
      _callbacks.onVfxiraLoaded?.('ok', 'VF Xira');
    });
    layer.once('loaderror', () => {
      _callbacks.onVfxiraStatus?.('error', 'VF Xira: erro');
      if (attempt < RETRY_DELAYS.length) setTimeout(() => loadVfxira(attempt + 1), RETRY_DELAYS[attempt]);
    });
    _vfxiraReady = true;
  } catch (e) {
    console.error('VF Xira error:', e);
    _callbacks.onVfxiraStatus?.('error', 'VF Xira: indispon\u00edvel');
    if (attempt < RETRY_DELAYS.length) setTimeout(() => loadVfxira(attempt + 1), RETRY_DELAYS[attempt]);
  }
}

// ── Mafra layer loader ───────────────────────────────────────

function getMafraStyle(props) {
  const cat = props.Categoria || '';
  const cfg = MAFRA_COLORS[cat];
  if (cfg) return makeStyle(cfg.fill);
  return makeStyle('#adb5bd');
}

async function fetchMafraFeatures() {
  const res = await fetch(MAFRA_WFS, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.features || [];
}

async function loadMafra(attempt = 0) {
  _callbacks.onMafraStatus?.('loading', 'Mafra\u2026');

  let features = null;

  // 1. Try cached file
  try {
    const res = await fetch('/data/mafra-zoning.geojson', { signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      const data = await res.json();
      const f = data.features || [];
      if (f.length > 0) features = f;
      else console.warn('[cache] mafra-zoning.geojson returned 0 features — falling back to live');
    } else {
      console.warn(`[cache] mafra-zoning.geojson \u2192 HTTP ${res.status} — falling back to live`);
    }
  } catch (e) {
    console.warn('[cache] mafra-zoning.geojson failed (' + e.message + ') — falling back to live');
  }

  // 2. Try DGT WFS live
  if (!features) {
    try {
      features = await fetchMafraFeatures();
      if (features.length > 0) {
        liveFallbackCount++;
        _callbacks.onFallback?.();
      } else {
        console.error('[live] Mafra WFS returned 0 features');
        features = null;
      }
    } catch (e) {
      console.error('[live] Mafra WFS failed:', e.message);
    }
  }

  if (!features || features.length === 0) {
    _callbacks.onMafraStatus?.('error', 'Mafra: erro');
    if (attempt < RETRY_DELAYS.length) {
      setTimeout(() => loadMafra(attempt + 1), RETRY_DELAYS[attempt]);
    }
    return;
  }

  L.geoJSON({ type: 'FeatureCollection', features }, {
    renderer: _renderer,
    style: f => getMafraStyle(f.properties),
    onEachFeature(feature, layer) {
      layer.on('click', e => {
        L.DomEvent.stopPropagation(e);
        const p   = feature.properties;
        const cat = p.Categoria || '';
        const cfg = MAFRA_COLORS[cat] || { fill: '#adb5bd', label: cat };
        const displayProps = {
          ...p,
          Descricao: p.Designacao_PlantaOrdenamento,
          area_ha:   p.Area_Ha,
        };
        _callbacks.onFeatureClick?.(displayProps, cfg, cat + (cfg.label ? ' \u2014 ' + cfg.label : ''));
      });
    },
  }).addTo(mafraLayer);

  _mafraReady = true;
  _callbacks.onMafraLoaded?.('ok', 'Mafra');
}

// ── Odivelas layer loader ─────────────────────────────────────
// AML pdm_revisao layer 8 — geometry blocked by server, tile rendering only.
// No scale restriction (minScale/maxScale both 0), no layerDefs needed (single-municipality layer).

function loadOdivelas(attempt = 0) {
  odivelaLayer.clearLayers();
  _callbacks.onOdivelasStatus?.('loading', 'Odivelas\u2026');
  try {
    const layer = L.esri.dynamicMapLayer({ url: CASCAIS_BASE, layers: [8], opacity: 0.55, maxZoom: 15 });
    layer.addTo(odivelaLayer);
    layer.once('load', () => {
      _odivelaReady = true;
      _callbacks.onOdivelasLoaded?.('ok', 'Odivelas');
    });
    layer.once('loaderror', () => {
      _callbacks.onOdivelasStatus?.('error', 'Odivelas: erro');
      if (attempt < RETRY_DELAYS.length) setTimeout(() => loadOdivelas(attempt + 1), RETRY_DELAYS[attempt]);
    });
    _odivelaReady = true;
  } catch (e) {
    console.error('Odivelas error:', e);
    _callbacks.onOdivelasStatus?.('error', 'Odivelas: indispon\u00edvel');
    if (attempt < RETRY_DELAYS.length) setTimeout(() => loadOdivelas(attempt + 1), RETRY_DELAYS[attempt]);
  }
}

// ── Alcochete layer loader ────────────────────────────────────
// AML PDM_I_GERACAO layer 2 — geometry blocked by server, tile rendering only.
// layerDefs filter required: layer 2 covers 18 AML municipalities.
// identifyFeatures must use 'all:2' (same quirk as Almada).

function loadAlcochete(attempt = 0) {
  alcocheteLayer.clearLayers();
  _callbacks.onAlcocheteStatus?.('loading', 'Alcochete\u2026');
  try {
    const layer = L.esri.dynamicMapLayer({ url: AML_PDM1_BASE, layers: [2], opacity: 0.55, maxZoom: 14, layerDefs: { 2: "Concelho = 'ALCOCHETE'" } });
    layer.addTo(alcocheteLayer);
    layer.once('load', () => {
      _alcocheteReady = true;
      _callbacks.onAlcocheteLoaded?.('ok', 'Alcochete');
    });
    layer.once('loaderror', () => {
      _callbacks.onAlcocheteStatus?.('error', 'Alcochete: erro');
      if (attempt < RETRY_DELAYS.length) setTimeout(() => loadAlcochete(attempt + 1), RETRY_DELAYS[attempt]);
    });
    _alcocheteReady = true;
  } catch (e) {
    console.error('Alcochete error:', e);
    _callbacks.onAlcocheteStatus?.('error', 'Alcochete: indispon\u00edvel');
    if (attempt < RETRY_DELAYS.length) setTimeout(() => loadAlcochete(attempt + 1), RETRY_DELAYS[attempt]);
  }
}

// ── Barreiro layer loader ─────────────────────────────────────
// AML PDM_I_GERACAO layer 2 — geometry blocked by server, tile rendering only.
// layerDefs filter required: layer 2 covers 18 AML municipalities.
// identifyFeatures must use 'all:2' (same quirk as Almada/Alcochete).
// DGT WFS (code 1504) exists but returns HTTP 502 — tile-only for now.

function loadBarreiro(attempt = 0) {
  barreiroLayer.clearLayers();
  _callbacks.onBarreiroStatus?.('loading', 'Barreiro\u2026');
  try {
    const layer = L.esri.dynamicMapLayer({ url: AML_PDM1_BASE, layers: [2], opacity: 0.55, maxZoom: 14, layerDefs: { 2: "Concelho = 'BARREIRO'" } });
    layer.addTo(barreiroLayer);
    layer.once('load', () => {
      _barreiroReady = true;
      _callbacks.onBarreiroLoaded?.('ok', 'Barreiro');
    });
    layer.once('loaderror', () => {
      _callbacks.onBarreiroStatus?.('error', 'Barreiro: erro');
      if (attempt < RETRY_DELAYS.length) setTimeout(() => loadBarreiro(attempt + 1), RETRY_DELAYS[attempt]);
    });
    _barreiroReady = true;
  } catch (e) {
    console.error('Barreiro error:', e);
    _callbacks.onBarreiroStatus?.('error', 'Barreiro: indispon\u00edvel');
    if (attempt < RETRY_DELAYS.length) setTimeout(() => loadBarreiro(attempt + 1), RETRY_DELAYS[attempt]);
  }
}

// ── Moita layer loader ────────────────────────────────────────
// AML pdm_revisao layer 4 — geometry blocked by server, tile rendering only.
// No scale restriction (minScale/maxScale both 0), no layerDefs needed (single-municipality layer).
// Field: Categoria (8 values). DGT WFS _1505_1 returns HTTP 500 — tile-only source.

function loadMoita(attempt = 0) {
  moitaLayer.clearLayers();
  _callbacks.onMoitaStatus?.('loading', 'Moita\u2026');
  try {
    const layer = L.esri.dynamicMapLayer({ url: CASCAIS_BASE, layers: [4], opacity: 0.55, maxZoom: 15 });
    layer.addTo(moitaLayer);
    layer.once('load', () => {
      _moitaReady = true;
      _callbacks.onMoitaLoaded?.('ok', 'Moita');
    });
    layer.once('loaderror', () => {
      _callbacks.onMoitaStatus?.('error', 'Moita: erro');
      if (attempt < RETRY_DELAYS.length) setTimeout(() => loadMoita(attempt + 1), RETRY_DELAYS[attempt]);
    });
    _moitaReady = true;
  } catch (e) {
    console.error('Moita error:', e);
    _callbacks.onMoitaStatus?.('error', 'Moita: indispon\u00edvel');
    if (attempt < RETRY_DELAYS.length) setTimeout(() => loadMoita(attempt + 1), RETRY_DELAYS[attempt]);
  }
}

// ── Montijo layer loader ──────────────────────────────────────
// DGT CRUS WFS (1507). 532 features, cache-first with WFS fallback.
// Categoria_2021 has 8 values; urban areas arrive as 'Não Atribuída' — style/click
// fall back to Classe_2021 ('Solo Urbano' / 'Solo Urbano (urbanizável – transitório)').
// Designacao_no_plano → Descricao in detail panel (original 1997 PDM category name).

function getMontijoStyle(props) {
  const cat = (props.Categoria_2021 || '').trim();
  if (cat && cat !== 'N\u00e3o Atribu\u00edda') {
    const cfg = MONTIJO_COLORS[cat];
    if (cfg) return makeStyle(cfg.fill);
  }
  const cls = (props.Classe_2021 || '').trim();
  const cfgCls = MONTIJO_COLORS[cls];
  if (cfgCls) return makeStyle(cfgCls.fill);
  return makeStyle('#adb5bd');
}

async function fetchMontijoFeatures() {
  const res = await fetch(MONTIJO_WFS, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.features || [];
}

async function loadMontijo(attempt = 0) {
  _callbacks.onMontijoStatus?.('loading', 'Montijo\u2026');

  let features = null;

  // 1. Try cached file
  try {
    const res = await fetch('/data/montijo-zoning.geojson', { signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      const data = await res.json();
      const f = data.features || [];
      if (f.length > 0) features = f;
      else console.warn('[cache] montijo-zoning.geojson returned 0 features \u2014 falling back to live');
    } else {
      console.warn(`[cache] montijo-zoning.geojson \u2192 HTTP ${res.status} \u2014 falling back to live`);
    }
  } catch (e) {
    console.warn('[cache] montijo-zoning.geojson failed (' + e.message + ') \u2014 falling back to live');
  }

  // 2. Try DGT WFS live
  if (!features) {
    try {
      features = await fetchMontijoFeatures();
      if (features.length > 0) {
        liveFallbackCount++;
        _callbacks.onFallback?.();
      } else {
        console.error('[live] Montijo WFS returned 0 features');
        features = null;
      }
    } catch (e) {
      console.error('[live] Montijo WFS failed:', e.message);
    }
  }

  if (!features || features.length === 0) {
    _callbacks.onMontijoStatus?.('error', 'Montijo: erro');
    if (attempt < RETRY_DELAYS.length) {
      setTimeout(() => loadMontijo(attempt + 1), RETRY_DELAYS[attempt]);
    }
    return;
  }

  L.geoJSON({ type: 'FeatureCollection', features }, {
    renderer: _renderer,
    style: f => getMontijoStyle(f.properties),
    onEachFeature(feature, layer) {
      layer.on('click', e => {
        L.DomEvent.stopPropagation(e);
        const p   = feature.properties;
        const cat = (p.Categoria_2021 || '').trim();
        const cls = (p.Classe_2021 || '').trim();
        const key = (cat && cat !== 'N\u00e3o Atribu\u00edda') ? cat : cls;
        const cfg = MONTIJO_COLORS[key] || { fill: '#adb5bd', label: key || 'N\u00e3o Atribu\u00edda' };
        const displayProps = {
          ...p,
          Descricao: p.Designacao_no_plano,
          area_ha:   p.AREA_HA,
        };
        _callbacks.onFeatureClick?.(displayProps, cfg, key + (cfg.label !== key ? ' \u2014 ' + cfg.label : ''));
      });
    },
  }).addTo(montijoLayer);

  _callbacks.onMontijoLoaded?.('ok', 'Montijo');
}

// ── Palmela layer loader ──────────────────────────────────────
// sig.cm-palmela.pt ArcGIS REST PMOTs/MapServer/17. 1097 features, cache-first.
// Field: tipo (43 values). design → Descricao in detail panel.
// Blank tipo (' ') = 'Compromissos' (approved plan overlays).

function getPalmelaStyle(props) {
  const tipo = (props.tipo || '').trim();
  const cfg = PALMELA_COLORS[tipo] || PALMELA_COLORS[' '];
  return makeStyle(cfg ? cfg.fill : '#adb5bd');
}

async function fetchPalmelaFeatures() {
  const url = `${PALMELA_BASE}/17/query?where=1%3D1&outFields=tipo%2Cdesign&outSR=4326&f=geojson`;
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.features || [];
}

async function loadPalmela(attempt = 0) {
  _callbacks.onPalmelaStatus?.('loading', 'Palmela\u2026');

  let features = null;

  // 1. Try cached file
  try {
    const res = await fetch('/data/palmela-zoning.geojson', { signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      const data = await res.json();
      const f = data.features || [];
      if (f.length > 0) features = f;
      else console.warn('[cache] palmela-zoning.geojson returned 0 features \u2014 falling back to live');
    } else {
      console.warn(`[cache] palmela-zoning.geojson \u2192 HTTP ${res.status} \u2014 falling back to live`);
    }
  } catch (e) {
    console.warn('[cache] palmela-zoning.geojson failed (' + e.message + ') \u2014 falling back to live');
  }

  // 2. Try live ArcGIS REST
  if (!features) {
    try {
      features = await fetchPalmelaFeatures();
      if (features.length > 0) {
        liveFallbackCount++;
        _callbacks.onFallback?.();
      } else {
        console.error('[live] Palmela ArcGIS returned 0 features');
        features = null;
      }
    } catch (e) {
      console.error('[live] Palmela ArcGIS failed:', e.message);
    }
  }

  if (!features || features.length === 0) {
    _callbacks.onPalmelaStatus?.('error', 'Palmela: erro');
    if (attempt < RETRY_DELAYS.length) {
      setTimeout(() => loadPalmela(attempt + 1), RETRY_DELAYS[attempt]);
    }
    return;
  }

  L.geoJSON({ type: 'FeatureCollection', features }, {
    renderer: _renderer,
    style: f => getPalmelaStyle(f.properties),
    onEachFeature(feature, layer) {
      layer.on('click', e => {
        L.DomEvent.stopPropagation(e);
        const p    = feature.properties;
        const tipo = (p.tipo || '').trim();
        const cfg  = PALMELA_COLORS[tipo] || { fill: '#adb5bd', label: tipo || 'Desconhecido' };
        const displayProps = {
          ...p,
          Descricao: p.design,
        };
        _callbacks.onFeatureClick?.(displayProps, cfg, tipo + (cfg.label !== tipo ? ' \u2014 ' + cfg.label : ''));
      });
    },
  }).addTo(palmelaLayer);

  _palmelaReady = true;
  _callbacks.onPalmelaLoaded?.('ok', 'Palmela');
}

// ── Seixal layer loader ───────────────────────────────────────
// sig.cm-seixal.pt hosted FeatureServer/27. 903 features, cache-first.
// Field: designacao (9 values, requires .trim() — trailing spaces/newlines in source data).
// layer field → Descricao in detail panel.

function getSeixalStyle(props) {
  const des = (props.designacao || '').trim();
  const cfg = SEIXAL_COLORS[des];
  return makeStyle(cfg ? cfg.fill : '#adb5bd');
}

async function fetchSeixalFeatures() {
  const url = `${SEIXAL_BASE}/27/query?where=1%3D1&outFields=*&outSR=4326&f=geojson`;
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.features || [];
}

async function loadSeixal(attempt = 0) {
  _callbacks.onSeixalStatus?.('loading', 'Seixal\u2026');

  let features = null;

  // 1. Try cached file
  try {
    const res = await fetch('/data/seixal-zoning.geojson', { signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      const data = await res.json();
      const f = data.features || [];
      if (f.length > 0) features = f;
      else console.warn('[cache] seixal-zoning.geojson returned 0 features \u2014 falling back to live');
    } else {
      console.warn(`[cache] seixal-zoning.geojson \u2192 HTTP ${res.status} \u2014 falling back to live`);
    }
  } catch (e) {
    console.warn('[cache] seixal-zoning.geojson failed (' + e.message + ') \u2014 falling back to live');
  }

  // 2. Try live ArcGIS FeatureServer
  if (!features) {
    try {
      features = await fetchSeixalFeatures();
      if (features.length > 0) {
        liveFallbackCount++;
        _callbacks.onFallback?.();
      } else {
        console.error('[live] Seixal FeatureServer returned 0 features');
        features = null;
      }
    } catch (e) {
      console.error('[live] Seixal FeatureServer failed:', e.message);
    }
  }

  if (!features || features.length === 0) {
    _callbacks.onSeixalStatus?.('error', 'Seixal: erro');
    if (attempt < RETRY_DELAYS.length) {
      setTimeout(() => loadSeixal(attempt + 1), RETRY_DELAYS[attempt]);
    }
    return;
  }

  L.geoJSON({ type: 'FeatureCollection', features }, {
    renderer: _renderer,
    style: f => getSeixalStyle(f.properties),
    onEachFeature(feature, layer) {
      layer.on('click', e => {
        L.DomEvent.stopPropagation(e);
        const p   = feature.properties;
        const des = (p.designacao || '').trim();
        const cfg = SEIXAL_COLORS[des] || { fill: '#adb5bd', label: des || 'Desconhecido' };
        const displayProps = {
          ...p,
          Descricao: p.layer,
          area_ha:   p.area_ha,
        };
        _callbacks.onFeatureClick?.(displayProps, cfg, des + (cfg.label !== des ? ' \u2014 ' + cfg.label : ''));
      });
    },
  }).addTo(seixalLayer);

  _seixalReady = true;
  _callbacks.onSeixalLoaded?.('ok', 'Seixal');
}

// ── Sesimbra layer loader ──────────────────────────────────────
// DGT CRUS WFS SDISNITWFSCRUS_1511_1. 126 features, cache-first.
// Categoria_2021 (after trim) → SESIMBRA_COLORS; fallback to Classe_2021 for 'Não Atribuída'.
let _sesimbraReady = false;

function getSesimbraStyle(props) {
  const cat = (props.Categoria_2021 || '').trim();
  if (cat && cat !== 'N\u00e3o Atribu\u00edda') {
    const cfg = SESIMBRA_COLORS[cat];
    if (cfg) return makeStyle(cfg.fill);
  }
  const cls = (props.Classe_2021 || '').trim();
  const cfgCls = SESIMBRA_COLORS[cls];
  if (cfgCls) return makeStyle(cfgCls.fill);
  return makeStyle('#adb5bd');
}

async function fetchSesimbraFeatures() {
  const res = await fetch(SESIMBRA_WFS, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.features || [];
}

async function loadSesimbra(attempt = 0) {
  _callbacks.onSesimbraStatus?.('loading', 'Sesimbra\u2026');

  let features = null;

  // 1. Try cached file
  try {
    const res = await fetch('/data/sesimbra-zoning.geojson', { signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      const data = await res.json();
      const f = data.features || [];
      if (f.length > 0) features = f;
      else console.warn('[cache] sesimbra-zoning.geojson returned 0 features \u2014 falling back to live');
    } else {
      console.warn(`[cache] sesimbra-zoning.geojson \u2192 HTTP ${res.status} \u2014 falling back to live`);
    }
  } catch (e) {
    console.warn('[cache] sesimbra-zoning.geojson failed (' + e.message + ') \u2014 falling back to live');
  }

  // 2. Try DGT WFS live
  if (!features) {
    try {
      features = await fetchSesimbraFeatures();
      if (features.length > 0) {
        liveFallbackCount++;
        _callbacks.onFallback?.();
      } else {
        console.error('[live] Sesimbra WFS returned 0 features');
        features = null;
      }
    } catch (e) {
      console.error('[live] Sesimbra WFS failed:', e.message);
    }
  }

  if (!features || features.length === 0) {
    _callbacks.onSesimbraStatus?.('error', 'Sesimbra: erro');
    if (attempt < RETRY_DELAYS.length) {
      setTimeout(() => loadSesimbra(attempt + 1), RETRY_DELAYS[attempt]);
    }
    return;
  }

  L.geoJSON({ type: 'FeatureCollection', features }, {
    renderer: _renderer,
    style: f => getSesimbraStyle(f.properties),
    onEachFeature(feature, layer) {
      layer.on('click', e => {
        L.DomEvent.stopPropagation(e);
        const p   = feature.properties;
        const cat = (p.Categoria_2021 || '').trim();
        const cls = (p.Classe_2021 || '').trim();
        const key = (cat && cat !== 'N\u00e3o Atribu\u00edda') ? cat : cls;
        const cfg = SESIMBRA_COLORS[key] || { fill: '#adb5bd', label: key || 'N\u00e3o Atribu\u00edda' };
        const displayProps = {
          ...p,
          Descricao: p.Designacao_no_plano,
          area_ha:   p.AREA_HA,
        };
        _callbacks.onFeatureClick?.(displayProps, cfg, key + (cfg.label !== key ? ' \u2014 ' + cfg.label : ''));
      });
    },
  }).addTo(sesimbraLayer);

  _sesimbraReady = true;
  _callbacks.onSesimbraLoaded?.('ok', 'Sesimbra');
}

// ── Setúbal layer loader ──────────────────────────────────────
// DGT CRUS WFS SDISNITWFSCRUS_1512_1. 792 features, cache-first.
// Categoria (17 values) → SETUBAL_COLORS. No 'Não Atribuída' fallback needed.
let _setubalReady = false;

function getSetubalStyle(props) {
  const cat = props.Categoria || '';
  const cfg = SETUBAL_COLORS[cat];
  return makeStyle(cfg ? cfg.fill : '#adb5bd');
}

async function fetchSetubalFeatures() {
  const res = await fetch(SETUBAL_WFS, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.features || [];
}

async function loadSetubal(attempt = 0) {
  _callbacks.onSetubalStatus?.('loading', 'Set\u00fabal\u2026');

  let features = null;

  // 1. Try cached file
  try {
    const res = await fetch('/data/setubal-zoning.geojson', { signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      const data = await res.json();
      const f = data.features || [];
      if (f.length > 0) features = f;
      else console.warn('[cache] setubal-zoning.geojson returned 0 features \u2014 falling back to live');
    } else {
      console.warn(`[cache] setubal-zoning.geojson \u2192 HTTP ${res.status} \u2014 falling back to live`);
    }
  } catch (e) {
    console.warn('[cache] setubal-zoning.geojson failed (' + e.message + ') \u2014 falling back to live');
  }

  // 2. Try DGT WFS live
  if (!features) {
    try {
      features = await fetchSetubalFeatures();
      if (features.length > 0) {
        liveFallbackCount++;
        _callbacks.onFallback?.();
      } else {
        console.error('[live] Set\u00fabal WFS returned 0 features');
        features = null;
      }
    } catch (e) {
      console.error('[live] Set\u00fabal WFS failed:', e.message);
    }
  }

  if (!features || features.length === 0) {
    _callbacks.onSetubalStatus?.('error', 'Set\u00fabal: erro');
    if (attempt < RETRY_DELAYS.length) {
      setTimeout(() => loadSetubal(attempt + 1), RETRY_DELAYS[attempt]);
    }
    return;
  }

  L.geoJSON({ type: 'FeatureCollection', features }, {
    renderer: _renderer,
    style: f => getSetubalStyle(f.properties),
    onEachFeature(feature, layer) {
      layer.on('click', e => {
        L.DomEvent.stopPropagation(e);
        const p   = feature.properties;
        const cat = p.Categoria || '';
        const cfg = SETUBAL_COLORS[cat] || { fill: '#adb5bd', label: cat || 'N\u00e3o Atribu\u00edda' };
        const displayProps = { ...p, Descricao: p.Designacao_PlantaOrdenamento || '' };
        _callbacks.onFeatureClick?.(displayProps, cfg, cat + (cfg.label !== cat ? ' \u2014 ' + cfg.label : ''));
      });
    },
  }).addTo(setubalLayer);

  _setubalReady = true;
  _callbacks.onSetubalLoaded?.('ok', 'Set\u00fabal');
}

// ── Overlay loader (exported — called from index.html on layer select) ──

export async function loadOverlay(id, activeMunicipality) {
  const def = OVERLAY_DEFS.find(d => d.id === id);
  const st  = ovlState[id];
  if (st.loaded)  { if (st.active) st.leafletLayer.addTo(_map); return; }
  if (st.loading) return;
  st.loading = true;
  const spin = document.getElementById('ovl-spin-' + id);
  if (spin) spin.style.display = '';
  try {
    const leafletLayer = L.layerGroup();

    if (def.categorized === 'wms') {
      // Standard OGC WMS tile layer — fails silently per-tile, no error surfaced to user
      const wmsLayer = L.tileLayer.wms(def.wmsUrl, {
        layers: def.wmsLayers,
        format: def.wmsFormat || 'image/png',
        transparent: true,
        opacity: def.opacity ?? 0.8,
        attribution: '',
      });
      wmsLayer.addTo(leafletLayer);
      st.leafletLayer = leafletLayer;
      st.loaded  = true;
      st.loading = false;
      if (spin) spin.style.display = 'none';
      if (st.active) {
        leafletLayer.addTo(_map);
        _callbacks.onOverlayStatus?.(id, 'ok', overlayShortName(def));
      }
      return;
    }

    if (def.categorized === 'fire') {
      // Server-rendered tiles — no GeoJSON download, no client lag
      const dynLayer = L.esri.dynamicMapLayer({ url: def.server, layers: [def.layerId], opacity: 0.65 });
      dynLayer.addTo(leafletLayer);
      st.leafletLayer = leafletLayer;
      if (st.active) leafletLayer.addTo(_map);
      dynLayer.once('load', () => {
        st.loaded = true; st.loading = false;
        if (spin) spin.style.display = 'none';
        if (st.active) _callbacks.onOverlayStatus?.(id, 'ok', overlayShortName(def));
      });
      dynLayer.on('loaderror', () => {
        st.loading = false;
        if (spin) spin.style.display = 'none';
        if (st.active) _callbacks.onOverlayStatus?.(id, 'error', overlayShortName(def) + ': erro');
      });
      return; // rest handled via events
    }

    // All other layers: GeoJSON rendered client-side (cache-first, live fallback).
    let cachedFile, fallbackUrl;
    if (def.sintraSource && def.cascaisSource) {
      // RAN: per-municipality source; Oeiras uses the same AML source as Cascais (layer 12)
      const isSintra = activeMunicipality === 'sintra';
      cachedFile  = isSintra ? def.sintraCachedFile : def.cascaisCachedFile;
      const src   = isSintra ? def.sintraSource     : def.cascaisSource;
      fallbackUrl = `${src.server}/${src.layerId}/query?where=1%3D1&outFields=*&outSR=4326&maxAllowableOffset=0.0001`;
    } else {
      cachedFile  = def.cachedFile;
      fallbackUrl = `${def.server}/${def.layerId}/query?where=1%3D1&outFields=*&outSR=4326&maxAllowableOffset=0.0001`;
    }
    let result = cachedFile ? _overlayDataCache[cachedFile] : null;
    if (!result) {
      result = await loadLayerData(cachedFile, fallbackUrl);
      if (result && cachedFile) _overlayDataCache[cachedFile] = result;
    }
    if (!result) throw new Error('Both cache and live failed');
    const allFeatures = result.features;
    L.geoJSON({ type: 'FeatureCollection', features: allFeatures }, {
      renderer: def.hatch ? _renderer : _overlayRenderer,
      style: () => makeOverlayStyle(def),
      filter: f => !!f.geometry,
      onEachFeature(feature, layer) {
        layer.on('click', e => {
          L.DomEvent.stopPropagation(e);
          _callbacks.onOverlayFeatureClick?.(def, feature.properties);
        });
      },
    }).addTo(leafletLayer);
    st.leafletLayer = leafletLayer;
    st.loaded  = true;
    st.loading = false;
    if (spin) spin.style.display = 'none';
    if (st.active) leafletLayer.addTo(_map);
    _callbacks.onOverlayStatus?.(id, 'ok', overlayShortName(def) + ' (' + allFeatures.length + ')');
  } catch (e) {
    console.error('Overlay error [' + id + ']:', e);
    st.loading = false;
    if (spin) spin.style.display = 'none';
    _callbacks.onOverlayStatus?.(id, 'error', overlayShortName(def) + ': erro');
    if (st.retries < RETRY_DELAYS.length) {
      const delay = RETRY_DELAYS[st.retries++];
      // Guard with st.active instead of activeLayer (activeLayer lives in index.html)
      setTimeout(() => { if (st.active && !st.loaded) loadOverlay(id, activeMunicipality); }, delay);
    }
  }
}

// ── initLayers ──────────────────────────────────────────────
// Sets up renderers, layer groups, overlay state, and kicks off
// base layer loading. Returns the layer groups and overlay state.
//
// callbacks: {
//   onFallback()                          — live fallback occurred
//   onSintraStatus(update)                — partial sintraStatus update
//   onCascaisStatus(state, text)          — transient chip state
//   onCascaisLoaded(state, text)          — permanent loaded state + triggers visibility
//   onOeirasStatus(state, text)           — transient chip state
//   onOeirasLoaded(state, text)           — permanent loaded state + triggers visibility
//   onLouresStatus(state, text)           — transient chip state
//   onLouresLoaded(state, text)           — permanent loaded state + triggers visibility
//   onAmadoraStatus(state, text)          — transient chip state
//   onAmadoraLoaded(state, text)          — permanent loaded state + triggers visibility
//   onAlmadaStatus(state, text)           — transient chip state
//   onAlmadaLoaded(state, text)           — permanent loaded state + triggers visibility
//   onVfxiraStatus(state, text)           — transient chip state (tile layer like Cascais)
//   onVfxiraLoaded(state, text)           — permanent loaded state + triggers visibility
//   onMafraStatus(state, text)            — transient chip state (GeoJSON like Lisboa)
//   onMafraLoaded(state, text)            — permanent loaded state + triggers visibility
//   onOverlayStatus(id, state, text)      — overlay chip update (guarded by id === activeLayer in caller)
//   onFeatureClick(props, cfg, label)     — open detail panel for GeoJSON polygon click
//   onOverlayFeatureClick(def, props)     — open detail panel for overlay polygon click
// }

export function initLayers(map, callbacks) {
  _map             = map;
  _callbacks       = callbacks;
  _renderer        = L.svg({ padding: 1 });
  _overlayRenderer = L.canvas({ padding: 0.5 });

  urbanLayer   = L.layerGroup().addTo(map);
  ruralLayer   = L.layerGroup().addTo(map);
  cascaisLayer = L.layerGroup().addTo(map);
  oeirasLayer  = L.layerGroup().addTo(map);
  louresLayer  = L.layerGroup().addTo(map);
  amadoraLayer = L.layerGroup().addTo(map);
  almadaLayer  = L.layerGroup().addTo(map);
  lisboaLayer  = L.layerGroup().addTo(map);
  vfxiraLayer   = L.layerGroup().addTo(map);
  mafraLayer    = L.layerGroup().addTo(map);
  odivelaLayer   = L.layerGroup().addTo(map);
  alcocheteLayer = L.layerGroup().addTo(map);
  barreiroLayer  = L.layerGroup().addTo(map);
  moitaLayer     = L.layerGroup().addTo(map);
  montijoLayer   = L.layerGroup().addTo(map);
  palmelaLayer   = L.layerGroup().addTo(map);
  seixalLayer    = L.layerGroup().addTo(map);
  sesimbraLayer  = L.layerGroup().addTo(map);
  setubalLayer   = L.layerGroup().addTo(map);

  for (const def of OVERLAY_DEFS) {
    ovlState[def.id] = { active: false, loaded: false, loading: false, leafletLayer: null, retries: 0 };
  }

  loadSintraUrban();
  loadSintraRural();
  loadCascais();
  loadOeiras();
  loadLoures();
  loadAmadora();
  loadAlmada();
  loadLisboa();
  loadVfxira();
  loadMafra();
  loadOdivelas();
  loadAlcochete();
  loadBarreiro();
  loadMoita();
  loadMontijo();
  loadPalmela();
  loadSeixal();
  loadSesimbra();
  loadSetubal();
}
