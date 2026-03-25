// ============================================================
// CONSTANTS & CONFIG
// ============================================================

export const SINTRA_BASE         = 'https://sig.cm-sintra.pt/arcgis/rest/services/WMS_Inspire/WMS_PDM20_Ordenamento/MapServer';
export const CASCAIS_BASE        = 'https://sig.aml.pt/arcgis/rest/services/PlaneamentoOrdenamento/pdm_revisao/MapServer';
export const RAN_BASE            = 'https://sig.cm-sintra.pt/arcgis/rest/services/WMS_Inspire/WMS_SRUP_REN_RAN/MapServer';
export const REN_BASE            = 'https://sig.cm-sintra.pt/arcgis/rest/services/WMS_Inspire/WMS_SRUP_REN_CMS/MapServer';
export const CONDICIONANTES_BASE = 'https://sig.cm-sintra.pt/arcgis/rest/services/WMS_Inspire/WMS_PDM20_Condicionantes/MapServer';

// Amadora zoning — DGT CRUS WFS (public, CC BY 4.0). 82 features, GeoJSON output.
// Amadora's own ArcGIS server (geoportal.cm-amadora.pt) is auth-protected;
// DGT publishes the CRUS (Carta do Regime de Uso do Solo) derived from the 1994 PDM.
export const AMADORA_WFS = 'https://servicos.dgterritorio.pt/SDISNITWFSCRUS_1115_1/WFService.aspx?service=WFS&version=1.1.0&request=GetFeature&typeName=gmgml:CRUS_Amadora_V&outputFormat=application/vnd.geo%2Bjson&srsName=EPSG:4326';

// Almada zoning — AML PDM_I_GERACAO MapServer (1st-gen PDM, tile rendering only).
// Almada's own server is down/firewalled; Almada is NOT on pdm_revisao (2nd-gen AML server).
// PDM_I_GERACAO layer 2 has maxScale:25000 — tiles only render at zoom ≥ 15.
// Field: Classe → "Solo Rural" | "Urbanizável" | "Urbanizado".
export const AML_PDM1_BASE = 'https://sig.aml.pt/arcgis/rest/services/PlaneamentoOrdenamento/PDM_I_GERACAO/MapServer';

// Lisboa zoning — DGT CRUS WFS (public, CC BY 4.0). GeoJSON output.
// Lisboa's own ArcGIS server requires authentication; DGT publishes CRUS from the current PDM.
export const LISBOA_WFS = 'https://servicos.dgterritorio.pt/SDISNITWFSCRUS_1106_1/WFService.aspx?service=WFS&version=1.1.0&request=GetFeature&typeName=gmgml:CRUS_Lisboa_V&outputFormat=application/vnd.geo%2Bjson&srsName=EPSG:4326';

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
  'Espa\u00e7o Natural':                      { fill: '#74c69d', label: 'Natural' },
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

