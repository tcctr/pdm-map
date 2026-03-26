// ============================================================
// MAP — Leaflet init, municipality switching, layer visibility
// ============================================================

import {
  MUNICIPALITIES, OVERLAY_DEFS, MIN_DATA_ZOOM,
  CASCAIS_BASE, CASCAIS_COLORS, OEIRAS_COLORS, LOURES_COLORS, CONDICIONANTES_BASE,
  AML_PDM1_BASE, ALMADA_COLORS, BARREIRO_COLORS, ALCOCHETE_COLORS, ODIVELAS_COLORS, VFX_COLORS, MOITA_COLORS,
} from './config.js';

// ── Module-level state ───────────────────────────────────────
let _map            = null;
let _baseLayer      = null;
let _ovlState       = null;
let _urbanLayer     = null;
let _ruralLayer     = null;
let _cascaisLayer   = null;
let _oeirasLayer    = null;
let _louresLayer    = null;
let _amadoraLayer   = null;
let _almadaLayer    = null;
let _lisboaLayer    = null;
let _vfxiraLayer    = null;
let _mafraLayer     = null;
let _odivelaLayer   = null;
let _alcocheteLayer = null;
let _barreiroLayer  = null;
let _moitaLayer     = null;
let _callbacks      = {};

let _activeLayer        = 'zoning';
let _activeMunicipality = 'sintra';

// ── Active-state getters / setters ───────────────────────────

export function getActiveLayer()        { return _activeLayer; }
export function setActiveLayer(v)       { _activeLayer = v; }
export function getActiveMunicipality() { return _activeMunicipality; }

// ── Map creation ─────────────────────────────────────────────
// Creates the Leaflet map, adds the base tile layer and attribution
// control. Returns the map instance for use by other modules.

export function initMap(containerId) {
  const map = L.map(containerId, {
    center: [38.75, -9.42],
    zoom: 13,
    zoomControl: false,
    attributionControl: false,
  });

  _baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map);

  _map = map;
  return map;
}

// ── Layer visibility ──────────────────────────────────────────

