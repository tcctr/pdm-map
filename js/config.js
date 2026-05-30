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

// Mafra zoning — DGT CRUS WFS (public, CC BY 4.0). 1709 features, GeoJSON output.
// Mafra's own ArcGIS server has TLS issues; AML pdm_revisao layer 5 blocks geometry export.
// DGT publishes CRUS from the current PDM (2023-03-13). Field: Categoria.
export const MAFRA_WFS = 'https://servicos.dgterritorio.pt/SDISNITWFSCRUS_1109_1/WFService.aspx?service=WFS&version=1.1.0&request=GetFeature&typeName=gmgml:CRUS_Mafra_V&outputFormat=application/vnd.geo%2Bjson&srsName=EPSG:4326';

// Montijo zoning — DGT CRUS WFS (public, CC BY 4.0). 532 features, GeoJSON output.
// Montijo's own server (mtgeo.mun-montijo.pt) works but splits PDM across 35 per-category layers.
// DGT WFS uses Categoria_2021 (8 values). Urban areas return Categoria_2021='Não Atribuída' —
// style/click fall back to Classe_2021 ('Solo Urbano' / 'Solo Urbano (urbanizável – transitório)').
export const MONTIJO_WFS = 'https://servicos.dgterritorio.pt/SDISNITWFSCRUS_1507_1/WFService.aspx?service=WFS&version=1.1.0&request=GetFeature&typeName=gmgml:CRUS_Montijo_V&outputFormat=application/vnd.geo%2Bjson&srsName=EPSG:4326';

// Sesimbra — DGT CRUS WFS (public). 126 features, GeoJSON output. INE code 1511.
// Urban areas (Categoria_2021='Não Atribuída') styled via Classe_2021 fallback (same as Montijo).
export const SESIMBRA_WFS = 'https://servicos.dgterritorio.pt/SDISNITWFSCRUS_1511_1/WFService.aspx?service=WFS&version=1.1.0&request=GetFeature&typeName=gmgml:CRUS_Sesimbra_V&outputFormat=application/vnd.geo%2Bjson&srsName=EPSG:4326';

// Setúbal — DGT CRUS WFS (public, CC BY 4.0). 792 features, GeoJSON output. INE code 1512.
// PDM published 2025-01-28. Field: Categoria (17 values). No 'Não Atribuída' fallback needed
// (only 2 genuinely unclassified features with Classe='Espaços não Classificados').
// sig.cm-setubal.pt is unreachable; AML pdm_revisao has no Setúbal zoning layer.
export const SETUBAL_WFS = 'https://servicos.dgterritorio.pt/SDISNITWFSCRUS_1512_1/WFService.aspx?service=WFS&version=2.0.0&request=GetFeature&typeNames=gmgml:CRUS_Setubal_V&outputFormat=application/vnd.geo%2Bjson&srsName=EPSG:4326';

// Palmela zoning — sig.cm-palmela.pt ArcGIS REST (public). 1097 features, GeoJSON export.
// Layer 17 (PDM Ordenamento polígonos) in PMOTs/MapServer. Field: tipo (43 values) for
// coloring; design for granular designation (detail panel Descricao). maxRecordCount: 50000.
export const PALMELA_BASE = 'https://sig.cm-palmela.pt/arcgis/rest/services/PMOTs/MapServer';

// Seixal zoning — sig.cm-seixal.pt hosted FeatureServer (public). 903 features, GeoJSON export.
// PDM_PO_Classificacao_Solo/FeatureServer/27. Field: designacao (9 values, requires .trim() —
// some values have trailing spaces/newlines from source data). layer field → Descricao.
export const SEIXAL_BASE = 'https://sig.cm-seixal.pt/arcgis/rest/services/Hosted/PDM_PO_Classificacao_Solo/FeatureServer';

// Odivelas zoning — DGT CRUS WFS (public, CC BY 4.0). 222 features, GeoJSON output.
// Odivelas' own ArcGIS server (sig.cm-odivelas.pt) is unreachable; AML pdm_revisao layer 8
// blocks geometry export. DGT publishes CRUS from the current PDM. Field: Categoria.
export const ODIVELAS_WFS = 'https://servicos.dgterritorio.pt/SDISNITWFSCRUS_1116_1/WFService.aspx?service=WFS&version=1.1.0&request=GetFeature&typeName=gmgml:CRUS_Odivelas_V&outputFormat=application/vnd.geo%2Bjson&srsName=EPSG:4326';

// Cadastro Predial — DGT public WMS (INSPIRE CP.CadastralParcel)
export const CADASTRO_WMS_URL = 'https://snicws.dgterritorio.gov.pt/geoserver/inspire/ows';

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