// Color palette for Oeiras zones (Categoria field, layer 3 — same AML server as Cascais)
export const OEIRAS_COLORS = {
  'Espa\u00e7o Canal':                                  { fill: '#555555', label: 'Canal' },
  'Espa\u00e7o Central':                                { fill: '#c1121f', label: 'Central' },
  'Espa\u00e7o Natural':                                { fill: '#74c69d', label: 'Natural' },
  'Espa\u00e7o Residencial':                            { fill: '#f4845f', label: 'Residencial' },
  'Espa\u00e7o Verde':                                  { fill: '#52b788', label: 'Verde' },
  'Espa\u00e7o de Actividades Econ\u00f3micas':         { fill: '#9b5de5', label: 'Actividades Econ\u00f3micas' },
  'Espa\u00e7o de Atividades Econ\u00f3micas':          { fill: '#9b5de5', label: 'Atividades Econ\u00f3micas' },
  'Espa\u00e7o de Equipamento':                         { fill: '#4895ef', label: 'Equipamento' },
  'Espa\u00e7o de Ocupa\u00e7\u00e3o Tur\u00edstica':  { fill: '#43aa8b', label: 'Ocupa\u00e7\u00e3o Tur\u00edstica' },
  'Espa\u00e7o de Uso Especial':                        { fill: '#e9c46a', label: 'Uso Especial' },
  'Espa\u00e7o de Uso Especial - Equipamentos':         { fill: '#4895ef', label: 'Uso Especial - Equipamentos' },
  'Espa\u00e7o de Uso Especial - Turismo':              { fill: '#43aa8b', label: 'Uso Especial - Turismo' },
  'Espa\u00e7o de Uso Especial Proposto':               { fill: '#ffe8a1', label: 'Uso Especial Proposto' },
  'Solo Rural':                                         { fill: '#74c69d', label: 'Solo Rural' },
  'Solo urbaniz\u00e1vel sem categoria associada':      { fill: '#f4a261', label: 'Solo Urbaniz\u00e1vel' },
  'PMOT em vigor':                                      { fill: '#cccccc', label: 'PMOT em vigor' },
};

// Color palette for Loures zones (Categoria field, layer 6 — same AML server as Cascais/Oeiras)
export const LOURES_COLORS = {
  'Rio Tejo':                                                  { fill: '#0070ff', label: 'Rio Tejo' },
  'Aglomerados Rurais':                                        { fill: '#003f7d', label: 'Aglomerados Rurais' },
  'Espa\u00e7o destinado a Equipamentos e Outras Estruturas':  { fill: '#4895ef', label: 'Equipamentos e Estruturas' },
  'Espa\u00e7os Afectos a Actividades Industriais':            { fill: '#884aaa', label: 'Actividades Industriais' },
  'Espa\u00e7os Afectos \u00e0 Explora\u00e7\u00e3o de Recursos Geol\u00f3gicos': { fill: '#6c757d', label: 'Recursos Geol\u00f3gicos' },
  'Espa\u00e7os Agr\u00edcolas e Florestais':                  { fill: '#1a9850', label: 'Agr\u00edcola e Florestal' },
  'Espa\u00e7os Naturais':                                     { fill: '#74c69d', label: 'Natural' },
  'Espa\u00e7os de Ocupa\u00e7\u00e3o Turistica':              { fill: '#43aa8b', label: 'Ocupa\u00e7\u00e3o Tur\u00edstica' },
  'Sistemas de Circula\u00e7\u00e3o e Mobilidade':             { fill: '#658a42', label: 'Circula\u00e7\u00e3o e Mobilidade' },
  'Solo Urbanizado':                                           { fill: '#c1121f', label: 'Solo Urbanizado' },
  'Solo Urbaniz\u00e1vel':                                     { fill: '#f4845f', label: 'Solo Urbaniz\u00e1vel' },
};

