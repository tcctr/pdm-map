#!/usr/bin/env node
// sync-data.js — Downloads all GeoJSON-paginated ArcGIS layers to public/data/
// Usage: node scripts/sync-data.js

import { writeFile, readFile } from 'fs/promises';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'data');

// ── Base URL constants (mirrors index.html) ──────────────────
const SINTRA_BASE         = 'https://sig.cm-sintra.pt/arcgis/rest/services/WMS_Inspire/WMS_PDM20_Ordenamento/MapServer';
const CASCAIS_BASE        = 'https://sig.aml.pt/arcgis/rest/services/PlaneamentoOrdenamento/pdm_revisao/MapServer';
const REN_RAN_BASE        = 'https://sig.cm-sintra.pt/arcgis/rest/services/WMS_Inspire/WMS_SRUP_REN_RAN/MapServer';
const CONDICIONANTES_BASE = 'https://sig.cm-sintra.pt/arcgis/rest/services/WMS_Inspire/WMS_PDM20_Condicionantes/MapServer';

// ── Layer definitions ─────────────────────────────────────────
const LAYERS = [
  // Base layers — large, use smaller pages (500) and longer timeout (60s)
  {
    filename: 'sintra-urban.geojson',
    baseUrl: `${SINTRA_BASE}/55/query`,
    params: 'where=1%3D1&outFields=CAT%2CDescricao%2CRegulamento%2CPag_Regulamento%2CGuiao%2CPag_Guiao%2CRelatorio%2CPag_relatorio%2Carea_ha&outSR=4326',
    pageSize: 500,
    timeoutMs: 60000,
  },
  {
    filename: 'sintra-rural.geojson',
    baseUrl: `${SINTRA_BASE}/54/query`,
    params: 'where=1%3D1&outFields=Ord_Categ%2CDescricao%2CRegulamento%2CPag_Regulamento%2CGuiao%2CPag_Guiao%2CRelatorio%2CPag_relatorio%2CArea_Ha&outSR=4326',
    pageSize: 500,
    timeoutMs: 60000,
  },
  // Overlay layers (outFields=* + maxAllowableOffset)
  {
    filename: 'ran-sintra.geojson',
    baseUrl: `${REN_RAN_BASE}/2/query`,
    params: 'where=1%3D1&outFields=*&outSR=4326&maxAllowableOffset=0.0001',
  },
  // TODO: confirm layerId 1 for Sintra REN when WMS_SRUP_REN_RAN server comes back online
  {
    filename: 'ren-sintra.geojson',
    baseUrl: `${REN_RAN_BASE}/1/query`,
    params: 'where=1%3D1&outFields=*&outSR=4326&maxAllowableOffset=0.0001',
  },
  {
    filename: 'ran-cascais.geojson',
    baseUrl: `${CASCAIS_BASE}/12/query`,
    params: 'where=1%3D1&outFields=*&outSR=4326&maxAllowableOffset=0.0001',
  },
  {
    filename: 'ren-cascais.geojson',
    baseUrl: `${CASCAIS_BASE}/11/query`,
    params: 'where=1%3D1&outFields=*&outSR=4326&maxAllowableOffset=0.0001',
  },
  {
    filename: 'faixa.geojson',
    baseUrl: `${REN_RAN_BASE}/6/query`,
    params: 'where=1%3D1&outFields=*&outSR=4326&maxAllowableOffset=0.0001',
  },
  {
    filename: 'praias.geojson',
    baseUrl: `${REN_RAN_BASE}/7/query`,
    params: 'where=1%3D1&outFields=*&outSR=4326&maxAllowableOffset=0.0001',
  },
  {
    filename: 'vertentes.geojson',
    baseUrl: `${REN_RAN_BASE}/16/query`,
    params: 'where=1%3D1&outFields=*&outSR=4326&maxAllowableOffset=0.0001',
  },
  {
    filename: 'erosao.geojson',
    baseUrl: `${REN_RAN_BASE}/17/query`,
    params: 'where=1%3D1&outFields=*&outSR=4326&maxAllowableOffset=0.0001',
  },
  {
    filename: 'mar.geojson',
    baseUrl: `${REN_RAN_BASE}/15/query`,
    params: 'where=1%3D1&outFields=*&outSR=4326&maxAllowableOffset=0.0001',
  },
  {
    filename: 'cheias.geojson',
    baseUrl: `${REN_RAN_BASE}/14/query`,
    params: 'where=1%3D1&outFields=*&outSR=4326&maxAllowableOffset=0.0001',
  },
  {
    filename: 'patrimonio.geojson',
    baseUrl: `${CONDICIONANTES_BASE}/299/query`,
    params: 'where=1%3D1&outFields=*&outSR=4326&maxAllowableOffset=0.0001',
  },
  {
    filename: 'zep.geojson',
    baseUrl: `${CONDICIONANTES_BASE}/302/query`,
    params: 'where=1%3D1&outFields=*&outSR=4326&maxAllowableOffset=0.0001',
  },
  {
    filename: 'perigosos.geojson',
    baseUrl: `${CONDICIONANTES_BASE}/368/query`,
    params: 'where=1%3D1&outFields=*&outSR=4326&maxAllowableOffset=0.0001',
  },
];

