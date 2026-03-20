// ============================================================
// ADDRESS SEARCH + REVERSE GEOCODE (Nominatim)
// ============================================================

export function initSearch(map, { onMunicipalityDetected } = {}) {
  const searchInput   = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const searchClear   = document.getElementById('search-clear');
  let searchDebounce = null;
  let searchMarker   = null;

  function closeSearch() {
    searchResults.classList.remove('open');
    searchResults.innerHTML = '';
  }

  function clearSearch() {
    searchInput.value = '';
    searchClear.classList.remove('visible');
    closeSearch();
    if (searchMarker) { searchMarker.remove(); searchMarker = null; }
    searchInput.focus();
  }

  function renderResults(items) {
    if (items.length === 0) {
      searchResults.innerHTML = '<div class="search-result-item no-results">Sem resultados</div>';
    } else {
      searchResults.innerHTML = items.map(item =>
        `<div class="search-result-item">${item.display_name}</div>`
      ).join('');
      searchResults.querySelectorAll('.search-result-item').forEach((el, i) => {
        el.addEventListener('click', () => selectResult(items[i]));
      });
    }
    searchResults.classList.add('open');
  }

  function detectMunicipality(displayName) {
    const name = displayName.toLowerCase();
    if (name.includes('cascais')) return 'cascais';
    if (name.includes('sintra'))  return 'sintra';
    return null;
  }

  function selectResult(item) {
    closeSearch();
    searchInput.value = item.display_name.split(',')[0];

    const muni = detectMunicipality(item.display_name);
    if (muni) onMunicipalityDetected?.(muni);

    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);

    if (searchMarker) searchMarker.remove();
    searchMarker = L.circleMarker([lat, lng], {
      radius: 7,
      color: '#fff',
      weight: 2,
      fillColor: '#f4845f',
      fillOpacity: 1,
    }).addTo(map);

    map.setView([lat, lng], 17);
  }

  async function runSearch(q) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=pt&viewbox=-9.55,38.65,-9.30,38.85&bounded=0`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'pt' } });
      const data = await res.json();
      renderResults(data);
    } catch {
      renderResults([]);
    }
  }

  searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    const q = searchInput.value.trim();
    searchClear.classList.toggle('visible', q.length > 0);
    if (q.length < 3) { closeSearch(); return; }
    searchDebounce = setTimeout(() => runSearch(q), 350);
  });

  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Escape') { clearSearch(); searchInput.blur(); }
  });

  searchClear.addEventListener('click', clearSearch);

  // Close dropdown when clicking outside
  document.addEventListener('click', e => {
    if (!document.getElementById('search-wrap').contains(e.target)) closeSearch();
  });

  // When the iOS keyboard opens, shift the search results into the
  // visible area by tracking the visual viewport height.
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      const keyboardHeight = window.innerHeight - window.visualViewport.height;
      searchResults.style.maxHeight =
        keyboardHeight > 100 ? `${window.visualViewport.height - 120}px` : '';
    });
  }
}

// Nominatim reverse geocode — returns 'sintra', 'cascais', or null.
// Called on first GPS fix to auto-select the active municipality.
export async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    const addr = data.address || {};
    const place = [addr.municipality, addr.city, addr.town, addr.village, addr.county]
      .filter(Boolean).join(' ').toLowerCase();
    if (place.includes('cascais')) return 'cascais';
    if (place.includes('sintra'))  return 'sintra';
    return null;
  } catch {
    return null;
  }
}
