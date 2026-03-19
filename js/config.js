// ============================================================
// CONSTANTS & CONFIG
// ============================================================

export const SINTRA_BASE         = 'https://sig.cm-sintra.pt/arcgis/rest/services/WMS_Inspire/WMS_PDM20_Ordenamento/MapServer';
export const CASCAIS_BASE        = 'https://sig.aml.pt/arcgis/rest/services/PlaneamentoOrdenamento/pdm_revisao/MapServer';
export const REN_RAN_BASE        = 'https://sig.cm-sintra.pt/arcgis/rest/services/WMS_Inspire/WMS_SRUP_REN_RAN/MapServer';
export const CONDICIONANTES_BASE = 'https://sig.cm-sintra.pt/arcgis/rest/services/WMS_Inspire/WMS_PDM20_Condicionantes/MapServer';

export const MIN_DATA_ZOOM = 1;
export const RETRY_DELAYS = [15000, 30000, 60000]; // 15 s, 30 s, 1 min

// Color palette for Sintra Urban zones (CAT field, layer 55)
export const URBAN_COLORS = {
  UC:  { fill: '#e63946', label: 'Espa\u00e7o Central' },
  UHD: { fill: '#f4845f', label: 'Habitacional Dominante' },
  UHC: { fill: '#f4a261', label: 'Habitacional Complementar' },
  UBD: { fill: '#e9c46a', label: 'Baixa Densidade Urbana' },
  UAE: { fill: '#9b5de5', label: 'Atividades Econ\u00f3micas' },
  UT:  { fill: '#43aa8b', label: 'Uso Tur\u00edstico' },
  UE:  { fill: '#4895ef', label: 'Equipamentos' },
  UI:  { fill: '#adb5bd', label: 'Infraestruturas' },
  UV:  { fill: '#2d6a4f', label: 'Verde Urbano' },
};

// Color palette for Sintra Rural zones (Ord_Categ field, layer 54)
export const RURAL_COLORS = {
  N:   { fill: '#1a9850', label: 'Espa\u00e7o Natural 1' },
  NF:  { fill: '#52b788', label: 'Espa\u00e7o Natural 2' },
  NA:  { fill: '#74c69d', label: 'Espa\u00e7o Natural 3' },
  F:   { fill: '#95d5b2', label: 'Espa\u00e7o Florestal 1' },
  FA:  { fill: '#b7e4c7', label: 'Espa\u00e7o Florestal 2' },
  A:   { fill: '#d4a017', label: 'Espa\u00e7o Agr\u00edcola' },
  EI:  { fill: '#f4a261', label: 'Equipamentos/Infraestrutura' },
  OT:  { fill: '#43aa8b', label: 'Ocupa\u00e7\u00e3o Tur\u00edstica' },
  I:   { fill: '#6a4c93', label: 'Atividades Industriais' },
  ER:  { fill: '#c77dff', label: 'Recursos Geol\u00f3gicos' },
  AR:  { fill: '#9e9e9e', label: 'Aglomerado Rural' },
};

// Color palette for Cascais zones (Categoria field, layer 2)
export const CASCAIS_COLORS = {
  'Espa\u00e7o Canal':                        { fill: '#555555', label: 'Canal' },
  'Espa\u00e7o Central':                      { fill: '#c1121f', label: 'Central' },
  'Espa\u00e7o Natural':                      { fill: '#2d6a4f', label: 'Natural' },
  'Espa\u00e7o Residencial':                  { fill: '#f4845f', label: 'Residencial' },
  'Espa\u00e7o Verde':                        { fill: '#52b788', label: 'Verde' },
  'Espa\u00e7o de Aglomerados Rurais':        { fill: '#9e9e9e', label: 'Aglomerados Rurais' },
  'Espa\u00e7o de Atividades Econ\u00f3micas':         { fill: '#9b5de5', label: 'Atividades Econ\u00f3micas' },
  'Espa\u00e7o de Atividades Econ\u00f3micas Proposto':{ fill: '#c77dff', label: 'At. Econ. Proposto' },
  'Espa\u00e7o de Equipamento':               { fill: '#4895ef', label: 'Equipamento' },
  'Espa\u00e7o de Ocupa\u00e7\u00e3o Tur\u00edstica':  { fill: '#43aa8b', label: 'Ocupa\u00e7\u00e3o Tur\u00edstica' },
  'Espa\u00e7o de Recursos Geol\u00f3gicos':  { fill: '#c77dff', label: 'Recursos Geol\u00f3gicos' },
  'Espa\u00e7o de Uso Especial':              { fill: '#e9c46a', label: 'Uso Especial' },
  'Espa\u00e7o de Uso Especial Proposto':     { fill: '#ffe8a1', label: 'Uso Especial Proposto' },
  'PMOT em vigor':                            { fill: '#cccccc', label: 'PMOT em vigor' },
};

// Fire hazard classes → colors (PMDFCI CLASSE field)
export const FIRE_COLORS = {
  'Muito baixa': '#ffffb2',
  'Baixa':       '#fecc5c',
  'M\u00e9dia':  '#fd8d3c',
  'Alta':        '#f03b20',
  'Muito alta':  '#bd0026',
};