// Color palette for Alcochete zones (Classe field — PDM_I_GERACAO AML layer 2, same classification as Almada)
export const ALCOCHETE_COLORS = {
  'Solo Rural':    { fill: '#1a9850', label: 'Solo Rural' },
  'Urbaniz\u00e1vel': { fill: '#f4a261', label: 'Solo Urbaniz\u00e1vel' },
  'Urbanizado':    { fill: '#c1121f', label: 'Solo Urbanizado' },
};

// Color palette for Barreiro zones (Classe field — PDM_I_GERACAO AML layer 2, same 3-value schema as Almada/Alcochete)
export const BARREIRO_COLORS = {
  'Solo Rural':    { fill: '#1a9850', label: 'Solo Rural' },
  'Urbaniz\u00e1vel': { fill: '#f4a261', label: 'Solo Urbaniz\u00e1vel' },
  'Urbanizado':    { fill: '#c1121f', label: 'Solo Urbanizado' },
};

// Color palette for Mafra zones (Categoria field — DGT CRUS WFS, 2023 PDM)
export const MAFRA_COLORS = {
  'Aglomerado Rural':                                         { fill: '#9e9e9e', label: 'Aglomerado Rural' },
  '\u00c1rea de Edifica\u00e7\u00e3o Dispersa':              { fill: '#f4a261', label: 'Edif. Dispersa' },
  'Espa\u00e7o Agr\u00edcola':                               { fill: '#d4a017', label: 'Agr\u00edcola' },
  'Espa\u00e7o Florestal':                                   { fill: '#2d6a4f', label: 'Florestal' },
  'Espa\u00e7o Habitacional':                                { fill: '#f4845f', label: 'Habitacional' },
  'Espa\u00e7o Natural e Paisag\u00edstico':                 { fill: '#74c69d', label: 'Natural e Paisag.' },
  'Espa\u00e7o Verde':                                       { fill: '#52b788', label: 'Verde' },
  'Espa\u00e7o de Atividades Econ\u00f3micas':               { fill: '#9b5de5', label: 'Atividades Econ.' },
  'Espa\u00e7o de Atividades Industriais':                   { fill: '#884aaa', label: 'Atividades Industriais' },
  'Espa\u00e7o de Equipamentos e Infraestruturas':           { fill: '#4895ef', label: 'Equipamentos e Infra.' },
  'Espa\u00e7o de Explora\u00e7\u00e3o de Recursos Energ\u00e9ticos e Geol\u00f3gicos': { fill: '#6c757d', label: 'Recursos Energ. e Geol.' },
  'Espa\u00e7o de Uso Especial Equipamentos e Infraestruturas': { fill: '#0d47a1', label: 'Uso Esp. Equip. e Infra.' },
};

// Color palette for Odivelas zones (Categoria field — AML pdm_revisao layer 8)
export const ODIVELAS_COLORS = {
  'Urbanizado - Central - N1':                                               { fill: '#c1121f', label: 'Urbanizado Central' },
  'Urbanizado - Central - N2':                                               { fill: '#c1121f', label: 'Urbanizado Central' },
  'Urbanizado - Residencial - N1':                                           { fill: '#f4845f', label: 'Urbanizado Residencial' },
  'Urbanizado - Residencial - N2':                                           { fill: '#f4845f', label: 'Urbanizado Residencial' },
  'Urbanizado - Residencial - N3':                                           { fill: '#f4845f', label: 'Urbanizado Residencial' },
  'Urbanizado Actividades Economicas':                                       { fill: '#9b5de5', label: 'Ativ. Econ\u00f3micas' },
  'Urbanizado Actividades Economicas Requalificar':                          { fill: '#9b5de5', label: 'Ativ. Econ. Requalificar' },
  'Urbanizado Espaco de Uso Especial - Equipamentos e Infraestruturas':      { fill: '#4895ef', label: 'Equipamentos e Infra.' },
  'Urbanizado Residencial Reconverter':                                      { fill: '#f4845f', label: 'Residencial Reconverter' },
  'Urbanizado Verde':                                                        { fill: '#52b788', label: 'Verde Urbano' },
  'Urbanizavel - Central - N1':                                              { fill: '#e05c5c', label: 'Urbaniz\u00e1vel Central' },
  'Urbanizavel - Central - N2':                                              { fill: '#e05c5c', label: 'Urbaniz\u00e1vel Central' },
  'Urbanizavel - Residencial - N1':                                          { fill: '#f4a261', label: 'Urbaniz\u00e1vel Residencial' },
  'Urbanizavel - Residencial - N2':                                          { fill: '#f4a261', label: 'Urbaniz\u00e1vel Residencial' },
  'Urbanizavel Actividades Economicas':                                      { fill: '#c77dff', label: 'Urbaniz\u00e1vel Ativ. Econ.' },
  'Urbanizavel Verde':                                                       { fill: '#95d5b2', label: 'Urbaniz\u00e1vel Verde' },
  'Aglomerado Rural':                                                        { fill: '#74c69d', label: 'Aglomerado Rural' },
  'Agro - pastoril':                                                         { fill: '#d4a017', label: 'Agro-Pastoril' },
  'Florestal Producao':                                                      { fill: '#2d6a4f', label: 'Florestal' },
  'Naturalizado Proteccao ou Enquadramento':                                 { fill: '#1a9850', label: 'Natural/Prote\u00e7\u00e3o' },
  'Equipamentos e Outras Estruturas':                                        { fill: '#adb5bd', label: 'Equipamentos' },
};

