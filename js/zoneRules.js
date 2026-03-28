// PDM Cascais — Regulamento em vigor (Republicação consolidada)
// Base: Aviso 7212-B/2015 (DR n.º 124/2015, 2.ª Série, 29/06/2015)
// 1.ª Alt.: Aviso n.º 3234/2017 (DR n.º 62/2017, 28/03/2017)
// 2.ª Alt.: Aviso n.º 13041/2019 (DR n.º 156/2019)
// 3.ª Alt.: Aviso n.º 12064/2020 (DR n.º 161/2020)
// 4.ª Alt. (adequação RJIGT): Aviso n.º 20120/2023 (DR n.º 204/2023, 20/10/2023)
// Correções materiais: Aviso n.º 15687/2024 (DR n.º 145/2024, 29/07/2024)
// Full text: https://www.cascais.pt/sites/default/files/anexos/gerais/new/regulamento_pdm_em_vigor_1.pdf
//
// ─── IMPORTANT — How Cascais PDM parameters work (Art. 63.º) ────────────────
// Number of floors and cércea are NOT fixed absolute values for most zones.
// They follow the MORPHOTYPOLOGICAL MODAL VALUE of the existing street front
// (Art. 63.º, n.º 4, alínea c). `pisos` and `cercea` are therefore null for
// all zones unless a specific UOPG sets an override.
//
// Primary height constraint → `altFachada` (Altura máxima da fachada, in metres).
// `ocupacao` → Índice de Ocupação de Solo (ratio 0–1, not a percentage).
// `utilizacao` → Índice de Edificabilidade (gross floor area / plot area ratio).
// `impermeabilizacao` → Índice de Impermeabilização (ratio 0–1).
//
// Zone keys match the `Categoria` field returned by the AML pdm_revisao MapServer
// (layer 2) via identifyFeatures — the same strings used in CASCAIS_COLORS.
// ────────────────────────────────────────────────────────────────────────────