export function updateLayerVisibility() {
  _callbacks.onUpdateSintraChip?.();

  const zoomed = _map.getZoom() >= MIN_DATA_ZOOM;
  const isGL = _activeMunicipality === 'grande-lisboa';

  // Cascais tile layer
  const cascaisOn = _activeLayer === 'zoning' && (_activeMunicipality === 'cascais' || isGL);
  cascaisOn && zoomed ? _map.addLayer(_cascaisLayer) : _map.removeLayer(_cascaisLayer);

  // Oeiras tile layer
  const oeirasOn = _activeLayer === 'zoning' && (_activeMunicipality === 'oeiras' || isGL);
  oeirasOn && zoomed ? _map.addLayer(_oeirasLayer) : _map.removeLayer(_oeirasLayer);

  // Loures tile layer
  const louresOn = _activeLayer === 'zoning' && (_activeMunicipality === 'loures' || isGL);
  louresOn && zoomed ? _map.addLayer(_louresLayer) : _map.removeLayer(_louresLayer);

  // Amadora GeoJSON layer
  const amadoraOn = _activeLayer === 'zoning' && (_activeMunicipality === 'amadora' || isGL);
  amadoraOn && zoomed ? _map.addLayer(_amadoraLayer) : _map.removeLayer(_amadoraLayer);

  // chip-cascais
  const cascaisEl = document.getElementById('chip-cascais');
  if (cascaisEl) {
    cascaisEl.style.display = _activeMunicipality === 'cascais' ? '' : 'none';
    if (_activeMunicipality === 'cascais' && _activeLayer === 'zoning' && !cascaisEl.classList.contains('chip-loading')) {
      if (!zoomed) {
        _callbacks.onSetChip?.('chip-cascais', 'warn', 'Cascais: zoom');
      } else if (_map.getZoom() > 15) {
        _callbacks.onSetChip?.('chip-cascais', 'warn', 'Cascais: recuar zoom');
      } else {
        const s = _callbacks.onGetChipLoadedState?.('chip-cascais');
        if (s) _callbacks.onSetChip?.('chip-cascais', s.state, s.text);
      }
    }
  }

  // chip-oeiras
  const oeirasEl = document.getElementById('chip-oeiras');
  if (oeirasEl) {
    oeirasEl.style.display = _activeMunicipality === 'oeiras' ? '' : 'none';
    if (_activeMunicipality === 'oeiras' && _activeLayer === 'zoning' && !oeirasEl.classList.contains('chip-loading')) {
      if (!zoomed) {
        _callbacks.onSetChip?.('chip-oeiras', 'warn', 'Oeiras: zoom');
      } else if (_map.getZoom() > 15) {
        _callbacks.onSetChip?.('chip-oeiras', 'warn', 'Oeiras: recuar zoom');
      } else {
        const s = _callbacks.onGetChipLoadedState?.('chip-oeiras');
        if (s) _callbacks.onSetChip?.('chip-oeiras', s.state, s.text);
      }
    }
  }

  // chip-loures
  const louresEl = document.getElementById('chip-loures');
  if (louresEl) {
    louresEl.style.display = _activeMunicipality === 'loures' ? '' : 'none';
    if (_activeMunicipality === 'loures' && _activeLayer === 'zoning' && !louresEl.classList.contains('chip-loading')) {
      if (!zoomed) {
        _callbacks.onSetChip?.('chip-loures', 'warn', 'Loures: zoom');
      } else if (_map.getZoom() > 15) {
        _callbacks.onSetChip?.('chip-loures', 'warn', 'Loures: recuar zoom');
      } else {
        const s = _callbacks.onGetChipLoadedState?.('chip-loures');
        if (s) _callbacks.onSetChip?.('chip-loures', s.state, s.text);
      }
    }
  }

  // chip-amadora (GeoJSON layer — no maxZoom cap)
  const amadoraEl = document.getElementById('chip-amadora');
  if (amadoraEl) {
    amadoraEl.style.display = _activeMunicipality === 'amadora' ? '' : 'none';
    if (_activeMunicipality === 'amadora' && _activeLayer === 'zoning' && !amadoraEl.classList.contains('chip-loading')) {
      if (!zoomed) {
        _callbacks.onSetChip?.('chip-amadora', 'warn', 'Amadora: zoom');
      } else {
        const s = _callbacks.onGetChipLoadedState?.('chip-amadora');
        if (s) _callbacks.onSetChip?.('chip-amadora', s.state, s.text);
      }
    }
  }

  // Almada tile layer (maxScale:25000 — tiles go blank above zoom 14)
  const almadaOn = _activeLayer === 'zoning' && (_activeMunicipality === 'almada' || isGL);
  almadaOn && zoomed ? _map.addLayer(_almadaLayer) : _map.removeLayer(_almadaLayer);

  // chip-almada (tile layer — blank tiles above zoom 14, same pattern as Cascais)
  const almadaEl = document.getElementById('chip-almada');
  if (almadaEl) {
    almadaEl.style.display = _activeMunicipality === 'almada' ? '' : 'none';
    if (_activeMunicipality === 'almada' && _activeLayer === 'zoning' && !almadaEl.classList.contains('chip-loading')) {
      if (!zoomed) {
        _callbacks.onSetChip?.('chip-almada', 'warn', 'Almada: zoom');
      } else if (_map.getZoom() > 14) {
        _callbacks.onSetChip?.('chip-almada', 'warn', 'Almada: recuar zoom');
      } else {
        const s = _callbacks.onGetChipLoadedState?.('chip-almada');
        if (s) _callbacks.onSetChip?.('chip-almada', s.state, s.text);
      }
    }
  }

  // Lisboa GeoJSON layer
  const lisboaOn = _activeLayer === 'zoning' && (_activeMunicipality === 'lisboa' || isGL);
  lisboaOn && zoomed ? _map.addLayer(_lisboaLayer) : _map.removeLayer(_lisboaLayer);

  // chip-lisboa (GeoJSON layer — no maxZoom cap)
  const lisboaEl = document.getElementById('chip-lisboa');
  if (lisboaEl) {
    lisboaEl.style.display = _activeMunicipality === 'lisboa' ? '' : 'none';
    if (_activeMunicipality === 'lisboa' && _activeLayer === 'zoning' && !lisboaEl.classList.contains('chip-loading')) {
      if (!zoomed) {
        _callbacks.onSetChip?.('chip-lisboa', 'warn', 'Lisboa: zoom');
      } else {
        const s = _callbacks.onGetChipLoadedState?.('chip-lisboa');
        if (s) _callbacks.onSetChip?.('chip-lisboa', s.state, s.text);
      }
    }
  }

  // Vila Franca de Xira GeoJSON layer
  const vfxiraOn = _activeLayer === 'zoning' && (_activeMunicipality === 'vfxira' || isGL);
  vfxiraOn && zoomed ? _map.addLayer(_vfxiraLayer) : _map.removeLayer(_vfxiraLayer);

  // chip-vfxira (tile layer — maxZoom:15, same pattern as Cascais/Oeiras/Loures)
  const vfxiraEl = document.getElementById('chip-vfxira');
  if (vfxiraEl) {
    vfxiraEl.style.display = _activeMunicipality === 'vfxira' ? '' : 'none';
    if (_activeMunicipality === 'vfxira' && _activeLayer === 'zoning' && !vfxiraEl.classList.contains('chip-loading')) {
      if (!zoomed) {
        _callbacks.onSetChip?.('chip-vfxira', 'warn', 'VF Xira: zoom');
      } else if (_map.getZoom() > 15) {
        _callbacks.onSetChip?.('chip-vfxira', 'warn', 'VF Xira: recuar zoom');
      } else {
        const s = _callbacks.onGetChipLoadedState?.('chip-vfxira');
        if (s) _callbacks.onSetChip?.('chip-vfxira', s.state, s.text);
      }
    }
  }

  // Mafra GeoJSON layer
  const mafraOn = _activeLayer === 'zoning' && (_activeMunicipality === 'mafra' || isGL);
  mafraOn && zoomed ? _map.addLayer(_mafraLayer) : _map.removeLayer(_mafraLayer);

  // chip-mafra (GeoJSON layer — no maxZoom cap)
  const mafraEl = document.getElementById('chip-mafra');
  if (mafraEl) {
    mafraEl.style.display = _activeMunicipality === 'mafra' ? '' : 'none';
    if (_activeMunicipality === 'mafra' && _activeLayer === 'zoning' && !mafraEl.classList.contains('chip-loading')) {
      if (!zoomed) {
        _callbacks.onSetChip?.('chip-mafra', 'warn', 'Mafra: zoom');
      } else {
        const s = _callbacks.onGetChipLoadedState?.('chip-mafra');
        if (s) _callbacks.onSetChip?.('chip-mafra', s.state, s.text);
      }
    }
  }

  // Odivelas tile layer (AML pdm_revisao layer 8 — no scale restriction)
  const odivelaOn = _activeLayer === 'zoning' && (_activeMunicipality === 'odivelas' || isGL);
  odivelaOn && zoomed ? _map.addLayer(_odivelaLayer) : _map.removeLayer(_odivelaLayer);

  // chip-odivelas (tile layer — pdm_revisao has no server maxScale, but maxZoom:15 used defensively)
  const odivelaEl = document.getElementById('chip-odivelas');
  if (odivelaEl) {
    odivelaEl.style.display = _activeMunicipality === 'odivelas' ? '' : 'none';
    if (_activeMunicipality === 'odivelas' && _activeLayer === 'zoning' && !odivelaEl.classList.contains('chip-loading')) {
      if (!zoomed) {
        _callbacks.onSetChip?.('chip-odivelas', 'warn', 'Odivelas: zoom');
      } else if (_map.getZoom() > 15) {
        _callbacks.onSetChip?.('chip-odivelas', 'warn', 'Odivelas: recuar zoom');
      } else {
        const s = _callbacks.onGetChipLoadedState?.('chip-odivelas');
        if (s) _callbacks.onSetChip?.('chip-odivelas', s.state, s.text);
      }
    }
  }

  // Alcochete tile layer (maxScale:25000 — tiles go blank above zoom 14, same as Almada)
  const alcocheteOn = _activeLayer === 'zoning' && (_activeMunicipality === 'alcochete' || isGL);
  alcocheteOn && zoomed ? _map.addLayer(_alcocheteLayer) : _map.removeLayer(_alcocheteLayer);

  // chip-alcochete (tile layer — blank tiles above zoom 14, same pattern as Almada)
  const alcocheteEl = document.getElementById('chip-alcochete');
  if (alcocheteEl) {
    alcocheteEl.style.display = _activeMunicipality === 'alcochete' ? '' : 'none';
    if (_activeMunicipality === 'alcochete' && _activeLayer === 'zoning' && !alcocheteEl.classList.contains('chip-loading')) {
      if (!zoomed) {
        _callbacks.onSetChip?.('chip-alcochete', 'warn', 'Alcochete: zoom');
      } else if (_map.getZoom() > 14) {
        _callbacks.onSetChip?.('chip-alcochete', 'warn', 'Alcochete: recuar zoom');
      } else {
        const s = _callbacks.onGetChipLoadedState?.('chip-alcochete');
        if (s) _callbacks.onSetChip?.('chip-alcochete', s.state, s.text);
      }
    }
  }

  // Barreiro tile layer (maxScale:25000 — tiles go blank above zoom 14, same as Almada/Alcochete)
  const barreiroOn = _activeLayer === 'zoning' && (_activeMunicipality === 'barreiro' || isGL);
  barreiroOn && zoomed ? _map.addLayer(_barreiroLayer) : _map.removeLayer(_barreiroLayer);

  // chip-barreiro (tile layer — blank tiles above zoom 14, same pattern as Almada/Alcochete)
  const barreiroEl = document.getElementById('chip-barreiro');
  if (barreiroEl) {
    barreiroEl.style.display = _activeMunicipality === 'barreiro' ? '' : 'none';
    if (_activeMunicipality === 'barreiro' && _activeLayer === 'zoning' && !barreiroEl.classList.contains('chip-loading')) {
      if (!zoomed) {
        _callbacks.onSetChip?.('chip-barreiro', 'warn', 'Barreiro: zoom');
      } else if (_map.getZoom() > 14) {
        _callbacks.onSetChip?.('chip-barreiro', 'warn', 'Barreiro: recuar zoom');
      } else {
        const s = _callbacks.onGetChipLoadedState?.('chip-barreiro');
        if (s) _callbacks.onSetChip?.('chip-barreiro', s.state, s.text);
      }
    }
  }

  // Moita tile layer (AML pdm_revisao layer 4 — no scale restriction, same as Odivelas)
  const moitaOn = _activeLayer === 'zoning' && (_activeMunicipality === 'moita' || isGL);
  moitaOn && zoomed ? _map.addLayer(_moitaLayer) : _map.removeLayer(_moitaLayer);

  // chip-moita (tile layer — no server maxScale, but maxZoom:15 used defensively)
  const moitaEl = document.getElementById('chip-moita');
  if (moitaEl) {
    moitaEl.style.display = _activeMunicipality === 'moita' ? '' : 'none';
    if (_activeMunicipality === 'moita' && _activeLayer === 'zoning' && !moitaEl.classList.contains('chip-loading')) {
      if (!zoomed) {
        _callbacks.onSetChip?.('chip-moita', 'warn', 'Moita: zoom');
      } else if (_map.getZoom() > 15) {
        _callbacks.onSetChip?.('chip-moita', 'warn', 'Moita: recuar zoom');
      } else {
        const s = _callbacks.onGetChipLoadedState?.('chip-moita');
        if (s) _callbacks.onSetChip?.('chip-moita', s.state, s.text);
      }
    }
  }

  // chip-grande-lisboa — single chip replaces all individual chips when region view is active
  const glEl = document.getElementById('chip-grande-lisboa');
  if (glEl) {
    glEl.style.display = isGL ? '' : 'none';
    if (isGL) _callbacks.onSetChip?.('chip-grande-lisboa', 'ok', 'Grande Lisboa');
  }
}

