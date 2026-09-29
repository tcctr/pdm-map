# Mapear

Mapear is a map of the land-use plans (PDM — Plano Diretor Municipal) for the Lisbon metropolitan area. It puts the zoning of all 18 AML municipalities on one map, so you don't have to go through each câmara's GIS portal.

**Live at [mapear-pdm.pt](https://mapear-pdm.pt)**

## What it does

- Shows how the land is classified (Qualificação do Solo) for Alcochete, Almada, Amadora, Barreiro, Cascais, Lisboa, Loures, Mafra, Moita, Montijo, Odivelas, Oeiras, Palmela, Seixal, Sesimbra, Setúbal, Sintra and Vila Franca de Xira
- Tap a zone to see its category and details
- Toggle the **Cadastro** layer to see land parcels from the national registry. Tapping a parcel shows its zoning and whether it falls inside REN or RAN
- Address search and GPS location
- Street and satellite basemaps

It's built for mobile first but works on desktop too.

## Data

The data comes from public sources: the municipalities' own ArcGIS servers, the AML (Área Metropolitana de Lisboa) GIS server, DGT's CRUS WFS services and DGT's SNIC cadastre WMS. Where a server allows it, the zoning is downloaded to `data/` as GeoJSON and refreshed every week by a GitHub Action. The rest is loaded live.

This is not an official source. The PDMs change and some of the public services are out of date or go down now and then, so always check with the câmara before making any decision based on this map.

## Running locally

There's no build step. Serve the folder with any static server:

```bash
npx serve .
# or
python3 -m http.server 8080
```

To refresh the cached data:

```bash
node scripts/sync-data.js
```

## Stack

Plain HTML/CSS/JS (ES modules), [Leaflet](https://leafletjs.com/) and [Esri Leaflet](https://developers.arcgis.com/esri-leaflet/). Deployed on Vercel.
