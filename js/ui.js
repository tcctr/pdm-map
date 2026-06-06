// ============================================================
// UI — chips, detail panel, overlay panel, cache indicator
// ============================================================

import { OVERLAY_DEFS, FIRE_COLORS, MIN_DATA_ZOOM } from './config.js';

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

function syncStatusbar() {
  const bar = document.getElementById('statusbar');
  if (!bar) return;
  const hasVisible = Array.from(bar.children).some(c => c.style.display !== 'none');
  bar.style.display = hasVisible ? '' : 'none';
}

export function setChip(id, state, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'status-chip chip-' + state;
  el.innerHTML = `<div class="dot"></div><span>${text}</span>`;
  el.style.display = (state === 'error' || state === 'warn') ? '' : 'none';
  syncStatusbar();
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
  const on = activeLayer === 'zoning' && (activeMunicipality === 'sintra' || activeMunicipality === 'grande-lisboa');

  [_urbanLayer, _ruralLayer].forEach(l => on && zoomed ? _map.addLayer(l) : _map.removeLayer(l));

  const sintraEl = document.getElementById('chip-sintra');
  if (!sintraEl) return;
  if (activeMunicipality !== 'sintra') { sintraEl.style.display = 'none'; syncStatusbar(); return; }
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
  if (area) metaItems.push(`<strong>\u00c1rea:</strong> ${escHtml(parseFloat(area).toFixed(2))} ha`);
  if (props.Classe) metaItems.push(`<strong>Classe:</strong> ${escHtml(props.Classe)}`);
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
  document.getElementById('basemap-btn').style.bottom = (panel.offsetHeight + 12 + 54) + 'px';
}

export function closeDetail() {
  document.getElementById('detail-panel').classList.remove('open');
  document.getElementById('layers-btn').style.bottom = '';
  document.getElementById('locate-btn').style.bottom = '';
  document.getElementById('basemap-btn').style.bottom = '';
}

export function showOverlayDetail(def, props, muni) {
  let fill = def.color;
  let code = def.name;
  if (def.categorized === 'fire') {
    const cl = props.CLASSE || '';
    fill = FIRE_COLORS[cl] || def.color;
    code = cl || def.name;
  }
  showDetail(props, { fill, label: def.name }, code);
  if (def.id === 'cadastro') {
    const rowsEl = document.getElementById('detail-rows');
    const mkRow = (id, label, first) => {
      const style = first
        ? 'margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.08)'
        : 'margin-top:4px';
      return `<div class="detail-row" style="${style}">` +
        `<div class="detail-row-value" style="font-size:12px;color:rgba(255,255,255,0.5)">` +
        `<strong>${label}:</strong> <span id="detail-${id}-val" style="font-style:italic">\u2026</span>` +
        `</div></div>`;
    };
    rowsEl.insertAdjacentHTML('beforeend', mkRow('zoning', 'Qualifica\u00e7\u00e3o do Solo', true));
    rowsEl.insertAdjacentHTML('beforeend', mkRow('ren',    'REN',                          false));
    rowsEl.insertAdjacentHTML('beforeend', mkRow('ran',    'RAN',                          false));
  }
}

export function updateDetailZoning(result) {
  const el = document.getElementById('detail-zoning-val');
  if (!el) return;
  el.style.fontStyle = 'normal';
  if (!result) { el.textContent = '\u2014'; return; }
  const label = typeof result === 'string' ? result : (result.label || '\u2014');
  const fill  = typeof result !== 'string' ? result.fill : null;
  if (fill) {
    el.innerHTML =
      `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;` +
      `background:${escHtml(fill)};margin-right:5px;vertical-align:middle"></span>` +
      escHtml(label);
  } else {
    el.textContent = label;
  }
}

export function updateDetailRow(id, value) {
  const el = document.getElementById(`detail-${id}-val`);
  if (!el) return;
  el.style.fontStyle = 'normal';
  if (value === 'Sim') {
    el.innerHTML = '<span style="color:#68d391">Sim</span>';
  } else if (value === 'N\u00e3o') {
    el.innerHTML = '<span style="color:rgba(255,255,255,0.35)">N\u00e3o</span>';
  } else {
    el.textContent = value || '\u2014';
  }
}

// ── Overlay panel builder (no-op — overlay panel removed) ────

export function buildOverlayPanel() {}

export function openLayersSheet() {}

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
