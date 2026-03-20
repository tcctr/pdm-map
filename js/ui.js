// ============================================================
// UI — chips, detail panel, overlay panel, cache indicator
// ============================================================

import { OVERLAY_DEFS, FIRE_COLORS, MIN_DATA_ZOOM } from './config.js';

// ── Module-level state (set by initUI) ──────────────────────
let _map                       = null;
let _urbanLayer                = null;
let _ruralLayer                = null;
let _getLiveFallbackCount      = null;
let _getSintraStatus           = null;
let _getActiveLayer            = null;
let _getActiveMunicipality     = null;
let _onZoningOverlayChipUpdate = null;

let _cacheMetaDate = null;
const _chipLoadedState = {};

// ── Generic chip helper ──────────────────────────────────────

export function setChip(id, state, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'status-chip chip-' + state;
  el.innerHTML = `<div class="dot"></div><span>${text}</span>`;
}

export function setChipLoaded(id, state, text) {
  _chipLoadedState[id] = { state, text };
  setChip(id, state, text);
}

export function getChipLoadedState(id) {
  return _chipLoadedState[id];
}

// ── Cache date indicator ──────────────────────────────────────

export function setCacheMetaDate(date) {
  _cacheMetaDate = date;
}

export function updateCacheDateIndicator() {
  const el = document.getElementById('cache-date');
  if (!el || !_cacheMetaDate) return;
  el.textContent = _getLiveFallbackCount() > 0
    ? `Dados: ${_cacheMetaDate} (alguns em direto)`
    : `Dados: ${_cacheMetaDate}`;
}

// ── Sintra combined chip ──────────────────────────────────────

export function updateSintraChip() {
  if (!_map) return; // called before initUI — initLayers fires this synchronously on startup
  const zoomed            = _map.getZoom() >= MIN_DATA_ZOOM;
  const sintraStatus      = _getSintraStatus();
  const activeLayer       = _getActiveLayer();
  const activeMunicipality = _getActiveMunicipality();
  const on = activeLayer === 'zoning' && activeMunicipality === 'sintra';

  [_urbanLayer, _ruralLayer].forEach(l => on && zoomed ? _map.addLayer(l) : _map.removeLayer(l));

  const sintraEl = document.getElementById('chip-sintra');
  if (!sintraEl) return;
  sintraEl.style.display = activeMunicipality === 'sintra' ? '' : 'none';
  if (activeMunicipality !== 'sintra') return;
  if (activeLayer !== 'zoning') return; // overlay active — leave chip as-is
  if (!zoomed) { setChip('chip-sintra', 'warn', 'Sintra: zoom'); return; }

  const u = sintraStatus.urban;
  const r = sintraStatus.rural;

  let state, label;
  if (u === 'loading' || r === 'loading') { state = 'loading'; label = 'Sintra\u2026'; }
  else if (u === 'ok' && r === 'ok')      { state = 'ok';      label = 'Sintra'; }
  else if (u === 'error' && r === 'error'){ state = 'error';   label = 'Sintra'; }
  else                                    { state = 'warn';    label = 'Sintra'; }

  setChip('chip-sintra', state, label);
  _onZoningOverlayChipUpdate?.();
}

// ── Detail panel ──────────────────────────────────────────────

export function showDetail(props, colorCfg, codeLabel) {
  const panel = document.getElementById('detail-panel');

  document.getElementById('detail-swatch').style.background = colorCfg.fill;
  document.getElementById('detail-cat-badge').style.background = colorCfg.fill + '22';
  document.getElementById('detail-cat-badge').style.color = colorCfg.fill;
  document.getElementById('detail-cat-code').textContent = codeLabel;

  document.getElementById('detail-title').textContent =
    props.Descricao || props.Categoria || colorCfg.label || codeLabel;
  document.getElementById('detail-sub').textContent =
    props.Subcategor && props.Subcategor !== props.Categoria ? props.Subcategor : '';

  const rowsEl = document.getElementById('detail-rows');
  let html = '';

  // ── Metadata row ──
  const area = props.area_ha || props.Area_Ha;
  const metaItems = [];
  if (area) metaItems.push(`<strong>\u00c1rea:</strong> ${parseFloat(area).toFixed(2)} ha`);
  if (props.Classe) metaItems.push(`<strong>Classe:</strong> ${props.Classe}`);
  if (metaItems.length) {
    html += `<div class="detail-row" style="margin-bottom:14px"><div class="detail-row-value" style="color:rgba(255,255,255,0.5);font-size:12px">${metaItems.join(' &nbsp;\u00b7&nbsp; ')}</div></div>`;
  }

  // ── Document buttons (hidden for now) ──
  // const docs = [
  //   { label: 'Regulamento', url: props.Regulamento, page: props.Pag_Regulamento },
  //   { label: 'Guião',       url: props.Guiao,        page: props.Pag_Guiao },
  //   { label: 'Relatório',   url: props.Relatorio,    page: props.Pag_relatorio },
  // ].filter(d => d.url);

  rowsEl.innerHTML = html;
  panel.classList.add('open');
  const offset = (panel.offsetHeight + 12) + 'px';
  document.getElementById('layers-btn').style.bottom = offset;
  document.getElementById('locate-btn').style.bottom = offset;
}