// Color palette for Amadora zones (Categoria_2021 field — DGT CRUS DR 15/2015 classification)
export const AMADORA_COLORS = {
  'Espa\u00e7o Central':                                              { fill: '#c1121f', label: 'Central' },
  'Espa\u00e7o Residencial':                                          { fill: '#f4845f', label: 'Residencial' },
  'Espa\u00e7o de Atividades Econ\u00f3micas':                        { fill: '#9b5de5', label: 'Atividades Econ\u00f3micas' },
  'Espa\u00e7o de Atividades Econ\u00f3micas e Log\u00edsticas':      { fill: '#7b2fff', label: 'At. Econ. e Log\u00edsticas' },
  'Espa\u00e7o de Uso Especial Equipamentos e Infraestruturas':       { fill: '#4895ef', label: 'Equipamentos e Infra.' },
  'Espa\u00e7o de Uso Especial Turismo e Lazer':                      { fill: '#43aa8b', label: 'Turismo e Lazer' },
  'Espa\u00e7o de Uso Especial Turismo':                              { fill: '#43aa8b', label: 'Turismo' },
  'Espa\u00e7o de Uso Especial Defesa e Seguran\u00e7a Nacional':     { fill: '#0d47a1', label: 'Defesa e Seguran\u00e7a' },
  'Espa\u00e7o Verde':                                                { fill: '#52b788', label: 'Verde' },
  'Espa\u00e7o Canal':                                                { fill: '#555555', label: 'Canal' },
  'Espa\u00e7o Natural':                                              { fill: '#74c69d', label: 'Natural' },
  'Espa\u00e7o Agr\u00edcola':                                        { fill: '#d4a017', label: 'Agr\u00edcola' },
  'Espa\u00e7o Florestal':                                            { fill: '#2d6a4f', label: 'Florestal' },
  'Espa\u00e7o de Explora\u00e7\u00e3o de Recursos Geol\u00f3gicos': { fill: '#6c757d', label: 'Recursos Geol\u00f3gicos' },
  'N\u00e3o Atribu\u00edda':                                          { fill: '#adb5bd', label: 'N\u00e3o Atribu\u00edda' },
};

// Color palette for Lisboa zones (Categoria_2021 field — DGT CRUS DR 15/2015 classification)
export const LISBOA_COLORS = {
  'Espa\u00e7o Central':                                              { fill: '#c1121f', label: 'Central' },
  'Espa\u00e7o Residencial':                                          { fill: '#f4845f', label: 'Residencial' },
  'Espa\u00e7o Habitacional':                                         { fill: '#f4845f', label: 'Habitacional' },
  'Espa\u00e7o de Atividades Econ\u00f3micas':                        { fill: '#9b5de5', label: 'Atividades Econ\u00f3micas' },
  'Espa\u00e7o de Atividades Econ\u00f3micas e Log\u00edsticas':      { fill: '#7b2fff', label: 'At. Econ. e Log\u00edsticas' },
  'Espa\u00e7o de Uso Especial Equipamentos e Infraestruturas':       { fill: '#4895ef', label: 'Equipamentos e Infra.' },
  'Espa\u00e7o de Uso Especial Turismo e Lazer':                      { fill: '#43aa8b', label: 'Turismo e Lazer' },
  'Espa\u00e7o de Uso Especial Turismo':                              { fill: '#43aa8b', label: 'Turismo' },
  'Espa\u00e7o de Uso Especial Defesa e Seguran\u00e7a Nacional':     { fill: '#0d47a1', label: 'Defesa e Seguran\u00e7a' },
  'Espa\u00e7o Verde':                                                { fill: '#52b788', label: 'Verde' },
  'Espa\u00e7o Canal':                                                { fill: '#555555', label: 'Canal' },
  'Espa\u00e7o Natural':                                              { fill: '#74c69d', label: 'Natural' },
  'Espa\u00e7o Agr\u00edcola':                                        { fill: '#d4a017', label: 'Agr\u00edcola' },
  'Espa\u00e7o Florestal':                                            { fill: '#2d6a4f', label: 'Florestal' },
  'Espa\u00e7o de Explora\u00e7\u00e3o de Recursos Geol\u00f3gicos': { fill: '#6c757d', label: 'Recursos Geol\u00f3gicos' },
  'N\u00e3o Atribu\u00edda':                                          { fill: '#adb5bd', label: 'N\u00e3o Atribu\u00edda' },
};

// Color palette for Almada zones (Classe field — PDM_I_GERACAO AML layer 2, 1st-gen DGT classification)
export const ALMADA_COLORS = {
  'Solo Rural':    { fill: '#1a9850', label: 'Solo Rural' },
  'Urbaniz\u00e1vel': { fill: '#f4a261', label: 'Solo Urbaniz\u00e1vel' },
  'Urbanizado':    { fill: '#c1121f', label: 'Solo Urbanizado' },
};

