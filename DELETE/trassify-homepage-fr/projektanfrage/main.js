// Basic Leaflet map + custom polyline drawing with self-snapping, buffer, KML import, multi-object support and search

(function () {
  // Map setup (Germany view)
  const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const OSM_ATTRIB = '&copy; <a href="https://www.openstreetmap.org/copyright">Contributeurs OpenStreetMap</a>';
  const GERMANY_CENTER = [51.1657, 10.4515];
  const GERMANY_BOUNDS = L.latLngBounds([47.2701, 5.8663], [55.0992, 15.0419]);
  const osm = L.tileLayer(OSM_URL, {
    maxZoom: 19,
    attribution: OSM_ATTRIB,
    crossOrigin: true,
    detectRetina: true,
    keepBuffer: 4,
    updateWhenIdle: true
  });
  const esriSat = L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    { attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community', crossOrigin: true, detectRetina: true, keepBuffer: 4, updateWhenIdle: true }
  );

  const map = L.map('map', { zoomControl: false, layers: [osm], zoomSnap: 0.25, zoomDelta: 0.25, preferCanvas: true })
    .setView(GERMANY_CENTER, 7);
  const ACCENT = '#A6C4A1';
  const DRAW_LINE_STYLE = { color: '#ff0000', weight: 3 };
  const DRAW_POLYGON_STYLE = { color: '#ff0000', weight: 3, fillColor: '#ff0000', fillOpacity: 0.12 };
  L.control.zoom({ position: 'topright' }).addTo(map);
  let userLocationMarker = null;
  let userLocationAccuracy = null;
  const locateControl = L.control({ position: 'topright' });
  locateControl.onAdd = function () {
    const container = L.DomUtil.create('div', 'leaflet-control leaflet-control-locate');
    const link = L.DomUtil.create('a', 'leaflet-control-locate-button', container);
    link.href = '#';
    link.title = 'Position';
    link.setAttribute('aria-label', 'Position');
    link.setAttribute('role', 'button');
    link.textContent = 'Position';
    L.DomEvent.disableClickPropagation(container);
    L.DomEvent.disableScrollPropagation(container);
    link.addEventListener('click', (ev) => {
      ev.preventDefault();
      if (!navigator.geolocation) {
        alert('La géolocalisation n’est pas disponible dans ce navigateur.');
        return;
      }
      map.locate({ setView: true, maxZoom: 18, enableHighAccuracy: true });
    });
    return container;
  };
  locateControl.addTo(map);
  map.on('locationfound', (ev) => {
    if (userLocationMarker) map.removeLayer(userLocationMarker);
    if (userLocationAccuracy) map.removeLayer(userLocationAccuracy);
    userLocationAccuracy = L.circle(ev.latlng, { radius: Math.max(10, ev.accuracy || 0), color: ACCENT, weight: 1, fillColor: ACCENT, fillOpacity: 0.12 }).addTo(map);
    userLocationMarker = L.circleMarker(ev.latlng, { radius: 6, color: '#111827', weight: 2, fillColor: ACCENT, fillOpacity: 0.9 }).addTo(map);
  });
  map.on('locationerror', (err) => {
    const msg = (err && err.message) ? err.message : 'La position n’a pas pu être déterminée.';
    alert(`Échec de la géolocalisation : ${msg}`);
  });
  const navMenuToggle = document.getElementById('navMenuToggle');
  const navMenu = document.getElementById('navMenu');
  if (navMenuToggle && navMenu) {
    navMenuToggle.addEventListener('click', (ev) => {
      ev.stopPropagation();
      navMenu.classList.toggle('open');
    });
    navMenu.addEventListener('click', () => {
      navMenu.classList.remove('open');
    });
    document.addEventListener('click', (ev) => {
      if (!navMenu.classList.contains('open')) return;
      if (navMenu.contains(ev.target) || ev.target === navMenuToggle) return;
      navMenu.classList.remove('open');
    });
  }
  const settingsMenuBtn = document.getElementById('settingsMenuBtn');
  if (settingsMenuBtn) {
    settingsMenuBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      alert('Aucun réglage cartographique n’est nécessaire. OpenStreetMap est utilisé.');
    });
  }

  const mapEl = document.getElementById('map');
  const cursorHint = document.getElementById('cursorHint');
  let lastCursorHintPos = null;

  function setCursorHintPosition(clientX, clientY) {
    if (!cursorHint) return;
    const x = Math.round(Number(clientX) + 14);
    const y = Math.round(Number(clientY) + 18);
    cursorHint.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  function shouldShowCursorHint() {
    if (!cursorHint) return false;
    if (!drawActive || attachMode || measureMode) return false;
    const o = getActive();
    if (!o || o.isClosed || !o.vertices || o.vertices.length === 0) return false;
    return o.shape === 'line' || o.shape === 'polygon';
  }

  function hideCursorHint() {
    if (!cursorHint) return;
    cursorHint.classList.add('hidden');
    cursorHint.setAttribute('aria-hidden', 'true');
  }

  function updateCursorHintVisibility() {
    if (!cursorHint) return;
    const show = shouldShowCursorHint() && !!lastCursorHintPos;
    cursorHint.classList.toggle('hidden', !show);
    cursorHint.setAttribute('aria-hidden', show ? 'false' : 'true');
    if (show) {
      setCursorHintPosition(lastCursorHintPos.x, lastCursorHintPos.y);
    }
  }

  function handleCursorHintPointerMove(ev) {
    if (!cursorHint || !ev) return;
    const clientX = Number(ev.clientX);
    const clientY = Number(ev.clientY);
    if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return;
    lastCursorHintPos = { x: clientX, y: clientY };
    updateCursorHintVisibility();
  }
  if (mapEl) {
    mapEl.addEventListener('mousemove', handleCursorHintPointerMove);
    mapEl.addEventListener('mouseleave', hideCursorHint);
  }
  function adjustZoomStep() {
    const z = map.getZoom();
    if (z <= 8) { map.options.zoomSnap = 0.5; map.options.zoomDelta = 0.5; }
    else if (z <= 13) { map.options.zoomSnap = 0.25; map.options.zoomDelta = 0.25; }
    else { map.options.zoomSnap = 0.1; map.options.zoomDelta = 0.1; }
  }
  map.on('zoomend', adjustZoomStep);
  adjustZoomStep();
  

  const baseLayers = {
    'OpenStreetMap': osm,
    'Satellite': esriSat,
  };
  const layerControl = L.control.layers(baseLayers, {}, { position: 'topright' }).addTo(map);
  const basemapBtns = Array.from(document.querySelectorAll('.basemap-option'));
  const searchPanel = document.getElementById('searchPanel');
  const searchToggle = document.getElementById('searchToggle');
  let activeBasemap = 'osm';
  const mapFooterLabel = document.getElementById('sourceLabel');

  function applyBasemap(mode) {
    const normalized = (mode === 'maptiler') ? 'osm' : (mode || 'osm'); // keep old value compatible
    activeBasemap = normalized;
    if (normalized === 'none') {
      if (map.hasLayer(osm)) map.removeLayer(osm);
      if (map.hasLayer(esriSat)) map.removeLayer(esriSat);
    } else if (normalized === 'sat') {
      map.removeLayer(osm);
      if (!map.hasLayer(esriSat)) map.addLayer(esriSat);
    } else {
      map.removeLayer(esriSat);
      if (!map.hasLayer(osm)) map.addLayer(osm);
    }
    basemapBtns.forEach(btn => {
      const isActive = btn.dataset.layer === normalized;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    updateBasemapAttribution();
  }

	  // close menus when clicking outside
	  document.addEventListener('click', (ev) => {
	    if (!objectsList) return;
	    if (ev.target.closest('.obj-item') || ev.target.closest('.obj-menu')) return;
	    closeAllObjMenus();
	  });
	  window.addEventListener('resize', () => closeAllObjMenus());
	  window.addEventListener('scroll', () => closeAllObjMenus(), true);
  function updateBasemapAttribution() {
    let provider = 'OpenStreetMap';
    if (activeBasemap === 'sat') provider = 'Imagerie Esri';
    else if (activeBasemap === 'none') provider = 'Aucun';
    if (mapFooterLabel) {
      mapFooterLabel.textContent = `dessin KML · par Trassify · Fond de carte : ${provider}`;
    }
  }


  // UI elements
  const startBtn = document.getElementById('startBtn');
  const bufferBtn = document.getElementById('bufferBtn');
  const selectBtn = document.getElementById('selectBtn');
  const measureBtn = document.getElementById('measureBtn');
  const drawMenuBtn = document.getElementById('drawMenuBtn');
  const drawMenu = document.getElementById('drawMenu');
  const drawIcon = document.querySelector('#startBtn img');
  const clearBtn = document.getElementById('clearBtn');
  const bufferInput = document.getElementById('bufferInput');
  const bufferRange = document.getElementById('bufferRange');
  const applyBufferBtn = document.getElementById('applyBufferBtn');
  const undoMenuBtn = document.getElementById('undoMenuBtn');
  const redoMenuBtn = document.getElementById('redoMenuBtn');
  const snapPxInput = document.getElementById('snapPxInput');
  const showConstructionChk = document.getElementById('showConstructionChk');
  const basemapSelect = document.getElementById('basemapSelect');
  const kmlFile = document.getElementById('kmlFile');
  const importBtn = document.getElementById('importBtn');
  const kmlIconBtn = document.getElementById('kmlIconBtn');
  const objectsList = document.getElementById('objectsList');
  const newObjectBtn = document.getElementById('newObjectBtn');
  const deleteObjectBtn = document.getElementById('deleteObjectBtn');
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const bufferSection = document.getElementById('bufferSection');
  const controlsEl = document.getElementById('controls');
  const controlsToggle = document.getElementById('controlsToggle');
  const layerPanel = document.querySelector('.layer-panel');
  const stepChoice = document.getElementById('stepChoice');
  const stepPackage = document.getElementById('stepPackage');
  const stepDetails = document.getElementById('stepDetails');
  const stepSummary = document.getElementById('stepSummary');
  const toolView = document.getElementById('toolView');
  const describeWrap = document.getElementById('describeWrap');
  const describeText = document.getElementById('describeText');
  const describeAddress = document.getElementById('describeAddress');
  const describeFile = document.getElementById('describeFile');
  const addressSuggestions = document.getElementById('addressSuggestions');
  const describeBackBtn = document.getElementById('describeBackBtn');
  const methodInputs = Array.from(document.querySelectorAll('input[name="areaMethod"]'));
  const packageInputs = Array.from(document.querySelectorAll('input[name="packageMethod"]'));
	  const choiceNextBtn = document.getElementById('choiceNextBtn');
	  const toolBackBtn = document.getElementById('toolBackBtn');
	  const toolNextBtn = document.getElementById('toolNextBtn');
	  const toolBackBtnMobile = document.getElementById('toolBackBtnMobile');
	  const toolNextBtnMobile = document.getElementById('toolNextBtnMobile');
	  const packageBackBtn = document.getElementById('packageBackBtn');
	  const packageNextBtn = document.getElementById('packageNextBtn');
	  const detailsBackBtn = document.getElementById('detailsBackBtn');
	  const detailsNextBtn = document.getElementById('detailsNextBtn');
  const summaryBackBtn = document.getElementById('summaryBackBtn');
  const summaryDownloadBtn = document.getElementById('summaryDownloadBtn');
  const summaryFinishBtn = document.getElementById('summaryFinishBtn');
  const summaryArea = document.getElementById('summaryArea');
  const summaryPackage = document.getElementById('summaryPackage');
  const summaryDetails = document.getElementById('summaryDetails');
  const summaryMapEl = document.getElementById('summaryMap');
  const summaryEmpty = document.getElementById('summaryEmpty');
  const packageDetailTitle = document.getElementById('packageDetailTitle');
  const packageDetailBody = document.getElementById('packageDetailBody');
  const packageFieldsLeitung = document.getElementById('packageFieldsLeitung');
  const packageFieldsDigit = document.getElementById('packageFieldsDigit');
  const MAX_UPLOAD_BYTES = 1 * 1024 * 1024;

  // Drawing/state
  let drawActive = false;
  let pendingNewObject = false;
  let objects = []; // { id, name, isClosed, vertices[], vertexMarkers[], polylineLayer, tempLine, bufferLayer, bufferGeojson, constructionHidden, visible, bufferMode, bufferDistance }
  let activeId = null;
  let snapMarker = null; // global for active editing
  let vertexDrag = null; // { o, marker }
  let bufferMode = 'polygon'; // always Fläche
  let searchMarker = null;
  let selectMode = false;
  let hoverSelect = false;
  let measureMode = false;
  let measurePoints = [];
  let measureLine = null;
  let measureTempLine = null;
  let measureMarkers = [];
  let measureLabel = null;
  let attachMode = false;
  let selectionDrag = null; // { obj, startPoint: Point, origPoints: Point[] }
  let bufferOpenForId = null;
  let drawShape = 'polygon';
  let floatingObjMenu = null;
  let floatingObjMenuRestore = null;

  function fitMapToGermany(targetMap, options = {}) {
    if (!targetMap || typeof targetMap.fitBounds !== 'function') return;
    const fitOptions = {
      padding: options.padding || [24, 24],
      animate: false,
    };
    if (Number.isFinite(options.maxZoom)) fitOptions.maxZoom = options.maxZoom;
    try {
      targetMap.fitBounds(GERMANY_BOUNDS, fitOptions);
    } catch (_) {
      const fallbackZoom = Number.isFinite(options.maxZoom) ? options.maxZoom : 6;
      try { targetMap.setView(GERMANY_CENTER, fallbackZoom); } catch (_) {}
    }
  }

  function hasMainMapContent() {
    if (searchMarker || userLocationMarker || userLocationAccuracy) return true;
    return objects.some((o) => Array.isArray(o && o.vertices) && o.vertices.length > 0);
  }

  function resetMainMapToGermanyIfEmpty() {
    if (hasMainMapContent()) return;
    fitMapToGermany(map, { padding: [28, 28], maxZoom: 7 });
  }

  function updateLayerPanelVisibility() {
    const hasObjects = objects.length > 0;
    if (layerPanel) layerPanel.classList.toggle('hidden', !hasObjects);
    if (controlsEl) controlsEl.classList.toggle('controls-hidden', !hasObjects);
	    }
	  updateLayerPanelVisibility();

	  const mobileControlsMq = (typeof window !== 'undefined' && window.matchMedia)
    ? window.matchMedia('(max-width: 767px), (max-height: 520px) and (orientation: landscape)')
    : null;

  function setControlsCollapsed(collapsed) {
    if (!controlsEl) return;
    controlsEl.classList.toggle('controls-collapsed', !!collapsed);
    if (controlsToggle) {
      controlsToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      controlsToggle.setAttribute('aria-label', collapsed ? 'Ouvrir la liste des couches' : 'Fermer la liste des couches');
    }
  }

  function syncControlsCollapseForViewport() {
    if (!controlsEl || !controlsToggle || !mobileControlsMq) return;
    setControlsCollapsed(!!mobileControlsMq.matches);
  }

  if (controlsToggle && controlsEl) {
    controlsToggle.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      setControlsCollapsed(!controlsEl.classList.contains('controls-collapsed'));
    });
  }

  if (mobileControlsMq) {
    syncControlsCollapseForViewport();
    if (typeof mobileControlsMq.addEventListener === 'function') {
      mobileControlsMq.addEventListener('change', syncControlsCollapseForViewport);
    } else if (typeof mobileControlsMq.addListener === 'function') {
      mobileControlsMq.addListener(syncControlsCollapseForViewport);
    }
  }

  let selectedMethod = null;
  let selectedPackage = (packageInputs.find(input => input.checked) || {}).value || null;
  let lastKmlFileName = '';
  let uploadedKmlFile = null;
  let summaryMap = null;
  let summaryLayer = null;
  let addressPoint = null;
	  let addressQueryTimer = null;
	  let addressFetchToken = 0;

	  function scrollToViewTop(targetEl) {
	    const active = document.activeElement;
	    if (active && typeof active.blur === 'function') {
	      try { active.blur(); } catch (_) {}
	    }
	
	    const doScroll = () => {
	      if (targetEl && typeof targetEl.scrollIntoView === 'function') {
	        try {
	          targetEl.scrollIntoView({ block: 'start', behavior: 'auto' });
	          return;
	        } catch (_) {
	          try {
	            targetEl.scrollIntoView(true);
	            return;
	          } catch (_) {}
	        }
	      }
	      try {
	        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
	      } catch (_) {
	        window.scrollTo(0, 0);
	      }
	    };
	
	    requestAnimationFrame(doScroll);
	    setTimeout(doScroll, 80);
	  }

	  function showChoiceView() {
	    if (toolView) toolView.classList.add('hidden');
	    if (stepPackage) stepPackage.classList.add('hidden');
	    if (stepDetails) stepDetails.classList.add('hidden');
	    if (stepSummary) stepSummary.classList.add('hidden');
	    if (stepChoice) stepChoice.classList.remove('hidden');
	    if (describeWrap) describeWrap.classList.toggle('hidden', selectedMethod !== 'describe');
	    scrollToViewTop(stepChoice);
	  }

  function promptKmlUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.kml,.kmz,application/vnd.google-earth.kml+xml,application/vnd.google-earth.kmz';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      document.body.removeChild(input);
      if (!file) return;
      await handleKmlFile(file);
    });
    input.click();
  }

	  function showToolView(mode, opts = {}) {
	    const promptUpload = !!opts.promptUpload;
	    if (stepChoice) stepChoice.classList.add('hidden');
	    if (stepPackage) stepPackage.classList.add('hidden');
	    if (stepDetails) stepDetails.classList.add('hidden');
	    if (stepSummary) stepSummary.classList.add('hidden');
	    if (toolView) toolView.classList.remove('hidden');
	    scrollToViewTop(toolView);
	    setTimeout(() => {
	      try { map.invalidateSize(); } catch (_) {}
	      resetMainMapToGermanyIfEmpty();
	    }, 120);
	    if (mode === 'upload') {
      if (kmlIconBtn) kmlIconBtn.classList.add('active');
      if (promptUpload) {
        promptKmlUpload();
      }
	    } else if (kmlIconBtn) {
	      kmlIconBtn.classList.remove('active');
	    }
	  }

  window.addEventListener('resize', () => {
    if (!toolView || toolView.classList.contains('hidden')) return;
    try { map.invalidateSize(); } catch (_) {}
    resetMainMapToGermanyIfEmpty();
  });

  function handleMethodChange(value) {
    selectedMethod = value;
    if (choiceNextBtn) choiceNextBtn.disabled = !selectedMethod;
    if (stepChoice) stepChoice.classList.toggle('describe-only', value === 'describe');
    if (describeWrap) describeWrap.classList.toggle('hidden', value !== 'describe');
    if (describeBackBtn) describeBackBtn.classList.toggle('hidden', value !== 'describe');
    if (value === 'describe' && describeText) {
      describeText.focus();
    }
    if (kmlIconBtn) kmlIconBtn.classList.remove('active');
    if (value !== 'describe') {
      addressPoint = null;
      if (describeAddress) describeAddress.value = '';
      hideAddressSuggestions();
    }
    if (stepChoice && stepChoice.classList.contains('hidden')) {
      showChoiceView();
    }
  }

  function escapeHtml(str) {
    return String(str || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
  }

  function formatBytes(bytes) {
    const n = Number(bytes) || 0;
    if (n < 1024) return `${n} B`;
    const kb = n / 1024;
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  }

  function enforceFileSizeLimit(input, maxBytes, label) {
    if (!input || !input.files || !input.files[0]) return true;
    const file = input.files[0];
    if (file.size <= maxBytes) return true;
    alert(`${label} est trop volumineux (${formatBytes(file.size)}). Taille maximale autorisée : ${formatBytes(maxBytes)}.`);
    input.value = '';
    return false;
  }

  function renderSummaryList(target, items) {
    if (!target) return;
    const rows = items.map(([label, value]) => {
      const safeLabel = escapeHtml(label);
      const safeValue = escapeHtml(value || '-');
      return `<dt>${safeLabel}</dt><dd>${safeValue}</dd>`;
    }).join('');
    target.innerHTML = rows || '<dt>Aucune donnée</dt><dd>-</dd>';
  }

  function getFieldValue(id, type = 'input') {
    const el = document.getElementById(id);
    if (!el) return '';
    if (type === 'select') {
      const opt = el.options && el.selectedIndex >= 0 ? el.options[el.selectedIndex] : null;
      return (opt && opt.value) ? opt.textContent.trim() : '';
    }
    return (typeof el.value === 'string') ? el.value.trim() : '';
  }

  function hideAddressSuggestions() {
    if (!addressSuggestions) return;
    addressSuggestions.classList.add('hidden');
    addressSuggestions.innerHTML = '';
  }

  function setAddressPoint(result) {
    if (!result) { addressPoint = null; return; }
    const lat = Number(result.lat);
    const lng = Number(result.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      addressPoint = null;
      return;
    }
    addressPoint = { lat, lng, label: result.display_name || '' };
  }

  function renderAddressSuggestions(results) {
    if (!addressSuggestions) return;
    addressSuggestions.innerHTML = '';
    if (!results || !results.length) {
      addressSuggestions.classList.add('hidden');
      return;
    }
    results.forEach((result) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'address-suggestion';
      btn.setAttribute('role', 'option');
      btn.textContent = result.display_name || '';
      btn.addEventListener('click', () => {
        if (describeAddress) describeAddress.value = result.display_name || '';
        setAddressPoint(result);
        hideAddressSuggestions();
      });
      addressSuggestions.appendChild(btn);
    });
    addressSuggestions.classList.remove('hidden');
  }

  async function fetchAddressSuggestions(query) {
    if (!query) return;
    const token = ++addressFetchToken;
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;
    try {
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      const results = await res.json();
      if (token !== addressFetchToken) return;
      renderAddressSuggestions(results || []);
    } catch (e) {
      if (token !== addressFetchToken) return;
      hideAddressSuggestions();
    }
  }

  function renderSummary() {
    const methodLabelMap = {
      upload: 'Téléversement KML/KMZ',
      draw: 'Tracé',
      describe: 'Description',
    };
    const areaItems = [];
    areaItems.push(['Zone du projet', methodLabelMap[selectedMethod] || '-']);
    const objCount = objects.filter(o => o && o.vertices && o.vertices.length > 0).length;
    const hasAddressPoint = !!(addressPoint && Number.isFinite(addressPoint.lat) && Number.isFinite(addressPoint.lng));
    const hasGeometry = objCount > 0 || hasAddressPoint;
    if (selectedMethod === 'upload') {
      const uploadEl = document.getElementById('areaUploadFile');
      const uploadName = lastKmlFileName || (uploadEl && uploadEl.files && uploadEl.files[0] ? uploadEl.files[0].name : '');
      areaItems.push(['Fichier', uploadName || '-']);
      areaItems.push(['Géométries', objCount ? String(objCount) : '-']);
    } else if (selectedMethod === 'draw') {
      areaItems.push(['Géométries', objCount ? String(objCount) : '-']);
    } else if (selectedMethod === 'describe') {
      const desc = describeText ? describeText.value.trim() : '';
      const address = describeAddress ? describeAddress.value.trim() : '';
      areaItems.push(['Description', desc || '-']);
      if (address) areaItems.push(['Adresse', address]);
      const fileInput = document.getElementById('describeFile');
      const file = fileInput && fileInput.files ? fileInput.files[0] : null;
      areaItems.push(['Fichier', file ? file.name : '-']);
    }
    if (hasGeometry) {
      areaItems.push(['Données géographiques', 'zone-projet.kml (automatique)']);
    }
    renderSummaryList(summaryArea, areaItems);

    const packageLabelMap = {
      leitung: 'Renseignements sur les réseaux',
      digitalisierung: 'Numérisation',
      kombiniert: 'Renseignements sur les réseaux et numérisation',
    };
    renderSummaryList(summaryPackage, [['Pack de services', packageLabelMap[selectedPackage] || '-']]);

    const leitungFields = [
      ['Nom du projet', getFieldValue('projName')],
      ['Début des travaux', getFieldValue('baubeginn')],
      ['Fin des travaux', getFieldValue('bauende')],
      ['Type d’activité', getFieldValue('artTaetigkeit', 'select')],
      ['Type de travaux de génie civil', getFieldValue('artTiefbau', 'select')],
      ['Description du projet', getFieldValue('projektbeschreibung')],
      ['Entreprise demandeuse', getFieldValue('anfragendesUnternehmen')],
      ['Maître d’ouvrage', getFieldValue('auftraggeberBauvorhaben')],
      ['Direction de chantier', getFieldValue('bauleitung')],
      ['Contact de la direction de chantier', getFieldValue('kontaktBauleitung')],
    ];
    const koordValue = getFieldValue('koordinatenSystem');
    const digitFields = [
      ['Système de coordonnées préféré', koordValue || 'ETRS89 / UTM zone 32N - EPSG:25832 (standard)'],
      ['Exigences particulières', getFieldValue('sonderanforderungen', 'select')],
    ];
    const detailsItems = [];
    if (selectedPackage === 'leitung' || selectedPackage === 'kombiniert') {
      detailsItems.push(...leitungFields);
    }
    if (selectedPackage === 'digitalisierung' || selectedPackage === 'kombiniert') {
      detailsItems.push(...digitFields);
    }
    renderSummaryList(summaryDetails, detailsItems);
  }

  function initSummaryMap() {
    if (!summaryMapEl || summaryMap) return;
    summaryMap = L.map(summaryMapEl, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
    }).setView(GERMANY_CENTER, 5);
    L.tileLayer(OSM_URL, { maxZoom: 19, crossOrigin: true }).addTo(summaryMap);
    summaryLayer = L.layerGroup().addTo(summaryMap);
  }

  function updateSummaryMap() {
    if (!summaryMap) return;
    summaryLayer.clearLayers();
	    const allLatLngs = [];
	    objects.forEach((o) => {
	      if (!o || !o.vertices || o.vertices.length === 0) return;
	      const dist = Number(o.bufferDistance) || 0;
	      if (dist > 0 && o.shape !== 'point') {
	        const line = toLineGeoJSON(o);
	        if (line) {
	          let buffered = null;
	          if (typeof turf !== 'undefined' && turf && typeof turf.buffer === 'function') {
	            try { buffered = turf.buffer(line, dist, { units: 'meters' }); } catch (_) {}
	          }
	          if (!buffered) buffered = o.bufferGeojson;
	          if (buffered && buffered.geometry) {
	            try {
	              const bufLayer = L.geoJSON(buffered, {
	                style: { color: '#e83e8c', weight: 2, fillColor: '#e83e8c', fillOpacity: 0.15 },
	              });
	              summaryLayer.addLayer(bufLayer);
	              if (bufLayer.getBounds) {
	                const b = bufLayer.getBounds();
	                if (b && b.isValid && b.isValid()) {
	                  allLatLngs.push(b.getSouthWest(), b.getNorthEast());
	                }
	              }
	            } catch (_) {}
	          }
	        }
	      }
	      if (o.shape === 'point' && o.vertices.length >= 1) {
	        o.vertices.forEach((pt) => {
	          if (!pt) return;
	          const marker = L.circleMarker(pt, { radius: 5, color: '#111827', weight: 2, fillColor: ACCENT, fillOpacity: 0.9 });
	          summaryLayer.addLayer(marker);
          allLatLngs.push(pt);
        });
        return;
      }
      if (o.vertices.length < 2) return;
      const layer = o.shape === 'polygon'
        ? L.polygon(o.vertices, { color: '#111827', weight: 2, fillColor: '#111827', fillOpacity: 0.12 })
        : L.polyline(o.vertices, { color: '#111827', weight: 3, opacity: 0.9 });
      summaryLayer.addLayer(layer);
      allLatLngs.push(...o.vertices);
    });
    if (addressPoint && Number.isFinite(addressPoint.lat) && Number.isFinite(addressPoint.lng)) {
      const addressLatLng = L.latLng(addressPoint.lat, addressPoint.lng);
      const marker = L.circleMarker(addressLatLng, { radius: 5, color: '#111827', weight: 2, fillColor: ACCENT, fillOpacity: 0.9 });
      summaryLayer.addLayer(marker);
      allLatLngs.push(addressLatLng);
    }
    if (allLatLngs.length) {
      if (summaryEmpty) summaryEmpty.classList.add('hidden');
      const bounds = L.latLngBounds(allLatLngs);
      summaryMap.fitBounds(bounds.pad(0.2));
    } else {
      if (summaryEmpty) summaryEmpty.classList.remove('hidden');
      fitMapToGermany(summaryMap, { padding: [12, 12], maxZoom: 6 });
    }
    setTimeout(() => summaryMap.invalidateSize(), 80);
  }

	  function showSummaryView() {
	    if (stepChoice) stepChoice.classList.add('hidden');
	    if (stepPackage) stepPackage.classList.add('hidden');
	    if (stepDetails) stepDetails.classList.add('hidden');
	    if (toolView) toolView.classList.add('hidden');
	    if (stepSummary) stepSummary.classList.remove('hidden');
	    scrollToViewTop(stepSummary);
	    initSummaryMap();
	    renderSummary();
	    updateSummaryMap();
	  }

  async function captureSummaryWithoutMap(card, options) {
    if (!window.html2canvas) return null;
    const sandbox = document.createElement('div');
    sandbox.style.position = 'fixed';
    sandbox.style.left = '-9999px';
    sandbox.style.top = '0';
    sandbox.style.width = `${card.offsetWidth}px`;
    sandbox.style.background = '#ffffff';
    const clone = card.cloneNode(true);
    const map = clone.querySelector('.summary-map');
    const empty = clone.querySelector('.summary-empty');
    if (map) map.style.display = 'none';
    if (empty) {
      empty.classList.remove('hidden');
      empty.textContent = 'L’aperçu cartographique n’est pas disponible dans le PDF.';
    }
    sandbox.appendChild(clone);
    document.body.appendChild(sandbox);
    let canvas = null;
    try {
      canvas = await window.html2canvas(clone, {
        ...options,
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight,
      });
    } finally {
      document.body.removeChild(sandbox);
    }
    return canvas;
  }

  async function downloadSummaryPdf() {
    if (!stepSummary) return;
    const card = stepSummary.querySelector('.step-card');
    if (!card) return;
    if (!window.html2canvas || !window.jspdf || !window.jspdf.jsPDF) {
      alert('Le téléchargement du PDF n’est actuellement pas disponible.');
      return;
    }
    const originalLabel = summaryDownloadBtn ? summaryDownloadBtn.textContent : '';
    if (summaryDownloadBtn) {
      summaryDownloadBtn.disabled = true;
      summaryDownloadBtn.textContent = 'Création du PDF...';
    }
    try {
      const options = {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: card.scrollWidth,
        windowHeight: card.scrollHeight,
      };
      let canvas = null;
      try {
        canvas = await window.html2canvas(card, options);
      } catch (err) {
        console.warn('PDF capture failed, retrying without map.', err);
        canvas = await captureSummaryWithoutMap(card, options);
      }
      if (!canvas) return;
      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pageWidth) / imgProps.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save('demande-projet-trassify-recapitulatif.pdf');
    } finally {
      if (summaryDownloadBtn) {
        summaryDownloadBtn.disabled = false;
        summaryDownloadBtn.textContent = originalLabel;
      }
    }
  }

  function coordsEqual(a, b) {
    if (!a || !b) return false;
    return Number(a[0]) === Number(b[0]) && Number(a[1]) === Number(b[1]);
  }

	  function objectsToGeoJson() {
	    const features = [];
	    objects.forEach((o) => {
	      if (!o) return;

	      const dist = Number(o.bufferDistance) || 0;
	      if (dist > 0 && o.shape !== 'point') {
	        const line = toLineGeoJSON(o);
	        if (line) {
	          let buffered = null;
	          if (typeof turf !== 'undefined' && turf && typeof turf.buffer === 'function') {
	            try { buffered = turf.buffer(line, dist, { units: 'meters' }); } catch (_) {}
	          }
	          if (!buffered) buffered = o.bufferGeojson;
	          const geom = buffered && buffered.geometry;
	          if (geom && (geom.type === 'Polygon' || geom.type === 'MultiPolygon')) {
	            const baseName = o.name || '';
	            const name = baseName ? `${baseName} (Zone tampon)` : 'Zone tampon';
	            if (geom.type === 'Polygon') {
	              features.push({
	                type: 'Feature',
	                properties: { name, shape: 'buffer', bufferDistance: dist, sourceName: baseName },
	                geometry: geom,
	              });
	            } else {
	              geom.coordinates.forEach((polyCoords, idx) => {
	                features.push({
	                  type: 'Feature',
	                  properties: { name, shape: 'buffer', bufferDistance: dist, sourceName: baseName, part: idx + 1 },
	                  geometry: { type: 'Polygon', coordinates: polyCoords },
	                });
	              });
	            }
	            o.bufferGeojson = buffered || null;
	            return;
	          }
	        }
	      }
	      const segments = (o.branches && o.branches.length) ? o.branches : [o.vertices];
	      segments.forEach((seg) => {
	        if (!seg || !seg.length) return;
	        const coords = seg
          .map(pt => [Number(pt.lng), Number(pt.lat)])
          .filter(c => Number.isFinite(c[0]) && Number.isFinite(c[1]));
        if (!coords.length) return;

        let geom = null;
        if (o.shape === 'point') {
          coords.forEach((c, idx) => {
            features.push({
              type: 'Feature',
              properties: { name: o.name || '', shape: o.shape || '', pointIndex: idx + 1 },
              geometry: { type: 'Point', coordinates: c },
            });
          });
          return;
        } else if (o.shape === 'polygon') {
          if (coords.length < 3) return;
          const ring = coords.slice();
          if (!coordsEqual(ring[0], ring[ring.length - 1])) ring.push(ring[0]);
          geom = { type: 'Polygon', coordinates: [ring] };
        } else {
          if (coords.length < 2) return;
          geom = { type: 'LineString', coordinates: coords };
        }

        features.push({
          type: 'Feature',
          properties: { name: o.name || '', shape: o.shape || '' },
          geometry: geom,
        });
      });
    });

    if (addressPoint && Number.isFinite(addressPoint.lat) && Number.isFinite(addressPoint.lng)) {
      features.push({
        type: 'Feature',
        properties: { kind: 'addressPoint', label: addressPoint.label || '' },
        geometry: { type: 'Point', coordinates: [Number(addressPoint.lng), Number(addressPoint.lat)] },
      });
    }

    return { type: 'FeatureCollection', features };
  }

  function kmlEscape(value) {
    return String(value || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m));
  }

  function geoJsonToKml(fc) {
    const features = (fc && Array.isArray(fc.features)) ? fc.features : [];
    if (!features.length) return '';
    const placemarks = features.map((f, idx) => {
      const props = (f && f.properties && typeof f.properties === 'object') ? f.properties : {};
      const geom = f && f.geometry;
      if (!geom || !geom.type) return '';
      const name = String(props.name || props.label || (props.kind === 'addressPoint' ? 'Adresse' : '') || `Élément ${idx + 1}`);

      if (geom.type === 'Point') {
        const c = geom.coordinates || [];
        if (!Array.isArray(c) || c.length < 2) return '';
        return `<Placemark><name>${kmlEscape(name)}</name><Point><coordinates>${c[0]},${c[1]},0</coordinates></Point></Placemark>`;
      }
      if (geom.type === 'LineString') {
        const coords = Array.isArray(geom.coordinates) ? geom.coordinates : [];
        if (coords.length < 2) return '';
        const str = coords.map(c => `${c[0]},${c[1]},0`).join(' ');
        return `<Placemark><name>${kmlEscape(name)}</name><LineString><tessellate>1</tessellate><coordinates>${str}</coordinates></LineString></Placemark>`;
      }
      if (geom.type === 'Polygon') {
        const ring = (geom.coordinates && Array.isArray(geom.coordinates[0])) ? geom.coordinates[0] : [];
        if (ring.length < 4) return '';
        const str = ring.map(c => `${c[0]},${c[1]},0`).join(' ');
        return `<Placemark><name>${kmlEscape(name)}</name><Polygon><tessellate>1</tessellate><outerBoundaryIs><LinearRing><coordinates>${str}</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>`;
      }
      return '';
    }).filter(Boolean).join('');

    if (!placemarks) return '';
    return `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document>${placemarks}</Document></kml>\n`;
  }

  function buildNetlifyFormData(form) {
    const fd = new FormData(form);
    fd.set('submittedAt', new Date().toISOString());

    const method = selectedMethod || fd.get('areaMethod') || '';
    const pkg = selectedPackage || fd.get('packageMethod') || '';
    if (method) fd.set('areaMethod', String(method));
    if (pkg) fd.set('packageMethod', String(pkg));

    const geojson = objectsToGeoJson();
    const featureCount = (geojson && Array.isArray(geojson.features)) ? geojson.features.length : 0;
    fd.set('geojsonFeatureCount', String(featureCount));

    const uploadName = lastKmlFileName || (uploadedKmlFile && uploadedKmlFile.name) || '';
    if (uploadName) fd.set('uploadFileName', uploadName);

    const describeUpload = fd.get('describeFile');
    if (describeUpload instanceof File && describeUpload.size > MAX_UPLOAD_BYTES) {
      throw new Error(`Fichier trop volumineux. Taille maximale autorisée : ${formatBytes(MAX_UPLOAD_BYTES)}.`);
    }

    fd.delete('areaKmlGenerated');
    if (featureCount > 0) {
      const kmlText = geoJsonToKml(geojson);
      if (kmlText) {
        const kmlBlob = new Blob([kmlText], { type: 'application/vnd.google-earth.kml+xml' });
        fd.append('areaKmlGenerated', kmlBlob, 'zone-projet.kml');
        if (!uploadName) fd.set('uploadFileName', 'zone-projet.kml');
      }
    }

    const existingAreaFile = fd.get('areaUploadFile');
    const hasAreaFile = existingAreaFile instanceof File && existingAreaFile.size > 0;
    if (!hasAreaFile) {
      fd.delete('areaUploadFile');
      if (method === 'upload' && uploadedKmlFile instanceof File && uploadedKmlFile.size > 0) {
        fd.append('areaUploadFile', uploadedKmlFile, uploadedKmlFile.name);
      }
    }
    return fd;
  }

  function isLocalPreview() {
    if (!window.location) return false;
    const host = (window.location.hostname || '').toLowerCase();
    return window.location.protocol === 'file:' || host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
  }

  async function submitNetlifyForm(form) {
    if (isLocalPreview()) {
      throw new Error('Netlify Forms fonctionne uniquement après déploiement sur Netlify ou via `netlify dev`, pas dans cette prévisualisation locale.');
    }
    const endpoint = '/';
    let res = null;
    try {
      res = await fetch(endpoint, { method: 'POST', body: buildNetlifyFormData(form) });
    } catch (e) {
      throw new Error('Échec de l’envoi. Netlify Forms fonctionne uniquement sur Netlify après redeploiement ou localement via `netlify dev`.');
    }
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error('HTTP 404. En général, cela signifie que le formulaire n’a pas encore été détecté par Netlify ou que le site n’a pas été redéployé.');
      }
      const txt = await res.text().catch(() => '');
      throw new Error(txt || `HTTP ${res.status}`);
    }
  }

  if (methodInputs.length) {
    methodInputs.forEach((input) => {
      input.addEventListener('change', () => handleMethodChange(input.value));
    });
  }
  if (describeAddress) {
    describeAddress.addEventListener('input', () => {
      const value = describeAddress.value.trim();
      addressPoint = null;
      if (addressQueryTimer) clearTimeout(addressQueryTimer);
      if (value.length < 3) {
        hideAddressSuggestions();
        return;
      }
      addressQueryTimer = setTimeout(() => fetchAddressSuggestions(value), 300);
    });
    describeAddress.addEventListener('focus', () => {
      const value = describeAddress.value.trim();
      if (value.length >= 3) fetchAddressSuggestions(value);
    });
    describeAddress.addEventListener('blur', () => {
      setTimeout(() => hideAddressSuggestions(), 150);
    });
    describeAddress.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hideAddressSuggestions();
    });
  }
  if (describeFile) {
    describeFile.addEventListener('change', () => {
      enforceFileSizeLimit(describeFile, MAX_UPLOAD_BYTES, 'Le fichier');
    });
  }
  if (describeBackBtn) {
    describeBackBtn.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      selectedMethod = null;
      methodInputs.forEach(input => { input.checked = false; });
      if (choiceNextBtn) choiceNextBtn.disabled = true;
      if (describeWrap) describeWrap.classList.add('hidden');
      if (stepChoice) stepChoice.classList.remove('describe-only');
      if (describeBackBtn) describeBackBtn.classList.add('hidden');
      if (describeAddress) describeAddress.value = '';
      if (describeFile) describeFile.value = '';
      addressPoint = null;
      hideAddressSuggestions();
    });
  }

  function updatePackageDetails(value) {
    const detailMap = {
      leitung: {
        title: 'Renseignements sur les réseaux',
        body: 'Nous prenons en charge les demandes de renseignements sur les réseaux et coordonnons les requêtes nécessaires pour votre zone de projet.'
      },
      digitalisierung: {
        title: 'Numérisation',
        body: 'Nous numérisons les documents existants et vous fournissons une base numérique propre pour la planification.'
      },
      kombiniert: {
        title: 'Renseignements sur les réseaux et numérisation',
        body: 'Combinez les deux prestations : demandes de renseignements sur les réseaux et préparation numérique auprès d’un seul interlocuteur.'
      }
    };
    const detail = detailMap[value] || null;
    if (packageDetailTitle) packageDetailTitle.textContent = detail ? detail.title : 'Veuillez choisir';
    if (packageDetailBody) packageDetailBody.textContent = detail ? detail.body : 'Dès qu’un pack est sélectionné, l’explication correspondante apparaît ici.';
    const showLeitung = value === 'leitung' || value === 'kombiniert';
    const showDigit = value === 'digitalisierung' || value === 'kombiniert';
    if (packageFieldsLeitung) packageFieldsLeitung.classList.toggle('hidden', !showLeitung);
    if (packageFieldsDigit) packageFieldsDigit.classList.toggle('hidden', !showDigit);
  }

  if (packageInputs.length) {
    packageInputs.forEach((input) => {
      input.addEventListener('change', () => {
        selectedPackage = input.value;
        if (packageNextBtn) packageNextBtn.disabled = !selectedPackage;
        updatePackageDetails(selectedPackage);
      });
    });
  }

	    if (choiceNextBtn) {
	      choiceNextBtn.addEventListener('click', () => {
	        if (!selectedMethod) return;
	        if (selectedMethod === 'describe') {
	          if (stepChoice) stepChoice.classList.add('hidden');
	          if (stepPackage) stepPackage.classList.remove('hidden');
	          scrollToViewTop(stepPackage);
	        } else {
	          showToolView(selectedMethod, { promptUpload: selectedMethod === 'upload' });
	        }
	      });
	    }
	  function handleToolBack() { showChoiceView(); }
	  function handleToolNext() {
	    if (toolView) toolView.classList.add('hidden');
	    if (stepPackage) stepPackage.classList.remove('hidden');
	    scrollToViewTop(stepPackage);
	  }

	  if (toolBackBtn) toolBackBtn.addEventListener('click', handleToolBack);
	  if (toolNextBtn) toolNextBtn.addEventListener('click', handleToolNext);
	  if (toolBackBtnMobile) toolBackBtnMobile.addEventListener('click', handleToolBack);
	  if (toolNextBtnMobile) toolNextBtnMobile.addEventListener('click', handleToolNext);
	  if (packageBackBtn) {
	    packageBackBtn.addEventListener('click', () => {
	      if (selectedMethod === 'draw' || selectedMethod === 'upload') {
        showToolView(selectedMethod, { promptUpload: false });
        return;
      }
      showChoiceView();
    });
  }
	  if (packageNextBtn) {
	    packageNextBtn.addEventListener('click', () => {
	      if (stepPackage) stepPackage.classList.add('hidden');
	      if (stepDetails) stepDetails.classList.remove('hidden');
	      scrollToViewTop(stepDetails);
	    });
	  }
	  if (detailsBackBtn) {
	    detailsBackBtn.addEventListener('click', () => {
	      if (stepDetails) stepDetails.classList.add('hidden');
	      if (stepPackage) stepPackage.classList.remove('hidden');
	      scrollToViewTop(stepPackage);
	    });
	  }
  if (detailsNextBtn) {
    detailsNextBtn.addEventListener('click', () => showSummaryView());
    detailsNextBtn.disabled = false;
  }
	  if (summaryBackBtn) {
	    summaryBackBtn.addEventListener('click', () => {
	      if (stepSummary) stepSummary.classList.add('hidden');
	      if (stepDetails) stepDetails.classList.remove('hidden');
	      scrollToViewTop(stepDetails);
	    });
	  }
  if (summaryDownloadBtn) {
    summaryDownloadBtn.addEventListener('click', downloadSummaryPdf);
  }
  const netlifyForm = document.querySelector('form[name="projektanfrage"]');
  if (netlifyForm) {
    netlifyForm.addEventListener('submit', async (ev) => {
      if (stepSummary && stepSummary.classList.contains('hidden')) {
        ev.preventDefault();
        return;
      }
      if (!window.fetch || !window.FormData) return; // fallback to normal POST
      ev.preventDefault();
      const originalLabel = summaryFinishBtn ? summaryFinishBtn.textContent : '';
      if (summaryFinishBtn) {
        summaryFinishBtn.disabled = true;
        summaryFinishBtn.textContent = 'Envoi…';
      }
      try {
        await submitNetlifyForm(netlifyForm);
        const target = (netlifyForm.getAttribute('action') || './danke.html').trim() || './danke.html';
        window.location.href = target;
      } catch (e) {
        console.error('Netlify submit failed', e);
        alert(`Échec de l’envoi : ${(e && e.message) ? e.message : 'Erreur inconnue'}`);
        if (summaryFinishBtn) {
          summaryFinishBtn.disabled = false;
          summaryFinishBtn.textContent = originalLabel;
        }
      }
    });
  }

  updatePackageDetails(selectedPackage);
  if (packageNextBtn) packageNextBtn.disabled = !selectedPackage;

  function getActive() {
    return objects.find(o => o.id === activeId) || null;
  }

  function enableButtons() {
    const active = getActive();
    const hasVertices = !!active && active.vertices.length > 0;
    const hasBufferVertices = !!active && active.vertices.length > 1 && active.shape !== 'point';
    const anyObjects = objects.length > 0;
    if (undoMenuBtn) undoMenuBtn.disabled = !hasVertices;
    if (redoMenuBtn) redoMenuBtn.disabled = !hasVertices; // redo state not tracked; disabled when no active object content
    if (bufferBtn) {
      bufferBtn.disabled = !hasBufferVertices;
      bufferBtn.classList.toggle('hidden', !active);
    }
    applyBufferBtn.disabled = !hasBufferVertices;
    if (deleteObjectBtn) deleteObjectBtn.disabled = !active;
    // do not auto-hide bufferSection here; controlled via bufferBtn + bufferOpenForId
  }

  function setDrawingCursor(on) {
    if (on) mapEl.classList.add('drawing');
    else mapEl.classList.remove('drawing');
    updateCursor();
    updateEditMarkers();
  }

	  function updateCursor() {
	    if (!mapEl) return;
	    updateCursorHintVisibility();
	    if (selectionDrag) {
	      mapEl.style.cursor = 'grabbing';
	      return;
	    }
    if (attachMode) {
      mapEl.style.cursor = 'crosshair';
      return;
    }
    if (measureMode) {
      mapEl.style.cursor = 'crosshair';
      return;
    }
    if (drawActive) {
      mapEl.style.cursor = 'crosshair';
      return;
    }
    if (selectMode) {
      mapEl.style.cursor = hoverSelect ? 'pointer' : 'grab';
      return;
    }
    mapEl.style.cursor = '';
  }

  function updateToolStates() {
    if (selectBtn) {
      selectBtn.classList.toggle('active', selectMode);
      selectBtn.setAttribute('aria-pressed', selectMode ? 'true' : 'false');
    }
    if (startBtn) {
      const isDraw = drawActive && !attachMode;
      startBtn.classList.toggle('active', isDraw || attachMode);
      const iconSrc = attachMode ? './images/plus.svg' : './images/PhPenNib.svg';
      if (drawIcon) drawIcon.src = iconSrc;
    }
    if (drawMenu) {
      const items = drawMenu.querySelectorAll('.draw-menu-item');
      items.forEach(it => {
        const mode = it.dataset.mode;
        const active = (mode === 'attach' && attachMode) || (mode === drawShape && !attachMode);
        it.classList.toggle('active', active);
      });
    }
    if (measureBtn) {
      measureBtn.classList.toggle('active', measureMode);
      measureBtn.setAttribute('aria-pressed', measureMode ? 'true' : 'false');
    }
  }

  function setSelectMode(on) {
    selectMode = !!on;
    if (!selectMode) hoverSelect = false;
    if (selectMode && measureMode) setMeasureMode(false);
    if (selectMode && attachMode) setAttachMode(false);
    if (selectMode) {
      drawActive = false;
      pendingNewObject = false;
      setDrawingCursor(false);
      map.doubleClickZoom.enable();
      removeSnapMarker();
      const active = getActive();
      if (active) removeTempLine(active);
    }
    updateToolStates();
    updateCursor();
    updateEditMarkers();
  }


  function setMeasureMode(on) {
    const next = !!on;
    if (next === measureMode) return;
    measureMode = next;
    if (measureMode) {
      drawActive = false;
      pendingNewObject = false;
      setSelectMode(false);
      setAttachMode(false);
      setDrawingCursor(false);
      map.doubleClickZoom.disable();
      removeSnapMarker();
    } else {
      resetMeasure();
      map.doubleClickZoom.enable();
    }
    updateToolStates();
    updateCursor();
    updateEditMarkers();
  }

  function setAttachMode(on) {
    const next = !!on;
    if (next === attachMode) return;
    attachMode = next;
    if (attachMode) {
      drawActive = false;
      pendingNewObject = false;
      setSelectMode(false);
      setMeasureMode(false);
      setDrawingCursor(false);
      removeSnapMarker();
      map.doubleClickZoom.disable();
      showConstruction();
    } else if (!drawActive && !measureMode) {
      map.doubleClickZoom.enable();
    }
    updateEditMarkers();
    updateToolStates();
    updateCursor();
  }

  function removePolyline(o) {
    if (o && o.polylineLayer) {
      if (map.hasLayer(o.polylineLayer)) map.removeLayer(o.polylineLayer);
      o.polylineLayer = null;
    }
  }

  function ensureShapeLayer(o) {
    if (!o) return;
    if (o.shape === 'point') {
      removePolyline(o);
      return;
    }
    const wantsPolygon = o.shape === 'polygon';
    const hasPolygon = o.polylineLayer instanceof L.Polygon;
    if (!o.polylineLayer || (wantsPolygon && !hasPolygon) || (!wantsPolygon && hasPolygon)) {
      removePolyline(o);
      o.polylineLayer = wantsPolygon ? L.polygon([], DRAW_POLYGON_STYLE) : L.polyline([], DRAW_LINE_STYLE);
      if (o.visible !== false) o.polylineLayer.addTo(map);
      attachPolylineHandlers(o);
    }
  }

  function removeTempLine(o) {
    if (o && o.tempLine) {
      if (map.hasLayer(o.tempLine)) map.removeLayer(o.tempLine);
      o.tempLine = null;
    }
  }

  function removeSnapMarker() {
    if (snapMarker) {
      map.removeLayer(snapMarker);
      snapMarker = null;
    }
  }

  function removeVertexMarkers(o) {
    if (!o) return;
    o.vertexMarkers.forEach(m => map.removeLayer(m));
    o.vertexMarkers = [];
  }

  function removeBuffer(o) {
    if (o && o.bufferLayer) {
      if (map.hasLayer(o.bufferLayer)) map.removeLayer(o.bufferLayer);
      o.bufferLayer = null;
    }
  }

  function clearBuffer(o) {
    if (!o) return;
    removeBuffer(o);
    o.bufferGeojson = null;
    o.bufferDistance = 0;
    o.bufferMode = 'polygon';
    o.bufferVisible = true;
  }

  function resetMeasure() {
    measurePoints = [];
    if (measureLine) { map.removeLayer(measureLine); measureLine = null; }
    if (measureTempLine) { map.removeLayer(measureTempLine); measureTempLine = null; }
    measureMarkers.forEach(m => map.removeLayer(m));
    measureMarkers = [];
    if (measureLabel) { map.removeLayer(measureLabel); measureLabel = null; }
  }

  function updatePolyline(o) {
    if (!o || !o.polylineLayer) return;
    const segments = (o.branches && o.branches.length) ? o.branches : [o.vertices];
    const latlngs = segments.map(seg => {
      if (o.shape === 'polygon') return seg.slice();
      if (!o.isClosed || seg.length < 3) return seg.slice();
      const first = seg[0];
      const last = seg[seg.length - 1];
      if (!last || !first.equals(last)) return seg.slice().concat([first]);
      return seg.slice();
    });
    o.polylineLayer.setLatLngs(latlngs);
  }

  function refreshBufferFor(o) {
    if (!o || !o.bufferDistance || o.bufferDistance <= 0) return;
    const dist = Number(o.bufferDistance) || 0;
    if (bufferInput) bufferInput.value = dist;
    if (bufferRange) bufferRange.value = dist;
    const activeBefore = activeId;
    setActive(o.id);
    applyBuffer();
    if (activeBefore && activeBefore !== o.id) setActive(activeBefore);
  }

  function startVertexDrag(o, marker) {
    if (!o || o.id !== activeId) return;
    drawActive = true;
    showConstruction(o);
    enableButtons();
    map.doubleClickZoom.disable();
    updateToolStates();
    setDrawingCursor(true);
    vertexDrag = { o, marker };
    map.dragging.disable();
    if (marker && marker.bringToFront) marker.bringToFront();
    updateEditMarkers();
  }

  function stopVertexDrag() {
    if (!vertexDrag) return;
    const { o } = vertexDrag;
    vertexDrag = null;
    map.dragging.enable();
    refreshBufferFor(o);
  }

  function handleVertexDragMove(e) {
    if (!vertexDrag || !e || !e.latlng) return;
    const { o, marker } = vertexDrag;
    const idx = o.vertexMarkers.indexOf(marker);
    if (idx === -1) { stopVertexDrag(); return; }
    const ll = e.latlng;
    marker.setLatLng(ll);
    o.vertices[idx] = ll;
    if (o.isClosed && o.vertices.length === o.vertexMarkers.length && o.vertices.length > 2) {
      const lastIdx = o.vertices.length - 1;
      const first = o.vertices[0];
      const last = o.vertices[lastIdx];
      const hasDuplicate = first && last && first.equals(last);
      if (hasDuplicate) {
        if (idx === 0) {
          o.vertices[lastIdx] = ll;
          const lastMarker = o.vertexMarkers[lastIdx];
          if (lastMarker && lastMarker !== marker) lastMarker.setLatLng(ll);
        } else if (idx === lastIdx) {
          o.vertices[0] = ll;
          const firstMarker = o.vertexMarkers[0];
          if (firstMarker && firstMarker !== marker) firstMarker.setLatLng(ll);
        }
      }
    }
    updatePolyline(o);
  }

  function bindVertexMarkerEvents(o, marker) {
    if (!marker) return;
    marker.on('click', (e) => {
      if (attachMode && !drawActive) {
        startAttachFrom(marker.getLatLng());
      } else {
        setActive(o.id);
        drawActive = true;
        showConstruction(o);
        enableButtons();
        map.doubleClickZoom.disable();
        updateToolStates();
        setDrawingCursor(true);
      }
      if (e && e.originalEvent) { e.originalEvent.preventDefault(); e.originalEvent.stopPropagation(); }
    });
    marker.on('mousedown', (e) => {
      if (e && e.originalEvent) { e.originalEvent.preventDefault(); e.originalEvent.stopPropagation(); }
      if (attachMode && !drawActive) return;
      setActive(o.id);
      startVertexDrag(o, marker);
    });
  }

  function addVertex(latlng) {
    const o = getActive();
    if (!o) return;
    const isPoint = o.shape === 'point';
    o.vertices.push(latlng);
    const marker = L.circleMarker(latlng, {
      radius: isPoint ? 6 : 4,
      color: '#111',
      weight: 1,
      fillColor: isPoint ? ACCENT : '#fff',
      fillOpacity: isPoint ? 0.9 : 1,
      pane: 'markerPane'
    });
    bindVertexMarkerEvents(o, marker);
    if (o.visible !== false) marker.addTo(map);
    o.vertexMarkers.push(marker);
    updatePolyline(o);
    updateEditMarkers();
    attachPolylineHandlers(o);
    enableButtons();
  }

  function trySnap(latlng, pxThreshold) {
    const o = getActive();
    if (!o || o.vertices.length === 0) return null;
    const targetPt = map.latLngToContainerPoint(latlng);
    let best = null;
    let bestDist = Infinity;
    for (let i = 0; i < o.vertices.length; i++) {
      const v = o.vertices[i];
      const p = map.latLngToContainerPoint(v);
      const d = p.distanceTo(targetPt);
      if (d < bestDist && d <= pxThreshold) {
        best = v;
        bestDist = d;
      }
    }
    return best; // returns L.LatLng or null
  }

  function showSnapMarker(latlng) {
    if (!snapMarker) {
      snapMarker = L.circleMarker(latlng, {
        radius: 6,
        color: '#e83e8c',
        weight: 2,
        fillColor: '#f3a6c7',
        fillOpacity: 0.6,
      }).addTo(map);
    } else {
      snapMarker.setLatLng(latlng);
    }
  }

  function updateTempLine(toLatLng) {
    const o = getActive();
    if (!o || o.vertices.length === 0) return;
    if (o.shape === 'point') return;
    const from = o.vertices[o.vertices.length - 1];
    const latlngs = [from, toLatLng];
    if (!o.tempLine) {
      o.tempLine = L.polyline(latlngs, { color: '#ff0000', weight: 2, dashArray: '4,6' });
      if (o.visible !== false) o.tempLine.addTo(map);
    } else {
      o.tempLine.setLatLngs(latlngs);
    }
  }

  function finishClose() {
    // intentionally left empty; auto-closing disabled
  }

  function undo() {
    const o = getActive();
    if (!o || o.vertices.length === 0) return;
    if (o.isClosed) {
      o.vertices.pop();
      const m = o.vertexMarkers.pop();
      if (m) map.removeLayer(m);
      o.isClosed = false;
    } else {
      o.vertices.pop();
      const m = o.vertexMarkers.pop();
      if (m) map.removeLayer(m);
    }
	    updatePolyline(o);
	    removeTempLine(o);
	    enableButtons();
	    updateCursorHintVisibility();
	  }

  function toLineGeoJSON(o) {
    if (!o) return null;
    const segments = (o.branches && o.branches.length) ? o.branches : [o.vertices];
    const coordsList = segments
      .map(seg => seg.map(ll => [ll.lng, ll.lat]))
      .filter(arr => arr.length >= 2);
    if (!coordsList.length) return null;
    if (coordsList.length === 1) {
      let coords = coordsList[0];
      if (o.isClosed && coords.length >= 3) {
        const first = coords[0];
        const last = coords[coords.length - 1];
        if (!(first[0] === last[0] && first[1] === last[1])) {
          coords = coords.concat([first]);
        }
      }
      return { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } };
    }
    // Multi segment
    const coords = coordsList.map(c => {
      if (o.isClosed && c.length >= 3) {
        const first = c[0];
        const last = c[c.length - 1];
        if (!(first[0] === last[0] && first[1] === last[1])) return c.concat([first]);
      }
      return c;
    });
    return { type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates: coords } };
  }

  function applyBuffer() {
    const o = getActive();
    if (!o) return;
    const line = toLineGeoJSON(o);
    if (!line) return;
    const dist = Number(bufferInput.value) || 0;
    removeBuffer(o);
    o.bufferDistance = dist;
    bufferMode = 'polygon';
    o.bufferMode = 'polygon';
    if (dist <= 0) { o.bufferGeojson = null; return; }
    try {
      const buffered = turf.buffer(line, dist, { units: 'meters' });
      o.bufferGeojson = buffered;
      o.bufferLayer = L.geoJSON(buffered, {
        style: { color: '#e83e8c', weight: 2, fillColor: '#e83e8c', fillOpacity: 0.15 },
      });
      if (o.visible !== false && o.bufferVisible !== false) o.bufferLayer.addTo(map);
      if (!showConstructionChk || !showConstructionChk.checked) {
        hideConstruction(o);
        updateEditMarkers();
      }
      renderObjectsList();
    } catch (e) {
      console.error('Buffer error:', e);
      alert('Erreur lors de la création de la zone tampon. Veuillez essayer une autre valeur.');
    }
  }

  function hideConstruction(o = getActive()) {
    if (!o) return;
    if (o.shape === 'point') return;
    o.constructionHidden = true;
    o.vertexMarkers.forEach(m => m.setStyle({ opacity: 0, fillOpacity: 0 }));
  }

  function showConstruction(o = getActive()) {
    if (!o) return;
    o.constructionHidden = false;
    o.vertexMarkers.forEach(m => m.setStyle({ opacity: 1, fillOpacity: 1 }));
  }

  // Show vertex anchors only for the active object while editing
  function updateEditMarkers() {
    objects.forEach((obj) => {
      const isPoint = obj.shape === 'point';
      const show = (obj.visible !== false) && (isPoint || attachMode || (drawActive && obj.id === activeId && !obj.constructionHidden));
      const fillOpacity = isPoint ? 0.9 : 1;
      obj.vertexMarkers.forEach(m => m.setStyle({ opacity: show ? 1 : 0, fillOpacity: show ? fillOpacity : 0 }));
    });
  }

  function formatDistance(meters) {
    if (!Number.isFinite(meters)) return '';
    if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
    return `${meters.toFixed(1)} m`;
  }

  // Draw vector overlays to the captured canvas for a given Leaflet map
  function drawVectorsOnCanvas(canvas, targetMap) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const size = targetMap.getSize ? targetMap.getSize() : { x: canvas.width, y: canvas.height };
    const elW = size.x || canvas.width;
    const elH = size.y || canvas.height;
    const scaleX = canvas.width / elW;
    const scaleY = canvas.height / elH;
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#ff0000';
    const baseWidth = 3; // match leaflet weight
    const lw = Math.max(1, Math.round(baseWidth * Math.max(scaleX, scaleY)));
    ctx.lineWidth = lw;
    (objects || []).forEach(o => {
      if (!o || !o.vertices || o.vertices.length === 0) return;
      if (o.visible === false) return;
      const pts = o.vertices.map(ll => targetMap.latLngToContainerPoint(ll));
      if (pts.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(pts[0].x * scaleX, pts[0].y * scaleY);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x * scaleX, pts[i].y * scaleY);
      }
      if (o.isClosed && pts.length >= 3) ctx.closePath();
      ctx.stroke();
    });
    ctx.restore();
  }

  function updateMeasureLabel(total) {
    if (!measurePoints.length) {
      if (measureLabel) { map.removeLayer(measureLabel); measureLabel = null; }
      return;
    }
    const last = measurePoints[measurePoints.length - 1];
    const html = `<div class="measure-label">${formatDistance(total)}</div>`;
    const icon = L.divIcon({ className: 'measure-label-wrap', html, iconSize: null, iconAnchor: [0, 0] });
    if (!measureLabel) {
      measureLabel = L.marker(last, { icon, interactive: false }).addTo(map);
    } else {
      measureLabel.setLatLng(last);
      measureLabel.setIcon(icon);
    }
  }

  function updateMeasureOverlay() {
    if (measureLine) { map.removeLayer(measureLine); measureLine = null; }
    if (measureTempLine) { map.removeLayer(measureTempLine); measureTempLine = null; }
    measureMarkers.forEach(m => map.removeLayer(m));
    measureMarkers = [];
    if (!measurePoints.length) {
      if (measureLabel) { map.removeLayer(measureLabel); measureLabel = null; }
      return;
    }
    measureLine = L.polyline(measurePoints, { color: ACCENT, weight: 3, dashArray: '6,4' }).addTo(map);
    measurePoints.forEach(pt => {
      const m = L.circleMarker(pt, { radius: 4, color: ACCENT, weight: 2, fillColor: '#fff', fillOpacity: 1 });
      m.addTo(map);
      measureMarkers.push(m);
    });
    let total = 0;
    for (let i = 1; i < measurePoints.length; i++) {
      total += map.distance(measurePoints[i - 1], measurePoints[i]);
    }
    updateMeasureLabel(total);
  }

  function updateMeasurePreview(toLatLng) {
    if (!measureMode || measurePoints.length === 0 || !toLatLng) return;
    const pts = measurePoints.concat([toLatLng]);
    if (!measureTempLine) {
      measureTempLine = L.polyline(pts, { color: ACCENT, weight: 2, dashArray: '4,4', opacity: 0.8 }).addTo(map);
    } else {
      measureTempLine.setLatLngs(pts);
    }
  }

  function addMeasurePoint(latlng) {
    if (!measureMode) return;
    measurePoints.push(latlng);
    updateMeasureOverlay();
  }

  function startAttachFrom(latlng, targetObj) {
    const obj = targetObj || getActive() || objects[0];
    if (!obj) return;
    setActive(obj.id);
    if (obj.shape === 'point') obj.shape = 'line';
    obj.isClosed = false;
    obj.branches = obj.branches || [];
    const newBranch = [latlng];
    obj.branches.push(newBranch);
    obj.vertices = newBranch;
    const marker = L.circleMarker(latlng, { radius: 4, color: '#111', weight: 1, fillColor: '#fff', fillOpacity: 1, pane: 'markerPane' });
    bindVertexMarkerEvents(obj, marker);
    marker.addTo(map);
    obj.vertexMarkers.push(marker);
    ensureShapeLayer(obj);
    updatePolyline(obj);
    drawActive = true;
    map.doubleClickZoom.disable();
    setDrawingCursor(true);
    updateToolStates();
    enableButtons();
    updateEditMarkers();
  }

  function handleMeasureClick(latlng) {
    addMeasurePoint(latlng);
  }

  // Map interactions
  map.on('click', (e) => {
    if (attachMode && !drawActive) {
      const nearest = findNearestVertex(e.latlng, 18);
      if (nearest && nearest.obj && nearest.vertex) {
        startAttachFrom(nearest.vertex, nearest.obj);
        return;
      }
    }
    if (measureMode) { handleMeasureClick(e.latlng); return; }
    if (!selectMode) return;
    handleSelectClick(e.latlng);
  });

  map.on('mousemove', (e) => {
    if (selectionDrag) {
      applySelectionDrag(e.latlng);
      return;
    }
    if (attachMode && !drawActive) return;
    if (measureMode) {
      if (!drawActive) updateMeasurePreview(e.latlng);
      return;
    }
    if (selectMode && !drawActive) {
      const hit = findClosestObject(e.latlng);
      hoverSelect = !!(hit && hit.obj);
      updateCursor();
      return;
    }
    if (vertexDrag) { handleVertexDragMove(e); return; }
    const o = getActive();
    if (!drawActive || !o || o.isClosed || o.vertices.length === 0) return;
    const px = Math.max(4, Number(snapPxInput ? snapPxInput.value : 14) || 14);
    const snapped = trySnap(e.latlng, px);
    if (snapped) {
      showSnapMarker(snapped);
      updateTempLine(snapped);
    } else {
      removeSnapMarker();
      updateTempLine(e.latlng);
    }
  });

  map.on('click', (e) => {
    if (vertexDrag) return;
    if (!drawActive) return;
    if (e && e.originalEvent) {
      const clientX = Number(e.originalEvent.clientX);
      const clientY = Number(e.originalEvent.clientY);
      if (Number.isFinite(clientX) && Number.isFinite(clientY)) {
        lastCursorHintPos = { x: clientX, y: clientY };
      }
    }
    let o = getActive();
    if (!o || pendingNewObject) {
      const oNew = createObject(drawShape);
      pendingNewObject = false;
      setActive(oNew.id);
      o = oNew;
      o.shape = drawShape;
      ensureShapeLayer(o);
      o.isClosed = false;
      removeBuffer(o);
      showConstruction(o);
      enableButtons();
      updateToolStates();
      map.doubleClickZoom.disable();
      setDrawingCursor(true);
      updateEditMarkers();
    }
    if (!o) return;
    if (o.isClosed) return;
    const px = Math.max(4, Number(snapPxInput ? snapPxInput.value : 14) || 14);
    const snapped = trySnap(e.latlng, px);
    const toAdd = snapped || e.latlng;
    if (o.shape === 'point') {
      addVertex(toAdd);
      updateCursorHintVisibility();
      return;
    }
    addVertex(toAdd);
    updateCursorHintVisibility();
  });

  map.on('dblclick', (e) => {
    if (measureMode) { resetMeasure(); return; }
    if (vertexDrag) return;
    finalizeActiveObject();
    if (attachMode) {
      updateEditMarkers();
    }
  });

  // Finish current object on right-click (context menu)
  function finalizeActiveObject() {
    const o = getActive();
    if (!o) return;
    drawActive = false;
    pendingNewObject = false;
    if (o.shape === 'polygon' && o.vertices.length >= 3) {
      o.isClosed = true;
    }
    if (startBtn) startBtn.classList.remove('active');
    removeTempLine(o);
    removeSnapMarker();
    setDrawingCursor(false);
    setSelectMode(true);
    enableButtons();
    updateToolStates();
    map.doubleClickZoom.enable();
    if (o.shape !== 'point') hideConstruction(o);
    updateEditMarkers();
  }
  map.on('contextmenu', (e) => {
    if (vertexDrag) return;
    if (selectionDrag) { stopSelectionDrag(); return; }
    const o = getActive();
    if (!drawActive || !o) return;
    if (e && e.originalEvent) { e.originalEvent.preventDefault(); }
    finalizeActiveObject();
    updateEditMarkers();
  });

  map.on('mouseup', () => { stopVertexDrag(); stopSelectionDrag(); });
  if (mapEl) {
    mapEl.addEventListener('mouseleave', () => { stopVertexDrag(); stopSelectionDrag(); });
  }
  map.on('dragstart', () => {
    if (selectMode && !drawActive && !selectionDrag) {
      mapEl.style.cursor = 'grabbing';
    }
  });
  map.on('dragend', () => {
    if (!selectionDrag) updateCursor();
  });

  // Buttons
  if (selectBtn) {
    selectBtn.addEventListener('click', () => {
      setSelectMode(!selectMode);
    });
  }

  if (measureBtn) {
    measureBtn.addEventListener('click', () => {
      setMeasureMode(!measureMode);
    });
  }

  if (drawMenuBtn && drawMenu) {
    drawMenuBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      drawMenu.classList.toggle('hidden');
      drawMenuBtn.classList.add('tip-hide');
    });
    document.addEventListener('click', () => {
      if (!drawMenu.classList.contains('hidden')) drawMenu.classList.add('hidden');
      drawMenuBtn.classList.remove('tip-hide');
    });
    const items = drawMenu.querySelectorAll('.draw-menu-item');
    items.forEach(it => {
      it.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const mode = it.dataset.mode;
        drawMenu.classList.add('hidden');
        drawMenuBtn.classList.remove('tip-hide');
        if (mode === 'attach') {
          setAttachMode(true);
          drawActive = false;
          setDrawingCursor(false);
        } else {
          setSelectMode(false);
          setMeasureMode(false);
          setAttachMode(false);
          drawShape = mode || 'polygon';
          drawActive = true;
          setDrawingCursor(true);
          const active = getActive();
          const needsNewObject = !active || pendingNewObject || (active.shape && active.shape !== drawShape) || active.isClosed;
          if (needsNewObject) {
            pendingNewObject = true;
            setActive(null);
          } else {
            active.shape = drawShape;
            ensureShapeLayer(active);
            active.isClosed = false;
            removeBuffer(active);
            showConstruction(active);
          }
          enableButtons();
          map.doubleClickZoom.disable();
          updateEditMarkers();
        }
        updateToolStates();
      });
    });
  }

  map.on('mousedown', (e) => {
    if (!selectMode || drawActive) return;
    const hit = findClosestObject(e.latlng);
    if (!hit || !hit.obj) return;
    setActive(hit.obj.id);
    showConstruction(hit.obj);
    startSelectionDrag(hit.obj, e.latlng);
  });

  startBtn.addEventListener('click', () => {
    setSelectMode(false);
    setAttachMode(false);
    setMeasureMode(false);
    const active = getActive();
    const needsNewObject = !drawActive || !active || (active.shape && active.shape !== drawShape);
    if (needsNewObject) {
      pendingNewObject = true;
      setActive(null);
    } else {
      pendingNewObject = false;
      active.shape = drawShape;
      ensureShapeLayer(active);
      active.isClosed = false;
      removeBuffer(active);
      showConstruction(active);
    }
    drawActive = true;
    enableButtons();
    updateToolStates();
    map.doubleClickZoom.disable();
	    setDrawingCursor(true);
	    updateEditMarkers();

	    if (drawMenu && drawMenuBtn) {
	      setTimeout(() => {
	        drawMenu.classList.remove('hidden');
	        drawMenuBtn.classList.add('tip-hide');
      }, 0);
    }
  });

  if (undoMenuBtn) undoMenuBtn.addEventListener('click', () => { undo(); });
  // Simple redo stub (no history stack implemented)
  if (redoMenuBtn) redoMenuBtn.addEventListener('click', () => { alert('La fonction de restauration n’est pas encore implémentée.'); });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      const o = getActive();
      if (!o) return;
      drawActive = false;
      if (startBtn) startBtn.classList.remove('active');
      o.isClosed = false;
      o.vertices = [];
      o.branches = [o.vertices];
      removePolyline(o);
      removeVertexMarkers(o);
      removeTempLine(o);
      removeSnapMarker();
      removeBuffer(o);
      setDrawingCursor(false);
      enableButtons();
      updateToolStates();
      map.doubleClickZoom.enable();
    });
  }

  applyBufferBtn.addEventListener('click', () => {
    applyBuffer();
  });

  if (bufferBtn) {
  bufferBtn.addEventListener('click', () => {
    const o = getActive();
    if (!o || !o.vertices || o.vertices.length === 0) return;
    bufferOpenForId = o.id;
    if (bufferSection) {
      bufferSection.classList.remove('hidden');
      bufferSection.style.display = 'block';
    }
    enableButtons();
  });
  }
  // Live controls
  if (snapPxInput) snapPxInput.addEventListener('change', () => {});

  const syncBufferInputs = (val) => {
    const v = Math.max(0, Number(val) || 0);
    bufferInput.value = String(v);
    bufferRange.value = String(Math.min(200, v));
  };
  bufferInput.addEventListener('change', () => {
    syncBufferInputs(bufferInput.value);
    if (getActive()) applyBuffer();
  });
  bufferRange.addEventListener('input', () => {
    syncBufferInputs(bufferRange.value);
    if (getActive()) applyBuffer();
  });

  if (showConstructionChk) {
    showConstructionChk.addEventListener('change', () => {
      const o = getActive();
      if (!o) return;
      if (showConstructionChk.checked) showConstruction(o);
      else hideConstruction(o);
    });
  }

  if (basemapSelect) {
    basemapSelect.addEventListener('change', () => {
      const val = basemapSelect.value;
      applyBasemap(val === 'satellite' ? 'sat' : val);
    });
  }

  if (basemapBtns && basemapBtns.length) {
    basemapBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.layer;
        applyBasemap(mode);
      });
    });
    applyBasemap('osm');
  }

  // Add scale control bottom left
  L.control.scale({ position: 'bottomleft', imperial: false, maxWidth: 120 }).addTo(map);

  // Objects management
  function createObject(shape = drawShape, isClosed = false) {
    const id = Date.now() + Math.random();
    const idx = objects.length + 1;
    const branch = [];
    const obj = {
      id,
	      name: `Objet ${idx}`,
      shape,
      isClosed,
      vertices: branch,
      branches: [branch],
      vertexMarkers: [],
      polylineLayer: null,
      tempLine: null,
      bufferLayer: null,
      bufferGeojson: null,
      bufferVisible: true,
      constructionHidden: false,
      visible: true,
      bufferMode: bufferMode || 'polygon',
      bufferDistance: 0,
    };
    objects.push(obj);
    renderObjectsList();
    return obj;
  }

  function removeObject(id) {
    const o = objects.find(x => x.id === id);
    if (!o) return;
    removeTempLine(o);
    removeBuffer(o);
    removePolyline(o);
    removeVertexMarkers(o);
    if (snapMarker) removeSnapMarker();
    objects = objects.filter(x => x.id !== id);
    if (activeId === id) activeId = null;
    renderObjectsList();
    enableButtons();
    updateEditMarkers();
  }

  function pointToSegmentDistSq(p, a, b) {
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const wx = p.x - a.x;
    const wy = p.y - a.y;
    const c1 = vx * wx + vy * wy;
    if (c1 <= 0) return wx * wx + wy * wy;
    const c2 = vx * vx + vy * vy;
    if (c2 <= c1) {
      const dx = p.x - b.x;
      const dy = p.y - b.y;
      return dx * dx + dy * dy;
    }
    const t = c1 / c2;
    const projX = a.x + t * vx;
    const projY = a.y + t * vy;
    const dx = p.x - projX;
    const dy = p.y - projY;
    return dx * dx + dy * dy;
  }

  function findClosestObject(latlng, tolerancePx = 18) {
    if (!latlng || !objects || !objects.length) return null;
    const clickPt = map.latLngToContainerPoint(latlng);
    let best = null;
    const maxDistSq = tolerancePx * tolerancePx;
    objects.forEach((o) => {
      if (!o || o.visible === false || !o.vertices || o.vertices.length < 2) return;
      const pts = o.vertices.map(v => map.latLngToContainerPoint(v));
      let minObjDistSq = Infinity;
      for (let i = 0; i < pts.length - 1; i++) {
        const d = pointToSegmentDistSq(clickPt, pts[i], pts[i + 1]);
        if (d < minObjDistSq) minObjDistSq = d;
      }
      if (o.isClosed && pts.length >= 3) {
        const d = pointToSegmentDistSq(clickPt, pts[pts.length - 1], pts[0]);
        if (d < minObjDistSq) minObjDistSq = d;
      }
      if (minObjDistSq <= maxDistSq) {
        if (!best || minObjDistSq < best.distSq) {
          best = { obj: o, distSq: minObjDistSq };
        }
      }
    });
    return best;
  }

  function findNearestVertex(latlng, tolerancePx = 18) {
    if (!latlng || !objects || !objects.length) return null;
    const clickPt = map.latLngToContainerPoint(latlng);
    let best = null;
    const maxDist = tolerancePx;
    objects.forEach((o) => {
      if (!o || !o.vertices || !o.vertices.length) return;
      o.vertices.forEach(v => {
        const p = map.latLngToContainerPoint(v);
        const d = p.distanceTo(clickPt);
        if (d <= maxDist && (!best || d < best.dist)) {
          best = { obj: o, vertex: v, dist: d };
        }
      });
    });
    return best;
  }

  function startSelectionDrag(o, startLatLng) {
    if (!o || !startLatLng) return;
    const startPoint = map.latLngToLayerPoint(startLatLng);
    const origPoints = o.vertices.map(v => map.latLngToLayerPoint(v));
    if (o.bufferLayer) removeBuffer(o);
    selectionDrag = { obj: o, startPoint, origPoints };
    map.dragging.disable();
    hoverSelect = true;
    updateCursor();
  }

  function applySelectionDrag(latlng) {
    if (!selectionDrag || !latlng) return;
    const curPt = map.latLngToLayerPoint(latlng);
    const dx = curPt.x - selectionDrag.startPoint.x;
    const dy = curPt.y - selectionDrag.startPoint.y;
    const newLatLngs = selectionDrag.origPoints.map(p => map.layerPointToLatLng(L.point(p.x + dx, p.y + dy)));
    selectionDrag.obj.vertices = newLatLngs;
    updatePolyline(selectionDrag.obj);
    selectionDrag.obj.vertexMarkers.forEach((m, idx) => {
      if (m && newLatLngs[idx]) m.setLatLng(newLatLngs[idx]);
    });
    updateEditMarkers();
  }

  function stopSelectionDrag() {
    if (!selectionDrag) return;
    const o = selectionDrag.obj;
    selectionDrag = null;
    map.dragging.enable();
    hoverSelect = false;
    if (o && o.bufferDistance && o.bufferDistance > 0) refreshBufferFor(o);
    updateCursor();
  }

  function handleSelectClick(latlng) {
    const hit = findClosestObject(latlng);
    if (!hit || !hit.obj) return;
    setActive(hit.obj.id);
    showConstruction(hit.obj);
    updateCursor();
  }

  function setActive(id) {
    activeId = id;
    if (id != null) pendingNewObject = false;
    const o = getActive();
    if (bufferSection && bufferOpenForId !== activeId) { bufferSection.classList.add('hidden'); bufferOpenForId = null; }
    if (showConstructionChk) showConstructionChk.checked = !!o && !o.constructionHidden;
    enableButtons();
    highlightActiveInList();
    updateEditMarkers();
  }

  function startObjectEdit(o) {
    if (!o) return;
    setActive(o.id);
    ensureShapeLayer(o);
    updatePolyline(o);
    o.vertexMarkers.forEach(m => {
      if (m && o.visible !== false && !map.hasLayer(m)) m.addTo(map);
    });
    drawActive = true;
    showConstruction(o);
    enableButtons();
    updateToolStates();
    map.doubleClickZoom.disable();
    setDrawingCursor(true);
    updateEditMarkers();
  }

  function setObjectVisibility(o, visible) {
    o.visible = visible;
    const ensureAdded = (layer) => { if (layer && !map.hasLayer(layer)) map.addLayer(layer); };
    const ensureRemoved = (layer) => { if (layer && map.hasLayer(layer)) map.removeLayer(layer); };
    if (visible) {
      ensureAdded(o.polylineLayer);
      o.vertexMarkers.forEach(m => ensureAdded(m));
      ensureAdded(o.tempLine);
    } else {
      ensureRemoved(o.polylineLayer);
      o.vertexMarkers.forEach(m => ensureRemoved(m));
      ensureRemoved(o.tempLine);
    }
  }

  function setBufferVisibility(o, visible) {
    o.bufferVisible = visible;
    const ensureAdded = (layer) => { if (layer && !map.hasLayer(layer)) map.addLayer(layer); };
    const ensureRemoved = (layer) => { if (layer && map.hasLayer(layer)) map.removeLayer(layer); };
    if (visible) {
      ensureAdded(o.bufferLayer);
    } else {
      ensureRemoved(o.bufferLayer);
    }
  }

	  function renderObjectsList() {
	    closeAllObjMenus();
	    objectsList.innerHTML = '';
	    objects.forEach((o) => {
      const shapeLabelMap = { polygon: 'Polygone', line: 'Ligne', point: 'Point' };
      const shapeLabel = shapeLabelMap[o.shape] || 'Tracé';
      const div = document.createElement('div');
      div.className = 'obj-item';
      div.dataset.id = String(o.id);
      const isVisible = o.visible !== false;
      div.innerHTML = `
        <div class="obj-icon" aria-hidden="true"></div>
        <div class="obj-meta">
          <span class="obj-title">${o.name}</span>
          <span class="obj-sub">${shapeLabel}</span>
        </div>
        <div class="obj-actions">
          <div class="obj-menu">
            <button type="button" class="obj-menu-item edit">Modifier</button>
            <button type="button" class="obj-menu-item jump">Aller à l’objet</button>
            <button type="button" class="obj-menu-item delete">Supprimer</button>
          </div>
          <button type="button" class="opts-btn" aria-label="Options">⋯</button>
          <button type="button" class="eye-btn ${isVisible ? '' : 'off'}" data-visible="${isVisible ? 'true' : 'false'}" aria-label="${isVisible ? 'Masquer la couche' : 'Afficher la couche'}"></button>
        </div>
      `;
      const eyeBtn = div.querySelector('.eye-btn');
      const menu = div.querySelector('.obj-menu');
      if (eyeBtn) {
        eyeBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const cur = eyeBtn.dataset.visible !== 'false';
          const next = !cur;
          setObjectVisibility(o, next);
          eyeBtn.dataset.visible = next ? 'true' : 'false';
          eyeBtn.classList.toggle('off', !next);
          eyeBtn.setAttribute('aria-label', next ? 'Masquer la couche' : 'Afficher la couche');
        });
      }
      const optsBtn = div.querySelector('.opts-btn');
      if (optsBtn) {
        optsBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const isOpen = !!menu && ((floatingObjMenu === menu) || menu.classList.contains('open'));
          closeAllObjMenus();
          if (menu && !isOpen) openFloatingObjMenu(menu, optsBtn);
        });
      }
      if (menu) {
        const editBtn = menu.querySelector('.obj-menu-item.edit');
        const jumpBtn = menu.querySelector('.obj-menu-item.jump');
        const delBtn = menu.querySelector('.obj-menu-item.delete');
        if (editBtn) {
          editBtn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            closeAllObjMenus();
            startObjectEdit(o);
          });
        }
        if (jumpBtn) {
          jumpBtn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            setActive(o.id);
            closeAllObjMenus();
            if (o.vertices && o.vertices.length) {
              const b = L.latLngBounds(o.vertices);
              map.fitBounds(b.pad(0.2));
            }
          });
        }
        if (delBtn) {
          delBtn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            closeAllObjMenus();
            removeObject(o.id);
          });
        }
      }
      div.addEventListener('click', (ev) => {
        if (ev.target.closest('.eye-btn') || ev.target.closest('.opts-btn')) return;
        setActive(o.id);
      });
      objectsList.appendChild(div);

      if (o.bufferLayer && (Number(o.bufferDistance) || 0) > 0) {
        const buf = document.createElement('div');
        buf.className = 'obj-item obj-buffer';
        buf.dataset.id = `buffer-${o.id}`;
        const bufVisible = o.bufferVisible !== false;
        buf.innerHTML = `
          <div class="obj-icon buffer" aria-hidden="true"></div>
          <div class="obj-meta">
            <span class="obj-title">${o.name}</span>
            <span class="obj-sub">Zone tampon (résultat)</span>
          </div>
          <div class="obj-actions">
            <div class="obj-menu">
              <button type="button" class="obj-menu-item jump">Aller à l’objet</button>
              <button type="button" class="obj-menu-item delete">Supprimer</button>
            </div>
            <button type="button" class="opts-btn" aria-label="Options">⋯</button>
            <button type="button" class="eye-btn ${bufVisible ? '' : 'off'}" data-visible="${bufVisible ? 'true' : 'false'}" aria-label="${bufVisible ? 'Masquer la zone tampon' : 'Afficher la zone tampon'}"></button>
          </div>
        `;
        const bufEye = buf.querySelector('.eye-btn');
        const bufMenu = buf.querySelector('.obj-menu');
        const bufOpts = buf.querySelector('.opts-btn');
        if (bufEye) {
          bufEye.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const cur = bufEye.dataset.visible !== 'false';
            const next = !cur;
            setBufferVisibility(o, next);
            bufEye.dataset.visible = next ? 'true' : 'false';
            bufEye.classList.toggle('off', !next);
            bufEye.setAttribute('aria-label', next ? 'Masquer la zone tampon' : 'Afficher la zone tampon');
          });
        }
        if (bufOpts && bufMenu) {
          bufOpts.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const isOpen = (floatingObjMenu === bufMenu) || bufMenu.classList.contains('open');
            closeAllObjMenus();
            if (!isOpen) openFloatingObjMenu(bufMenu, bufOpts);
          });
          const jumpBtn = bufMenu.querySelector('.obj-menu-item.jump');
          const delBtn = bufMenu.querySelector('.obj-menu-item.delete');
          if (jumpBtn) {
            jumpBtn.addEventListener('click', (ev) => {
              ev.stopPropagation();
              setActive(o.id);
              closeAllObjMenus();
              if (o.bufferLayer && o.bufferLayer.getBounds) {
                map.fitBounds(o.bufferLayer.getBounds().pad(0.2));
              } else if (o.vertices && o.vertices.length) {
                map.fitBounds(L.latLngBounds(o.vertices).pad(0.2));
              }
            });
	          }
	          if (delBtn) {
	            delBtn.addEventListener('click', (ev) => {
	              ev.stopPropagation();
	              closeAllObjMenus();
	              clearBuffer(o);
	              renderObjectsList();
	            });
	          }
	        }
	        buf.addEventListener('click', () => setActive(o.id));
	        objectsList.appendChild(buf);
	      }
	    });
	    highlightActiveInList();
	    updateLayerPanelVisibility();

	  }

	  function closeFloatingObjMenu() {
	    if (!floatingObjMenu) return;
	    const menu = floatingObjMenu;
	    const restore = floatingObjMenuRestore;
	    floatingObjMenu = null;
	    floatingObjMenuRestore = null;

	    menu.classList.remove('open', 'floating');
	    menu.style.position = '';
	    menu.style.left = '';
	    menu.style.top = '';
	    menu.style.right = '';
	    menu.style.bottom = '';
	    menu.style.zIndex = '';
	    menu.style.visibility = '';
	    menu.style.transformOrigin = '';

	    if (restore && restore.parent && restore.parent.isConnected) {
	      try {
	        if (restore.nextSibling && restore.nextSibling.parentNode === restore.parent) {
	          restore.parent.insertBefore(menu, restore.nextSibling);
	        } else {
	          restore.parent.appendChild(menu);
	        }
	        return;
	      } catch (_) {}
	    }
	    if (menu.parentNode) {
	      try { menu.parentNode.removeChild(menu); } catch (_) {}
	    }
	  }

	  function openFloatingObjMenu(menu, anchorBtn) {
	    if (!menu || !anchorBtn) return;
	    closeFloatingObjMenu();

	    const restore = { parent: menu.parentNode, nextSibling: menu.nextSibling };
	    floatingObjMenu = menu;
	    floatingObjMenuRestore = restore;

	    menu.classList.add('open', 'floating');
	    menu.style.position = 'fixed';
	    menu.style.left = '0px';
	    menu.style.top = '0px';
	    menu.style.right = 'auto';
	    menu.style.bottom = 'auto';
	    menu.style.zIndex = '5000';
	    menu.style.visibility = 'hidden';
	    document.body.appendChild(menu);

	    const anchorRect = anchorBtn.getBoundingClientRect();
	    const menuRect = menu.getBoundingClientRect();
	    const pad = 8;
	    const offset = 6;

	    let left = anchorRect.right - menuRect.width;
	    left = Math.max(pad, Math.min(left, window.innerWidth - menuRect.width - pad));

	    const spaceBelow = window.innerHeight - anchorRect.bottom;
	    const spaceAbove = anchorRect.top;
	    let top;
	    if (spaceBelow < menuRect.height + offset && spaceAbove > menuRect.height + offset) {
	      top = anchorRect.top - menuRect.height - offset;
	      menu.style.transformOrigin = 'bottom right';
	    } else {
	      top = anchorRect.bottom + offset;
	      menu.style.transformOrigin = 'top right';
	    }
	    top = Math.max(pad, Math.min(top, window.innerHeight - menuRect.height - pad));

	    menu.style.left = `${Math.round(left)}px`;
	    menu.style.top = `${Math.round(top)}px`;
	    menu.style.visibility = 'visible';
	  }

	  function closeAllObjMenus() {
	    closeFloatingObjMenu();
	    const menus = objectsList.querySelectorAll('.obj-menu.open');
	    menus.forEach(m => m.classList.remove('open'));
	  }

  function attachPolylineHandlers(o) {
    if (!o || !o.polylineLayer) return;
    o.polylineLayer.off('click');
    o.polylineLayer.on('click', (e) => {
      setActive(o.id);
      drawActive = true;
      showConstruction(o);
      enableButtons();
      updateToolStates();
      map.doubleClickZoom.disable();
      setDrawingCursor(true);
      updateEditMarkers();
      if (e && e.originalEvent) {
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
      }
    });
  }

  function highlightActiveInList() {
    const items = objectsList.querySelectorAll('.obj-item');
    items.forEach(el => {
    const id = el.dataset.id;
    const isActive = id && String(activeId) === String(id);
    el.classList.toggle('active', isActive);
  });
}

  if (newObjectBtn) {
    newObjectBtn.addEventListener('click', () => {
      const o = createObject(drawShape);
      setActive(o.id);
      // Start drawing immediately
      o.shape = drawShape;
      ensureShapeLayer(o);
      drawActive = true;
      map.doubleClickZoom.disable();
      setDrawingCursor(true);
      enableButtons();
      updateToolStates();
    });
  }

  if (deleteObjectBtn) {
    deleteObjectBtn.addEventListener('click', () => {
      const o = getActive();
      if (!o) return;
      removeObject(o.id);
    });
  }

  function pickCoordsFromGeometry(g) {
    if (!g) return { coords: [], isClosed: false, shape: '' };
    const type = g.type;
    if (type === 'LineString') {
      return { coords: g.coordinates || [], isClosed: false, shape: 'line' };
    }
    if (type === 'MultiLineString') {
      const line = (g.coordinates || []).find(arr => Array.isArray(arr) && arr.length >= 2);
      return { coords: line || [], isClosed: false, shape: 'line' };
    }
    if (type === 'Polygon') {
      return { coords: (g.coordinates && g.coordinates[0]) || [], isClosed: true, shape: 'polygon' };
    }
    if (type === 'MultiPolygon') {
      const poly = (g.coordinates || []).find(p => Array.isArray(p) && p[0] && p[0].length >= 2);
      return { coords: (poly && poly[0]) || [], isClosed: true, shape: 'polygon' };
    }
    if (type === 'Point') {
      return { coords: g.coordinates ? [g.coordinates] : [], isClosed: false, shape: 'point' };
    }
    if (type === 'MultiPoint') {
      const pt = (g.coordinates || []).find(arr => Array.isArray(arr) && arr.length >= 2);
      return { coords: pt ? [pt] : [], isClosed: false, shape: 'point' };
    }
    if (type === 'GeometryCollection') {
      const geometries = g.geometries || [];
      for (let i = 0; i < geometries.length; i++) {
        const res = pickCoordsFromGeometry(geometries[i]);
        const minCoords = res.shape === 'point' ? 1 : 2;
        if (res.coords.length >= minCoords) return res;
      }
      return { coords: [], isClosed: false, shape: '' };
    }
    return { coords: [], isClosed: false, shape: '' };
  }

  function pickCoordsFromFeatures(features) {
    if (!features || !features.length) return { coords: [], isClosed: false, name: '', shape: '' };
    for (let i = 0; i < features.length; i++) {
      const feat = features[i];
      const { coords, isClosed, shape } = pickCoordsFromGeometry(feat && feat.geometry);
      const minCoords = shape === 'point' ? 1 : 2;
      if (coords.length >= minCoords) {
        const name = (feat && feat.properties && feat.properties.name) || '';
        return { coords, isClosed, name, shape };
      }
    }
    return { coords: [], isClosed: false, name: '', shape: '' };
  }

  function collectGeoJsonEntries(fc) {
    if (!fc || !Array.isArray(fc.features)) return [];
    const entries = [];
    fc.features.forEach((feat) => {
      const { coords, isClosed, shape } = pickCoordsFromGeometry(feat && feat.geometry);
      const resolvedShape = shape || (isClosed ? 'polygon' : (coords.length === 1 ? 'point' : 'line'));
      const minCoords = resolvedShape === 'point' ? 1 : 2;
      if (!coords || coords.length < minCoords) return;
      const name = (feat && feat.properties && feat.properties.name) || '';
      entries.push({ coords, isClosed, name, shape: resolvedShape });
    });
    return entries;
  }

  // Fallback parser when toGeoJSON returns no features
  function extractCoordsFromKml(xml) {
    if (!xml) return [];
    const entries = [];
    const coordEls = Array.from(xml.getElementsByTagName('coordinates'));
    const gxTracks = Array.from(xml.getElementsByTagName('gx:Track'));
    const getNameFromPlacemark = (node) => {
      let p = node;
      while (p) {
        if (p.nodeName && p.nodeName.toLowerCase() === 'placemark') {
          const nameEl = Array.from(p.childNodes || []).find(n => n.nodeName && n.nodeName.toLowerCase() === 'name');
          if (nameEl && nameEl.textContent) return nameEl.textContent.trim();
        }
        p = p.parentNode;
      }
      return '';
    };
    const isPolygonAncestor = (node) => {
      let p = node;
      while (p) {
        const tag = p.nodeName ? p.nodeName.toLowerCase() : '';
        if (tag === 'polygon' || tag === 'outerboundaryis' || tag === 'innerboundaryis') return true;
        p = p.parentNode;
      }
      return false;
    };
    coordEls.forEach((el) => {
      const txt = (el.textContent || '').trim();
      if (!txt) return;
      const parts = txt.split(/\s+/).map(s => s.split(',').map(Number)).filter(arr => arr.length >= 2 && arr.every(Number.isFinite));
      if (parts.length < 1) return;
      const name = getNameFromPlacemark(el);
      const isPolygon = isPolygonAncestor(el);
      const isClosed = isPolygon || (parts.length >= 3 && parts[0][0] === parts[parts.length - 1][0] && parts[0][1] === parts[parts.length - 1][1]);
      const shape = isPolygon ? 'polygon' : (parts.length === 1 ? 'point' : 'line');
      const minCoords = shape === 'point' ? 1 : 2;
      if (parts.length < minCoords) return;
      entries.push({ coords: parts, isClosed, name, shape });
    });
    if (gxTracks.length) {
      gxTracks.forEach((track) => {
        const coordEls = Array.from(track.getElementsByTagName('gx:coord'));
        const coords = [];
        let name = '';
        coordEls.forEach((el) => {
          const txt = (el.textContent || '').trim();
          if (!txt) return;
          const parts = txt.split(/\s+/).map(Number).filter(Number.isFinite);
          if (parts.length < 2) return;
          coords.push([parts[0], parts[1]]);
          if (!name) name = getNameFromPlacemark(el);
        });
        if (coords.length >= 2) entries.push({ coords, isClosed: false, name, shape: 'line' });
      });
    } else {
      const gxCoordEls = Array.from(xml.getElementsByTagName('gx:coord'));
      if (gxCoordEls.length) {
        const coords = [];
        let name = '';
        gxCoordEls.forEach((el) => {
          const txt = (el.textContent || '').trim();
          if (!txt) return;
          const parts = txt.split(/\s+/).map(Number).filter(Number.isFinite);
          if (parts.length < 2) return;
          coords.push([parts[0], parts[1]]);
          if (!name) name = getNameFromPlacemark(el);
        });
        if (coords.length >= 2) entries.push({ coords, isClosed: false, name, shape: 'line' });
      }
    }
    return entries;
  }

  // KML import -> create a new object and fill it
  async function importKmlFromText(text) {
    try {
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'text/xml');
      const parseError = xml.getElementsByTagName('parsererror')[0];
      if (parseError) { alert('Le KML n’a pas pu être analysé.'); return; }
      const fc = window.toGeoJSON ? window.toGeoJSON.kml(xml) : null;
      let entries = collectGeoJsonEntries(fc);
      if (!entries.length) {
        entries = extractCoordsFromKml(xml);
      }
      if (!entries.length) {
        alert('Aucune géométrie prise en charge n’a été trouvée (point/ligne/polygone).');
        return;
      }

      const allLatLngs = [];
      const imported = [];
      entries.forEach((entry, idx) => {
        const resolvedShape = entry.shape || (entry.isClosed ? 'polygon' : (entry.coords.length === 1 ? 'point' : 'line'));
        const minCoords = resolvedShape === 'point' ? 1 : 2;
        if (!entry.coords || entry.coords.length < minCoords) return;
        const latlngs = [];
        entry.coords.forEach((pair) => {
          const lon = Array.isArray(pair) ? Number(pair[0]) : NaN;
          const lat = Array.isArray(pair) ? Number(pair[1]) : NaN;
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
          latlngs.push([lat, lon]);
        });
        if (latlngs.length < minCoords) return;
        const o = createObject(resolvedShape, resolvedShape === 'polygon');
        if (entry.name) {
          o.name = entry.name;
        } else if (entries.length > 1) {
          o.name = `Objet KML ${idx + 1}`;
        }
        setActive(o.id);
        o.shape = resolvedShape;
        o.isClosed = resolvedShape === 'polygon' && latlngs.length >= 3;
        if (resolvedShape !== 'point') {
          ensureShapeLayer(o);
        }
        latlngs.forEach(([lat, lon]) => {
          const latlng = L.latLng(lat, lon);
          addVertex(latlng);
        });
        imported.push(o);
        allLatLngs.push(...latlngs);
      });
      if (!imported.length || !allLatLngs.length) {
        alert('Pas assez de points dans la géométrie.');
        return;
      }
      if (allLatLngs.length === 1) {
        map.setView(allLatLngs[0], Math.max(map.getZoom(), 14));
      } else {
        const bounds = L.latLngBounds(allLatLngs);
        map.fitBounds(bounds.pad(0.2));
      }
      drawActive = true;
      map.doubleClickZoom.disable();
      setDrawingCursor(true);
      enableButtons();
      updateToolStates();
      updateEditMarkers();
      setTimeout(() => {
        try { map.invalidateSize(); } catch (_) {}
      }, 60);
    } catch (e) {
      console.error('KML Import Fehler:', e);
      alert('Erreur lors de l’import du KML.');
    }
  }

  async function readKmlTextFromFile(file) {
    if (!file) throw new Error('Aucun fichier sélectionné.');
    const name = file.name || '';
    const lower = name.toLowerCase();
    if (lower.endsWith('.kmz')) {
      if (typeof JSZip === 'undefined') throw new Error('La prise en charge des fichiers KMZ n’est pas disponible.');
      const buf = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buf);
      const kmlEntries = (zip && zip.file && zip.file(/\.kml$/i)) || [];
      if (!kmlEntries.length) throw new Error('Aucun fichier KML trouvé dans le KMZ.');
      const looksLikeGeom = (text) => /<coordinates>|<gx:coord>/i.test(text || '');
      let selected = kmlEntries.find(entry => /doc\.kml$/i.test(entry.name)) || kmlEntries[0];
      let text = await selected.async('text');
      if (!looksLikeGeom(text) && kmlEntries.length > 1) {
        for (const entry of kmlEntries) {
          const candidate = await entry.async('text');
          if (looksLikeGeom(candidate)) {
            selected = entry;
            text = candidate;
            break;
          }
        }
      }
      return { text, name: selected.name || name };
    }
    if (lower.endsWith('.kml') || file.type === 'application/vnd.google-earth.kml+xml') {
      const text = await file.text();
      return { text, name };
    }
    throw new Error('Le type de fichier n’est pas pris en charge.');
  }

  async function handleKmlFile(file) {
    if (!file) {
      alert('Veuillez d’abord sélectionner un fichier KML ou KMZ.');
      return;
    }
    try {
      uploadedKmlFile = file;
      const { text, name } = await readKmlTextFromFile(file);
      lastKmlFileName = name || file.name || '';
      await importKmlFromText(text);
    } catch (e) {
      console.error('Erreur d’import KML/KMZ :', e);
      const msg = (e && e.message) ? e.message : 'Erreur lors de l’import du KML/KMZ.';
      alert(msg);
    } finally {
      if (kmlFile) kmlFile.value = '';
    }
  }

  if (importBtn) {
    importBtn.addEventListener('click', async () => {
      if (!kmlFile || !kmlFile.files || !kmlFile.files[0]) {
        alert('Veuillez d’abord sélectionner un fichier KML ou KMZ.');
        return;
      }
      await handleKmlFile(kmlFile.files[0]);
    });
  }
  if (kmlIconBtn && kmlFile) {
    kmlIconBtn.addEventListener('click', () => promptKmlUpload());
  }
  if (kmlFile) {
    kmlFile.addEventListener('change', async () => {
      if (kmlIconBtn) kmlIconBtn.classList.remove('active');
      if (!kmlFile.files || !kmlFile.files[0]) return;
      await handleKmlFile(kmlFile.files[0]);
    });
  }

  // Drag & drop KML onto map
  mapEl.addEventListener('dragover', (e) => { e.preventDefault(); });
  mapEl.addEventListener('drop', async (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file) return;
    const isKml = /\.kml$/i.test(file.name);
    const isKmz = /\.kmz$/i.test(file.name) || file.type === 'application/vnd.google-earth.kmz';
    if (isKml || isKmz) {
      await handleKmlFile(file);
      return;
    }
  });

  // Simple search (toolbar) via Nominatim
  async function searchAddress(qOrResult) {
    const direct = (qOrResult && typeof qOrResult === 'object' && qOrResult.lat && qOrResult.lon);
    const q = direct ? qOrResult.display_name : qOrResult;
    if (!q || !String(q).trim()) return;
    try {
      let r = null;
      if (direct) {
        r = qOrResult;
      } else {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`;
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        const arr = await res.json();
        if (!arr || arr.length === 0) { alert('Aucun résultat trouvé.'); return; }
        r = arr[0];
      }
      const lat = parseFloat(r.lat), lon = parseFloat(r.lon);
      if (r.boundingbox) {
        const bb = r.boundingbox.map(parseFloat);
        const sw = L.latLng(bb[0], bb[2]);
        const ne = L.latLng(bb[1], bb[3]);
        map.fitBounds(L.latLngBounds(sw, ne).pad(0.1));
      } else {
        map.setView([lat, lon], 15);
      }
      if (searchMarker) map.removeLayer(searchMarker);
      searchMarker = L.marker([lat, lon]).addTo(map);
    } catch (e) {
      console.warn('Search error', e);
    }
  }

  const searchSuggestions = document.getElementById('searchSuggestions');
  function openSearchPanel() {
    if (searchPanel) searchPanel.classList.remove('hidden');
    if (searchSuggestions) searchSuggestions.classList.add('hidden');
    if (searchInput) setTimeout(() => searchInput.focus(), 0);
  }
  function closeSearchPanel() {
    if (searchPanel) searchPanel.classList.add('hidden');
    if (searchSuggestions) searchSuggestions.classList.add('hidden');
  }
  let suggestTimer = null;
  async function loadSuggestions(term) {
    if (!searchSuggestions) return;
    if (!term || term.trim().length < 3) {
      searchSuggestions.classList.add('hidden');
      searchSuggestions.innerHTML = '';
      return;
    }
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(term)}&limit=5&addressdetails=0`;
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      const arr = await res.json();
      searchSuggestions.innerHTML = '';
      if (!arr || arr.length === 0) { searchSuggestions.classList.add('hidden'); return; }
      arr.forEach(r => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = r.display_name || '';
        btn.addEventListener('click', () => {
          searchInput.value = r.display_name || '';
          searchSuggestions.classList.add('hidden');
          searchAddress(r);
        });
        searchSuggestions.appendChild(btn);
      });
      searchSuggestions.classList.remove('hidden');
    } catch (e) {
      console.warn('Suggestion error', e);
    }
  }

  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => { searchSuggestions && searchSuggestions.classList.add('hidden'); searchAddress(searchInput.value); });
    searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { searchSuggestions && searchSuggestions.classList.add('hidden'); searchAddress(searchInput.value); } });
    searchInput.addEventListener('input', () => {
      clearTimeout(suggestTimer);
      const term = searchInput.value;
      suggestTimer = setTimeout(() => loadSuggestions(term), 250);
    });
    document.addEventListener('click', (ev) => {
      if (!searchSuggestions) return;
      const insideSearch = ev.target.closest('.nav-search');
      const toggleBtn = ev.target.closest('#searchToggle');
      if (!insideSearch) {
        closeSearchPanel();
        return;
      }
      if (!ev.target.closest('.search-box')) searchSuggestions.classList.add('hidden');
      if (toggleBtn) return;
    });
    if (searchToggle) {
      searchToggle.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const isOpen = searchPanel && !searchPanel.classList.contains('hidden');
        if (isOpen) closeSearchPanel();
        else openSearchPanel();
      });
    }
    // Open on focus via keyboard navigation
    if (searchInput) {
      searchInput.addEventListener('focus', () => {
        if (searchPanel && searchPanel.classList.contains('hidden')) openSearchPanel();
      });
    }
  }

  // Init UI
  renderObjectsList();
  enableButtons();

  // Default: selection mode active on load
  setSelectMode(true);
  enableButtons();
  updateCursor();
})();