export function closeDetail() {
  document.getElementById('detail-panel').classList.remove('open');
  document.getElementById('layers-btn').style.bottom = '';
  document.getElementById('locate-btn').style.bottom = '';
}

export function showOverlayDetail(def, props) {
  let fill = def.color;
  let code = def.name;
  if (def.categorized === 'fire') {
    const cl = props.CLASSE || '';
    fill = FIRE_COLORS[cl] || def.color;
    code = cl || def.name;
  }
  showDetail(props, { fill, label: def.name }, code);
}

// ── Layers sheet ──────────────────────────────────────────────

export function openLayersSheet() {
  const btn   = document.getElementById('layers-btn');
  const sheet = document.getElementById('layers-sheet');
  const rect  = btn.getBoundingClientRect();
  sheet.style.bottom = (window.innerHeight - rect.top + 8) + 'px';
  sheet.classList.add('open');
  document.getElementById('layers-backdrop').classList.add('open');
}

// ── Overlay panel builder ─────────────────────────────────────

export function buildOverlayPanel() {
  const activeMunicipality = _getActiveMunicipality();
  const body = document.getElementById('overlay-body');
  const visibleDefs = OVERLAY_DEFS.filter(d => d.muni === activeMunicipality || d.muni === 'both');
  const groups = [...new Set(visibleDefs.map(d => d.group))];
  let html = `<label class="overlay-item">
    <input type="radio" name="active-layer" value="zoning" checked />
    <span class="overlay-dot" style="background:linear-gradient(135deg,#e63946 33%,#1a9850 33% 66%,#f4a261 66%)"></span>
    <span class="overlay-name">Qualifica\u00e7\u00e3o do Solo</span>
  </label>`;
  for (const grp of groups) {
    html += `<div class="overlay-group-title">${grp}</div>`;
    for (const def of visibleDefs.filter(d => d.group === grp)) {
      const dotBg = def.hatch
        ? `background:repeating-linear-gradient(45deg,${def.color}66,${def.color}66 2px,transparent 2px,transparent 7px),${def.color}22`
        : `background:${def.color}`;
      html += `<label class="overlay-item">
        <input type="radio" name="active-layer" value="${def.id}" />
        <span class="overlay-dot" style="${dotBg}"></span>
        <span class="overlay-name">${def.name}</span>
        <span class="overlay-spinner" id="ovl-spin-${def.id}" style="display:none">&#x21BB;</span>
      </label>`;
    }
  }
  body.innerHTML = html;
}

// ── initUI ────────────────────────────────────────────────────
// Call after initLayers so urbanLayer/ruralLayer are set.
//
// options: {
//   map                        — Leaflet map instance
//   urbanLayer                 — L.layerGroup for Sintra urban zoning
//   ruralLayer                 — L.layerGroup for Sintra rural zoning
//   getLiveFallbackCount()     — returns number of live fallbacks so far
//   getSintraStatus()          — returns { urban, urbanText, rural, ruralText }
//   getActiveLayer()           — returns current activeLayer string
//   getActiveMunicipality()    — returns 'sintra' | 'cascais'
//   onZoningOverlayChipUpdate  — called at end of updateSintraChip when zoning is active
// }

export function initUI({
  map,
  urbanLayer,
  ruralLayer,
  getLiveFallbackCount,
  getSintraStatus,
  getActiveLayer,
  getActiveMunicipality,
  onZoningOverlayChipUpdate,
}) {
  _map                       = map;
  _urbanLayer                = urbanLayer;
  _ruralLayer                = ruralLayer;
  _getLiveFallbackCount      = getLiveFallbackCount;
  _getSintraStatus           = getSintraStatus;
  _getActiveLayer            = getActiveLayer;
  _getActiveMunicipality     = getActiveMunicipality;
  _onZoningOverlayChipUpdate = onZoningOverlayChipUpdate;

  // Swipe down to close detail panel
  let touchStartY = 0;
  document.getElementById('detail-panel').addEventListener('touchstart', e => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  document.getElementById('detail-panel').addEventListener('touchend', e => {
    if (e.changedTouches[0].clientY - touchStartY > 60) closeDetail();
  }, { passive: true });
}