// ── Municipality switching ────────────────────────────────────

export function selectMunicipality(muni) {
  _activeMunicipality = muni;

  const cfg = MUNICIPALITIES.find(m => m.id === muni);
  document.getElementById('muni-picker-label').textContent = cfg ? cfg.label : muni;
  document.querySelectorAll('.muni-option').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.muni === muni);
  });

  // Reset to zoning and clear all overlay cache
  _activeLayer = 'zoning';
  for (const def of OVERLAY_DEFS) {
    const st = _ovlState[def.id];
    if (st.leafletLayer) { _map.removeLayer(st.leafletLayer); st.leafletLayer = null; }
    st.loaded = false; st.loading = false; st.active = false; st.retries = 0;
  }

  _callbacks.onBuildOverlayPanel?.();
  updateLayerVisibility();
  _callbacks.onUpdateLayersBtnLabel?.('zoning');
  _callbacks.onUpdateZoningOverlayChip?.();
}

// ── Active layer selection ────────────────────────────────────

export function handleLayerSelect(value) {
  _activeLayer = value;
  _callbacks.onUpdateLayersBtnLabel?.(value);
  setTimeout(() => _callbacks.onCloseLayersSheet?.(), 180);

  if (value === 'zoning') {
    _callbacks.onUpdateZoningOverlayChip?.();
    for (const def of OVERLAY_DEFS) {
      _ovlState[def.id].active = false;
      if (_ovlState[def.id].leafletLayer) _map.removeLayer(_ovlState[def.id].leafletLayer);
    }
    updateLayerVisibility();
  } else if (value === 'none') {
    [_urbanLayer, _ruralLayer, _cascaisLayer, _oeirasLayer, _louresLayer, _amadoraLayer, _almadaLayer, _barreiroLayer, _lisboaLayer, _vfxiraLayer, _mafraLayer, _odivelaLayer, _alcocheteLayer, _moitaLayer].forEach(l => _map.removeLayer(l));
    for (const def of OVERLAY_DEFS) {
      _ovlState[def.id].active = false;
      if (_ovlState[def.id].leafletLayer) _map.removeLayer(_ovlState[def.id].leafletLayer);
    }
    _callbacks.onUpdateZoningOverlayChip?.();
  } else {
    [_urbanLayer, _ruralLayer, _cascaisLayer, _oeirasLayer, _louresLayer, _amadoraLayer, _almadaLayer, _barreiroLayer, _lisboaLayer, _vfxiraLayer, _mafraLayer, _odivelaLayer, _alcocheteLayer, _moitaLayer].forEach(l => _map.removeLayer(l));
    const def = OVERLAY_DEFS.find(d => d.id === value);
    _callbacks.onSetOverlayChip?.('loading', _callbacks.onOverlayShortName?.(def) + '\u2026');
    for (const def of OVERLAY_DEFS) {
      if (def.id === value) {
        _ovlState[def.id].active = true;
        _callbacks.onLoadOverlay?.(def.id, _activeMunicipality);
      } else {
        _ovlState[def.id].active = false;
        if (_ovlState[def.id].leafletLayer) _map.removeLayer(_ovlState[def.id].leafletLayer);
      }
    }
  }
}