// Color palette for Montijo zones (Categoria_2021 + Classe_2021 fallback — DGT CRUS WFS 1507)
// Urban areas arrive as Categoria_2021='Não Atribuída'; style/click resolve via Classe_2021.
export const MONTIJO_COLORS = {
  // Categoria_2021 (DGT WFS DR 15/2015 harmonized classification)
  'Espa\u00e7o Agr\u00edcola':                                { fill: '#d4a017', label: 'Agr\u00edcola' },
  'Espa\u00e7o Florestal':                                    { fill: '#2d6a4f', label: 'Florestal' },
  'Espa\u00e7o Natural e Paisag\u00edstico':                  { fill: '#74c69d', label: 'Natural e Paisag.' },
  'Espa\u00e7o de Atividades Econ\u00f3micas':                { fill: '#9b5de5', label: 'Atividades Econ.' },
  'Espa\u00e7o de Atividades Industriais':                    { fill: '#884aaa', label: 'Atividades Industriais' },
  'Espa\u00e7o Verde':                                        { fill: '#52b788', label: 'Verde' },
  'Espa\u00e7o de Equipamentos e Infraestruturas':            { fill: '#4895ef', label: 'Equipamentos e Infra.' },
  // Classe_2021 fallbacks for Categoria_2021 = 'Não Atribuída' (urban areas in 1997 PDM)
  'Solo Urbano':                                              { fill: '#c1121f', label: 'Urbano' },
  'Solo Urbano (urbaniz\u00e1vel \u2013 transit\u00f3rio)':   { fill: '#f4845f', label: 'Urbaniz\u00e1vel' },
};

// Color palette for Sesimbra zones (Categoria_2021 field — DGT CRUS WFS 1511_1)
// 10 distinct Categoria_2021 values after trim(). PDM origin: 1998-02-02 (1:25000).
// 'Não Atribuída' (55 features: 54 Solo Urbano + 1 Solo Rústico) uses Classe_2021 fallback.
// Trailing spaces on 'Espaço de Atividades Industriais ' and 'Espaço de Equipamentos e Infraestruturas ' — pre-trimmed.
export const SESIMBRA_COLORS = {
  'Espa\u00e7o de Uso Especial Equipamentos e Infraestruturas': { fill: '#4895ef', label: 'Equip. Espec.' },
  'Espa\u00e7o de Equipamentos e Infraestruturas':              { fill: '#457b9d', label: 'Equipamentos e Infra.' },
  'Espa\u00e7o Agr\u00edcola':                                  { fill: '#d4a017', label: 'Agr\u00edcola' },
  'Espa\u00e7o Florestal':                                      { fill: '#2d6a4f', label: 'Florestal' },
  'Espa\u00e7o de Uso Especial - Tur\u00edstico':               { fill: '#fb8500', label: 'Tur\u00edstico' },
  'Espa\u00e7o de Atividades Industriais':                      { fill: '#884aaa', label: 'Industrial' },
  'Espa\u00e7o de Atividades Econ\u00f3micas':                  { fill: '#9b5de5', label: 'Atividades Econ.' },
  'Espa\u00e7o de Explora\u00e7\u00e3o de Recursos Energ\u00e9ticos e Geol\u00f3gicos': { fill: '#b8860b', label: 'Rec. Energ./Geol.' },
  'Espa\u00e7o Natural e Paisag\u00edstico':                    { fill: '#74c69d', label: 'Natural e Paisag.' },
  // Classe_2021 fallbacks for Categoria_2021 = 'Não Atribuída'
  'Solo Urbano':                                                { fill: '#c1121f', label: 'Urbano' },
};