// ── Esri JSON → GeoJSON conversion ───────────────────────────

function esriRingsToGeoJSON(geometry) {
  if (!geometry) return null;
  const { rings, paths, x, y, geometryType } = geometry;

  if (rings) {
    // Polygon or MultiPolygon
    if (rings.length === 1) {
      return { type: 'Polygon', coordinates: rings };
    }
    return { type: 'MultiPolygon', coordinates: rings.map(r => [r]) };
  }
  if (paths) {
    if (paths.length === 1) {
      return { type: 'LineString', coordinates: paths[0] };
    }
    return { type: 'MultiLineString', coordinates: paths };
  }
  if (x !== undefined && y !== undefined) {
    return { type: 'Point', coordinates: [x, y] };
  }
  return null;
}

function esriToGeoJSONFeatures(data) {
  // Already GeoJSON — has a 'type' field at the top level
  if (data.type === 'FeatureCollection') return data.features || [];
  // Esri JSON — has 'features' with 'attributes' and 'geometry'
  if (!data.features) return [];
  return data.features.map(f => ({
    type: 'Feature',
    properties: f.attributes || {},
    geometry: esriRingsToGeoJSON(f.geometry),
  }));
}

// ── Fetch helpers ─────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetches one page, trying f=geojson first then falling back to f=json.
// Returns { features, exceededTransferLimit } in GeoJSON terms.
async function fetchPage(baseUrl, params, offset, pageSize, timeoutMs) {
  const base = `${baseUrl}?${params}&resultOffset=${offset}&resultRecordCount=${pageSize}`;

  for (const fmt of ['geojson', 'json']) {
    const url = `${base}&f=${fmt}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });

    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();

    // HTML response — server doesn't support this format, try next
    if (contentType.includes('text/html') || text.trimStart().startsWith('<')) {
      console.log(`    [debug] f=${fmt} returned HTML, first 200 chars: ${text.slice(0, 200).replace(/\s+/g, ' ')}`);
      if (fmt === 'json') throw new Error('Server returned HTML for both f=geojson and f=json');
      continue; // try f=json
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.log(`    [debug] f=${fmt} returned non-JSON, first 200 chars: ${text.slice(0, 200).replace(/\s+/g, ' ')}`);
      if (fmt === 'json') throw new Error('Server returned non-JSON for both f=geojson and f=json');
      continue;
    }

    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));

    const features = esriToGeoJSONFeatures(data);
    const exceededTransferLimit = !!data.exceededTransferLimit;

    if (fmt === 'json' && data.type !== 'FeatureCollection') {
      // Log so we know conversion was used
      process.stdout.write(` [esri-json→geojson]`);
    }

    return { features, exceededTransferLimit };
  }
}

async function fetchAllFeatures(baseUrl, params, pageSize, timeoutMs) {
  const features = [];
  let offset = 0;
  let page = 0;

  while (true) {
    if (page > 0) await sleep(1000); // 1 s delay between paginated requests
    page++;
    const result = await fetchPage(baseUrl, params, offset, pageSize, timeoutMs);
    features.push(...result.features);
    process.stdout.write(`\r    page ${page}: ${features.length} features so far...`);
    if (!result.exceededTransferLimit || result.features.length === 0) break;
    offset += result.features.length;
  }
  process.stdout.write('\n');
  return features;
}

async function loadMetadata() {
  const metaPath = join(OUT_DIR, 'sync-metadata.json');
  try {
    const raw = await readFile(metaPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { layers: {} };
  }
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const runTimestamp = new Date().toISOString();
  console.log(`\n=== sync-data.js — ${runTimestamp} ===\n`);

  const metadata = await loadMetadata();
  if (!metadata.layers) metadata.layers = {};

  const results = { succeeded: [], failed: [] };

  for (let i = 0; i < LAYERS.length; i++) {
    const layer = LAYERS[i];
    const pageSize  = layer.pageSize  ?? 1000;
    const timeoutMs = layer.timeoutMs ?? 30000;
    const sourceUrl = `${layer.baseUrl}?${layer.params}`;

    console.log(`[${i + 1}/${LAYERS.length}] ${layer.filename} (pageSize=${pageSize}, timeout=${timeoutMs / 1000}s)`);
    console.log(`    ${sourceUrl}`);

    if (i > 0) await sleep(1000); // 1 s delay between layers

    try {
      const features = await fetchAllFeatures(layer.baseUrl, layer.params, pageSize, timeoutMs);

      if (features.length === 0) {
        throw new Error('Response contained 0 features — skipping to avoid overwriting cached data');
      }

      const geojson = { type: 'FeatureCollection', features };
      await writeFile(join(OUT_DIR, layer.filename), JSON.stringify(geojson), 'utf8');

      const nowISO = new Date().toISOString();
      metadata.layers[layer.filename] = {
        filename: layer.filename,
        sourceUrl,
        featureCount: features.length,
        status: 'success',
        lastSuccessfulSync: nowISO,
      };

      console.log(`    ✓ ${features.length} features → public/data/${layer.filename}`);
      results.succeeded.push(layer.filename);

    } catch (err) {
      console.error(`    ✗ FAILED: ${err.message}`);

      if (!metadata.layers[layer.filename]) {
        metadata.layers[layer.filename] = {
          filename: layer.filename,
          sourceUrl,
          featureCount: null,
          status: 'failure',
          lastSuccessfulSync: null,
        };
      } else {
        metadata.layers[layer.filename].status = 'failure';
      }

      results.failed.push({ filename: layer.filename, error: err.message });
    }
  }

  // Write metadata (always, even if some layers failed)
  metadata.lastRun = runTimestamp;
  metadata.lastRunSucceeded = results.succeeded.length;
  metadata.lastRunFailed = results.failed.length;
  await writeFile(join(OUT_DIR, 'sync-metadata.json'), JSON.stringify(metadata, null, 2), 'utf8');

  // Summary
  console.log('\n─────────────────────────────────────────');
  console.log(`  Succeeded (${results.succeeded.length}): ${results.succeeded.join(', ') || '—'}`);
  if (results.failed.length > 0) {
    console.log(`  Failed    (${results.failed.length}):`);
    for (const f of results.failed) console.log(`    • ${f.filename}: ${f.error}`);
  } else {
    console.log(`  Failed    (0): —`);
  }
  console.log('─────────────────────────────────────────\n');

  if (results.failed.length > 0) process.exit(1);
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
