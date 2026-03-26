// ============================================================
// LAYERS — data loading, GeoJSON rendering, overlay management
// ============================================================

import {
  SINTRA_BASE, CASCAIS_BASE, CONDICIONANTES_BASE, AMADORA_WFS, AML_PDM1_BASE, LISBOA_WFS, MAFRA_WFS, ODIVELAS_WFS,
  OVERLAY_DEFS, URBAN_COLORS, RURAL_COLORS, AMADORA_COLORS, ALMADA_COLORS, LISBOA_COLORS, MAFRA_COLORS, ODIVELAS_COLORS, FIRE_COLORS, RETRY_DELAYS,
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

function getOdivelasStyle(props) {
  const cat = props.Categoria || '';
  const cfg = ODIVELAS_COLORS[cat];
  if (cfg) return makeStyle(cfg.fill);
  return makeStyle('#adb5bd');
}

async function fetchOdivelasFeatures() {
  const res = await fetch(ODIVELAS_WFS, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.features || [];
}

async function loadOdivelas(attempt = 0) {
  _callbacks.onOdivelasStatus?.('loading', 'Odivelas\u2026');

  let features = null;

  // 1. Try cached file
  try {
    const res = await fetch('/data/odivelas-zoning.geojson', { signal: AbortSignal.timeout(15000) });
    if (res.ok) {
      const data = await res.json();
      const f = data.features || [];
      if (f.length > 0) features = f;
      else console.warn('[cache] odivelas-zoning.geojson returned 0 features — falling back to live');
    } else {
      console.warn(`[cache] odivelas-zoning.geojson \u2192 HTTP ${res.status} — falling back to live`);
    }
  } catch (e) {
    console.warn('[cache] odivelas-zoning.geojson failed (' + e.message + ') — falling back to live');
  }

  // 2. Try DGT WFS live
  if (!features) {
    try {
      features = await fetchOdivelasFeatures();
      if (features.length > 0) {
        liveFallbackCount++;
        _callbacks.onFallback?.();
      } else {
        console.error('[live] Odivelas WFS returned 0 features');
        features = null;
      }
    } catch (e) {
      console.error('[live] Odivelas WFS failed:', e.message);
    }
  }

  if (!features || features.length === 0) {
    _callbacks.onOdivelasStatus?.('error', 'Odivelas: erro');
    if (attempt < RETRY_DELAYS.length) {
      setTimeout(() => loadOdivelas(attempt + 1), RETRY_DELAYS[attempt]);
    }
    return;
  }

  L.geoJSON({ type: 'FeatureCollection', features }, {
    renderer: _renderer,
    style: f => getOdivelasStyle(f.properties),
    onEachFeature(feature, layer) {
      layer.on('click', e => {
        L.DomEvent.stopPropagation(e);
        const p   = feature.properties;
        const cat = p.Categoria || '';
        const cfg = ODIVELAS_COLORS[cat] || { fill: '#adb5bd', label: cat };
        const displayProps = {
          ...p,
          Descricao: p.Designacao_PlantaOrdenamento,
          area_ha:   p.Area_Ha,
        };
        _callbacks.onFeatureClick?.(displayProps, cfg, cat + (cfg.label ? ' \u2014 ' + cfg.label : ''));
      });
    },
  }).addTo(odivelaLayer);

  _odivelaReady = true;
  _callbacks.onOdivelasLoaded?.('ok', 'Odivelas');
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
  odivelaLayer  = L.layerGroup().addTo(map);

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
}
