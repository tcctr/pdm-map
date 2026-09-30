// ============================================================
// MAP — Leaflet init, municipality switching, layer visibility
// ============================================================

import {
  MUNICIPALITIES, OVERLAY_DEFS, MIN_DATA_ZOOM,
  CONDICIONANTES_BASE, CRUS_COLORS,
  URBAN_COLORS, RURAL_COLORS, AMADORA_COLORS, LISBOA_COLORS, MAFRA_COLORS,
  MONTIJO_COLORS, PALMELA_COLORS, SEIXAL_COLORS, SESIMBRA_COLORS, SETUBAL_COLORS,
} from './config.js';
import { crusKey } from './layers.js';

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
let _montijoLayer   = null;
let _palmelaLayer   = null;
let _seixalLayer    = null;
let _sesimbraLayer  = null;
let _setubalLayer       = null;
let _cadastroHighlight       = null;
let _cadastroAbortController = null;
let _cadastroClickId         = 0;
let _callbacks               = {};

let _activeLayer        = 'zoning';
let _activeMunicipality = 'grande-lisboa';

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

  // zoningPane (z-index 350) holds all GeoJSON zoning layers; hidden when a non-zoning layer
  // is active so paths are pre-created in the background without visual interference.
  // cadastroPane (z-index 500) holds the cadastro WMS so it renders above the SVG overlay pane.
  map.createPane('zoningPane');
  map.getPane('zoningPane').style.zIndex = '350';
  map.getPane('zoningPane').style.display = 'none';
  map.createPane('cadastroPane');
  map.getPane('cadastroPane').style.zIndex = '500';
  map.getPane('cadastroPane').style.pointerEvents = 'none';
  map.getPane('cadastroPane').style.filter = 'sepia(1) saturate(2) hue-rotate(90deg) brightness(1.4)';
  map.createPane('highlightPane');
  map.getPane('highlightPane').style.zIndex = '550';
  map.getPane('highlightPane').style.pointerEvents = 'none';

  return map;
}

// ── Layer visibility ──────────────────────────────────────────