export const MUNICIPALITIES = [
  { id: 'sintra',  label: 'Sintra',  center: [38.800, -9.390], zoom: 12 },
  { id: 'cascais', label: 'Cascais', center: [38.697, -9.422], zoom: 12 },
];

// Overlay layer definitions — loaded lazily when toggled on
// muni: 'sintra' | 'cascais' | 'both'
export const OVERLAY_DEFS = [
  // ─── Reservas (REN/RAN) ─────────────────────────────────
  { id: 'ran',        name: 'RAN \u2014 Reserva Agr\u00edcola',    group: 'Reservas (REN/RAN)',                muni: 'both',    server: REN_RAN_BASE,        layerId: 2,   color: '#b47832', hatch: 'hatch-ran', sintraSource: { server: REN_RAN_BASE, layerId: 2 }, cascaisSource: { server: CASCAIS_BASE, layerId: 12 }, sintraCachedFile: 'ran-sintra.geojson', cascaisCachedFile: 'ran-cascais.geojson' },
  // TODO: confirm layerId 1 for Sintra REN when WMS_SRUP_REN_RAN server comes back online
  { id: 'ren-sintra', name: 'REN \u2014 Reserva Ecol\u00f3gica',  group: 'Reservas (REN/RAN)',                muni: 'sintra',  server: REN_RAN_BASE,        layerId: 1,   color: '#1a9850', hatch: 'hatch-ren', cachedFile: 'ren-sintra.geojson' },
  { id: 'ren-cascais', name: 'REN \u2014 Reserva Ecol\u00f3gica', group: 'Reservas (REN/RAN)',                muni: 'cascais', server: CASCAIS_BASE,        layerId: 11,  color: '#1a9850', hatch: 'hatch-ren', cachedFile: 'ren-cascais.geojson' },
  { id: 'faixa',     name: 'Faixa Costeira',                        group: 'Reservas (REN/RAN)',                muni: 'sintra',  server: REN_RAN_BASE,        layerId: 6,   color: '#4361ee', fillOpacity: 0.35, cachedFile: 'faixa.geojson' },
  { id: 'praias',    name: 'Praias',                                 group: 'Reservas (REN/RAN)',                muni: 'sintra',  server: REN_RAN_BASE,        layerId: 7,   color: '#e9c46a', fillOpacity: 0.5,  cachedFile: 'praias.geojson' },
  // ─── Riscos Naturais ────────────────────────────────────
  { id: 'vertentes', name: 'Instabilidade de Vertentes',            group: 'Riscos Naturais',                   muni: 'sintra',  server: REN_RAN_BASE,        layerId: 16,  color: '#dc3545', hatch: 'hatch-risk-red',    cachedFile: 'vertentes.geojson' },
  { id: 'erosao',    name: 'Eros\u00e3o H\u00eddrica',              group: 'Riscos Naturais',                   muni: 'sintra',  server: REN_RAN_BASE,        layerId: 17,  color: '#e07800', hatch: 'hatch-risk-orange', cachedFile: 'erosao.geojson' },
  { id: 'mar',       name: 'Amea\u00e7a Costeira (Mar)',            group: 'Riscos Naturais',                   muni: 'sintra',  server: REN_RAN_BASE,        layerId: 15,  color: '#3a86ff', fillOpacity: 0.4,  cachedFile: 'mar.geojson' },
  { id: 'cheias',    name: 'Zonas de Cheias',                       group: 'Riscos Naturais',                   muni: 'sintra',  server: REN_RAN_BASE,        layerId: 14,  color: '#0077b6', fillOpacity: 0.4,  cachedFile: 'cheias.geojson' },
  // ─── Incêndio ───────────────────────────────────────────
  { id: 'incendio',  name: 'Perigosidade de Inc\u00eandio',         group: 'Risco de Inc\u00eandio',            muni: 'sintra',  server: CONDICIONANTES_BASE, layerId: 371, color: '#fd8d3c', categorized: 'fire' },
  // ─── Património ─────────────────────────────────────────
  { id: 'patrimonio',name: 'Bens Im\u00f3veis Classificados',       group: 'Patrim\u00f3nio e Infraestruturas', muni: 'sintra',  server: CONDICIONANTES_BASE, layerId: 299, color: '#9b5de5', fillOpacity: 0.35, cachedFile: 'patrimonio.geojson' },
  { id: 'zep',       name: 'Zona Especial de Prote\u00e7\u00e3o',  group: 'Patrim\u00f3nio e Infraestruturas', muni: 'sintra',  server: CONDICIONANTES_BASE, layerId: 302, color: '#c77dff', fillOpacity: 0.25, cachedFile: 'zep.geojson' },
  { id: 'perigosos', name: 'Equipamentos Perigosos',                 group: 'Patrim\u00f3nio e Infraestruturas', muni: 'sintra',  server: CONDICIONANTES_BASE, layerId: 368, color: '#6c757d', fillOpacity: 0.4,  cachedFile: 'perigosos.geojson' },
];