// ── Basemap toggle ────────────────────────────────────────────

export function initBasemapToggle(map) {
  const satelliteLayer = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 19, attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics' },
  );

  // SVG icon shown when on satellite (click → switch to street map)
  const iconMap = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
    <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
  </svg>`;

  // SVG icon shown when on street (click → switch to satellite): globe
  const iconSatellite = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
    <path d="M2 12h20"/>
  </svg>`;

  // Start on satellite by default
  map.removeLayer(_baseLayer);
  satelliteLayer.addTo(map);
  let isSatellite = true;

  const btn = document.getElementById('basemap-btn');
  btn.innerHTML = iconMap;

  btn.addEventListener('click', () => {
    if (isSatellite) {
      map.removeLayer(satelliteLayer);
      _baseLayer.addTo(map);
      isSatellite = false;
      btn.innerHTML = iconSatellite;
    } else {
      map.removeLayer(_baseLayer);
      satelliteLayer.addTo(map);
      isSatellite = true;
      btn.innerHTML = iconMap;
    }
  });
}

// ── initMapHandlers ───────────────────────────────────────────
// Call after initMap, initLayers, and initUI — stores layer deps and
// UI callbacks, then wires zoom and click listeners onto the map.
//
// options: {
//   ovlState                   — shared overlay state object (from layers.js)
//   urbanLayer                 — L.layerGroup for Sintra urban
//   ruralLayer                 — L.layerGroup for Sintra rural
//   cascaisLayer               — L.layerGroup for Cascais tiles
//   overlayShortName(def)      — returns short display name (from layers.js)
//   loadOverlay(id, muni)      — lazy-loads an overlay (from layers.js)
//   getCascaisReady()          — returns bool (from layers.js)
//   onUpdateSintraChip()       — updates Sintra chip + layer visibility
//   onSetChip(id, state, text) — sets a status chip
//   onGetChipLoadedState(id)   — returns saved chip state
//   onSetOverlayChip(s, text)  — updates Solo overlay chip
//   onCloseDetail()            — closes detail panel
//   onShowDetail(p, cfg, lbl)  — opens detail panel
//   onShowOverlayDetail(d, p)  — opens overlay detail panel
//   onBuildOverlayPanel()      — rebuilds overlay radio list
//   onUpdateLayersBtnLabel(v)  — updates layers button label
//   onCloseLayersSheet()       — closes layers popup
//   onUpdateZoningOverlayChip()— updates Solo chip for zoning mode
// }