// Color palette for Setúbal zones (Categoria field — DGT CRUS WFS 1512_1, 2025 PDM)
// 17 Categoria values. 'Não Atribuída' (2 features, Classe='Espaços não Classificados') → gray.
export const SETUBAL_COLORS = {
  'Espa\u00e7o Central':                                                                        { fill: '#c1121f', label: 'Central' },
  'Espa\u00e7o Habitacional':                                                                   { fill: '#f4845f', label: 'Habitacional' },
  'Espa\u00e7o Urbano de Baixa Densidade':                                                      { fill: '#e9c46a', label: 'Baixa Densidade' },
  '\u00c1rea de Edifica\u00e7\u00e3o Dispersa':                                                { fill: '#f4a261', label: 'Edif. Dispersa' },
  'Aglomerado Rural':                                                                            { fill: '#9e9e9e', label: 'Aglomerado Rural' },
  'Espa\u00e7o Verde':                                                                          { fill: '#52b788', label: 'Verde' },
  'Espa\u00e7o Natural e Paisag\u00edstico':                                                   { fill: '#74c69d', label: 'Natural e Paisag.' },
  'Espa\u00e7o Agr\u00edcola':                                                                  { fill: '#d4a017', label: 'Agr\u00edcola' },
  'Espa\u00e7o Florestal':                                                                      { fill: '#2d6a4f', label: 'Florestal' },
  'Espa\u00e7o de Atividades Econ\u00f3micas':                                                 { fill: '#9b5de5', label: 'Atividades Econ.' },
  'Espa\u00e7o de Atividades Industriais':                                                      { fill: '#884aaa', label: 'Atividades Industriais' },
  'Espa\u00e7o de Uso Especial Equipamentos e Infraestruturas':                                 { fill: '#4895ef', label: 'Equip. Especial' },
  'Espa\u00e7o de Equipamentos e Infraestruturas':                                              { fill: '#457b9d', label: 'Equipamentos e Infra.' },
  'Espa\u00e7o de Uso Especial - Tur\u00edstico':                                              { fill: '#fb8500', label: 'Tur\u00edstico Espec.' },
  'Espa\u00e7o de Ocupa\u00e7\u00e3o Tur\u00edstica':                                         { fill: '#43aa8b', label: 'Ocupa\u00e7\u00e3o Tur\u00edstica' },
  'Espa\u00e7o de Explora\u00e7\u00e3o de Recursos Energ\u00e9ticos e Geol\u00f3gicos':       { fill: '#6c757d', label: 'Rec. Energ./Geol.' },
  'N\u00e3o Atribu\u00edda':                                                                    { fill: '#adb5bd', label: 'N\u00e3o Atribu\u00edda' },
};

// Color palette for Seixal zones (designacao field — sig.cm-seixal.pt FeatureServer/27)
// 9 distinct designacao values after trim(). Source data has trailing spaces/newlines on
// 'Espaço Natural', 'Espaço de Exploração de Recursos Geológicos', 'Solo Urbano - Urbanizável'.
export const SEIXAL_COLORS = {
  'Espa\u00e7o Residencial':                                                   { fill: '#c1121f', label: 'Residencial' },
  'Espa\u00e7o Urbano de Baixa Densidade':                                     { fill: '#f4845f', label: 'Baixa Densidade' },
  'Espa\u00e7o de Actividades Econ\u00f3micas':                                { fill: '#9b5de5', label: 'Atividades Econ.' },
  'Espa\u00e7o Uso Especial - Equipamentos e Infraestruturas':                 { fill: '#4895ef', label: 'Equipamentos e Infra.' },
  'Espa\u00e7o Verde':                                                         { fill: '#52b788', label: 'Verde' },
  'Espa\u00e7o Agr\u00edcola ou Florestal':                                    { fill: '#d4a017', label: 'Agr\u00edcola/Florestal' },
  'Espa\u00e7o Natural':                                                       { fill: '#74c69d', label: 'Natural' },
  'Espa\u00e7o de Explora\u00e7\u00e3o de Recursos Geol\u00f3gicos':          { fill: '#b8860b', label: 'Rec. Geol\u00f3gicos' },
  'Espa\u00e7o de Ocupa\u00e7\u00e3oTur\u00edstica':                          { fill: '#fb8500', label: 'Tur\u00edstico' },
};

