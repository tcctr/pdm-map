// ============================================================
// MAIN — app entry point
// ============================================================

import { OVERLAY_DEFS, MUNICIPALITIES } from './config.js';
import { initSearch, reverseGeocode } from './search.js';
import { initLayers, loadOverlay, ovlState, overlayShortName, getLiveFallbackCount, getCascaisReady, getOeirasReady, getLouresReady, getAlmadaReady, getVfxiraReady, urbanLayer, ruralLayer, cascaisLayer, oeirasLayer, louresLayer, amadoraLayer, almadaLayer, lisboaLayer, vfxiraLayer, mafraLayer } from './layers.js';
import { initUI, setChip, setChipLoaded, getChipLoadedState, setCacheMetaDate, updateCacheDateIndicator, updateSintraChip, showDetail, closeDetail, showOverlayDetail, openLayersSheet, buildOverlayPanel } from './ui.js';
import { initMap, initMapHandlers, initBasemapToggle, selectMunicipality, handleLayerSelect, updateLayerVisibility, getActiveLayer, getActiveMunicipality } from './map.js';

// ============================================================
// CACHE METADATA
// ============================================================

async function loadCacheMetadata() {
  try {
    const res = await fetch('/data/sync-metadata.json', { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return;
    const meta = await res.json();
    if (meta.lastRun) {
      const d = new Date(meta.lastRun);
      setCacheMetaDate(d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' }));
      updateCacheDateIndicator();
    }
  } catch {
    // silently ignore — indicator stays hidden
  }
}

// ============================================================
// GPS TRACKING
// ============================================================

let gpsMarker   = null;
let gpsAccuracy = null;
let firstFix    = true;

const gpsDotIcon = L.divIcon({
  className: '',
  html: '<div class="gps-dot" style="width:14px;height:14px"></div>',
  iconSize:  [14, 14],
  iconAnchor:[7,  7],
});

function onGpsSuccess(pos) {
  const lat    = pos.coords.latitude;
  const lng    = pos.coords.longitude;
  const acc    = pos.coords.accuracy;
  const latlng = [lat, lng];

  if (!gpsMarker) {
    gpsMarker   = L.marker(latlng, { icon: gpsDotIcon, zIndexOffset: 500 }).addTo(map);
    gpsAccuracy = L.circle(latlng, { radius: acc, weight: 1, color: '#4299e1', fillColor: '#4299e1', fillOpacity: 0.08 }).addTo(map);
  } else {
    gpsMarker.setLatLng(latlng);
    gpsAccuracy.setLatLng(latlng).setRadius(acc);
  }

  if (firstFix) {
    map.setView(latlng, 15);
    firstFix = false;
    reverseGeocode(lat, lng).then(muni => { if (muni) selectMunicipality(muni); });
  }

  setChip('chip-gps', 'gps', `GPS \u00b1${Math.round(acc)}m`);
}

function onGpsError(err) {
  setChip('chip-gps', 'error', 'GPS: ' + (err.code === 1 ? 'bloqueado' : 'erro'));
}

function startGPS() {
  if (!navigator.geolocation) { setChip('chip-gps', 'error', 'GPS: N/A'); return; }
  setChip('chip-gps', 'loading', 'GPS\u2026');
  navigator.geolocation.watchPosition(onGpsSuccess, onGpsError, {
    enableHighAccuracy: true,
    maximumAge: 5000,
    timeout: 15000,
  });
}

function locateUser() {
  if (gpsMarker) {
    map.setView(gpsMarker.getLatLng(), Math.max(map.getZoom(), 15));
  } else if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => map.setView([pos.coords.latitude, pos.coords.longitude], 15),
      onGpsError,
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }
}

// ============================================================
// MUNICIPALITY PICKER
// ============================================================

function toggleMuniDropdown() {
  const btn  = document.getElementById('muni-picker-btn');
  const dd   = document.getElementById('muni-dropdown');
  const open = dd.classList.toggle('open');
  btn.classList.toggle('open', open);
}

function closeMuniDropdown() {
  document.getElementById('muni-dropdown').classList.remove('open');
  document.getElementById('muni-picker-btn').classList.remove('open');
}

function pickMunicipality(muni) {
  closeMuniDropdown();
  selectMunicipality(muni);
  const cfg = MUNICIPALITIES.find(m => m.id === muni);
  if (cfg) map.panTo(cfg.center);
}

// ============================================================
// OVERLAY CHIP + ZONING STATUS
// ============================================================

function setOverlayChip(state, text) {
  const el = document.getElementById('chip-overlay');
  if (!el) return;
  el.className = 'status-chip chip-' + state;
  el.innerHTML = `<div class="dot"></div><span>${text}</span>`;
}

function updateZoningOverlayChip() {
  if (getActiveLayer() === 'none') { setOverlayChip('hidden', 'Solo'); return; }
  if (getActiveLayer() !== 'zoning') return;
  if (getActiveMunicipality() === 'sintra') {
    const u = sintraStatus.urban, r = sintraStatus.rural;
    if (u === 'loading' || r === 'loading') setOverlayChip('loading', 'Solo\u2026');
    else if (u === 'ok' && r === 'ok')       setOverlayChip('ok', 'Solo');
    else if (u === 'error' && r === 'error') setOverlayChip('error', 'Solo: erro');
    else                                     setOverlayChip('warn', 'Solo');
  } else if (getActiveMunicipality() === 'oeiras') {
    const oeirasState = getChipLoadedState('chip-oeiras')?.state;
    if (!oeirasState)               setOverlayChip('loading', 'Solo\u2026');
    else if (oeirasState === 'ok')  setOverlayChip('ok', 'Solo');
    else                            setOverlayChip('error', 'Solo: erro');
  } else if (getActiveMunicipality() === 'loures') {
    const louresState = getChipLoadedState('chip-loures')?.state;
    if (!louresState)               setOverlayChip('loading', 'Solo\u2026');
    else if (louresState === 'ok')  setOverlayChip('ok', 'Solo');
    else                            setOverlayChip('error', 'Solo: erro');
  } else if (getActiveMunicipality() === 'amadora') {
    const amadoraState = getChipLoadedState('chip-amadora')?.state;
    if (!amadoraState)               setOverlayChip('loading', 'Solo\u2026');
    else if (amadoraState === 'ok')  setOverlayChip('ok', 'Solo');
    else                             setOverlayChip('error', 'Solo: erro');
  } else if (getActiveMunicipality() === 'almada') {
    const almadaState = getChipLoadedState('chip-almada')?.state;
    if (!almadaState)               setOverlayChip('loading', 'Solo\u2026');
    else if (almadaState === 'ok')  setOverlayChip('ok', 'Solo');
    else                            setOverlayChip('error', 'Solo: erro');
  } else if (getActiveMunicipality() === 'lisboa') {
    const lisboaState = getChipLoadedState('chip-lisboa')?.state;
    if (!lisboaState)               setOverlayChip('loading', 'Solo\u2026');
    else if (lisboaState === 'ok')  setOverlayChip('ok', 'Solo');
    else                            setOverlayChip('error', 'Solo: erro');
  } else if (getActiveMunicipality() === 'vfxira') {
    const vfxiraState = getChipLoadedState('chip-vfxira')?.state;
    if (!vfxiraState)               setOverlayChip('loading', 'Solo\u2026');
    else if (vfxiraState === 'ok')  setOverlayChip('ok', 'Solo');
    else                            setOverlayChip('error', 'Solo: erro');
  } else if (getActiveMunicipality() === 'mafra') {
    const mafraState = getChipLoadedState('chip-mafra')?.state;
    if (!mafraState)               setOverlayChip('loading', 'Solo\u2026');
    else if (mafraState === 'ok')  setOverlayChip('ok', 'Solo');
    else                           setOverlayChip('error', 'Solo: erro');
  } else {
    const cascaisState = getChipLoadedState('chip-cascais')?.state;
    if (!cascaisState)              setOverlayChip('loading', 'Solo\u2026');
    else if (cascaisState === 'ok') setOverlayChip('ok', 'Solo');
    else                            setOverlayChip('error', 'Solo: erro');
  }
}

const sintraStatus = { urban: 'loading', urbanText: '', rural: 'loading', ruralText: '' };

// ============================================================
// LAYERS SHEET
// ============================================================

function closeLayersSheet() {
  document.getElementById('layers-sheet').classList.remove('open');
  document.getElementById('layers-backdrop').classList.remove('open');
  document.getElementById('overlay-body').scrollTop = 0;
}

function toggleLayersSheet() {
  document.getElementById('layers-sheet').classList.contains('open')
    ? closeLayersSheet()
    : openLayersSheet();
}

function updateLayersBtnLabel(value) {
  if (value === 'none') { document.getElementById('layers-btn-label').textContent = 'Mapa base'; return; }
  const def = OVERLAY_DEFS.find(d => d.id === value);
  document.getElementById('layers-btn-label').textContent = def ? def.name : 'Mapeamento';
}

// ============================================================
// INIT
// ============================================================

const map = initMap('map');
initBasemapToggle(map);

initSearch(map, {
  onMunicipalityDetected: muni => selectMunicipality(muni),
  getGpsLocation: () => gpsMarker ? gpsMarker.getLatLng() : null,
});
startGPS();

initLayers(map, {
  onFallback:            () => updateCacheDateIndicator(),
  onSintraStatus:        update => { Object.assign(sintraStatus, update); updateSintraChip(); },
  onCascaisStatus:       (state, text) => setChip('chip-cascais', state, text),
  onCascaisLoaded:       (state, text) => { setChipLoaded('chip-cascais', state, text); updateLayerVisibility(); updateZoningOverlayChip(); },
  onOeirasStatus:        (state, text) => setChip('chip-oeiras', state, text),
  onOeirasLoaded:        (state, text) => { setChipLoaded('chip-oeiras', state, text); updateLayerVisibility(); updateZoningOverlayChip(); },
  onLouresStatus:        (state, text) => setChip('chip-loures', state, text),
  onLouresLoaded:        (state, text) => { setChipLoaded('chip-loures', state, text); updateLayerVisibility(); updateZoningOverlayChip(); },
  onAmadoraStatus:       (state, text) => setChip('chip-amadora', state, text),
  onAmadoraLoaded:       (state, text) => { setChipLoaded('chip-amadora', state, text); updateLayerVisibility(); updateZoningOverlayChip(); },
  onAlmadaStatus:        (state, text) => setChip('chip-almada', state, text),
  onAlmadaLoaded:        (state, text) => { setChipLoaded('chip-almada', state, text); updateLayerVisibility(); updateZoningOverlayChip(); },
  onLisboaStatus:        (state, text) => setChip('chip-lisboa', state, text),
  onLisboaLoaded:        (state, text) => { setChipLoaded('chip-lisboa', state, text); updateLayerVisibility(); updateZoningOverlayChip(); },
  onVfxiraStatus:        (state, text) => setChip('chip-vfxira', state, text),
  onVfxiraLoaded:        (state, text) => { setChipLoaded('chip-vfxira', state, text); updateLayerVisibility(); updateZoningOverlayChip(); },
  onMafraStatus:         (state, text) => setChip('chip-mafra', state, text),
  onMafraLoaded:         (state, text) => { setChipLoaded('chip-mafra', state, text); updateLayerVisibility(); updateZoningOverlayChip(); },
  onOverlayStatus:       (id, state, text) => { if (getActiveLayer() === id) setOverlayChip(state, text); },
  onFeatureClick:        (props, cfg, label) => showDetail(props, cfg, label),
  onOverlayFeatureClick: (def, props) => showOverlayDetail(def, props),
});

initUI({
  map,
  urbanLayer,
  ruralLayer,
  getLiveFallbackCount,
  getSintraStatus:           () => sintraStatus,
  getActiveLayer,
  getActiveMunicipality,
  onZoningOverlayChipUpdate: updateZoningOverlayChip,
});

initMapHandlers({
  ovlState,
  urbanLayer, ruralLayer, cascaisLayer, oeirasLayer, louresLayer, amadoraLayer, almadaLayer, lisboaLayer, vfxiraLayer, mafraLayer,
  overlayShortName, loadOverlay, getCascaisReady, getOeirasReady, getLouresReady, getAlmadaReady, getVfxiraReady,
  onUpdateSintraChip:         updateSintraChip,
  onSetChip:                  setChip,
  onGetChipLoadedState:       getChipLoadedState,
  onSetOverlayChip:           setOverlayChip,
  onCloseDetail:              closeDetail,
  onShowDetail:               showDetail,
  onShowOverlayDetail:        showOverlayDetail,
  onBuildOverlayPanel:        buildOverlayPanel,
  onUpdateLayersBtnLabel:     updateLayersBtnLabel,
  onCloseLayersSheet:         closeLayersSheet,
  onUpdateZoningOverlayChip:  updateZoningOverlayChip,
});

buildOverlayPanel();
updateLayerVisibility();
loadCacheMetadata();

// ============================================================
// EVENT WIRING — replaces inline onclick/onchange attributes
// ============================================================

// Municipality picker
document.getElementById('muni-picker-btn').addEventListener('click', toggleMuniDropdown);
document.getElementById('muni-dropdown').addEventListener('click', e => {
  const opt = e.target.closest('.muni-option');
  if (opt) pickMunicipality(opt.dataset.muni);
});
document.addEventListener('click', e => {
  if (!document.getElementById('muni-picker').contains(e.target)) closeMuniDropdown();
});

// Layers sheet
document.getElementById('layers-btn').addEventListener('click', toggleLayersSheet);
document.getElementById('layers-backdrop').addEventListener('click', closeLayersSheet);

// Layers sheet swipe-to-close
let layersTouchStartY = 0;
document.getElementById('layers-sheet').addEventListener('touchstart', e => {
  layersTouchStartY = e.touches[0].clientY;
}, { passive: true });
document.getElementById('layers-sheet').addEventListener('touchend', e => {
  if (e.changedTouches[0].clientY - layersTouchStartY > 60) closeLayersSheet();
}, { passive: true });

// Overlay radio buttons — event delegation handles dynamically generated radios
document.getElementById('overlay-body').addEventListener('change', e => {
  if (e.target.name === 'active-layer') handleLayerSelect(e.target.value);
});

// Detail panel close button
document.getElementById('detail-close').addEventListener('click', closeDetail);

// Layers clear button
document.getElementById('layers-clear').addEventListener('click', () => {
  handleLayerSelect('none');
  document.querySelectorAll('#overlay-body input[type=radio]').forEach(r => r.checked = false);
});

// Locate button
document.getElementById('locate-btn').addEventListener('click', locateUser);
