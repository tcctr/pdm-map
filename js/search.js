// ============================================================
// ADDRESS SEARCH + REVERSE GEOCODE (Nominatim)
// ============================================================

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function initSearch(map, { onMunicipalityDetected, getGpsLocation } = {}) {
  const searchInput   = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const searchClear   = document.getElementById('search-clear');
  let searchDebounce = null;
  let searchMarker   = null;
  let currentItems   = [];
  let selectedIndex  = -1;

  function closeSearch() {
    searchResults.classList.remove('open');
    searchResults.innerHTML = '';
    currentItems  = [];
    selectedIndex = -1;
  }

  function clearSearch() {
    searchInput.value = '';
    searchClear.classList.remove('visible');
    closeSearch();
    if (searchMarker) { searchMarker.remove(); searchMarker = null; }
    searchInput.focus();
  }

  function setSelectedIndex(idx) {
    const items = searchResults.querySelectorAll('.search-result-item:not(.no-results)');
    items.forEach(el => el.classList.remove('active'));
    selectedIndex = idx;
    if (idx >= 0 && idx < items.length) {
      items[idx].classList.add('active');
      items[idx].scrollIntoView({ block: 'nearest' });
    }
  }

  function renderResults(items) {
    currentItems  = items;
    selectedIndex = -1;
    if (items.length === 0) {
      searchResults.innerHTML = '<div class="search-result-item no-results">Sem resultados</div>';
    } else {
      searchResults.innerHTML = items.map(item => {
        const muni = detectMunicipality(item.display_name);
        const warning = muni ? '' : '<span class="result-warning">⚠ Sem dados PDM disponíveis</span>';
        const cls = muni ? '' : ' outside-area';
        return `<div class="search-result-item${cls}">${escHtml(item.display_name)}${warning}</div>`;
      }).join('');
      searchResults.querySelectorAll('.search-result-item').forEach((el, i) => {
        el.addEventListener('mouseenter', () => setSelectedIndex(i));
        el.addEventListener('click', () => selectResult(items[i]));
      });
    }
    searchResults.classList.add('open');
  }

  function detectMunicipality(displayName) {
    const name = displayName.toLowerCase();
    if (name.includes('cascais')) return 'cascais';
    if (name.includes('sintra'))  return 'sintra';
    if (name.includes('oeiras'))  return 'oeiras';
    if (name.includes('loures'))  return 'loures';
    if (name.includes('amadora')) return 'amadora';
    if (name.includes('almada'))  return 'almada';
    if (name.includes('lisboa'))  return 'lisboa';
    if (name.includes('vila franca de xira') || name.includes('v.f. de xira')) return 'vfxira';
    if (name.includes('mafra')) return 'mafra';
    if (name.includes('odivelas')) return 'odivelas';
    if (name.includes('alcochete')) return 'alcochete';
    if (name.includes('barreiro')) return 'barreiro';
    if (name.includes('moita')) return 'moita';
    if (name.includes('montijo')) return 'montijo';
    if (name.includes('palmela')) return 'palmela';
    if (name.includes('seixal')) return 'seixal';
    if (name.includes('sesimbra')) return 'sesimbra';
    if (name.includes('set\u00fabal') || name.includes('setubal')) return 'setubal';
    return null;
  }

  function selectResult(item) {
    searchResults.classList.add('closing');
    setTimeout(() => {
      searchResults.classList.remove('closing');
      closeSearch();
    }, 150);

    searchInput.value = item.display_name.split(',')[0];
    searchInput.blur();

    const muni = detectMunicipality(item.display_name);
    if (muni) onMunicipalityDetected?.(muni);
    const zoom = muni === 'cascais' || muni === 'oeiras' || muni === 'loures' || muni === 'amadora' || muni === 'almada' || muni === 'barreiro' || muni === 'lisboa' || muni === 'vfxira' || muni === 'mafra' || muni === 'odivelas' || muni === 'alcochete' || muni === 'moita' || muni === 'montijo' || muni === 'palmela' || muni === 'seixal' || muni === 'sesimbra' || muni === 'setubal' ? 15 : 17;

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

    map.setView([lat, lng], zoom);
  }

  async function runSearch(q) {
    try {
      const gps = getGpsLocation?.();
      const viewboxParam = gps
        ? `&viewbox=${gps.lng - 0.15},${gps.lat + 0.10},${gps.lng + 0.15},${gps.lat - 0.10}&bounded=0`
        : '';
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=7&countrycodes=pt${viewboxParam}`;
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
    if (e.key === 'Escape') { clearSearch(); searchInput.blur(); return; }
    if (!searchResults.classList.contains('open') || currentItems.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(Math.min(selectedIndex + 1, currentItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(Math.max(selectedIndex - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const idx = selectedIndex >= 0 ? selectedIndex : 0;
      selectResult(currentItems[idx]);
    }
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
    if (place.includes('oeiras'))  return 'oeiras';
    if (place.includes('loures'))  return 'loures';
    if (place.includes('amadora')) return 'amadora';
    if (place.includes('almada'))  return 'almada';
    if (place.includes('lisboa'))  return 'lisboa';
    if (place.includes('vila franca de xira')) return 'vfxira';
    if (place.includes('mafra')) return 'mafra';
    if (place.includes('odivelas')) return 'odivelas';
    if (place.includes('alcochete')) return 'alcochete';
    if (place.includes('barreiro')) return 'barreiro';
    if (place.includes('moita')) return 'moita';
    if (place.includes('montijo')) return 'montijo';
    if (place.includes('palmela')) return 'palmela';
    if (place.includes('seixal'))   return 'seixal';
    if (place.includes('sesimbra')) return 'sesimbra';
    if (place.includes('set\u00fabal') || place.includes('setubal')) return 'setubal';
    return null;
  } catch {
    return null;
  }
}