// Color palette for Palmela zones (tipo field — sig.cm-palmela.pt PMOTs/17)
// 1997 PDM (43 tipo values). tipo is the broad category for coloring;
// design is the granular sub-designation shown in the detail panel as Descricao.
// Blank tipo (' ') = "Compromissos" (approved plans overlaid on zoning).
// Includes PNA/RNES protected-area sub-zones and PGRI flood-risk zones embedded in the layer.
export const PALMELA_COLORS = {
  // ── Urbano ─────────────────────────────────────────────────
  'Espa\u00e7os Urbanos':                                                                                                                 { fill: '#c1121f', label: 'Urbano' },
  'Espa\u00e7os Urbaniz\u00e1veis - Habitacionais Alta Densidade':                                                                        { fill: '#e63946', label: 'Hab. Alta Densidade' },
  'Espa\u00e7os Urbaniz\u00e1veis - Habitacionais M\u00e9dia Densidade':                                                                   { fill: '#f4845f', label: 'Hab. M\u00e9dia Densidade' },
  'Espa\u00e7os Urbaniz\u00e1veis - Habitacionais Baixa Densidade':                                                                       { fill: '#f7a07a', label: 'Hab. Baixa Densidade' },
  'Espa\u00e7os de Recupera\u00e7\u00e3o e Reconvers\u00e3o Urban\u00edstica - \u00c1reas Constitu\u00eddas em Avos':                      { fill: '#e8a0a0', label: 'Recup. Urban. (Avos)' },
  'Espa\u00e7os de Recupera\u00e7\u00e3o e Reconvers\u00e3o Urban\u00edstica - \u00c1reas Fraccionadas em 0,5 ha':                         { fill: '#e8b4b4', label: 'Recup. Urban. (0,5 ha)' },
  'Espa\u00e7os de Recupera\u00e7\u00e3o e Reconvers\u00e3o Urban\u00edstica - \u00c1reas Fraccionadas N\u00e3o Urbanizadas':              { fill: '#f0c8c8', label: 'Recup. Urban. (N\u00e3o Urb.)' },
  'Espa\u00e7os Urbaniz\u00e1veis - \u00c1rea Verde Livre Urbana':                                                                         { fill: '#52b788', label: 'Verde Urbano' },
  'Espa\u00e7os Urbaniz\u00e1veis - Verde de Recreio e Lazer':                                                                            { fill: '#40916c', label: 'Verde de Recreio' },
  // ── Industrial ─────────────────────────────────────────────
  'Espa\u00e7os Industriais - Existentes':                                                                                                 { fill: '#9b5de5', label: 'Industrial Existente' },
  'Espa\u00e7os Industriais - Previstos':                                                                                                  { fill: '#b77ae8', label: 'Industrial Previsto' },
  'Espa\u00e7os Urbaniz\u00e1veis - Industriais Existentes':                                                                              { fill: '#7b3fbf', label: 'Urb. Industrial Exist.' },
  'Espa\u00e7os Urbaniz\u00e1veis - Industriais Previstos':                                                                               { fill: '#a060c8', label: 'Urb. Industrial Prev.' },
  // ── Tur\u00edstico ────────────────────────────────────────────
  'Espa\u00e7os de Ocupa\u00e7\u00e3o Tur\u00edstica':                                                                                     { fill: '#fb8500', label: 'Ocupa\u00e7\u00e3o Tur\u00edstica' },
  'Unidades Territoriais de Voca\u00e7\u00e3o Tur\u00edstica':                                                                            { fill: '#ffb703', label: 'Voca\u00e7\u00e3o Tur\u00edstica' },
  // ── Agr\u00edcola / Agroflorestal ─────────────────────────────
  'Espa\u00e7os Agr\u00edcolas Cat. I':                                                                                                    { fill: '#d4a017', label: 'Agr\u00edcola Cat. I' },
  'Espa\u00e7os Agr\u00edcolas Cat. II':                                                                                                   { fill: '#c8b040', label: 'Agr\u00edcola Cat. II' },
  'Espa\u00e7os Agro-florestais Cat. I':                                                                                                   { fill: '#b8860b', label: 'Agroflorestal Cat. I' },
  'Espa\u00e7os Agro-florestais Cat. II':                                                                                                  { fill: '#c49020', label: 'Agroflorestal Cat. II' },
  'Espa\u00e7os Agro-florestais Cat. III':                                                                                                 { fill: '#d4a830', label: 'Agroflorestal Cat. III' },
  // ── Florestal / Natural ─────────────────────────────────────
  'Espa\u00e7os Florestais':                                                                                                               { fill: '#2d6a4f', label: 'Florestal' },
  'Espa\u00e7os Naturais':                                                                                                                 { fill: '#74c69d', label: 'Natural' },
  'Espa\u00e7os Naturais - Linhas de \u00c1gua (10m para cada lado)':                                                                     { fill: '#4895ef', label: 'Linha de \u00c1gua' },
  'Espa\u00e7os Naturais e Culturais - Cultural':                                                                                          { fill: '#7b2d8b', label: 'Natural/Cultural' },
  'Espa\u00e7os Naturais e Culturais - Parque Natural da Arr\u00e1bida (PNA)':                                                            { fill: '#1a9850', label: 'Parque Arr\u00e1bida' },
  'Espa\u00e7os Naturais e Culturais - Reserva Natural do Estu\u00e1rio do Sado (RNES)':                                                  { fill: '#006d77', label: 'Reserva Est. Sado' },
  // ── \u00c1reas Protegidas PNA ─────────────────────────────────
  'PNA - Prote\u00e7\u00e3o Complementar Tipo I':                                                                                          { fill: '#339933', label: 'PNA Compl. I' },
  'PNA - Prote\u00e7\u00e3o Complementar Tipo II':                                                                                         { fill: '#55aa55', label: 'PNA Compl. II' },
  'PNA - Prote\u00e7\u00e3o Parcial Tipo I':                                                                                               { fill: '#77bb77', label: 'PNA Parcial I' },
  'PNA - Prote\u00e7\u00e3o Parcial Tipo II':                                                                                              { fill: '#99cc99', label: 'PNA Parcial II' },
  // ── \u00c1reas Protegidas RNES ─────────────────────────────────
  'RNES - Prote\u00e7\u00e3o Complementar Tipo I':                                                                                         { fill: '#0092a3', label: 'RNES Compl. I' },
  'RNES - Prote\u00e7\u00e3o Complementar Tipo II':                                                                                        { fill: '#22b2cf', label: 'RNES Compl. II' },
  'RNES - Prote\u00e7\u00e3o Parcial Tipo I':                                                                                              { fill: '#55c8de', label: 'RNES Parcial I' },
  'RNES - Prote\u00e7\u00e3o Parcial Tipo II':                                                                                             { fill: '#88d8e8', label: 'RNES Parcial II' },
  'RNES - Prote\u00e7\u00e3o Total':                                                                                                       { fill: '#003f5c', label: 'RNES Total' },
  // ── Risco de Inunda\u00e7\u00e3o PGRI ──────────────────────────
  'PGRI - \u00c1reas de Risco Potencial Significativo de Inunda\u00e7\u00e3o - Perigosidade Alta - Muito Alta': { fill: '#023e8a', label: 'Inund. Alta' },
  'PGRI - \u00c1reas de Risco Potencial Significativo de Inunda\u00e7\u00e3o - Perigosidade M\u00e9dia':       { fill: '#0077b6', label: 'Inund. M\u00e9dia' },
  'PGRI - \u00c1reas de Risco Potencial Significativo de Inunda\u00e7\u00e3o - Perigosidade Muito Baixa - Baixa': { fill: '#00b4d8', label: 'Inund. Baixa' },
  // ── Infraestrutura / Outros ─────────────────────────────────
  'Espa\u00e7os Canais':                                                                                                                   { fill: '#555555', label: 'Canais' },
  'Aterro Controlado':                                                                                                                     { fill: '#666666', label: 'Aterro Controlado' },
  'Unidades Operativas de Planeamento e Gest\u00e3o - \u00c1reas Apoiadas no Eixo Industrial da EN252':        { fill: '#886644', label: 'UOPG Eixo Industrial' },
  'Unidades Operativas de Planeamento e Gest\u00e3o - Zona Poente':                                                                       { fill: '#997755', label: 'UOPG Zona Poente' },
  ' ':                                                                                                                                     { fill: '#adb5bd', label: 'Compromissos' },
};