// Color palette for Vila Franca de Xira zones (Classe field — pdm_revisao AML layer 10)
export const VFX_COLORS = {
  'Solo Rural':               { fill: '#1a9850', label: 'Solo Rural' },
  'Solo Urbano':              { fill: '#c1121f', label: 'Solo Urbano' },
  'Outras Infraestruturas':   { fill: '#555555', label: 'Infraestruturas' },
  'Valores Culturais':        { fill: '#9b5de5', label: 'Valores Culturais' },
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
  { id: 'sintra',   label: 'Sintra',        center: [38.800, -9.390], zoom: 12 },
  { id: 'cascais',  label: 'Cascais',       center: [38.697, -9.422], zoom: 12 },
  { id: 'oeiras',   label: 'Oeiras',        center: [38.700, -9.300], zoom: 12 },
  { id: 'loures',   label: 'Loures',        center: [38.830, -9.165], zoom: 12 },
  { id: 'amadora',  label: 'Amadora',       center: [38.752, -9.225], zoom: 13 },
  { id: 'almada',   label: 'Almada',        center: [38.675, -9.160], zoom: 13 },
  { id: 'lisboa',   label: 'Lisboa',        center: [38.717, -9.133], zoom: 13 },
  { id: 'vfxira',   label: 'V.F. de Xira',  center: [38.955, -8.990], zoom: 12 },
];