export const ZONE_RULES = {
  "Cascais": {

    // ── SOLO URBANO ─────────────────────────────────────────────────────────

    "Espaço Central": {
      label: "Espaço Central",
      // Regulamento zone: Espaço Central (Art. 65.º)
      // Fallback values apply only where no morphotypological dominance exists in
      // the street front (Art. 63.º).
      ocupacao: "0.35",          // Índice de Ocupação de Solo máx. (Art. 65.º)
      pisos: null,               // Governed by Art. 63.º morphotype rule
      cercea: null,              // Governed by Art. 63.º morphotype rule
      altFachada: "13m",         // Altura máxima da fachada — fallback (Art. 65.º)
      utilizacao: "0.55",        // Índice de Edificabilidade máx. (Art. 65.º)
      impermeabilizacao: "0.60", // Índice de Impermeabilização máx. (Art. 65.º)
      loteMin: "150m²",          // Área mínima do lote (Art. 65.º)
      source: "PDM Cascais, Art. 65.º (Aviso 7212-B/2015, alt. Aviso 20120/2023)"
    },

    "Espaço Residencial": {
      label: "Espaço Habitacional",
      // AML classification uses "Espaço Residencial"; the Cascais PDM Regulamento
      // calls this zone "Espaço Habitacional" (Art. 70.º).
      // Subcategory "Espaço Habitacional Singular e Turístico" (Art. 74.º) has
      // parameters governed by the existing alvará/loteamento licence — no fixed
      // fallback values exist for that sub-type.
      ocupacao: "0.30",          // Índice de Ocupação de Solo máx. (Art. 70.º)
      pisos: null,               // Governed by Art. 63.º morphotype rule
      cercea: null,              // Governed by Art. 63.º morphotype rule
      altFachada: "11m",         // Altura máxima da fachada — fallback (Art. 70.º)
      utilizacao: "0.50",        // Índice de Edificabilidade máx. (Art. 70.º)
      impermeabilizacao: "0.60", // Índice de Impermeabilização máx. (Art. 70.º)
      loteMin: "300m²",          // Área mínima do lote (Art. 70.º)
      // Permeabilidade mínima do logradouro by lot size (Art. 70.º):
      //   ≤ 300 m² → 15% | 300–600 m² → 25% | > 600 m² → 40%
      source: "PDM Cascais, Art. 70.º (Aviso 7212-B/2015, alt. Aviso 20120/2023)"
    },

    "Espaço de Atividades Económicas": {
      label: "Espaço de Atividades Económicas",
      // Art. 77.º (general) and Art. 79.º (Estratégico sub-type).
      // The AML layer does not distinguish between the two sub-types; parameters
      // below are for the general regime (Art. 77.º).
      // Espaço Estratégico (Art. 79.º): same ocupacao/utilizacao; altFachada 20m.
      // Industrial uses: índice volumétrico 7 m³/m² (not an edificabilidade ratio).
      // AltFachada may exceed 16m for industrial if justified by production tech.
      ocupacao: "0.50",          // Índice de Ocupação de Solo máx. (Art. 77.º)
      pisos: null,               // Governed by Art. 63.º morphotype rule
      cercea: null,              // Governed by Art. 63.º morphotype rule
      altFachada: "16m",         // Altura máxima da fachada — general (Art. 77.º)
      utilizacao: "0.60",        // Índice de Edificabilidade máx. (Art. 77.º)
      impermeabilizacao: "0.70", // Índice de Impermeabilização máx. (Art. 77.º)
      source: "PDM Cascais, Art. 77.º (geral) e Art. 79.º (Estratégico, altFachada 20m; Aviso 7212-B/2015)"
    },

    "Espaço de Atividades Económicas Proposto": {
      label: "Espaço de Atividades Económicas (Proposto)",
      // Proposed zone not yet reclassified. Until formal reclassification takes effect,
      // the Art. 77.º fallback regime applies by analogy.
      ocupacao: "0.50",
      pisos: null,
      cercea: null,
      altFachada: "16m",
      utilizacao: "0.60",
      impermeabilizacao: "0.70",
      source: "PDM Cascais, Art. 77.º por analogia (zona proposta; Aviso 7212-B/2015)"
    },

    "Espaço de Equipamento": {
      label: "Espaço de Equipamento",
      // Subcategory of Espaço de Uso Especial (Art. 84.º).
      // Art. 63.º-B allows +2 floors above modal value by Câmara Municipal deliberation.
      ocupacao: "0.60",          // Índice de Ocupação de Solo máx. (Art. 84.º)
      pisos: null,               // Governed by Art. 63.º; +2 via Art. 63.º-B deliberation
      cercea: null,              // Governed by Art. 63.º morphotype rule
      altFachada: "15m",         // Altura máxima da fachada (Art. 84.º)
      utilizacao: "1.00",        // Índice de Edificabilidade máx. (Art. 84.º)
      impermeabilizacao: "0.80", // Índice de Impermeabilização máx. (Art. 84.º)
      source: "PDM Cascais, Art. 84.º (subcategoria de Espaço de Uso Especial; Aviso 7212-B/2015)"
    },

    "Espaço de Uso Especial": {
      label: "Espaço de Uso Especial",
      // Umbrella category covering equipment, infrastructure, and other special uses.
      // Parameters below are for the equipment/infrastructure sub-type (Art. 84.º).
      // Other sub-types (e.g. defence, cemeteries) may have different regimes.
      ocupacao: "0.60",
      pisos: null,
      cercea: null,
      altFachada: "15m",
      utilizacao: "1.00",
      impermeabilizacao: "0.80",
      source: "PDM Cascais, Art. 84.º (Aviso 7212-B/2015, alt. Aviso 20120/2023)"
    },

    "Espaço de Uso Especial Proposto": {
      label: "Espaço de Uso Especial (Proposto)",
      // Proposed zone. Until reclassified, Art. 84.º applies by analogy.
      ocupacao: "0.60",
      pisos: null,
      cercea: null,
      altFachada: "15m",
      utilizacao: "1.00",
      impermeabilizacao: "0.80",
      source: "PDM Cascais, Art. 84.º por analogia (zona proposta; Aviso 7212-B/2015)"
    },

    "Espaço Verde": {
      label: "Espaço Verde",
      // Two sub-types with different regimes:
      // • Verde de Recreio e Produção (Art. 89.º): support structures only,
      //   1 piso above soleira, impermeabilização máx. 5%.
      // • Verde de Proteção e Conservação (Art. 91.º): no building permitted.
      // `pisos: 1` reflects the Recreio sub-type limit; Proteção sub-type = 0.
      ocupacao: null,
      pisos: 1,                  // Support structures only, 1 piso above soleira (Art. 89.º)
      cercea: null,
      altFachada: null,
      utilizacao: null,
      impermeabilizacao: "0.05", // Índice de Impermeabilização máx. (Art. 89.º, Recreio sub-type)
      source: "PDM Cascais, Art. 89.º (Verde de Recreio) e Art. 91.º (Verde de Proteção; Aviso 7212-B/2015)"
    },

    // ── SOLO RÚSTICO ────────────────────────────────────────────────────────

    "Espaço Natural": {
      label: "Espaço Natural",
      // Rural zones (Art. 47.º–51.º). No building as a rule (Art. 44.º, n.º 3, c).
      // Three levels:
      // • Nível 1 (Art. 47.º): only per specific statutory regimes (PNSC, POOC, etc.)
      // • Nível 2 (Art. 49.º): conservation of existing legal buildings only
      // • Nível 3 (Art. 51.º): reconstrução + ampliação up to +20% of existing floor area
      ocupacao: null,
      pisos: null,
      cercea: null,
      altFachada: null,
      utilizacao: null,
      impermeabilizacao: null,
      source: "PDM Cascais, Art. 47.º (Nível 1), Art. 49.º (Nível 2), Art. 51.º (Nível 3; Aviso 7212-B/2015)"
    },

    "Espaço de Aglomerados Rurais": {
      label: "Espaço de Aglomerados Rurais",
      // Art. 53.º: new construction only for equipment or community support services.
      // Residential reconstruction of existing buildings is permitted; no new housing plots.
      ocupacao: null,
      pisos: null,
      cercea: null,
      altFachada: null,
      utilizacao: null,
      impermeabilizacao: null,
      source: "PDM Cascais, Art. 53.º (Aviso 7212-B/2015)"
    },

    "Espaço de Ocupação Turística": {
      label: "Espaço de Ocupação Turística",
      // Rural zone. Two levels with different regimes:
      // • Nível 1 (Art. 59.º): parameters governed by existing valid alvarás — no new fixed values.
      // • Nível 2 (Art. 59.º-A): índice de edificabilidade máx. 0.20;
      //   cércea ≤ cércea of the existing historic building on the plot.
      ocupacao: null,
      pisos: null,
      cercea: null,              // Nível 2: ≤ cércea of existing historic building (Art. 59.º-A)
      altFachada: null,
      utilizacao: "0.20",        // Índice de Edificabilidade máx. — Nível 2 only (Art. 59.º-A)
      impermeabilizacao: null,
      source: "PDM Cascais, Art. 59.º (Nível 1, per alvará) e Art. 59.º-A (Nível 2; Aviso 7212-B/2015)"
    },

    "Espaço de Recursos Geológicos": {
      label: "Espaço de Recursos Geológicos",
      // Mineral/geological extraction zones. Building limited to extraction support
      // infrastructure (offices, machinery shelters). No residential or commercial use.
      ocupacao: null,
      pisos: null,
      cercea: null,
      altFachada: null,
      utilizacao: null,
      impermeabilizacao: null,
      source: "PDM Cascais, Art. 55.º (Aviso 7212-B/2015)"
    },

    // ── INFRASTRUCTURE / OTHER ───────────────────────────────────────────────

    "Espaço Canal": {
      label: "Espaço Canal",
      // Infrastructure corridor (roads, rail, utility easements).
      // No building vocation — subject to the specific infrastructure regime.
      ocupacao: null,
      pisos: null,
      cercea: null,
      altFachada: null,
      utilizacao: null,
      impermeabilizacao: null,
      source: "PDM Cascais, regime de infraestruturas/servidões (Aviso 7212-B/2015)"
    },

    "PMOT em vigor": {
      label: "PMOT em vigor",
      // Area governed by a Plano Municipal de Ordenamento do Território (Plano de
      // Urbanização or Plano de Pormenor) that supersedes the PDM for this parcel.
      // All parameters are set by that specific plan — PDM fallback does not apply.
      // Consult the applicable PMOT for the parcel in question.
      ocupacao: null,
      pisos: null,
      cercea: null,
      altFachada: null,
      utilizacao: null,
      impermeabilizacao: null,
      source: "Governed by the applicable PMOT — consult the specific plan (PDM Cascais, Art. 4.º)"
    },
  }
};