export function updateLayerVisibility() {
  // Loaders can report status before initMapHandlers has wired the layers
  if (!_cascaisLayer) return;
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

  // Amadora GeoJSON layer (always on map in zoningPane; pane visibility controls display)
  const amadoraOn = _activeLayer === 'zoning' && (_activeMunicipality === 'amadora' || isGL);
  amadoraOn && zoomed ? _map.addLayer(_amadoraLayer) : _map.removeLayer(_amadoraLayer);

  // chip-cascais
  const cascaisEl = document.getElementById('chip-cascais');
  if (cascaisEl) {
    cascaisEl.style.display = _activeMunicipality === 'cascais' ? '' : 'none';
    if (_activeMunicipality === 'cascais' && _activeLayer === 'zoning' && !cascaisEl.classList.contains('chip-loading')) {
      if (!zoomed) {
        _callbacks.onSetChip?.('chip-cascais', 'warn', 'Cascais: zoom');
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
      } else {
        const s = _callbacks.onGetChipLoadedState?.('chip-almada');
        if (s) _callbacks.onSetChip?.('chip-almada', s.state, s.text);
      }
    }
  }

  // Lisboa GeoJSON layer (always on map in zoningPane)
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
      } else {
        const s = _callbacks.onGetChipLoadedState?.('chip-vfxira');
        if (s) _callbacks.onSetChip?.('chip-vfxira', s.state, s.text);
      }
    }
  }

  // Mafra GeoJSON layer (always on map in zoningPane)
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
      } else {
        const s = _callbacks.onGetChipLoadedState?.('chip-barreiro');
        if (s) _callbacks.onSetChip?.('chip-barreiro', s.state, s.text);
      }
    }
  }

  // Montijo GeoJSON layer (always on map in zoningPane)
  const montijoOn = _activeLayer === 'zoning' && (_activeMunicipality === 'montijo' || isGL);
  montijoOn && zoomed ? _map.addLayer(_montijoLayer) : _map.removeLayer(_montijoLayer);

  // chip-montijo (GeoJSON layer — no maxZoom cap)
  const montijoEl = document.getElementById('chip-montijo');
  if (montijoEl) {
    montijoEl.style.display = _activeMunicipality === 'montijo' ? '' : 'none';
    if (_activeMunicipality === 'montijo' && _activeLayer === 'zoning' && !montijoEl.classList.contains('chip-loading')) {
      if (!zoomed) {
        _callbacks.onSetChip?.('chip-montijo', 'warn', 'Montijo: zoom');
      } else {
        const s = _callbacks.onGetChipLoadedState?.('chip-montijo');
        if (s) _callbacks.onSetChip?.('chip-montijo', s.state, s.text);
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
      } else {
        const s = _callbacks.onGetChipLoadedState?.('chip-moita');
        if (s) _callbacks.onSetChip?.('chip-moita', s.state, s.text);
      }
    }
  }

  // Palmela GeoJSON layer (always on map in zoningPane)
  const palmelaOn = _activeLayer === 'zoning' && (_activeMunicipality === 'palmela' || isGL);
  palmelaOn && zoomed ? _map.addLayer(_palmelaLayer) : _map.removeLayer(_palmelaLayer);

  // chip-palmela (GeoJSON layer — no maxZoom cap)
  const palmelaEl = document.getElementById('chip-palmela');
  if (palmelaEl) {
    palmelaEl.style.display = _activeMunicipality === 'palmela' ? '' : 'none';
    if (_activeMunicipality === 'palmela' && _activeLayer === 'zoning' && !palmelaEl.classList.contains('chip-loading')) {
      if (!zoomed) {
        _callbacks.onSetChip?.('chip-palmela', 'warn', 'Palmela: zoom');
      } else {
        const s = _callbacks.onGetChipLoadedState?.('chip-palmela');
        if (s) _callbacks.onSetChip?.('chip-palmela', s.state, s.text);
      }
    }
  }

  // Seixal GeoJSON layer (always on map in zoningPane)
  const seixalOn = _activeLayer === 'zoning' && (_activeMunicipality === 'seixal' || isGL);
  seixalOn && zoomed ? _map.addLayer(_seixalLayer) : _map.removeLayer(_seixalLayer);

  // chip-seixal (GeoJSON layer — no maxZoom cap)
  const seixalEl = document.getElementById('chip-seixal');
  if (seixalEl) {
    seixalEl.style.display = _activeMunicipality === 'seixal' ? '' : 'none';
    if (_activeMunicipality === 'seixal' && _activeLayer === 'zoning' && !seixalEl.classList.contains('chip-loading')) {
      if (!zoomed) {
        _callbacks.onSetChip?.('chip-seixal', 'warn', 'Seixal: zoom');
      } else {
        const s = _callbacks.onGetChipLoadedState?.('chip-seixal');
        if (s) _callbacks.onSetChip?.('chip-seixal', s.state, s.text);
      }
    }
  }

  // Sesimbra GeoJSON layer (always on map in zoningPane)
  const sesimbraOn = _activeLayer === 'zoning' && (_activeMunicipality === 'sesimbra' || isGL);
  sesimbraOn && zoomed ? _map.addLayer(_sesimbraLayer) : _map.removeLayer(_sesimbraLayer);

  // chip-sesimbra (GeoJSON layer — no maxZoom cap)
  const sesimbraEl = document.getElementById('chip-sesimbra');
  if (sesimbraEl) {
    sesimbraEl.style.display = _activeMunicipality === 'sesimbra' ? '' : 'none';
    if (_activeMunicipality === 'sesimbra' && _activeLayer === 'zoning' && !sesimbraEl.classList.contains('chip-loading')) {
      if (!zoomed) {
        _callbacks.onSetChip?.('chip-sesimbra', 'warn', 'Sesimbra: zoom');
      } else {
        const s = _callbacks.onGetChipLoadedState?.('chip-sesimbra');
        if (s) _callbacks.onSetChip?.('chip-sesimbra', s.state, s.text);
      }
    }
  }

  // Setúbal GeoJSON layer (always on map in zoningPane)
  const setubalOn = _activeLayer === 'zoning' && (_activeMunicipality === 'setubal' || isGL);
  setubalOn && zoomed ? _map.addLayer(_setubalLayer) : _map.removeLayer(_setubalLayer);

  // chip-setubal (GeoJSON layer — no maxZoom cap)
  const setubalEl = document.getElementById('chip-setubal');
  if (setubalEl) {
    setubalEl.style.display = _activeMunicipality === 'setubal' ? '' : 'none';
    if (_activeMunicipality === 'setubal' && _activeLayer === 'zoning' && !setubalEl.classList.contains('chip-loading')) {
      if (!zoomed) {
        _callbacks.onSetChip?.('chip-setubal', 'warn', 'Set\u00fabal: zoom');
      } else {
        const s = _callbacks.onGetChipLoadedState?.('chip-setubal');
        if (s) _callbacks.onSetChip?.('chip-setubal', s.state, s.text);
      }
    }
  }

  // chip-grande-lisboa — single chip replaces all individual chips when region view is active
  const glEl = document.getElementById('chip-grande-lisboa');
  if (glEl) {
    glEl.style.display = isGL ? '' : 'none';
    if (isGL) _callbacks.onSetChip?.('chip-grande-lisboa', 'ok', 'AML');
  }
}