// Overlay layer definitions — loaded lazily when toggled on
// muni: 'sintra' | 'cascais' | 'oeiras' | 'loures' | 'amadora' | 'almada' | 'lisboa' | 'vfxira' | 'both'  ('both' = all municipalities)
export const OVERLAY_DEFS = [
  // ─── Reservas (REN/RAN) ─────────────────────────────────
  { id: 'ran',          name: 'RAN \u2014 Reserva Agr\u00edcola',   group: 'Reservas (REN/RAN)',                muni: 'both',    server: RAN_BASE,            layerId: 2,   color: '#b47832', hatch: 'hatch-ran', sintraSource: { server: CONDICIONANTES_BASE, layerId: 264 }, cascaisSource: { server: CASCAIS_BASE, layerId: 12 }, sintraCachedFile: 'ran-sintra.geojson', cascaisCachedFile: 'ran-cascais.geojson' },
  { id: 'ren-cascais',  name: 'REN \u2014 Reserva Ecol\u00f3gica', group: 'Reservas (REN/RAN)',                muni: 'cascais', server: CASCAIS_BASE,        layerId: 11,  color: '#1a9850', hatch: 'hatch-ren', cachedFile: 'ren-cascais.geojson' },
  { id: 'ren-oeiras',   name: 'REN \u2014 Reserva Ecol\u00f3gica', group: 'Reservas (REN/RAN)',                muni: 'oeiras',  server: CASCAIS_BASE,        layerId: 11,  color: '#1a9850', hatch: 'hatch-ren', cachedFile: 'ren-cascais.geojson' },
  { id: 'ren-loures',   name: 'REN \u2014 Reserva Ecol\u00f3gica', group: 'Reservas (REN/RAN)',                muni: 'loures',  server: CASCAIS_BASE,        layerId: 11,  color: '#1a9850', hatch: 'hatch-ren', cachedFile: 'ren-cascais.geojson' },
  { id: 'ren-amadora',  name: 'REN \u2014 Reserva Ecol\u00f3gica', group: 'Reservas (REN/RAN)',                muni: 'amadora', server: CASCAIS_BASE,        layerId: 11,  color: '#1a9850', hatch: 'hatch-ren', cachedFile: 'ren-cascais.geojson' },
  { id: 'ren-almada',   name: 'REN \u2014 Reserva Ecol\u00f3gica', group: 'Reservas (REN/RAN)',                muni: 'almada',  server: CASCAIS_BASE,        layerId: 11,  color: '#1a9850', hatch: 'hatch-ren', cachedFile: 'ren-cascais.geojson' },
  { id: 'ren-lisboa',  name: 'REN \u2014 Reserva Ecol\u00f3gica', group: 'Reservas (REN/RAN)',                muni: 'lisboa',  server: CASCAIS_BASE,        layerId: 11,  color: '#1a9850', hatch: 'hatch-ren', cachedFile: 'ren-cascais.geojson' },
  { id: 'ren-vfxira',  name: 'REN \u2014 Reserva Ecol\u00f3gica', group: 'Reservas (REN/RAN)',                muni: 'vfxira',  server: CASCAIS_BASE,        layerId: 11,  color: '#1a9850', hatch: 'hatch-ren', cachedFile: 'ren-cascais.geojson' },
  { id: 'faixa',     name: 'Faixa Costeira',                        group: 'Reservas (REN/RAN)',                muni: 'sintra',  server: REN_BASE,             layerId: 2,   color: '#4361ee', fillOpacity: 0.35, cachedFile: 'faixa.geojson' },
  { id: 'praias',    name: 'Praias',                                 group: 'Reservas (REN/RAN)',                muni: 'sintra',  server: REN_BASE,             layerId: 3,   color: '#e9c46a', fillOpacity: 0.5,  cachedFile: 'praias.geojson' },
  // ─── Riscos Naturais ────────────────────────────────────
  { id: 'vertentes', name: 'Instabilidade de Vertentes',            group: 'Riscos Naturais',                   muni: 'sintra',  server: REN_BASE,             layerId: 12,  color: '#dc3545', hatch: 'hatch-risk-red',    cachedFile: 'vertentes.geojson' },
  { id: 'erosao',    name: 'Eros\u00e3o H\u00eddrica',              group: 'Riscos Naturais',                   muni: 'sintra',  server: REN_BASE,             layerId: 13,  color: '#e07800', hatch: 'hatch-risk-orange', cachedFile: 'erosao.geojson' },
  { id: 'mar',       name: 'Amea\u00e7a Costeira (Mar)',            group: 'Riscos Naturais',                   muni: 'sintra',  server: REN_BASE,             layerId: 11,  color: '#3a86ff', fillOpacity: 0.4,  cachedFile: 'mar.geojson' },
  { id: 'cheias',    name: 'Zonas de Cheias',                       group: 'Riscos Naturais',                   muni: 'sintra',  server: REN_BASE,             layerId: 10,  color: '#0077b6', fillOpacity: 0.4,  cachedFile: 'cheias.geojson' },
  // ─── Incêndio ───────────────────────────────────────────
  { id: 'incendio',  name: 'Perigosidade de Inc\u00eandio',         group: 'Risco de Inc\u00eandio',            muni: 'sintra',  server: CONDICIONANTES_BASE, layerId: 371, color: '#fd8d3c', categorized: 'fire' },
  // ─── Património ─────────────────────────────────────────
  { id: 'patrimonio',name: 'Bens Im\u00f3veis Classificados',       group: 'Patrim\u00f3nio e Infraestruturas', muni: 'sintra',  server: CONDICIONANTES_BASE, layerId: 299, color: '#9b5de5', fillOpacity: 0.35, cachedFile: 'patrimonio.geojson' },
  { id: 'zep',       name: 'Zona Especial de Prote\u00e7\u00e3o',  group: 'Patrim\u00f3nio e Infraestruturas', muni: 'sintra',  server: CONDICIONANTES_BASE, layerId: 302, color: '#c77dff', fillOpacity: 0.25, cachedFile: 'zep.geojson' },
  { id: 'perigosos', name: 'Equipamentos Perigosos',                 group: 'Patrim\u00f3nio e Infraestruturas', muni: 'sintra',  server: CONDICIONANTES_BASE, layerId: 368, color: '#6c757d', fillOpacity: 0.4,  cachedFile: 'perigosos.geojson' },
];