// Color palette for Moita zones (Categoria field — pdm_revisao AML layer 4)
// 1st-generation PDM classification (pre-DR 15/2015). No scale restriction (minScale/maxScale both 0).
export const MOITA_COLORS = {
  'Solo urbanizado':                                    { fill: '#c1121f', label: 'Solo Urbanizado' },
  'Solo urbanizado programado':                         { fill: '#f4845f', label: 'Urbanizado Programado' },
  'Solo urbanizado - Solo urbanizado programado':       { fill: '#e05c5c', label: 'Urbanizado/Programado' },
  'Espa\u00e7os agr\u00edcolas periurbanos':            { fill: '#d4a017', label: 'Agr\u00edcola Periurbano' },
  'Espa\u00e7os agro-pecu\u00e1rios':                  { fill: '#a0785a', label: 'Agro-Pecu\u00e1rio' },
  'Rio Tejo':                                           { fill: '#0070ff', label: 'Rio Tejo' },
  'Geral':                                              { fill: '#adb5bd', label: 'Geral' },
  'N\u00e3o disponibilizado':                           { fill: '#888888', label: 'N\u00e3o Disponibilizado' },
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
  { id: 'barreiro', label: 'Barreiro',      center: [38.663, -9.073], zoom: 13 },
  { id: 'lisboa',   label: 'Lisboa',        center: [38.717, -9.133], zoom: 13 },
  { id: 'vfxira',   label: 'V.F. de Xira',  center: [38.955, -8.990], zoom: 12 },
  { id: 'mafra',         label: 'Mafra',         center: [38.965, -9.295], zoom: 12 },
  { id: 'odivelas',      label: 'Odivelas',      center: [38.793, -9.176], zoom: 13 },
  { id: 'alcochete',     label: 'Alcochete',     center: [38.717, -8.917], zoom: 12 },
  { id: 'moita',         label: 'Moita',         center: [38.638, -8.990], zoom: 13 },
  { id: 'montijo',       label: 'Montijo',       center: [38.706, -8.975], zoom: 12 },
  { id: 'palmela',       label: 'Palmela',       center: [38.556, -8.900], zoom: 11 },
  { id: 'seixal',        label: 'Seixal',        center: [38.625, -9.095], zoom: 12 },
  { id: 'sesimbra',      label: 'Sesimbra',      center: [38.490, -9.095], zoom: 12 },
  { id: 'setubal',       label: 'Set\u00fabal',       center: [38.518, -8.894], zoom: 11 },
  { id: 'grande-lisboa', label: 'AML', center: [38.756, -9.208], zoom: 10 },
];