// ── Municipality switching ────────────────────────────────────

export function selectMunicipality(muni) {
  _activeMunicipality = muni;

  const cfg = MUNICIPALITIES.find(m => m.id === muni);
  const _lbl = document.getElementById('muni-picker-label');
  if (_lbl) _lbl.textContent = cfg ? cfg.label : muni;
  document.querySelectorAll('.muni-option').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.muni === muni);
  });

  // Clear overlay cache; preserve 'both'-municipality overlays already on the map
  for (const def of OVERLAY_DEFS) {
    const st = _ovlState[def.id];
    if (_activeLayer === def.id && def.muni === 'both' && st.leafletLayer) {
      st.retries = 0;
      continue;
    }
    if (st.leafletLayer) { _map.removeLayer(st.leafletLayer); st.leafletLayer = null; }
    st.loaded = false; st.loading = false; st.active = false; st.retries = 0;
  }

  if (_activeLayer === 'cadastro' && _ovlState['cadastro']?.leafletLayer) {
    _callbacks.onUpdateLayersBtnLabel?.('cadastro');
  } else {
    handleLayerSelect(_activeLayer);
  }
  _callbacks.onBuildOverlayPanel?.();
  updateLayerVisibility();
}

// ── Active layer selection ────────────────────────────────────

export function handleLayerSelect(value) {
  _activeLayer = value;
  _callbacks.onUpdateLayersBtnLabel?.(value);
  setTimeout(() => _callbacks.onCloseLayersSheet?.(), 180);

  const zoningPane = _map.getPane('zoningPane');

  if (value === 'zoning') {
    if (zoningPane) { zoningPane.style.display = ''; zoningPane.style.pointerEvents = ''; }
    _callbacks.onUpdateZoningOverlayChip?.();
    for (const def of OVERLAY_DEFS) {
      _ovlState[def.id].active = false;
      if (_ovlState[def.id].leafletLayer) _map.removeLayer(_ovlState[def.id].leafletLayer);
    }
    updateLayerVisibility();
  } else if (value === 'none') {
    if (zoningPane) { zoningPane.style.display = 'none'; zoningPane.style.pointerEvents = ''; }
    for (const def of OVERLAY_DEFS) {
      _ovlState[def.id].active = false;
      if (_ovlState[def.id].leafletLayer) _map.removeLayer(_ovlState[def.id].leafletLayer);
    }
    _callbacks.onUpdateZoningOverlayChip?.();
  } else {
    if (zoningPane) { zoningPane.style.display = 'none'; zoningPane.style.pointerEvents = ''; }
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
      _baseLayer.bringToBack();
      isSatellite = false;
      btn.innerHTML = iconSatellite;
    } else {
      map.removeLayer(_baseLayer);
      satelliteLayer.addTo(map);
      satelliteLayer.bringToBack();
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
//   onUpdateDetailZoning(label)— injects zoning label into open cadastro detail panel
// }

// ── Point-in-polygon helpers ──────────────────────────────────

function pointInRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function pointInPolygon(coord, geometry) {
  const [x, y] = coord;
  const polys = geometry.type === 'MultiPolygon' ? geometry.coordinates : [geometry.coordinates];
  for (const rings of polys) {
    if (!pointInRing(x, y, rings[0])) continue;
    let inHole = false;
    for (let i = 1; i < rings.length; i++) if (pointInRing(x, y, rings[i])) { inHole = true; break; }
    if (!inHole) return true;
  }
  return false;
}

// Point-in-polygon scan over the loaded GeoJSON layers.
// cfg: { layer, field, colors, fallback } or { layer, crus: true } for DGT CRUS layers.
function scanZoning(latlng, cfgs) {
  const coord = [latlng.lng, latlng.lat];
  for (const { layer, field, colors, fallback, crus } of cfgs) {
    let found = null;
    layer.eachLayer(sub => {
      if (found) return;
      sub.eachLayer(fl => {
        if (found) return;
        const geom = fl.feature?.geometry;
        if (!geom || !pointInPolygon(coord, geom)) return;
        const props = fl.feature.properties;
        let key, cfg;
        if (crus) {
          key = crusKey(props);
          cfg = CRUS_COLORS[key];
        } else {
          key = (props[field] || '').trim();
          if ((!key || key === 'Não Atribuída') && fallback) key = (props[fallback] || '').trim();
          cfg = colors[key];
        }
        found = cfg
          ? { label: cfg.label || key, fill: cfg.fill, props }
          : (key ? { label: key, fill: '#888', props } : null);
      });
    });
    if (found) return found;
  }
  return null;
}

// Queries the active municipality's zoning at a given latlng.
// Returns a Promise<{label, fill, props}|null>. The scan runs in a setTimeout so the
// detail panel and the network requests go out before the CPU-heavy loop.
function queryZoningAtPoint(latlng) {
  const geojsonCfg = {
    sintra:    [{ layer: _urbanLayer,    field: 'CAT',            colors: URBAN_COLORS    },
                { layer: _ruralLayer,    field: 'Ord_Categ',      colors: RURAL_COLORS    }],
    amadora:   [{ layer: _amadoraLayer,  field: 'Categoria_2021', colors: AMADORA_COLORS  }],
    lisboa:    [{ layer: _lisboaLayer,   field: 'Categoria',      colors: LISBOA_COLORS   }],
    mafra:     [{ layer: _mafraLayer,    field: 'Categoria',      colors: MAFRA_COLORS    }],
    montijo:   [{ layer: _montijoLayer,  field: 'Categoria_2021', colors: MONTIJO_COLORS, fallback: 'Classe_2021' }],
    palmela:   [{ layer: _palmelaLayer,  field: 'tipo',           colors: PALMELA_COLORS  }],
    seixal:    [{ layer: _seixalLayer,   field: 'designacao',     colors: SEIXAL_COLORS   }],
    sesimbra:  [{ layer: _sesimbraLayer, field: 'Categoria_2021', colors: SESIMBRA_COLORS, fallback: 'Classe_2021' }],
    setubal:   [{ layer: _setubalLayer,  field: 'Categoria',      colors: SETUBAL_COLORS  }],
    cascais:   [{ layer: _cascaisLayer,   crus: true }],
    oeiras:    [{ layer: _oeirasLayer,    crus: true }],
    loures:    [{ layer: _louresLayer,    crus: true }],
    odivelas:  [{ layer: _odivelaLayer,   crus: true }],
    vfxira:    [{ layer: _vfxiraLayer,    crus: true }],
    almada:    [{ layer: _almadaLayer,    crus: true }],
    barreiro:  [{ layer: _barreiroLayer,  crus: true }],
    alcochete: [{ layer: _alcocheteLayer, crus: true }],
    moita:     [{ layer: _moitaLayer,     crus: true }],
  };
  const cfgs = _activeMunicipality === 'grande-lisboa'
    ? Object.values(geojsonCfg).flat()
    : geojsonCfg[_activeMunicipality];
  if (!cfgs) return Promise.resolve(null);
  return new Promise(resolve => setTimeout(() => resolve(scanZoning(latlng, cfgs)), 0));
}

// REN and RAN for the whole AML come from the pdm_revisao layers 11/12, which are only
// available as the cached files now that sig.aml.pt is gone. Loaded on first parcel click.
const _condCache = {};
function loadCondicionante(file) {
  if (!_condCache[file]) {
    _condCache[file] = fetch('/data/' + file)
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(fc => fc.features || [])
      .catch(err => { delete _condCache[file]; throw err; });
  }
  return _condCache[file];
}

function pointInCondicionante(latlng, file) {
  const coord = [latlng.lng, latlng.lat];
  return loadCondicionante(file).then(features => features.some(f => f.geometry && pointInPolygon(coord, f.geometry)));
}

function queryRENAtPoint(latlng) {
  return pointInCondicionante(latlng, 'ren-cascais.geojson');
}

function queryRANAtPoint(latlng) {
  if (_activeMunicipality !== 'sintra') return pointInCondicionante(latlng, 'ran-cascais.geojson');
  return new Promise((resolve, reject) => {
    L.esri.identifyFeatures({ url: CONDICIONANTES_BASE })
      .on(_map).at(latlng).layers('all:264').tolerance(0)
      .run((err, fc) => err ? reject(err) : resolve(fc?.features?.length > 0));
  });
}

export function initMapHandlers({
  ovlState,
  urbanLayer, ruralLayer, cascaisLayer, oeirasLayer, louresLayer, amadoraLayer, almadaLayer, barreiroLayer, lisboaLayer, vfxiraLayer, mafraLayer, odivelaLayer, alcocheteLayer, moitaLayer, montijoLayer, palmelaLayer, seixalLayer, sesimbraLayer, setubalLayer,
  overlayShortName, loadOverlay, getCascaisReady, getOeirasReady, getLouresReady, getAlmadaReady, getBarreiroReady, getAlcocheteReady, getOdivelasReady, getVfxiraReady, getMoitaReady,
  onUpdateSintraChip, onSetChip, onGetChipLoadedState,
  onSetOverlayChip, onCloseDetail, onShowDetail, onShowOverlayDetail,
  onBuildOverlayPanel, onUpdateLayersBtnLabel, onCloseLayersSheet,
  onUpdateZoningOverlayChip, onUpdateDetailZoning, onUpdateDetailRow,
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
  _montijoLayer   = montijoLayer;
  _palmelaLayer   = palmelaLayer;
  _seixalLayer    = seixalLayer;
  _sesimbraLayer  = sesimbraLayer;
  _setubalLayer   = setubalLayer;
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
    onUpdateDetailZoning,
    onUpdateDetailRow,
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
    if (_cadastroHighlight) { _map.removeLayer(_cadastroHighlight); _cadastroHighlight = null; }

    if (_activeLayer === 'cadastro') {
      const def = OVERLAY_DEFS.find(d => d.id === 'cadastro');
      if (!def) return;

      // Show panel immediately — don't wait for WMS response
      _callbacks.onShowOverlayDetail?.(def, {}, _activeMunicipality);

      // Cancel any in-flight WMS request from a previous click
      if (_cadastroAbortController) _cadastroAbortController.abort();
      _cadastroAbortController = new AbortController();

      // Click ID guards against stale results overwriting a newer click
      const clickId = ++_cadastroClickId;

      const mapSize = _map.getSize();
      const bounds  = _map.getBounds();
      const pt      = _map.latLngToContainerPoint(e.latlng);
      const bbox    = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
      const url     = `${def.wmsUrl}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetFeatureInfo` +
        `&LAYERS=cadastralparcel&QUERY_LAYERS=cadastralparcel` +
        `&INFO_FORMAT=application%2Fjson&FEATURE_COUNT=1` +
        `&WIDTH=${mapSize.x}&HEIGHT=${mapSize.y}` +
        `&CRS=EPSG%3A4326&BBOX=${bbox}` +
        `&I=${Math.round(pt.x)}&J=${Math.round(pt.y)}&STYLES=`;

      const zoningPromise = queryZoningAtPoint(e.latlng);
      const renPromise    = queryRENAtPoint(e.latlng);
      const ranPromise    = queryRANAtPoint(e.latlng);

      // WMS fetch — only adds highlight geometry; panel already open
      fetch(url, { signal: _cadastroAbortController.signal })
        .then(r => r.json())
        .then(fc => {
          if (clickId !== _cadastroClickId) return;
          if (!fc?.features?.length) return;
          const feature = fc.features[0];
          if (feature.geometry) {
            _cadastroHighlight = L.geoJSON(feature, {
              style: { color: '#ffffff', weight: 2.5, opacity: 0.85, fillColor: '#ffffff', fillOpacity: 0.06 },
              pane: 'highlightPane',
            }).addTo(_map);
          }
        })
        .catch(err => { if (err.name !== 'AbortError') console.error(err); });

      zoningPromise
        .then(r  => { if (clickId === _cadastroClickId) _callbacks.onUpdateDetailZoning?.(r); })
        .catch(() => { if (clickId === _cadastroClickId) _callbacks.onUpdateDetailZoning?.(null); });
      renPromise
        .then(v  => { if (clickId === _cadastroClickId) _callbacks.onUpdateDetailRow?.('ren',  v ? 'Sim' : 'Não'); })
        .catch(() => { if (clickId === _cadastroClickId) _callbacks.onUpdateDetailRow?.('ren',  '—'); });
      ranPromise
        .then(v  => { if (clickId === _cadastroClickId) _callbacks.onUpdateDetailRow?.('ran',  v ? 'Sim' : 'Não'); })
        .catch(() => { if (clickId === _cadastroClickId) _callbacks.onUpdateDetailRow?.('ran',  '—'); });
      return;
    }

    _callbacks.onCloseDetail?.();

    if (_activeLayer === 'incendio') {
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
