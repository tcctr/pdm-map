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
  },

  // ════════════════════════════════════════════════════════════════════════════
  // SINTRA
  // PDM Sintra — Regulamento em vigor
  // Ratificado por Resolução do Conselho de Ministros n.º 7-B/2020 (DR 1.ª série,
  // n.º 35, 20/02/2020). Correções materiais: Aviso n.º 21777/2021 (DR 2.ª série,
  // 18/11/2021).
  // Full text: https://cm-sintra.pt/phocadownload/PDF/PDM/PDM_Regulamento.pdf
  //
  // KEY STRUCTURAL NOTE (Art. 98, 99, 101):
  // For Espaços Centrais (UC), Habitacionais (UHD, UHC), and Atividades
  // Económicas (UAE), building height and floor count follow the VALOR MODAL
  // of the existing street front — no fixed absolute values are prescribed.
  // Fixed numeric parameters only exist for UBD, UT, UE, and all rural zones.
  //
  // The universal abstract Iu (Índice de utilização) = 0,1 applies across the
  // whole municipality as a perequation baseline (Art. 86). Zone-level entries
  // below show the CONCRETE edificabilidade (above the abstract baseline).
  //
  // Zone keys = CAT field (urban, layer 55) and Ord_Categ field (rural, layer 54)
  // as used in the app's URBAN_COLORS / RURAL_COLORS lookup tables.
  // ════════════════════════════════════════════════════════════════════════════
  "Sintra": {

    // ── SOLO URBANO ──────────────────────────────────────────────────────────

    "UC": {
      label: "Espaços Centrais",
      ocupacao: null,
      utilizacao: null,     // Governed by valor modal of street front (Art. 98)
      altFachada: null,          // Governed by valor modal of street front (Art. 67, 98)
      impermeabilizacao: null,
      permeabilidadeMin: null,
      nota: "Altura e edificabilidade seguem o VALOR MODAL da frente urbana (Art. 67 e 98). Sem parâmetros numéricos fixos para zonas consolidadas. +3,5 m admitido para piso recuado/sótão acima da cércea modal.",
      source: "PDM Sintra, Art. 73.º e 98.º (RCM n.º 7-B/2020)"
    },

    "UHD": {
      label: "Espaços Habitacionais 1 (Plurifamiliar)",
      ocupacao: null,
      utilizacao: null,     // Governed by valor modal (Art. 99)
      altFachada: null,          // Governed by valor modal (Art. 67, 99)
      impermeabilizacao: null,
      permeabilidadeMin: "0.30", // Mínimo de permeabilidade do logradouro (Art. 99)
      nota: "Altura e edificabilidade seguem o VALOR MODAL da frente urbana (Art. 67 e 99). Edifícios plurifamiliares; zona urbana consolidada per RJUE. Permeabilidade mínima do logradouro: 30%.",
      source: "PDM Sintra, Art. 74.º e 99.º (RCM n.º 7-B/2020)"
    },

    "UHC": {
      label: "Espaços Habitacionais 2 (Unifamiliar/Baixa Densidade Relativa)",
      ocupacao: null,
      utilizacao: null,     // Governed by valor modal (Art. 99)
      altFachada: null,          // Governed by valor modal (Art. 67, 99)
      impermeabilizacao: null,
      permeabilidadeMin: "0.30", // Mínimo de permeabilidade do logradouro (Art. 99)
      nota: "Altura e edificabilidade seguem o VALOR MODAL da frente urbana (Art. 67 e 99). Unifamiliar / baixa densidade relativa; típico ≤ 3 pisos. Permeabilidade mínima do logradouro: 30%.",
      source: "PDM Sintra, Art. 74.º e 99.º (RCM n.º 7-B/2020)"
    },

    "UBD": {
      label: "Espaços Urbanos de Baixa Densidade",
      ocupacao: null,
      utilizacao: "0.20",   // Iu máximo (Art. 100)
      altFachada: "7m",          // H máx. normal; pontualmente 9m com base em valor modal (Art. 100)
      altFachadaMax: "9m",       // Pontual — apenas onde valor modal o suporta (Art. 100)
      impermeabilizacao: null,
      permeabilidadeMin: "0.50", // Mínimo de permeabilidade (Art. 100)
      pisos: 2,                  // Máximo de pisos acima da cota de soleira (Art. 100)
      loteMin: "500m²",          // Parcela mínima (Art. 100)
      nota: "H = 9m só pontualmente onde valor modal o suporta; nesse caso não é admitido piso recuado/sótão (Art. 100).",
      source: "PDM Sintra, Art. 75.º e 100.º (RCM n.º 7-B/2020)"
    },

    "UAE": {
      label: "Espaços de Atividades Económicas",
      ocupacao: null,
      utilizacao: "0.60",   // Iu máximo (Art. 101)
      altFachada: "11m",         // H máximo absoluto (Art. 101); maquinaria especial: excepção justificada
      impermeabilizacao: null,
      permeabilidadeMin: "0.30", // Mínimo de permeabilidade (Art. 101)
      loteMin: "2000m²",         // Parcela mínima (Art. 101)
      nota: "Sem piso recuado/sótão admitido (Art. 101). Afastamento a estrema ≥ ½ altura da edificação. Maquinaria especial pode justificar H > 11m.",
      source: "PDM Sintra, Art. 76.º e 101.º (RCM n.º 7-B/2020)"
    },

    "UT": {
      label: "Espaços Turísticos (Uso Especial)",
      ocupacao: null,
      utilizacao: "0.20",   // Iu máximo (Art. 102)
      altFachada: "11m",         // H normal; pontualmente 15m com base em valor modal (Art. 102)
      altFachadaMax: "15m",      // Pontual — apenas onde valor modal o suporta (Art. 102)
      impermeabilizacao: null,
      permeabilidadeMin: "0.60", // Mínimo de permeabilidade (Art. 102)
      nota: "H = 15m só pontualmente onde valor modal o suporta; nesse caso sem piso recuado/sótão (Art. 102).",
      source: "PDM Sintra, Art. 80.º e 102.º (RCM n.º 7-B/2020)"
    },

    "UE": {
      label: "Espaços de Equipamentos (Uso Especial)",
      ocupacao: null,
      utilizacao: "0.30",   // Iu máximo para equipamentos privados (Art. 103); público: ilimitado
      altFachada: "11m",         // H máx. para equipamentos privados (Art. 103)
      impermeabilizacao: null,
      permeabilidadeMin: "0.30", // Mínimo de permeabilidade (privado, Art. 103)
      nota: "Equipamentos de natureza pública: edificabilidade e altura sem limitação concreta (medida exata do interesse público). Valores acima aplicam-se a equipamentos privados (Art. 103).",
      source: "PDM Sintra, Art. 80.º e 103.º (RCM n.º 7-B/2020)"
    },

    "UI": {
      label: "Espaços de Infraestruturas Estruturantes (Uso Especial)",
      ocupacao: null,
      utilizacao: null,     // Public interest only — no fixed limit (Art. 104)
      altFachada: null,
      impermeabilizacao: null,
      nota: "Apenas intervenções de natureza pública. Edificabilidade e altura determinadas pela medida exata do interesse público (Art. 104).",
      source: "PDM Sintra, Art. 80.º e 104.º (RCM n.º 7-B/2020)"
    },

    "UV": {
      label: "Espaços Verdes Urbanos",
      ocupacao: null,
      utilizacao: "0",      // Nova construção não admitida (Art. 77–79)
      altFachada: null,
      impermeabilizacao: null,
      nota: "Nova construção não admitida. Apenas instalações de apoio ao uso coletivo, equipamentos de lazer e comércio de apoio podem ser autorizados. Uso coletivo obrigatório.",
      source: "PDM Sintra, Art. 77.º–79.º (RCM n.º 7-B/2020)"
    },

    // ── SOLO RÚSTICO ─────────────────────────────────────────────────────────

    "N": {
      label: "Espaços Naturais 1",
      ocupacao: null,
      utilizacao: "0",      // Edificação proibida (Art. 47–48, 90)
      altFachada: null,
      impermeabilizacao: null,
      nota: "Edificação proibida. Apenas conservação da natureza e centros de interpretação ambiental permitidos (Art. 47–48, 90).",
      source: "PDM Sintra, Art. 47.º–48.º e 90.º (RCM n.º 7-B/2020)"
    },

    "NF": {
      label: "Espaços Naturais 2",
      ocupacao: null,
      utilizacao: "0",      // Edificação proibida (Art. 47–48, 90)
      altFachada: null,
      impermeabilizacao: null,
      nota: "Edificação proibida. Admite criação de bosques autóctones e uso florestal/agrícola extensivo. (Art. 47–48, 90).",
      source: "PDM Sintra, Art. 47.º–48.º e 90.º (RCM n.º 7-B/2020)"
    },

    "NA": {
      label: "Espaços Naturais 3",
      ocupacao: null,
      utilizacao: "0",      // Edificação proibida (Art. 47–48, 90)
      altFachada: null,
      impermeabilizacao: null,
      nota: "Edificação proibida. Admite uso agro-silvopastoril extensivo (Art. 47–48, 90).",
      source: "PDM Sintra, Art. 47.º–48.º e 90.º (RCM n.º 7-B/2020)"
    },

    "F": {
      label: "Espaços Florestais 1",
      ocupacao: null,
      utilizacao: "0",      // Edificação não admitida (Art. 49–50, 91)
      altFachada: null,
      impermeabilizacao: null,
      nota: "Edificação não admitida. Uso turístico pode ser autorizado via Art. 46 + 97 (Espaços de Ocupação Turística em solo rústico) mediante condições específicas.",
      source: "PDM Sintra, Art. 49.º–50.º e 91.º (RCM n.º 7-B/2020)"
    },

    "FA": {
      label: "Espaços Florestais 2",
      ocupacao: null,
      utilizacao: "0.02",   // Iu máximo (Art. 49–50, 91)
      altFachada: "5m",          // H máximo (Art. 91)
      impermeabilizacao: null,
      implantacaoMax: "750m²",   // ∑ Área de implantação máxima (Art. 91)
      acMax: "500m²",            // ∑ Área de construção máxima (Art. 91)
      loteMin: "2ha",            // Parcela mínima (Art. 91)
      nota: "Só instalações adstritas à atividade florestal/agrícola. ∑ implantação ≤ 750m², ∑ construção ≤ 500m².",
      source: "PDM Sintra, Art. 49.º–50.º e 91.º (RCM n.º 7-B/2020)"
    },

    "A": {
      label: "Espaços Agrícolas",
      ocupacao: null,
      utilizacao: "0.02",   // Iu máximo (Art. 51–52, 92)
      altFachada: "5m",          // H máximo (Art. 92)
      impermeabilizacao: null,
      implantacaoMax: "1200m²",  // ∑ Área de implantação máxima (Art. 92)
      acMax: "800m²",            // ∑ Área de construção máxima (Art. 92)
      loteMin: "2ha",            // Parcela mínima (Art. 92)
      nota: "Só instalações adstritas à atividade agrícola. ∑ implantação ≤ 1200m², ∑ construção ≤ 800m². Turismo em espaço rústico (Art. 97): min 10ha, Iu ≤ 0,01 adicional, H ≤ 5m, permeabilidade ≥ 95%.",
      source: "PDM Sintra, Art. 51.º–52.º e 92.º (RCM n.º 7-B/2020)"
    },

    "EI": {
      label: "Espaços de Equipamentos e Infraestruturas (Rústico)",
      ocupacao: null,
      utilizacao: "0.30",   // Iu máximo para privados (Art. 61–62, 96); público: ilimitado
      altFachada: "9m",          // H máx. para privados (Art. 96)
      impermeabilizacao: null,
      permeabilidadeMin: "0.30", // Mínimo de permeabilidade (Art. 96)
      nota: "Equipamentos e infraestruturas de utilidade pública. Privados: Iu ≤ 0,30, H ≤ 9m. Públicos: sem limitação concreta.",
      source: "PDM Sintra, Art. 61.º–62.º e 96.º (RCM n.º 7-B/2020)"
    },

    "OT": {
      label: "Espaços de Ocupação Turística (Rústico)",
      ocupacao: null,
      utilizacao: "0.05",   // Iu máximo (Art. 59–60, 95)
      altFachada: "5m",          // H máximo (Art. 95)
      impermeabilizacao: null,
      permeabilidadeMin: "0.90", // Mínimo de permeabilidade (Art. 95)
      loteMin: "5ha",            // Parcela mínima (Art. 95)
      nota: "Só turismo de habitação, rural ou de natureza; parques de campismo. Habitação permanente não admitida.",
      source: "PDM Sintra, Art. 59.º–60.º e 95.º (RCM n.º 7-B/2020)"
    },

    "I": {
      label: "Espaços de Atividades Industriais (Rústico)",
      ocupacao: null,
      utilizacao: "0.60",   // Iu máximo (Art. 57–58, 94)
      altFachada: "9m",          // H máximo (Art. 94)
      impermeabilizacao: null,
      permeabilidadeMin: "0.30", // Mínimo de permeabilidade (Art. 94)
      nota: "Apenas indústrias ligadas ao setor primário (transformação de produtos agrícolas/florestais). Afastamento a estrema ≥ ½ H.",
      source: "PDM Sintra, Art. 57.º–58.º e 94.º (RCM n.º 7-B/2020)"
    },

    "ER": {
      label: "Espaços de Exploração de Recursos Geológicos",
      ocupacao: null,
      utilizacao: "0",      // Edificação não admitida, exceto anexos de pedreira (Art. 53–54, 93)
      altFachada: null,
      impermeabilizacao: null,
      nota: "Edificação não admitida, exceto instalações de apoio direto a pedreiras existentes. Recuperação paisagística obrigatória após extração (Art. 53–54, 93).",
      source: "PDM Sintra, Art. 53.º–54.º e 93.º (RCM n.º 7-B/2020)"
    },

    "AR": {
      label: "Aglomerado Rural (legado)",
      ocupacao: null,
      utilizacao: null,
      altFachada: null,
      impermeabilizacao: null,
      nota: "Código legado não presente no PDM 2020 em vigor. O PDM atual não define uma categoria 'Aglomerado Rural' autónoma no solo rústico — os aglomerados foram reclassificados como solo urbano ou integrados nos Espaços Agrícolas. Consultar a Planta de Ordenamento.",
      source: "PDM Sintra, RCM n.º 7-B/2020 — categoria não mapeada no regulamento atual"
    },
  },

  // ════════════════════════════════════════════════════════════════════════════
  // OEIRAS
  // PDM Oeiras — Regulamento em vigor (consolidado)
  // Base: Aviso n.º 10445/2015 (DR 2.ª série, n.º 179, 14/09/2015)
  // Consolidação/adequação RJIGT: Aviso n.º 19629/2022 (DR 2.ª série, n.º 198,
  // 13/10/2022) — versão actualmente em vigor.
  // Full text: https://files.dre.pt/2s/2022/10/198000000/0028800359.pdf
  //
  // KEY STRUCTURAL NOTE:
  // The Oeiras PDM is UOPG-based (5 Unidades Operativas de Planeamento e
  // Gestão). It sets a single Índice de Utilização do Solo (IUS) per UOPG,
  // not per parcel. Per-parcel height, implantation, floor count, and
  // impermeability are NOT defined in the PDM regulamento — they are governed
  // by in-force sub-plans (Planos de Urbanização / Pormenor) or by Art. 66
  // "imagem urbana" rule (match the dominant morphology of surrounding blocks).
  //
  // Zone categories (Categoria field, AML pdm_revisao layer 3) map to the
  // PDM's qualitative zone descriptions, but numeric parameters cannot be
  // assigned at zone level — only at UOPG level.
  //
  // UOPG IUS values (Art. 45, 48, 51, 53–54, 56–60, 65):
  //   Litoral (204 ha):       IUS máx. 0,40
  //   Nascente (1 303 ha):    IUS máx. 0,65
  //   Norte (625 ha):         IUS máx. 0,50
  //   Poente Norte (1 240 ha):IUS máx. 0,60  (Sub-UOPG 1 Porto Salvo: 0,68)
  //   Poente Sul (1 216 ha):  IUS máx. 0,60  (Sub-UOPG 2 Paço Arcos: 0,79)
  // ════════════════════════════════════════════════════════════════════════════
  "Oeiras": {

    // NOTE: all per-parcel numeric parameters are null — the Oeiras PDM does
    // not set IOS, cércea, or floor count at zone level (only UOPG-wide IUS).
    // Heights and implantation follow Art. 66 "imagem urbana" (valor modal).

    "Espaço Central": {
      label: "Espaços Centrais",
      ocupacao: null,
      utilizacao: null,     // UOPG-level IUS only (see file header); Art. 30
      altFachada: null,          // Governed by Art. 66 valor modal
      impermeabilizacao: null,
      nota: "Parâmetros ao nível do lote não estão definidos no PDM. Edificabilidade regida pelo IUS da UOPG correspondente (0,40–0,65). Altura por Art. 66 (imagem urbana — valor modal dos quarteirões envolventes).",
      source: "PDM Oeiras, Art. 30.º e 65.º (Aviso 19629/2022)"
    },

    "Espaço Residencial": {
      label: "Espaços Habitacionais",
      ocupacao: null,
      utilizacao: null,
      altFachada: null,
      impermeabilizacao: null,
      nota: "Parâmetros ao nível do lote não estão definidos no PDM. Edificabilidade regida pelo IUS da UOPG (0,40–0,79 consoante sub-UOPG). Altura por Art. 66 valor modal.",
      source: "PDM Oeiras, Art. 31.º e 65.º (Aviso 19629/2022)"
    },

    "Espaço de Actividades Económicas": {
      label: "Espaços de Atividades Económicas",
      ocupacao: null,
      utilizacao: null,
      altFachada: null,
      impermeabilizacao: null,
      nota: "Parâmetros ao nível do lote não estão definidos no PDM. IUS da UOPG aplica-se. Altura por Art. 66 valor modal.",
      source: "PDM Oeiras, Art. 32.º e 65.º (Aviso 19629/2022)"
    },

    "Espaço de Atividades Económicas": {
      label: "Espaços de Atividades Económicas",
      ocupacao: null,
      utilizacao: null,
      altFachada: null,
      impermeabilizacao: null,
      nota: "Parâmetros ao nível do lote não estão definidos no PDM. IUS da UOPG aplica-se. Altura por Art. 66 valor modal.",
      source: "PDM Oeiras, Art. 32.º e 65.º (Aviso 19629/2022)"
    },

    "Espaço de Equipamento": {
      label: "Espaços de Uso Especial — Equipamentos",
      ocupacao: null,
      utilizacao: null,
      altFachada: null,
      impermeabilizacao: null,
      nota: "Parâmetros ao nível do lote não estão definidos no PDM.",
      source: "PDM Oeiras, Art. 33.º (Aviso 19629/2022)"
    },

    "Espaço de Uso Especial - Equipamentos": {
      label: "Espaços de Uso Especial — Equipamentos",
      ocupacao: null,
      utilizacao: null,
      altFachada: null,
      impermeabilizacao: null,
      nota: "Parâmetros ao nível do lote não estão definidos no PDM.",
      source: "PDM Oeiras, Art. 33.º (Aviso 19629/2022)"
    },

    "Espaço de Ocupação Turística": {
      label: "Espaços de Uso Especial — Turismo",
      ocupacao: null,
      utilizacao: null,
      altFachada: null,
      impermeabilizacao: null,
      nota: "Parâmetros ao nível do lote não estão definidos no PDM.",
      source: "PDM Oeiras, Art. 34.º (Aviso 19629/2022)"
    },

    "Espaço de Uso Especial - Turismo": {
      label: "Espaços de Uso Especial — Turismo",
      ocupacao: null,
      utilizacao: null,
      altFachada: null,
      impermeabilizacao: null,
      nota: "Parâmetros ao nível do lote não estão definidos no PDM.",
      source: "PDM Oeiras, Art. 34.º (Aviso 19629/2022)"
    },

    "Espaço Verde": {
      label: "Espaços Verdes",
      ocupacao: null,
      utilizacao: null,
      altFachada: null,
      impermeabilizacao: null,
      nota: "Parâmetros ao nível do lote não estão definidos no PDM.",
      source: "PDM Oeiras, Art. 35.º (Aviso 19629/2022)"
    },

    "Espaço Natural": {
      label: "Espaços Naturais e Paisagísticos",
      ocupacao: null,
      utilizacao: null,
      altFachada: null,
      impermeabilizacao: null,
      nota: "Solo rústico. Sem loteamento, sem obras de urbanização, sem novas edificações. Ampliação de edificações existentes ≤ 50% da área de implantação original. Equipamentos e infraestruturas públicas admitidos (Art. 41).",
      source: "PDM Oeiras, Art. 41.º (Aviso 19629/2022)"
    },

    "Solo Rural": {
      label: "Espaços Agrícolas / Naturais (Solo Rústico)",
      ocupacao: null,
      utilizacao: null,
      altFachada: null,
      impermeabilizacao: null,
      nota: "Solo rústico — sujeito a RAN, REN, regime florestal e habitats comunitários. Apenas usos compatíveis com a função agrícola, investigação e turismo/lazer (Art. 40–41).",
      source: "PDM Oeiras, Art. 40.º–41.º (Aviso 19629/2022)"
    },

    "Solo urbanizável sem categoria associada": {
      label: "Solo Urbanizável s/ Categoria (Revogado)",
      ocupacao: null,
      utilizacao: null,
      altFachada: null,
      impermeabilizacao: null,
      nota: "Categoria revogada na consolidação de 2022 (Art. 36 revogado). Parcelas nesta categoria são agora tratadas ao abrigo do sub-plano aplicável ou do regime geral do PDM.",
      source: "PDM Oeiras, Art. 36.º revogado (Aviso 19629/2022)"
    },

    "Espaço de Uso Especial": {
      label: "Espaços de Uso Especial",
      ocupacao: null,
      utilizacao: null,
      altFachada: null,
      impermeabilizacao: null,
      nota: "Parâmetros ao nível do lote não estão definidos no PDM. Regime depende do sub-tipo (equipamentos, turismo, defesa).",
      source: "PDM Oeiras, Art. 33.º–34.º (Aviso 19629/2022)"
    },

    "Espaço de Uso Especial Proposto": {
      label: "Espaços de Uso Especial (Proposto)",
      ocupacao: null,
      utilizacao: null,
      altFachada: null,
      impermeabilizacao: null,
      nota: "Zona proposta — regime a definir por sub-plano. Parâmetros ao nível do lote não definidos no PDM.",
      source: "PDM Oeiras, Art. 33.º–34.º (Aviso 19629/2022)"
    },

    "Espaço Canal": {
      label: "Espaço Canal (Infraestruturas)",
      ocupacao: null,
      utilizacao: null,
      altFachada: null,
      impermeabilizacao: null,
      nota: "Corredor de infraestruturas. Sem vocação edificatória própria.",
      source: "PDM Oeiras (Aviso 19629/2022)"
    },

    "PMOT em vigor": {
      label: "PMOT em vigor",
      ocupacao: null,
      utilizacao: null,
      altFachada: null,
      impermeabilizacao: null,
      nota: "Área abrangida por Plano de Urbanização ou Plano de Pormenor em vigor que prevalece sobre o PDM. Consultar o plano específico aplicável.",
      source: "PDM Oeiras, Art. 65.º (Aviso 19629/2022)"
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // AMADORA
  // PDM da Amadora — Regulamento em vigor
  // Base: Aviso n.º 1485/2015 (DR 2.ª série, n.º 29, 11/02/2015)
  // Adequação RJIGT: Aviso n.º 9574/2020 (DR 2.ª série, n.º 118, 18/06/2020)
  // Full text (base): https://dre.pt/dre/detalhe/aviso/1485-2015-66531019
  //
  // KEY STRUCTURAL NOTE:
  // Amadora is virtually 100% Solo Urbano (< 1% Solo Rústico). Most
  // consolidated areas are covered by Planos de Pormenor (PP) or Planos de
  // Urbanização (PU) in force — their parameters supersede the PDM fallback.
  // Where no PP/PU applies, the PDM sets a zone-level edificabilidade index
  // and height is governed by the "cércea dominante" rule (match the dominant
  // cornice height of the surrounding urban front). Lote mínimo = 200 m²
  // (Art. 44).
  //
  // Zone keys match `Categoria_2021` from the DGT CRUS WFS (DR 15/2015
  // taxonomy) as used in AMADORA_COLORS.
  // ══════════════════════════════════════════════════════════════════════════
  "Amadora": {

    // ── SOLO URBANO ──────────────────────────────────────────────────────────

    "Espaço Central": {
      // Mixed-use high-density central zones. No fixed PDM-level altFachada
      // or IOS — governed by cércea dominante and applicable PP/PU.
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           "200m²",
      source: "PDM Amadora, Art. 45.º (Aviso 1485/2015; alt. Aviso 9574/2020)"
    },

    "Espaço Residencial": {
      // Residential zones (medium-to-high density). Most areas covered by
      // PP/PU setting specific per-parcel parameters. PDM fallback applies
      // cércea dominante rule for height.
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           "200m²",
      source: "PDM Amadora, Art. 46.º (Aviso 1485/2015; alt. Aviso 9574/2020)"
    },

    "Espaço de Atividades Económicas": {
      // Commercial, office, and light-industry zones. Parameters governed by
      // applicable PP/PU or by cércea dominante rule.
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           null,
      source: "PDM Amadora, Art. 48.º (Aviso 1485/2015; alt. Aviso 9574/2020)"
    },

    "Espaço de Atividades Económicas e Logísticas": {
      // Logistics / industrial zones. Parameters by PP/PU or cércea dominante.
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           null,
      source: "PDM Amadora, Art. 49.º (Aviso 1485/2015; alt. Aviso 9574/2020)"
    },

    "Espaço de Uso Especial Equipamentos e Infraestruturas": {
      // Public/private equipment and infrastructure facilities (hospitals,
      // schools, civic centres). Parameters by PP/PU or Câmara deliberation.
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           null,
      source: "PDM Amadora, Art. 51.º (Aviso 1485/2015; alt. Aviso 9574/2020)"
    },

    "Espaço de Uso Especial Turismo e Lazer": {
      // Tourism and leisure special-use zones.
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           null,
      source: "PDM Amadora, Art. 52.º (Aviso 1485/2015; alt. Aviso 9574/2020)"
    },

    "Espaço de Uso Especial Turismo": {
      // Tourism special use (CRUS sub-type variant of Turismo e Lazer).
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           null,
      source: "PDM Amadora, Art. 52.º (Aviso 1485/2015; alt. Aviso 9574/2020)"
    },

    "Espaço de Uso Especial Defesa e Segurança Nacional": {
      // Military / national security installations. Building only by
      // competent national authority. No private construction permitted.
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           null,
      source: "PDM Amadora, Art. 53.º (Aviso 1485/2015)"
    },

    "Espaço Verde": {
      // Urban parks and public gardens. Building limited to leisure support
      // structures only. Impermeabilização máx. 5% (Art. 54).
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: "0.05",
      altFachada:        null,
      pisos:             1,       // Support structures only; 1 piso acima da soleira
      cercea:            null,
      loteMin:           null,
      source: "PDM Amadora, Art. 54.º (Aviso 1485/2015)"
    },

    // ── SOLO RÚSTICO / INFRAESTRUTURA ────────────────────────────────────────

    "Espaço Canal": {
      // Infrastructure corridor (roads, rail, utilities). No private building
      // vocation — subject to the specific infrastructure regime.
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           null,
      source: "PDM Amadora (Aviso 1485/2015) — espaço de infraestruturas"
    },

    "Espaço Natural": {
      // Residual natural fringe. No new construction permitted.
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           null,
      source: "PDM Amadora, Art. 56.º (Aviso 1485/2015)"
    },

    "Espaço Agrícola": {
      // Agricultural land (very limited extent in Amadora). No new construction.
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           null,
      source: "PDM Amadora, Art. 57.º (Aviso 1485/2015)"
    },

    "Espaço Florestal": {
      // Forest fringe (very limited in Amadora). No new construction.
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           null,
      source: "PDM Amadora, Art. 58.º (Aviso 1485/2015)"
    },

    "Espaço de Exploração de Recursos Geológicos": {
      // Geological extraction. Building limited to extraction support only.
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           null,
      source: "PDM Amadora (Aviso 1485/2015)"
    },

    "Não Atribuída": {
      // Solo Urbano with no specific CRUS category — area is covered by a PP
      // or PU in force that defines all parameters. Consult the applicable plan.
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           null,
      source: "PDM Amadora (Aviso 1485/2015) — área abrangida por PP/PU em vigor"
    },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // LISBOA
  // PDM de Lisboa — Regulamento em vigor
  // Base: Aviso n.º 11622/2012 (DR 2.ª série, n.º 168, 30/08/2012)
  // Alterações: múltiplas desde 2012; versão consolidada em
  // https://informacao.cm-lisboa.pt/planeamento-e-gestao-urbanistica/planeamento/pdm/pdm-em-vigor
  //
  // KEY STRUCTURAL NOTE (Art. 5–8):
  // Lisboa's PDM operates at the scale of 9 Unidades de Intervenção / UOPGs.
  // A dense network of Planos de Pormenor (PP) and Planos de Urbanização (PU)
  // covers most of the city — where a PP/PU exists, its per-parcel parameters
  // supersede the PDM. Where none exists, Art. 62 applies the "cércea dominante"
  // rule (match the dominant cornice height of the immediate urban block).
  //
  // The DGT CRUS "Não Atribuída" category reflects Solo Urbano areas governed
  // by a PP that was not resolved into a DR 15/2015 sub-category at time of
  // data publication.
  //
  // Zone keys match `Categoria` from the DGT CRUS WFS (DR 15/2015 taxonomy)
  // as used in LISBOA_COLORS.
  // ══════════════════════════════════════════════════════════════════════════
  "Lisboa": {

    // ── SOLO URBANO ──────────────────────────────────────────────────────────

    "Espaço Central": {
      // High-density mixed-use central zones (Baixa, Avenidas, Chiado area).
      // Height and edificabilidade set by PP/PU or cércea dominante (Art. 62).
      // No PDM-level fixed altFachada or IOS.
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           null,
      source: "PDM Lisboa, Art. 27.º (Aviso 11622/2012 e alt.)"
    },

    "Espaço Residencial": {
      // Residential zones (PDM classifies into 5 density sub-levels; DGT CRUS
      // aggregates all into this category). IUb 0,6–2,4 depending on sub-level
      // and UOPG; height by cércea dominante (Art. 62) or applicable PP/PU.
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           null,
      source: "PDM Lisboa, Art. 28.º–32.º (Aviso 11622/2012 e alt.)"
    },

    "Espaço Habitacional": {
      // Residential zones (same zone as Espaço Residencial in DGT CRUS
      // taxonomy; see that entry for notes on sub-levels and IUb range).
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           null,
      source: "PDM Lisboa, Art. 28.º–32.º (Aviso 11622/2012 e alt.)"
    },

    "Espaço de Atividades Económicas": {
      // Commercial, office, and mixed economic activity zones. Parameters by
      // PP/PU or cércea dominante. Frente ribeirinha / Humberto Delgado zones
      // have own PP regimes.
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           null,
      source: "PDM Lisboa, Art. 33.º–36.º (Aviso 11622/2012 e alt.)"
    },

    "Espaço de Atividades Económicas e Logísticas": {
      // Logistics and industrial zones (Matinha, Alcântara industrial belt,
      // Manutenção Militar area). Parameters by PP/PU in force.
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           null,
      source: "PDM Lisboa, Art. 37.º (Aviso 11622/2012 e alt.)"
    },

    "Espaço de Uso Especial Equipamentos e Infraestruturas": {
      // Public/private equipment and infrastructure (hospitals, universities,
      // stadiums). Parameters by PP/PU or Câmara Municipal deliberation.
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           null,
      source: "PDM Lisboa, Art. 38.º–40.º (Aviso 11622/2012 e alt.)"
    },

    "Espaço de Uso Especial Turismo e Lazer": {
      // Tourism and leisure special use. Parameters by specific PP/PU.
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           null,
      source: "PDM Lisboa, Art. 41.º (Aviso 11622/2012 e alt.)"
    },

    "Espaço de Uso Especial Turismo": {
      // Tourism special use (CRUS sub-type variant of Turismo e Lazer).
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           null,
      source: "PDM Lisboa, Art. 41.º (Aviso 11622/2012 e alt.)"
    },

    "Espaço de Uso Especial Defesa e Segurança Nacional": {
      // Military installations. Building by competent national authority only.
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           null,
      source: "PDM Lisboa, Art. 42.º (Aviso 11622/2012 e alt.)"
    },

    "Espaço Verde": {
      // Parks and public gardens (Monsanto margins, Tapada da Ajuda, Parque
      // Eduardo VII). Building limited to leisure support structures only.
      // Impermeabilização máx. ~5% (Art. 43).
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: "0.05",
      altFachada:        null,
      pisos:             1,       // Apoio ao lazer apenas; 1 piso máx.
      cercea:            null,
      loteMin:           null,
      source: "PDM Lisboa, Art. 43.º–44.º (Aviso 11622/2012 e alt.)"
    },

    // ── SOLO RÚSTICO / INFRAESTRUTURA ────────────────────────────────────────

    "Espaço Canal": {
      // Infrastructure corridor (IC19, A5, rail). No private building vocation.
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           null,
      source: "PDM Lisboa (Aviso 11622/2012) — espaço de infraestruturas"
    },

    "Espaço Natural": {
      // Natural and landscape spaces (Parque Florestal de Monsanto, riverside
      // natural margins). No new building permitted.
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           null,
      source: "PDM Lisboa, Art. 45.º (Aviso 11622/2012 e alt.)"
    },

    "Espaço Agrícola": {
      // Agricultural land (river flood plain margins and Monsanto valley
      // clearings). No new construction.
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           null,
      source: "PDM Lisboa, Art. 46.º (Aviso 11622/2012 e alt.)"
    },

    "Espaço Florestal": {
      // Forest land (Monsanto and peripheral wooded areas). No new construction.
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           null,
      source: "PDM Lisboa, Art. 47.º (Aviso 11622/2012 e alt.)"
    },

    "Espaço de Exploração de Recursos Geológicos": {
      // Geological extraction (limited in Lisboa territory). Building limited to
      // extraction support infrastructure only.
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           null,
      source: "PDM Lisboa (Aviso 11622/2012 e alt.)"
    },

    "Não Atribuída": {
      // Solo Urbano with no specific CRUS sub-category — area governed by a
      // PP or PU in force that defines all parameters. Consult the applicable
      // plan for the parcel. Covers the majority of built-up Lisboa in CRUS.
      ocupacao:          null,
      utilizacao:        null,
      impermeabilizacao: null,
      altFachada:        null,
      pisos:             null,
      cercea:            null,
      loteMin:           null,
      source: "PDM Lisboa (Aviso 11622/2012 e alt.) — área abrangida por PP/PU em vigor"
    },
  },
};