// Overlay layer definitions — loaded lazily when toggled on
// muni: 'sintra' | 'cascais' | 'oeiras' | 'loures' | 'amadora' | 'almada' | 'barreiro' | 'lisboa' | 'vfxira' | 'mafra' | 'odivelas' | 'alcochete' | 'setubal' | 'both'  ('both' = all municipalities)
export const OVERLAY_DEFS = [
  // ─── Cadastro Predial ────────────────────────────────────
  { id: 'cadastro', name: 'Cadastro Predial', group: 'Cadastro', muni: 'both', color: '#4299e1', categorized: 'wms', wmsUrl: CADASTRO_WMS_URL, wmsLayers: 'cadastralparcel', wmsFormat: 'image/png', opacity: 0.85,
    sldBody: '<StyledLayerDescriptor version="1.0.0" xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><NamedLayer><Name>cadastralparcel</Name><UserStyle><FeatureTypeStyle><Rule><PolygonSymbolizer><Fill><CssParameter name="fill">#bee3f8</CssParameter><CssParameter name="fill-opacity">0.5</CssParameter></Fill><Stroke><CssParameter name="stroke">#4299e1</CssParameter><CssParameter name="stroke-width">0.8</CssParameter></Stroke></PolygonSymbolizer></Rule></FeatureTypeStyle></UserStyle></NamedLayer></StyledLayerDescriptor>' },
  // ─── Reservas (REN/RAN) ─────────────────────────────────
  { id: 'ran',          name: 'RAN \u2014 Reserva Agr\u00edcola',   group: 'Reservas (REN/RAN)',                muni: 'both',    server: RAN_BASE,            layerId: 2,   color: '#b47832', hatch: 'hatch-ran', sintraSource: { server: CONDICIONANTES_BASE, layerId: 264 }, cascaisSource: { server: CASCAIS_BASE, layerId: 12 }, sintraCachedFile: 'ran-sintra.geojson', cascaisCachedFile: 'ran-cascais.geojson' },
  { id: 'ren-cascais',  name: 'REN \u2014 Reserva Ecol\u00f3gica', group: 'Reservas (REN/RAN)',                muni: 'cascais', server: CASCAIS_BASE,        layerId: 11,  color: '#1a9850', hatch: 'hatch-ren', cachedFile: 'ren-cascais.geojson' },
  { id: 'ren-oeiras',   name: 'REN \u2014 Reserva Ecol\u00f3gica', group: 'Reservas (REN/RAN)',                muni: 'oeiras',  server: CASCAIS_BASE,        layerId: 11,  color: '#1a9850', hatch: 'hatch-ren', cachedFile: 'ren-cascais.geojson' },
  { id: 'ren-loures',   name: 'REN \u2014 Reserva Ecol\u00f3gica', group: 'Reservas (REN/RAN)',                muni: 'loures',  server: CASCAIS_BASE,        layerId: 11,  color: '#1a9850', hatch: 'hatch-ren', cachedFile: 'ren-cascais.geojson' },
  { id: 'ren-amadora',  name: 'REN \u2014 Reserva Ecol\u00f3gica', group: 'Reservas (REN/RAN)',                muni: 'amadora', server: CASCAIS_BASE,        layerId: 11,  color: '#1a9850', hatch: 'hatch-ren', cachedFile: 'ren-cascais.geojson' },
  { id: 'ren-almada',   name: 'REN \u2014 Reserva Ecol\u00f3gica', group: 'Reservas (REN/RAN)',                muni: 'almada',  server: CASCAIS_BASE,        layerId: 11,  color: '#1a9850', hatch: 'hatch-ren', cachedFile: 'ren-cascais.geojson' },
  { id: 'ren-lisboa',  name: 'REN \u2014 Reserva Ecol\u00f3gica', group: 'Reservas (REN/RAN)',                muni: 'lisboa',  server: CASCAIS_BASE,        layerId: 11,  color: '#1a9850', hatch: 'hatch-ren', cachedFile: 'ren-cascais.geojson' },
  { id: 'ren-vfxira',  name: 'REN \u2014 Reserva Ecol\u00f3gica', group: 'Reservas (REN/RAN)',                muni: 'vfxira',  server: CASCAIS_BASE,        layerId: 11,  color: '#1a9850', hatch: 'hatch-ren', cachedFile: 'ren-cascais.geojson' },
  { id: 'ren-mafra',          name: 'REN \u2014 Reserva Ecol\u00f3gica', group: 'Reservas (REN/RAN)',                muni: 'mafra',          server: CASCAIS_BASE,        layerId: 11,  color: '#1a9850', hatch: 'hatch-ren', cachedFile: 'ren-cascais.geojson' },
  { id: 'ren-odivelas',      name: 'REN \u2014 Reserva Ecol\u00f3gica', group: 'Reservas (REN/RAN)',                muni: 'odivelas',       server: CASCAIS_BASE,        layerId: 11,  color: '#1a9850', hatch: 'hatch-ren', cachedFile: 'ren-cascais.geojson' },
  { id: 'ren-alcochete',     name: 'REN \u2014 Reserva Ecol\u00f3gica', group: 'Reservas (REN/RAN)',                muni: 'alcochete',      server: CASCAIS_BASE,        layerId: 11,  color: '#1a9850', hatch: 'hatch-ren', cachedFile: 'ren-cascais.geojson' },
  { id: 'ren-barreiro',     name: 'REN \u2014 Reserva Ecol\u00f3gica', group: 'Reservas (REN/RAN)',                muni: 'barreiro',       server: CASCAIS_BASE,        layerId: 11,  color: '#1a9850', hatch: 'hatch-ren', cachedFile: 'ren-cascais.geojson' },
  { id: 'ren-moita',        name: 'REN \u2014 Reserva Ecol\u00f3gica', group: 'Reservas (REN/RAN)',                muni: 'moita',          server: CASCAIS_BASE,        layerId: 11,  color: '#1a9850', hatch: 'hatch-ren', cachedFile: 'ren-cascais.geojson' },
  { id: 'ren-montijo',      name: 'REN \u2014 Reserva Ecol\u00f3gica', group: 'Reservas (REN/RAN)',                muni: 'montijo',        server: CASCAIS_BASE,        layerId: 11,  color: '#1a9850', hatch: 'hatch-ren', cachedFile: 'ren-cascais.geojson' },
  { id: 'ren-palmela',      name: 'REN \u2014 Reserva Ecol\u00f3gica', group: 'Reservas (REN/RAN)',                muni: 'palmela',        server: CASCAIS_BASE,        layerId: 11,  color: '#1a9850', hatch: 'hatch-ren', cachedFile: 'ren-cascais.geojson' },
  { id: 'ren-seixal',       name: 'REN \u2014 Reserva Ecol\u00f3gica', group: 'Reservas (REN/RAN)',                muni: 'seixal',         server: CASCAIS_BASE,        layerId: 11,  color: '#1a9850', hatch: 'hatch-ren', cachedFile: 'ren-cascais.geojson' },
  { id: 'ren-sesimbra',     name: 'REN \u2014 Reserva Ecol\u00f3gica', group: 'Reservas (REN/RAN)',                muni: 'sesimbra',       server: CASCAIS_BASE,        layerId: 11,  color: '#1a9850', hatch: 'hatch-ren', cachedFile: 'ren-cascais.geojson' },
  { id: 'ren-setubal',      name: 'REN \u2014 Reserva Ecol\u00f3gica', group: 'Reservas (REN/RAN)',                muni: 'setubal',        server: CASCAIS_BASE,        layerId: 11,  color: '#1a9850', hatch: 'hatch-ren', cachedFile: 'ren-cascais.geojson' },
  { id: 'ren-grande-lisboa', name: 'REN \u2014 Reserva Ecol\u00f3gica', group: 'Reservas (REN/RAN)',                muni: 'grande-lisboa',  server: CASCAIS_BASE,        layerId: 11,  color: '#1a9850', hatch: 'hatch-ren', cachedFile: 'ren-cascais.geojson' },
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