export function initMapHandlers({
  ovlState,
  urbanLayer, ruralLayer, cascaisLayer, oeirasLayer, louresLayer, amadoraLayer, almadaLayer, barreiroLayer, lisboaLayer, vfxiraLayer, mafraLayer, odivelaLayer, alcocheteLayer, moitaLayer,
  overlayShortName, loadOverlay, getCascaisReady, getOeirasReady, getLouresReady, getAlmadaReady, getBarreiroReady, getAlcocheteReady, getOdivelasReady, getVfxiraReady, getMoitaReady,
  onUpdateSintraChip, onSetChip, onGetChipLoadedState,
  onSetOverlayChip, onCloseDetail, onShowDetail, onShowOverlayDetail,
  onBuildOverlayPanel, onUpdateLayersBtnLabel, onCloseLayersSheet,
  onUpdateZoningOverlayChip,
}) {
  _ovlState     = ovlState;
  _urbanLayer   = urbanLayer;
  _ruralLayer   = ruralLayer;
  _cascaisLayer = cascaisLayer;
  _oeirasLayer  = oeirasLayer;
  _louresLayer  = louresLayer;
  _amadoraLayer = amadoraLayer;
  _almadaLayer  = almadaLayer;
  _barreiroLayer = barreiroLayer;
  _lisboaLayer  = lisboaLayer;
  _vfxiraLayer  = vfxiraLayer;
  _mafraLayer    = mafraLayer;
  _odivelaLayer  = odivelaLayer;
  _alcocheteLayer = alcocheteLayer;
  _moitaLayer     = moitaLayer;
  _callbacks = {
    onUpdateSintraChip,
    onSetChip,
    onGetChipLoadedState,
    onSetOverlayChip,
    onCloseDetail,
    onShowDetail,
    onShowOverlayDetail,
    onBuildOverlayPanel,
    onUpdateLayersBtnLabel,
    onCloseLayersSheet,
    onUpdateZoningOverlayChip,
    onOverlayShortName:  overlayShortName,
    onLoadOverlay:       loadOverlay,
    onGetCascaisReady:   getCascaisReady,
    onGetOeirasReady:    getOeirasReady,
    onGetLouresReady:    getLouresReady,
    onGetAlmadaReady:    getAlmadaReady,
    onGetBarreiroReady:  getBarreiroReady,
    onGetAlcocheteReady: getAlcocheteReady,
    onGetOdivelasReady:  getOdivelasReady,
    onGetVfxiraReady:    getVfxiraReady,
    onGetMoitaReady:     getMoitaReady,
  };

  _map.on('zoomend', updateLayerVisibility);

  _map.on('click', e => {
    _callbacks.onCloseDetail?.();
    if (_activeLayer === 'zoning' && _activeMunicipality === 'grande-lisboa') {
      // Fire all tile identify queries in parallel; show first non-empty result
      let shown = false;
      const show = (p, cfg, key) => { if (!shown) { shown = true; _callbacks.onShowDetail?.(p, cfg, key); } };
      // CASCAIS_BASE layers
      const cascaisQueries = [
        { layer: _cascaisLayer,  spec: 'visible:2',  colors: CASCAIS_COLORS,  field: 'Categoria' },
        { layer: _oeirasLayer,   spec: 'visible:3',  colors: OEIRAS_COLORS,   field: 'Categoria' },
        { layer: _moitaLayer,    spec: 'visible:4',  colors: MOITA_COLORS,    field: 'Categoria' },
        { layer: _louresLayer,   spec: 'visible:6',  colors: LOURES_COLORS,   field: 'Categoria' },
        { layer: _odivelaLayer,  spec: 'visible:8',  colors: ODIVELAS_COLORS, field: 'Categoria' },
        { layer: _vfxiraLayer,   spec: 'visible:10', colors: VFX_COLORS,      field: 'Classe'    },
      ];
      cascaisQueries.forEach(({ layer, spec, colors, field }) => {
        if (!_map.hasLayer(layer)) return;
        L.esri.identifyFeatures({ url: CASCAIS_BASE })
          .on(_map).at(e.latlng).layers(spec).tolerance(2)
          .run((err, fc) => {
            if (err || !fc || !fc.features.length) return;
            const p = fc.features[0].properties;
            const key = p[field] || '';
            show(p, colors[key] || { fill: '#888888', label: key }, key);
          });
      });
      // AML_PDM1_BASE layer 2 — Almada, Barreiro, Alcochete (identical color maps)
      if (_map.hasLayer(_almadaLayer) || _map.hasLayer(_barreiroLayer) || _map.hasLayer(_alcocheteLayer)) {
        L.esri.identifyFeatures({ url: AML_PDM1_BASE })
          .on(_map).at(e.latlng).layers('all:2').tolerance(2)
          .run((err, fc) => {
            if (err || !fc || !fc.features.length) return;
            const p = fc.features[0].properties;
            const key = p.Classe || '';
            show(p, ALMADA_COLORS[key] || { fill: '#888888', label: key }, key);
          });
      }
    } else if (_activeLayer === 'zoning' && _activeMunicipality !== 'grande-lisboa' && _callbacks.onGetCascaisReady?.() && _map.hasLayer(_cascaisLayer)) {
      L.esri.identifyFeatures({ url: CASCAIS_BASE })
        .on(_map).at(e.latlng).layers('visible:2').tolerance(2)
        .run((err, fc) => {
          if (err || !fc || !fc.features.length) return;
          const p   = fc.features[0].properties;
          const cat = p.Categoria || '';
          const cfg = CASCAIS_COLORS[cat] || { fill: '#888888', label: cat };
          _callbacks.onShowDetail?.(p, cfg, cat);
        });
    } else if (_activeLayer === 'zoning' && _activeMunicipality !== 'grande-lisboa' && _callbacks.onGetOeirasReady?.() && _map.hasLayer(_oeirasLayer)) {
      L.esri.identifyFeatures({ url: CASCAIS_BASE })
        .on(_map).at(e.latlng).layers('visible:3').tolerance(2)
        .run((err, fc) => {
          if (err || !fc || !fc.features.length) return;
          const p   = fc.features[0].properties;
          const cat = p.Categoria || '';
          const cfg = OEIRAS_COLORS[cat] || { fill: '#888888', label: cat };
          _callbacks.onShowDetail?.(p, cfg, cat);
        });
    } else if (_activeLayer === 'zoning' && _activeMunicipality !== 'grande-lisboa' && _callbacks.onGetLouresReady?.() && _map.hasLayer(_louresLayer)) {
      L.esri.identifyFeatures({ url: CASCAIS_BASE })
        .on(_map).at(e.latlng).layers('visible:6').tolerance(2)
        .run((err, fc) => {
          if (err || !fc || !fc.features.length) return;
          const p   = fc.features[0].properties;
          const cat = p.Categoria || '';
          const cfg = LOURES_COLORS[cat] || { fill: '#888888', label: cat };
          _callbacks.onShowDetail?.(p, cfg, cat);
        });
    } else if (_activeLayer === 'zoning' && _activeMunicipality !== 'grande-lisboa' && _callbacks.onGetAlmadaReady?.() && _map.hasLayer(_almadaLayer)) {
      L.esri.identifyFeatures({ url: AML_PDM1_BASE })
        .on(_map).at(e.latlng).layers('all:2').tolerance(2)
        .run((err, fc) => {
          if (err || !fc || !fc.features.length) return;
          const p   = fc.features[0].properties;
          const cat = p.Classe || '';
          const cfg = ALMADA_COLORS[cat] || { fill: '#888888', label: cat };
          _callbacks.onShowDetail?.(p, cfg, cat);
        });
    } else if (_activeLayer === 'zoning' && _activeMunicipality !== 'grande-lisboa' && _callbacks.onGetBarreiroReady?.() && _map.hasLayer(_barreiroLayer)) {
      L.esri.identifyFeatures({ url: AML_PDM1_BASE })
        .on(_map).at(e.latlng).layers('all:2').tolerance(2)
        .run((err, fc) => {
          if (err || !fc || !fc.features.length) return;
          const p   = fc.features[0].properties;
          const cat = p.Classe || '';
          const cfg = BARREIRO_COLORS[cat] || { fill: '#888888', label: cat };
          _callbacks.onShowDetail?.(p, cfg, cat);
        });
    } else if (_activeLayer === 'zoning' && _activeMunicipality !== 'grande-lisboa' && _callbacks.onGetAlcocheteReady?.() && _map.hasLayer(_alcocheteLayer)) {
      L.esri.identifyFeatures({ url: AML_PDM1_BASE })
        .on(_map).at(e.latlng).layers('all:2').tolerance(2)
        .run((err, fc) => {
          if (err || !fc || !fc.features.length) return;
          const p   = fc.features[0].properties;
          const cat = p.Classe || '';
          const cfg = ALCOCHETE_COLORS[cat] || { fill: '#888888', label: cat };
          _callbacks.onShowDetail?.(p, cfg, cat);
        });
    } else if (_activeLayer === 'zoning' && _activeMunicipality !== 'grande-lisboa' && _callbacks.onGetOdivelasReady?.() && _map.hasLayer(_odivelaLayer)) {
      L.esri.identifyFeatures({ url: CASCAIS_BASE })
        .on(_map).at(e.latlng).layers('visible:8').tolerance(2)
        .run((err, fc) => {
          if (err || !fc || !fc.features.length) return;
          const p   = fc.features[0].properties;
          const cat = p.Categoria || '';
          const cfg = ODIVELAS_COLORS[cat] || { fill: '#888888', label: cat };
          _callbacks.onShowDetail?.(p, cfg, cat);
        });
    } else if (_activeLayer === 'zoning' && _activeMunicipality !== 'grande-lisboa' && _callbacks.onGetVfxiraReady?.() && _map.hasLayer(_vfxiraLayer)) {
      L.esri.identifyFeatures({ url: CASCAIS_BASE })
        .on(_map).at(e.latlng).layers('visible:10').tolerance(2)
        .run((err, fc) => {
          if (err || !fc || !fc.features.length) return;
          const p   = fc.features[0].properties;
          const cls = p.Classe || '';
          const cfg = VFX_COLORS[cls] || { fill: '#888888', label: cls };
          _callbacks.onShowDetail?.(p, cfg, cls);
        });
    } else if (_activeLayer === 'zoning' && _activeMunicipality !== 'grande-lisboa' && _callbacks.onGetMoitaReady?.() && _map.hasLayer(_moitaLayer)) {
      L.esri.identifyFeatures({ url: CASCAIS_BASE })
        .on(_map).at(e.latlng).layers('visible:4').tolerance(2)
        .run((err, fc) => {
          if (err || !fc || !fc.features.length) return;
          const p   = fc.features[0].properties;
          const cat = p.Categoria || '';
          const cfg = MOITA_COLORS[cat] || { fill: '#888888', label: cat };
          _callbacks.onShowDetail?.(p, cfg, cat);
        });
    } else if (_activeLayer === 'incendio') {
      const def = OVERLAY_DEFS.find(d => d.id === 'incendio');
      L.esri.identifyFeatures({ url: CONDICIONANTES_BASE })
        .on(_map).at(e.latlng).layers('visible:371').tolerance(3)
        .run((err, fc) => {
          if (err || !fc || !fc.features.length) return;
          _callbacks.onShowOverlayDetail?.(def, fc.features[0].properties);
        });
    }
  });
}
