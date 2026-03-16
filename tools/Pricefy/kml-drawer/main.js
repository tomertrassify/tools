// Basic Leaflet map + custom polygon drawing with self-snapping, buffer, KML import/export, multi-object support and search

(function () {
  // Map setup (Germany view)
  const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const OSM_ATTRIB = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap-Mitwirkende</a>';
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
    .setView([51.1657, 10.4515], 7);
  const ACCENT = '#A6C4A1';
  const DRAW_STYLE = { color: '#ff0000', weight: 3, fillColor: '#ff0000', fillOpacity: 0.2 };
  function createDrawLayer(latlngs = []) {
    return L.polygon(latlngs, DRAW_STYLE);
  }
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  const navMenuToggle = document.getElementById('navMenuToggle');
  const navMenu = document.getElementById('navMenu');
  if (navMenuToggle && navMenu) {
    navMenuToggle.addEventListener('click', (ev) => {
      ev.stopPropagation();
      navMenu.classList.toggle('open');
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
      alert('Keine Karteneinstellungen erforderlich. OpenStreetMap wird genutzt.');
    });
  }
  
  const mapEl = document.getElementById('map');
  const exportMaskEl = document.getElementById('exportMask');
  // Export mode: 'zip' (default) or 'pdfOnly'
  let exportMode = 'zip';
  function adjustZoomStep() {
    const z = map.getZoom();
    if (z <= 8) { map.options.zoomSnap = 0.5; map.options.zoomDelta = 0.5; }
    else if (z <= 13) { map.options.zoomSnap = 0.25; map.options.zoomDelta = 0.25; }
    else { map.options.zoomSnap = 0.1; map.options.zoomDelta = 0.1; }
  }
  map.on('zoomend', adjustZoomStep);
  adjustZoomStep();
  

  // Dedicated pane for georeferenced images (under drawn overlays)
  map.createPane('georefPane');
  const georefPane = map.getPane('georefPane');
  const GEOREF_Z_LOW = 300;   // below overlayPane (400)
  const GEOREF_Z_HIGH = 650;  // above markers (600) while editing
  georefPane.style.zIndex = GEOREF_Z_LOW; // tiles 200, overlays 400, markers 600
  georefPane.style.pointerEvents = 'auto';
  function raiseGeorefPane() { georefPane.style.zIndex = GEOREF_Z_HIGH; }
  function lowerGeorefPane() { georefPane.style.zIndex = GEOREF_Z_LOW; }
  // Handles pane above everything so corner markers are clickable
  map.createPane('georefHandlesPane');
  const georefHandlesPane = map.getPane('georefHandlesPane');
  georefHandlesPane.style.zIndex = 700;
  georefHandlesPane.style.pointerEvents = 'auto';

  // Export handles pane
  map.createPane('exportHandlesPane');
  const exportHandlesPane = map.getPane('exportHandlesPane');
  exportHandlesPane.style.zIndex = 800;
  exportHandlesPane.style.pointerEvents = 'auto';

  const baseLayers = {
    'OpenStreetMap': osm,
    'Satellit': esriSat,
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
    if (ev.target.closest('.obj-item')) return;
    closeAllObjMenus();
  });
  function updateBasemapAttribution() {
    let provider = 'OpenStreetMap';
    if (activeBasemap === 'sat') provider = 'Esri Imagery';
    else if (activeBasemap === 'none') provider = 'None';
    if (mapFooterLabel) {
      mapFooterLabel.textContent = `kml drawer · made by Trassify · Basemap: ${provider}`;
    }
  }


  // UI elements
  const startBtn = document.getElementById('startBtn');
  const bufferBtn = document.getElementById('bufferBtn');
  const selectBtn = document.getElementById('selectBtn');
  const measureBtn = document.getElementById('measureBtn');
  const infoBtn = document.getElementById('infoBtn');
  const drawMenuBtn = document.getElementById('drawMenuBtn');
  const drawMenu = document.getElementById('drawMenu');
  const drawIcon = document.querySelector('#startBtn img');
  const clearBtn = document.getElementById('clearBtn');
  const bufferInput = document.getElementById('bufferInput');
  const bufferRange = document.getElementById('bufferRange');
  const applyBufferBtn = document.getElementById('applyBufferBtn');
  const bufferModeSel = document.getElementById('bufferMode');
  const exportBtn = document.getElementById('exportBtn');
  const exportMenuBtn = document.getElementById('exportMenuBtn');
  const exportMenu = document.getElementById('exportMenu');
  const menuPdfOnly = document.getElementById('menuPdfOnly');
  const menuKmlOnly = document.getElementById('menuKmlOnly');
  const exportStepBar = document.getElementById('exportStepBar');
  const expStepNext = document.getElementById('expStepNext');
  const expStepCancel = document.getElementById('expStepCancel');
  const exportModal = document.getElementById('exportModal');
  const expTitle = document.getElementById('expTitle');
  const expProject = document.getElementById('expProject');
  const expKst = document.getElementById('expKst');
  const expClient = document.getElementById('expClient');
  const expContact = document.getElementById('expContact');
  const expStartDate = document.getElementById('expStartDate');
  const expEndDate = document.getElementById('expEndDate');
  const expDesc = document.getElementById('expDesc');
  const expWebhookUrl = document.getElementById('expWebhookUrl');
  const expTemplateFile = document.getElementById('expTemplateFile');
  const expNextBtn = document.getElementById('expNextBtn');
  const expCancelBtn = document.getElementById('expCancelBtn');
  const undoMenuBtn = document.getElementById('undoMenuBtn');
  const redoMenuBtn = document.getElementById('redoMenuBtn');
  const WEBHOOK_URL = 'https://hook.eu2.make.com/2inavud5m1ikdngrg9xi7s9i8a6e28hy';
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
  const planFile = document.getElementById('planFile');
  const togglePlanEditBtn = document.getElementById('togglePlanEditBtn');
  const removePlanBtn = document.getElementById('removePlanBtn');
  const planIconBtn = document.getElementById('planIconBtn');
  const planOpacity = document.getElementById('planOpacity');
  const planVisibleChk = document.getElementById('planVisibleChk');
  const georefSettings = document.getElementById('georefSettings');
  const planRotation = document.getElementById('planRotation');
  const applyRotationBtn = document.getElementById('applyRotationBtn');
  const twoPtBtn = document.getElementById('twoPtBtn');
  const twoPtCancelBtn = document.getElementById('twoPtCancelBtn');
  const georefStatus = document.getElementById('georefStatus');
  const bufferSection = document.getElementById('bufferSection');
  const controlsEl = document.getElementById('controls');
  const layerPanel = document.querySelector('.layer-panel');
  // Webhook URL handling (fixed + hidden)
  if (expWebhookUrl) {
    expWebhookUrl.value = WEBHOOK_URL || '';
    expWebhookUrl.readOnly = true;
    expWebhookUrl.type = 'hidden';
  }
  function getWebhookUrl() {
    const fixed = (expWebhookUrl && expWebhookUrl.value) ? expWebhookUrl.value.trim() : '';
    return fixed || WEBHOOK_URL || '';
  }

  // Drawing/state
  let drawActive = false;
  let objects = []; // { id, name, isClosed, vertices[], vertexMarkers[], polylineLayer, tempLine, bufferLayer, constructionHidden, visible, bufferMode, bufferDistance }
  let activeId = null;
  let snapMarker = null; // global for active editing
  let vertexDrag = null; // { o, marker }
  let bufferMode = 'outline'; // UI default
  let searchMarker = null;
  let lastKnownAddress = '';
  let lastKnownCoords = null;
  let selectMode = false;
  let hoverSelect = false;
  let measureMode = false;
  let measurePoints = [];
  let measureLine = null;
  let measureTempLine = null;
  let measureMarkers = [];
  let measureLabel = null;
  let infoMode = false;
  let infoPopup = null;
  let infoAbort = null;
  let attachMode = false;
  let selectionDrag = null; // { obj, startPoint: Point, origPoints: Point[] }
  // Georeferenced plan overlay
  let planOverlay = null; // DistortableImageOverlay or ImageOverlay
  let planEditing = false;
  let planDragging = false; // fallback drag state
  let planDragStart = null; // { latlng, bounds }
  let planHandles = []; // corner markers for rotated overlay
  // Two-point georef state
  let twoPtActive = false;
  let twoPtStep = 0; // 0 idle, 1 img1, 2 map1, 3 img2, 4 live map2
  let tpImgPts = []; // [{x,y}, {x,y}] in image px
  let tpMapPts = []; // [LatLng, LatLng]
  let twoPtMoveHandler = null;
  let twoPtSavedCorners = null;
  let twoPtMarkers = { img1: null, img2: null, map1: null, line: null };
  // Export selection state
  let expActive = false;
  let expRect = null; // L.Rectangle
  let expCenterMarker = null; // draggable center
  let expHandleMarkers = {}; // {nw,ne,se,sw}
  // Export selection aspect ratio (width:height)
  let expAspect = 330 / 287; // ~1.14913
  let exportFrameListenersAttached = false;
  let bufferOpenForId = null;

  function updateLayerPanelVisibility() {
    const hasObjects = objects.length > 0 || !!planOverlay;
    if (layerPanel) layerPanel.classList.toggle('hidden', !hasObjects);
    if (controlsEl) controlsEl.classList.toggle('controls-hidden', !hasObjects);
  }
  updateLayerPanelVisibility();
  
  // Helper: update rotation input availability
  function refreshRotationField() {
    if (!planOverlay) { if (planRotation) planRotation.value = '0'; if (applyRotationBtn) applyRotationBtn.disabled = true; return; }
    if (planOverlay instanceof L.RotatedImageOverlay) {
      if (planRotation) planRotation.value = String(computeRotationDeg());
      if (applyRotationBtn) applyRotationBtn.disabled = !planEditing;
    } else {
      if (planRotation) planRotation.value = '0';
      if (applyRotationBtn) applyRotationBtn.disabled = true;
    }
  }

  function getActive() {
    return objects.find(o => o.id === activeId) || null;
  }

  function enableButtons() {
    const active = getActive();
    const hasVertices = !!active && active.vertices.length > 0;
    const hasAnyGeometry = objects.some(o => o && o.vertices && o.vertices.length > 0);
    const anyObjects = objects.length > 0;
    if (undoMenuBtn) undoMenuBtn.disabled = !hasVertices;
    if (redoMenuBtn) redoMenuBtn.disabled = !hasVertices; // redo state not tracked; disabled when no active object content
    if (bufferBtn) {
      bufferBtn.disabled = !hasVertices;
      bufferBtn.classList.toggle('hidden', !active);
    }
    applyBufferBtn.disabled = !hasVertices;
    if (exportBtn) exportBtn.disabled = !hasAnyGeometry;
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
    if (selectionDrag) {
      mapEl.style.cursor = 'grabbing';
      return;
    }
    if (infoMode) {
      mapEl.style.cursor = 'copy';
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
        const active = (mode === 'draw' && drawActive && !attachMode) || (mode === 'attach' && attachMode);
        it.classList.toggle('active', active);
      });
    }
    if (measureBtn) {
      measureBtn.classList.toggle('active', measureMode);
      measureBtn.setAttribute('aria-pressed', measureMode ? 'true' : 'false');
    }
    if (infoBtn) {
      infoBtn.classList.toggle('active', infoMode);
      infoBtn.setAttribute('aria-pressed', infoMode ? 'true' : 'false');
    }
  }

  function setSelectMode(on) {
    selectMode = !!on;
    if (!selectMode) hoverSelect = false;
    if (selectMode && measureMode) setMeasureMode(false);
    if (selectMode && attachMode) setAttachMode(false);
    if (selectMode && infoMode) setInfoMode(false);
    if (selectMode) {
      drawActive = false;
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

  function clearInfoPopup() {
    if (infoPopup) {
      map.closePopup(infoPopup);
      infoPopup = null;
    }
    if (infoAbort) {
      infoAbort.abort();
      infoAbort = null;
    }
  }

  function setInfoMode(on) {
    const next = !!on;
    if (next === infoMode) return;
    infoMode = next;
    if (infoMode) {
      setMeasureMode(false);
      setSelectMode(false);
      setAttachMode(false);
      drawActive = false;
      setDrawingCursor(false);
      removeSnapMarker();
      map.doubleClickZoom.enable();
      clearInfoPopup();
    } else {
      clearInfoPopup();
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
      if (infoMode) setInfoMode(false);
      drawActive = false;
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
      if (infoMode) setInfoMode(false);
      drawActive = false;
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
    const rings = segments.map(seg => {
      const ring = seg.slice();
      if (ring.length > 1) {
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first && last && first.equals && first.equals(last)) ring.pop();
      }
      return ring;
    });
    const latlngs = (rings.length <= 1) ? (rings[0] || []) : rings.map(r => [r]);
    o.polylineLayer.setLatLngs(latlngs);
  }

  function refreshBufferFor(o) {
    if (!o || !o.bufferDistance || o.bufferDistance <= 0) return;
    const prevMode = bufferMode;
    const dist = Number(o.bufferDistance) || 0;
    bufferMode = o.bufferMode || 'outline';
    if (bufferInput) bufferInput.value = dist;
    if (bufferRange) bufferRange.value = dist;
    const activeBefore = activeId;
    setActive(o.id);
    applyBuffer();
    // restore previous mode selection
    bufferMode = prevMode;
    if (activeBefore && activeBefore !== o.id) setActive(activeBefore);
  }

  function startVertexDrag(o, marker) {
    if (!o || o.id !== activeId) return;
    if (twoPtActive) return;
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
    o.vertices.push(latlng);
    const marker = L.circleMarker(latlng, {
      radius: 4,
      color: '#111',
      weight: 1,
      fillColor: '#fff',
      fillOpacity: 1,
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
  }

  function toPolygonGeoJSON(o) {
    if (!o) return null;
    const segments = (o.branches && o.branches.length) ? o.branches : [o.vertices];
    const rings = segments
      .map(seg => seg.map(ll => [ll.lng, ll.lat]))
      .filter(arr => arr.length >= 3);
    if (!rings.length) return null;
    const closed = rings.map((ring) => {
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (!(first[0] === last[0] && first[1] === last[1])) return ring.concat([first]);
      return ring;
    });
    if (closed.length === 1) {
      return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [closed[0]] } };
    }
    return { type: 'Feature', properties: {}, geometry: { type: 'MultiPolygon', coordinates: closed.map(ring => [ring]) } };
  }

  function applyBuffer() {
    const o = getActive();
    if (!o) return;
    const poly = toPolygonGeoJSON(o);
    if (!poly) return;
    const dist = Number(bufferInput.value) || 0;
    removeBuffer(o);
    o.bufferDistance = dist;
    o.bufferMode = bufferMode;
    if (dist <= 0) return;
    try {
      const buffered = turf.buffer(poly, dist, { units: 'meters' });
      if (bufferMode === 'polygon') {
        o.bufferLayer = L.geoJSON(buffered, {
          style: { color: '#e83e8c', weight: 2, fillColor: '#e83e8c', fillOpacity: 0.15 },
        });
        if (o.visible !== false) o.bufferLayer.addTo(map);
      } else {
        const layers = [];
        const geom = buffered.geometry;
        if (geom.type === 'Polygon') {
          const rings = geom.coordinates;
          rings.forEach(ring => layers.push(L.polyline(ring.map(c => [c[1], c[0]]), { color: '#e83e8c', weight: 2 })));
        } else if (geom.type === 'MultiPolygon') {
          geom.coordinates.forEach(poly => { poly.forEach(ring => layers.push(L.polyline(ring.map(c => [c[1], c[0]]), { color: '#e83e8c', weight: 2 }))); });
        }
        o.bufferLayer = L.featureGroup(layers);
        if (o.visible !== false) o.bufferLayer.addTo(map);
      }
      if (!showConstructionChk || !showConstructionChk.checked) {
        hideConstruction(o);
        updateEditMarkers();
      }
      renderObjectsList();
    } catch (e) {
      console.error('Buffer error:', e);
      alert('Fehler beim Puffern. Bitte anderen Wert versuchen.');
    }
  }

  function hideConstruction(o = getActive()) {
    if (!o) return;
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
      const show = attachMode || (drawActive && obj.id === activeId && !obj.constructionHidden);
      obj.vertexMarkers.forEach(m => m.setStyle({ opacity: show ? 1 : 0, fillOpacity: show ? 1 : 0 }));
    });
  }

  function download(filename, content, mime = 'application/octet-stream') {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function kmlEscape(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function formatDistance(meters) {
    if (!Number.isFinite(meters)) return '';
    if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
    return `${meters.toFixed(1)} m`;
  }

  function lineToKmlCoordinates(coordsLonLat) {
    return coordsLonLat.map(([x, y]) => `${x},${y}`).join(' ');
  }

  function polygonToKmlCoordinates(polygonCoords) {
    const rings = [];
    for (let r = 0; r < polygonCoords.length; r++) {
      const ring = polygonCoords[r];
      const first = ring[0];
      const last = ring[ring.length - 1];
      const closed = (first[0] === last[0] && first[1] === last[1]) ? ring : ring.concat([first]);
      rings.push(`<LinearRing><coordinates>${lineToKmlCoordinates(closed)}</coordinates></LinearRing>`);
    }
    let kml = '';
    if (rings.length > 0) {
      kml += `<outerBoundaryIs>${rings[0]}</outerBoundaryIs>`;
      for (let i = 1; i < rings.length; i++) {
        kml += `<innerBoundaryIs>${rings[i]}</innerBoundaryIs>`;
      }
    }
    return kml;
  }

  function buildKml() {
    if (!objects || objects.length === 0 || objects.every(o => o.vertices.length === 0)) return null;
    let kml = '';
    kml += `<?xml version="1.0" encoding="UTF-8"?>\n`;
    kml += `<kml xmlns="http://www.opengis.net/kml/2.2">\n`;
    kml += `<Document>\n`;
    kml += `<name>${kmlEscape('Zeichnung')}</name>\n`;
    kml += `<Style id="shapeStyle"><LineStyle><color>ff0000ff</color><width>3</width></LineStyle><PolyStyle><color>330000ff</color></PolyStyle></Style>\n`;
    kml += `<Style id="polyStyle"><LineStyle><color>ff8c3ee8</color><width>2</width></LineStyle><PolyStyle><color>338c3ee8</color></PolyStyle></Style>\n`;
    kml += `<Style id="outlineStyle"><LineStyle><color>ff8c3ee8</color><width>2</width></LineStyle></Style>\n`;
    objects.forEach((o, idx) => {
      const poly = toPolygonGeoJSON(o);
      if (!poly) return;
      const geom = poly.geometry;
      const oName = o.name || `Objekt ${idx + 1}`;
      const emitPolygon = (coords, suffix) => {
        const name = suffix ? `${oName} - ${suffix}` : oName;
        const ringsKml = polygonToKmlCoordinates(coords);
        kml += `<Placemark>\n`;
        kml += `<name>${kmlEscape(name)}</name>\n`;
        kml += `<styleUrl>#shapeStyle</styleUrl>\n`;
        kml += `<Polygon>${ringsKml}</Polygon>\n`;
        kml += `</Placemark>\n`;
      };
      if (geom.type === 'Polygon') {
        emitPolygon(geom.coordinates, '');
      } else if (geom.type === 'MultiPolygon') {
        geom.coordinates.forEach((coords, i) => emitPolygon(coords, `Teil ${i + 1}`));
      }

      const dist = Number(o.bufferDistance) || 0;
      if (dist > 0) {
        try {
          const buffered = turf.buffer(poly, dist, { units: 'meters' });
          const g = buffered.geometry;
          const mode = o.bufferMode || 'polygon';
          if (mode === 'polygon') {
            if (g.type === 'Polygon') {
              const ringsKml = polygonToKmlCoordinates(g.coordinates);
              kml += `<Placemark>\n`;
              kml += `<name>${kmlEscape(`${oName} - Buffer ${dist}m`)}</name>\n`;
              kml += `<styleUrl>#polyStyle</styleUrl>\n`;
              kml += `<Polygon>${ringsKml}</Polygon>\n`;
              kml += `</Placemark>\n`;
            } else if (g.type === 'MultiPolygon') {
              for (let i = 0; i < g.coordinates.length; i++) {
                const ringsKml = polygonToKmlCoordinates(g.coordinates[i]);
                kml += `<Placemark>\n`;
                kml += `<name>${kmlEscape(`${oName} - Buffer ${dist}m (Teil ${i + 1})`)}</name>\n`;
                kml += `<styleUrl>#polyStyle</styleUrl>\n`;
                kml += `<Polygon>${ringsKml}</Polygon>\n`;
                kml += `</Placemark>\n`;
              }
            }
          } else {
            const emitRing = (ring, name) => {
              const c = ring.map(([lon, lat]) => `${lon},${lat}`).join(' ');
              kml += `<Placemark>\n`;
              kml += `<name>${kmlEscape(name)}</name>\n`;
              kml += `<styleUrl>#outlineStyle</styleUrl>\n`;
              kml += `<LineString><tessellate>1</tessellate><coordinates>${c}</coordinates></LineString>\n`;
              kml += `</Placemark>\n`;
            };
            if (g.type === 'Polygon') {
              g.coordinates.forEach((ring, idx2) => emitRing(ring, idx2 === 0 ? `${oName} - Buffer-Umriss ${dist}m` : `${oName} - Loch ${idx2}`));
            } else if (g.type === 'MultiPolygon') {
              g.coordinates.forEach((poly, pidx) => poly.forEach((ring, ridx) => emitRing(ring, ridx === 0 ? `${oName} - Buffer-Umriss ${dist}m (Teil ${pidx + 1})` : `${oName} - Loch ${pidx + 1}-${ridx}`)));
            }
          }
        } catch (e) {
          console.warn('Buffer KML generation error:', e);
        }
      }
    });

    kml += `</Document>\n`;
    kml += `</kml>`;
    return kml;
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
    ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
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
      if (pts.length >= 3) {
        ctx.closePath();
        ctx.fill();
      }
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
    obj.isClosed = false;
    obj.branches = obj.branches || [];
    const newBranch = [latlng];
    obj.branches.push(newBranch);
    obj.vertices = newBranch;
    const marker = L.circleMarker(latlng, { radius: 4, color: '#111', weight: 1, fillColor: '#fff', fillOpacity: 1, pane: 'markerPane' });
    bindVertexMarkerEvents(obj, marker);
    marker.addTo(map);
    obj.vertexMarkers.push(marker);
    if (!obj.polylineLayer) {
      obj.polylineLayer = createDrawLayer([]).addTo(map);
    }
    updatePolyline(obj);
    attachPolylineHandlers(obj);
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

  function escapeHtml(str) {
    const mapHtml = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(str || '').replace(/[&<>"']/g, ch => mapHtml[ch] || ch);
  }

  function formatAddress(addr, fallback) {
    if (!addr) return fallback || '';
    const street = addr.road || addr.pedestrian || addr.cycleway || addr.footway || addr.path || addr.neighbourhood || '';
    const house = addr.house_number ? String(addr.house_number).trim() : '';
    const city = addr.city || addr.town || addr.village || addr.hamlet || addr.suburb || addr.locality || addr.municipality || addr.county || '';
    const postcode = addr.postcode ? String(addr.postcode).trim() : '';
    const area = city || addr.state || '';
    const streetLine = [street, house].filter(Boolean).join(' ').trim();
    const cityLine = [postcode, area].filter(Boolean).join(' ').trim();
    const parts = [];
    if (streetLine) parts.push(streetLine);
    if (cityLine) parts.push(cityLine);
    if (!parts.length && fallback) return fallback;
    return parts.join(', ');
  }

  async function copyTextToClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (err) {
      console.warn('Clipboard API failed, falling back', err);
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (err2) {
      console.warn('Clipboard fallback failed', err2);
      return false;
    }
  }

  function showInfoPopup(latlng, address, copied) {
    const safeAddr = escapeHtml(address);
    const title = copied ? 'Adresse kopiert' : 'Adresse';
    const hint = copied ? 'In die Zwischenablage übernommen' : 'Adresse konnte nicht automatisch kopiert werden';
    const html = `<div class="info-popup-content"><div class="info-popup-title">${title}</div><div class="info-popup-address">${safeAddr}</div><div class="hint">${hint}</div></div>`;
    if (infoPopup) map.closePopup(infoPopup);
    infoPopup = L.popup({ className: 'info-popup', closeButton: false, autoClose: true, closeOnClick: false })
      .setLatLng(latlng)
      .setContent(html)
      .openOn(map);
  }

  async function handleInfoClick(latlng) {
    clearInfoPopup();
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latlng.lat}&lon=${latlng.lng}&addressdetails=1`;
    const controller = new AbortController();
    infoAbort = controller;
    try {
      const res = await fetch(url, { headers: { 'Accept': 'application/json' }, signal: controller.signal });
      const data = await res.json();
      const formatted = formatAddress(data.address, data.display_name);
      if (!formatted) {
        alert('Keine Adresse gefunden.');
        return;
      }
      lastKnownAddress = formatted;
      lastKnownCoords = { lat: latlng.lat, lng: latlng.lng };
      const copied = await copyTextToClipboard(formatted);
      showInfoPopup(latlng, formatted, copied);
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      console.warn('Reverse geocode failed', e);
      alert('Adresse konnte nicht abgerufen werden.');
    } finally {
      infoAbort = null;
    }
  }

  // Map interactions
  map.on('click', (e) => {
    if (infoMode) { handleInfoClick(e.latlng); return; }
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
    if (infoMode) return;
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
    if (twoPtActive) return; // don't show drawing preview during georef
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
    if (infoMode) return;
    if (twoPtActive) return; // don't add vertices during georef
    const o = getActive();
    if (!drawActive || !o) return;
    if (o.isClosed) return;
    const px = Math.max(4, Number(snapPxInput ? snapPxInput.value : 14) || 14);
    const snapped = trySnap(e.latlng, px);
    const toAdd = snapped || e.latlng;
    addVertex(toAdd);
  });

  map.on('dblclick', (e) => {
    if (infoMode) return;
    if (measureMode) { resetMeasure(); return; }
    if (vertexDrag) return;
    if (twoPtActive) return;
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
    if (startBtn) startBtn.classList.remove('active');
    removeTempLine(o);
    removeSnapMarker();
    o.isClosed = o.vertices.length >= 3;
    updatePolyline(o);
    setDrawingCursor(false);
    setSelectMode(true);
    enableButtons();
    updateToolStates();
    map.doubleClickZoom.enable();
    hideConstruction(o);
    updateEditMarkers();
  }
  map.on('contextmenu', (e) => {
    if (vertexDrag) return;
    if (infoMode) return;
    if (selectionDrag) { stopSelectionDrag(); return; }
    if (twoPtActive) return;
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

  if (infoBtn) {
    infoBtn.addEventListener('click', () => {
      setInfoMode(!infoMode);
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
          setAttachMode(false);
          drawActive = true;
          setDrawingCursor(true);
        }
        updateToolStates();
      });
    });
  }

  map.on('mousedown', (e) => {
    if (!selectMode || drawActive || twoPtActive) return;
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
    setInfoMode(false);
    // If not actively drawing, always start a brand new object
    if (!drawActive) {
      const oNew = createObject();
      setActive(oNew.id);
    }
    const o = getActive();
    if (!o.polylineLayer) {
      o.polylineLayer = createDrawLayer([]);
      if (o.visible !== false) o.polylineLayer.addTo(map);
      attachPolylineHandlers(o);
    }
    drawActive = true;
    o.isClosed = false;
    removeBuffer(o);
    showConstruction(o);
    enableButtons();
    updateToolStates();
    map.doubleClickZoom.disable();
    setDrawingCursor(true);
    updateEditMarkers();
  });

  if (undoMenuBtn) undoMenuBtn.addEventListener('click', () => { undo(); });
  // Simple redo stub (no history stack implemented)
  if (redoMenuBtn) redoMenuBtn.addEventListener('click', () => { alert('Wiederherstellen ist noch nicht implementiert.'); });

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

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportMode = 'zip';
      showExportStepBar(true);
      placeExportSelection();
      updateFixedExportFrame();
    });
  }

  // Dropdown menu handling
  if (exportMenuBtn) {
    exportMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exportMenu && exportMenu.classList.toggle('hidden');
    });
    document.addEventListener('click', () => {
      if (exportMenu && !exportMenu.classList.contains('hidden')) exportMenu.classList.add('hidden');
    });
  }
  if (menuPdfOnly) menuPdfOnly.addEventListener('click', () => {
    exportMode = 'pdfOnly';
    exportMenu && exportMenu.classList.add('hidden');
    showExportStepBar(true);
    placeExportSelection();
    updateFixedExportFrame();
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
  if (menuKmlOnly) menuKmlOnly.addEventListener('click', () => {
    exportMenu && exportMenu.classList.add('hidden');
    const kml = buildKml();
    if (!kml) { alert('Keine Geometrie zum Exportieren.'); return; }
    const projectRaw = (expProject && expProject.value) || '';
    const projectSafe = sanitizeFileName(projectRaw) || 'Projekt';
    download(`${projectSafe}.kml`, kml, 'application/vnd.google-earth.kml+xml');
  });

  function showExportStepBar(show) {
    if (!exportStepBar) return;
    exportStepBar.classList.toggle('hidden', !show);
    const appEl = document.getElementById('app');
    if (appEl) appEl.classList.toggle('export-framing', show);
  }

  if (expStepNext) expStepNext.addEventListener('click', () => {
    showExportStepBar(false);
    showExportModal(true);
  });
  if (expStepCancel) expStepCancel.addEventListener('click', () => {
    showExportStepBar(false);
    clearExportSelection();
  });

  // Close export modal when clicking the dark backdrop
  if (exportModal) {
    exportModal.addEventListener('click', (e) => {
      if (e.target === exportModal) showExportModal(false);
    });
  }

  function waitForBaseTiles(timeoutMs = 1500) {
    return new Promise((resolve) => {
      const layers = [];
      if (map && map.hasLayer(osm)) layers.push(osm);
      if (map && map.hasLayer(esriSat)) layers.push(esriSat);
      if (!layers.length) { resolve(); return; }
      let done = false;
      const finish = () => {
        if (!done) {
          done = true;
          layers.forEach(l => l.off('load', finish));
          resolve();
        }
      };
      layers.forEach(l => l.on('load', finish));
      setTimeout(finish, timeoutMs);
    });
  }

  function getExpRectSizePx() {
    if (!expRect) return null;
    const b = expRect.getBounds();
    const p1 = map.latLngToContainerPoint(b.getNorthWest());
    const p2 = map.latLngToContainerPoint(b.getSouthEast());
    const w = Math.abs(p2.x - p1.x);
    const h = Math.abs(p2.y - p1.y);
    return { w: Math.max(10, Math.round(w)), h: Math.max(10, Math.round(h)) };
  }

  function cloneBaseLayerForExport(targetMap) {
    let layer = null;
    if (activeBasemap === 'none') return null;
    if (activeBasemap === 'sat') {
      layer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { crossOrigin: true, detectRetina: true });
    } else {
      layer = L.tileLayer(OSM_URL, { maxZoom: 19, crossOrigin: true, detectRetina: true, attribution: OSM_ATTRIB });
    }
    layer && layer.addTo(targetMap);
    return layer;
  }
  
  function cloneVisibleOverlaysForExport(targetMap) {
    const clones = [];
    map.eachLayer((l) => {
      if (!map.hasLayer(l)) return;
      let clone = null;
      try {
        if (l instanceof L.TileLayer.WMS) {
          clone = L.tileLayer.wms(l._url, l.options);
        } else if (l instanceof L.TileLayer && !(l instanceof L.GridLayer)) {
          clone = L.tileLayer(l._url, l.options);
        } else if (l instanceof L.GeoJSON) {
          if (l.toGeoJSON) {
            const data = l.toGeoJSON();
            clone = L.geoJSON(data, { style: l.options && l.options.style });
          }
        }
      } catch (e) { /* ignore */ }
      if (clone) {
        clone.addTo(targetMap);
        clones.push(clone);
      }
    });
    return clones;
  }

  async function waitForMapTiles(targetMap, timeoutMs = 1500) {
    return new Promise(resolve => {
      const layers = [];
      targetMap.eachLayer(l => { if (l instanceof L.TileLayer) layers.push(l); });
      if (!layers.length) { resolve(); return; }
      let done = false;
      const finish = () => {
        if (!done) {
          done = true;
          layers.forEach(l => l.off('load', finish));
          resolve();
        }
      };
      layers.forEach(l => l.on('load', finish));
      setTimeout(finish, timeoutMs);
    });
  }

  function addObjectsToMapForExport(targetMap) {
    const layers = [];
    (objects || []).forEach(o => {
      if (!o || !o.vertices || o.vertices.length === 0) return;
      if (o.visible === false) return;
      const ll = o.vertices.map(v => [v.lat, v.lng]);
      const pl = createDrawLayer(ll);
      pl.addTo(targetMap);
      layers.push(pl);
      const dist = Number(o.bufferDistance) || 0;
      if (dist > 0) {
        try {
          const poly = toPolygonGeoJSON(o);
          if (!poly) return;
          const buffered = turf.buffer(poly, dist, { units: 'meters' });
          const mode = o.bufferMode || 'polygon';
          const stylePoly = { color: '#8c3ee8', weight: 2, fillColor: '#8c3ee8', fillOpacity: 0.2 };
          const styleLine = { color: '#8c3ee8', weight: 2, fillOpacity: 0 };
          if (mode === 'polygon') {
            const g = L.geoJSON(buffered, { style: stylePoly });
            g.addTo(targetMap);
            layers.push(g);
          } else {
            const g = L.geoJSON(buffered, { style: styleLine });
            g.addTo(targetMap);
            layers.push(g);
          }
        } catch (e) {
          console.warn('Buffer clone fail', e);
        }
      }
    });
    return layers;
  }

  async function captureOffscreen(bounds, sizePx) {
    const w = sizePx && sizePx.w ? sizePx.w : 1200;
    const h = sizePx && sizePx.h ? sizePx.h : Math.round(w / expAspect);
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.left = '-10000px';
    div.style.top = '0';
    div.style.width = `${w}px`;
    div.style.height = `${h}px`;
    div.style.background = '#ffffff';
    div.style.zIndex = '-1';
    document.body.appendChild(div);
    const m = L.map(div, { zoomControl: false, attributionControl: false, preferCanvas: true });
    cloneBaseLayerForExport(m);
    const cloned = addObjectsToMapForExport(m);
    m.fitBounds(bounds, { padding: [0, 0] });
    // Keep zoom level if it would go beyond native max to avoid overscaling
    const maxZ = Math.min(m.getMaxZoom() || 18, 20);
    if (m.getZoom() > maxZ) m.setZoom(maxZ);
    await waitForMapTiles(m, 2000);
    await new Promise(r => setTimeout(r, 80));
    const scale = 2.5; // crisp, but not excessive
    let dataUrl = null;
    try {
      const canvas = await html2canvas(div, { useCORS: true, backgroundColor: '#ffffff', scale });
      dataUrl = canvas.toDataURL('image/png');
    } catch (e) {
      console.warn('Offscreen capture failed', e);
    }
    try { m.remove(); } catch (_) {}
    if (cloned && cloned.forEach) { cloned.forEach(l => { try { l.remove(); } catch (_) {} }); }
    document.body.removeChild(div);
    return dataUrl;
  }

  function collectExportMeta() {
    const today = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const formatDate = (v) => {
      if (!v) return '';
      const [y, m, d] = v.split('-');
      if (!y || !m || !d) return '';
      return `${d.padStart(2, '0')}.${m.padStart(2, '0')}.${y}`;
    };
    const readVal = (el) => (el && typeof el.value === 'string') ? el.value.trim() : '';
    return {
      projektname: readVal(expProject),
      kst: readVal(expKst),
      datum: `${pad(today.getDate())}.${pad(today.getMonth() + 1)}.${today.getFullYear()}`,
      auftraggeber: readVal(expClient),
      ansprechpartner: readVal(expContact),
      baubeginn: formatDate(readVal(expStartDate)),
      bauende: formatDate(readVal(expEndDate)),
      beschreibung: readVal(expDesc),
    };
  }

  function getExportCenterLatLng() {
    if (expRect && expRect.getBounds) return expRect.getBounds().getCenter();
    if (map && map.getCenter) return map.getCenter();
    return null;
  }

  function formatLatLng(ll) {
    if (!ll || !Number.isFinite(ll.lat) || !Number.isFinite(ll.lng)) return '';
    return `${Number(ll.lat).toFixed(6)},${Number(ll.lng).toFixed(6)}`;
  }

  function buildExportGeoJson() {
    const features = [];
    (objects || []).forEach((o, idx) => {
      const poly = toPolygonGeoJSON(o);
      if (!poly) return;
      const name = o.name || `Objekt ${idx + 1}`;
      const bufferDistance = Number(o.bufferDistance) || 0;
      const bufferMode = o.bufferMode || '';
      poly.properties = { name, kind: 'polygon', bufferDistance, bufferMode };
      features.push(poly);
      if (bufferDistance > 0 && typeof turf !== 'undefined' && turf.buffer) {
        try {
          const buffered = turf.buffer(poly, bufferDistance, { units: 'meters' });
          const bufferFeature = buffered && buffered.type === 'FeatureCollection' ? buffered.features[0] : buffered;
          if (bufferFeature) {
            bufferFeature.properties = { name, kind: 'buffer', bufferDistance, bufferMode };
            features.push(bufferFeature);
          }
        } catch (e) {
          console.warn('Buffer GeoJSON generation error:', e);
        }
      }
    });
    return { type: 'FeatureCollection', features };
  }

  function buildProjectDataJson(meta, baseName) {
    const center = getExportCenterLatLng();
    const coords = formatLatLng(center || lastKnownCoords);
    const address = (lastKnownAddress || (searchInput && searchInput.value) || '').trim();
    const geojson = buildExportGeoJson();
    return {
      projectName: meta.projektname || '',
      client: meta.auftraggeber || '',
      contractor: '',
      startDate: meta.baubeginn || '',
      endDate: meta.bauende || '',
      coordinates: coords,
      address,
      requestReason: '',
      projectDescription: meta.beschreibung || '',
      siteManager: meta.ansprechpartner || '',
      siteManagerContact: meta.ansprechpartner || '',
      geojsonName: `${baseName}.geojson`,
      geojsonData: JSON.stringify(geojson, null, 2),
      plotLayoutTelekom: 'A0 quer',
      plotScaleTelekom: '500',
      plotExportCrsTelekom: 'EPSG:3857',
      plotExportDpiTelekom: '150',
      plotPreviewMode: 'custom',
    };
  }

  async function makeMapPdf(metaOverride) {
    let dataUrl = null;
    if (expRect) {
      const sizePx = getExpRectSizePx();
      dataUrl = await captureOffscreen(expRect.getBounds(), sizePx || null);
    } else {
      dataUrl = await captureOffscreen(map.getBounds(), { w: map.getSize().x, h: map.getSize().y });
    }
    if (!dataUrl) throw new Error('Konnte Kartenbild nicht erfassen');
    const meta = metaOverride || collectExportMeta();
    return await makePdfFromTemplate(dataUrl, meta);
  }

  function prepareMapForExport() {
    const ctx = { layers: [], hadPlan: false, hadSnap: false, hadTwoPt: {}, polyStyles: [], hidVectors: false };
    const mapEl = document.getElementById('map');
    mapEl.classList.add('exporting');
    ctx.hidVectors = true;
    // Hide editing artifacts per object
    objects.forEach(o => {
      // remove vertex markers
      (o.vertexMarkers || []).forEach(m => {
        if (map.hasLayer(m)) { ctx.layers.push(m); map.removeLayer(m); }
      });
      // temp line
      if (o.tempLine && map.hasLayer(o.tempLine)) { ctx.layers.push(o.tempLine); map.removeLayer(o.tempLine); }
      // ensure polyline + buffer visible
      if (o.polylineLayer) {
        try {
          ctx.polyStyles.push({ layer: o.polylineLayer, style: { opacity: o.polylineLayer.options.opacity ?? 1 } });
          o.polylineLayer.setStyle({ opacity: 1 });
          if (!map.hasLayer(o.polylineLayer)) o.polylineLayer.addTo(map);
        } catch(_){}
      }
      if (o.bufferLayer && !map.hasLayer(o.bufferLayer)) { try { o.bufferLayer.addTo(map); } catch(_){} }
    });
    // Snap marker
    if (snapMarker && map.hasLayer(snapMarker)) { ctx.layers.push(snapMarker); map.removeLayer(snapMarker); ctx.hadSnap = true; }
    // Two-point georef markers/line
    if (twoPtMarkers) {
      ['img1','img2','map1','line'].forEach(k => {
        const l = twoPtMarkers[k];
        if (l && map.hasLayer(l)) { ctx.layers.push(l); map.removeLayer(l); ctx.hadTwoPt[k] = true; }
      });
    }
    // Search marker
    if (searchMarker && map.hasLayer(searchMarker)) { ctx.layers.push(searchMarker); map.removeLayer(searchMarker); }
    // Georeferenced plan overlay (not part of KML): hide
    if (planOverlay && map.hasLayer(planOverlay)) { ctx.layers.push(planOverlay); map.removeLayer(planOverlay); ctx.hadPlan = true; }
    return ctx;
  }

  function restoreMapAfterExport(ctx) {
    const mapEl = document.getElementById('map');
    mapEl.classList.remove('exporting');
    // Re-add removed layers
    (ctx.layers || []).forEach(l => { try { l.addTo(map); } catch (e) { try { map.addLayer(l); } catch(_){} } });
    (ctx.polyStyles || []).forEach(ps => { try { ps.layer.setStyle(ps.style); } catch(_){} });
  }

  function hideExportSelectionForCapture() {
    const ctx = { hadRect: false, hadCenter: false, hadHandles: {} };
    if (expRect && map.hasLayer(expRect)) { map.removeLayer(expRect); ctx.hadRect = true; }
    if (expCenterMarker && map.hasLayer(expCenterMarker)) { map.removeLayer(expCenterMarker); ctx.hadCenter = true; }
    Object.keys(expHandleMarkers).forEach(k => {
      const m = expHandleMarkers[k];
      if (m && map.hasLayer(m)) { map.removeLayer(m); ctx.hadHandles[k] = true; }
    });
    return ctx;
  }

  function restoreExportSelectionAfterCapture(ctx) {
    if (ctx.hadRect && expRect) expRect.addTo(map);
    if (ctx.hadCenter && expCenterMarker) expCenterMarker.addTo(map);
    Object.keys(ctx.hadHandles || {}).forEach(k => {
      if (ctx.hadHandles[k] && expHandleMarkers[k]) expHandleMarkers[k].addTo(map);
    });
  }

  function cropCanvasToSelection(canvas, rectLayer) {
    const b = rectLayer.getBounds();
    const p1 = map.latLngToContainerPoint(b.getNorthWest());
    const p2 = map.latLngToContainerPoint(b.getSouthEast());
    const x = Math.max(0, Math.min(p1.x, p2.x));
    const y = Math.max(0, Math.min(p1.y, p2.y));
    const w = Math.abs(p2.x - p1.x);
    const h = Math.abs(p2.y - p1.y);
    // Use actual canvas-to-element scale to avoid misalignment
    const mapEl = document.getElementById('map');
    const elW = (mapEl && mapEl.clientWidth) ? mapEl.clientWidth : canvas.width;
    const elH = (mapEl && mapEl.clientHeight) ? mapEl.clientHeight : canvas.height;
    const scaleX = canvas.width / elW;
    const scaleY = canvas.height / elH;
    const sx = Math.round(x * scaleX);
    const sy = Math.round(y * scaleY);
    const sw = Math.round(w * scaleX);
    const sh = Math.round(h * scaleY);
    const out = document.createElement('canvas');
    out.width = sw; out.height = sh;
    const ctx2 = out.getContext('2d');
    ctx2.drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);
    return out.toDataURL('image/png');
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

  if (bufferModeSel) {
    bufferModeSel.value = bufferMode;
    bufferModeSel.addEventListener('change', () => {
      bufferMode = bufferModeSel.value;
      if (getActive()) applyBuffer();
    });
  }

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
  function createObject() {
    const id = Date.now() + Math.random();
    const idx = objects.length + 1;
    const branch = [];
    const obj = {
      id,
      name: `Objekt ${idx}`,
      isClosed: false,
      vertices: branch,
      branches: [branch],
      vertexMarkers: [],
      polylineLayer: null,
      tempLine: null,
      bufferLayer: null,
      constructionHidden: false,
      visible: true,
      bufferMode: bufferMode || 'outline',
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
    if (!o.polylineLayer) {
      o.polylineLayer = createDrawLayer([]);
    }
    attachPolylineHandlers(o);
    updatePolyline(o);
    if (o.visible !== false && o.polylineLayer && !map.hasLayer(o.polylineLayer)) {
      o.polylineLayer.addTo(map);
    }
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
    objectsList.innerHTML = '';
    objects.forEach((o) => {
      const div = document.createElement('div');
      div.className = 'obj-item';
      div.dataset.id = String(o.id);
      const isVisible = o.visible !== false;
      div.innerHTML = `
        <div class="obj-icon" aria-hidden="true"></div>
        <div class="obj-meta">
          <span class="obj-title">${o.name}</span>
          <span class="obj-sub">Zeichnung</span>
        </div>
        <div class="obj-actions">
          <div class="obj-menu">
            <button type="button" class="obj-menu-item edit">Bearbeiten</button>
            <button type="button" class="obj-menu-item jump">Zum Objekt springen</button>
            <button type="button" class="obj-menu-item delete">Löschen</button>
          </div>
          <button type="button" class="opts-btn" aria-label="Optionen">⋯</button>
          <button type="button" class="eye-btn ${isVisible ? '' : 'off'}" data-visible="${isVisible ? 'true' : 'false'}" aria-label="${isVisible ? 'Layer ausblenden' : 'Layer einblenden'}"></button>
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
          eyeBtn.setAttribute('aria-label', next ? 'Layer ausblenden' : 'Layer einblenden');
        });
      }
      const optsBtn = div.querySelector('.opts-btn');
      if (optsBtn) {
        optsBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const isOpen = menu && menu.classList.contains('open');
          closeAllObjMenus();
          if (menu) menu.classList.toggle('open', !isOpen);
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
            <span class="obj-sub">Puffer (Ergebnis)</span>
          </div>
          <div class="obj-actions">
            <div class="obj-menu">
              <button type="button" class="obj-menu-item jump">Zum Objekt springen</button>
              <button type="button" class="obj-menu-item delete">Löschen</button>
            </div>
            <button type="button" class="opts-btn" aria-label="Optionen">⋯</button>
            <button type="button" class="eye-btn ${bufVisible ? '' : 'off'}" data-visible="${bufVisible ? 'true' : 'false'}" aria-label="${bufVisible ? 'Puffer ausblenden' : 'Puffer einblenden'}"></button>
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
            bufEye.setAttribute('aria-label', next ? 'Puffer ausblenden' : 'Puffer einblenden');
          });
        }
        if (bufOpts && bufMenu) {
          bufOpts.addEventListener('click', (ev) => {
            ev.stopPropagation();
            const isOpen = bufMenu.classList.contains('open');
            closeAllObjMenus();
            bufMenu.classList.toggle('open', !isOpen);
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
              removeBuffer(o);
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

    // Georeferenced plan entry
    if (planOverlay) {
      const div = document.createElement('div');
      div.className = 'obj-item obj-plan';
      const isVisible = map.hasLayer(planOverlay);
      div.innerHTML = `
        <div class="obj-icon plan" aria-hidden="true"></div>
        <div class="obj-meta">
          <span class="obj-title">Georeferenzieren</span>
          <span class="obj-sub">Plan</span>
        </div>
        <div class="obj-actions">
          <button type="button" class="eye-btn ${isVisible ? '' : 'off'}" data-visible="${isVisible ? 'true' : 'false'}" aria-label="${isVisible ? 'Plan ausblenden' : 'Plan einblenden'}"></button>
          <button type="button" class="opts-btn plan-remove" aria-label="Plan entfernen">✕</button>
        </div>
      `;
      const eye = div.querySelector('.eye-btn');
      const removeBtn = div.querySelector('.plan-remove');
      if (eye) {
        eye.addEventListener('click', (ev) => {
          ev.stopPropagation();
          const next = eye.dataset.visible === 'false';
          setPlanVisible(next);
          if (planVisibleChk) planVisibleChk.checked = next;
          eye.dataset.visible = next ? 'true' : 'false';
          eye.classList.toggle('off', !next);
          eye.setAttribute('aria-label', next ? 'Plan ausblenden' : 'Plan einblenden');
        });
      }
      if (removeBtn) {
        removeBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          removePlanOverlay();
          renderObjectsList();
        });
      }
      objectsList.appendChild(div);
    }
  }

  function closeAllObjMenus() {
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
      const o = createObject();
      setActive(o.id);
      // Start drawing immediately
      if (!o.polylineLayer) {
        o.polylineLayer = createDrawLayer([]);
        o.polylineLayer.addTo(map);
      }
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
    if (!g) return { coords: [], isClosed: false };
    const type = g.type;
    if (type === 'LineString') {
      return { coords: g.coordinates || [], isClosed: false };
    }
    if (type === 'MultiLineString') {
      const line = (g.coordinates || []).find(arr => Array.isArray(arr) && arr.length >= 2);
      return { coords: line || [], isClosed: false };
    }
    if (type === 'Polygon') {
      return { coords: (g.coordinates && g.coordinates[0]) || [], isClosed: true };
    }
    if (type === 'MultiPolygon') {
      const poly = (g.coordinates || []).find(p => Array.isArray(p) && p[0] && p[0].length >= 2);
      return { coords: (poly && poly[0]) || [], isClosed: true };
    }
    if (type === 'GeometryCollection') {
      const geometries = g.geometries || [];
      for (let i = 0; i < geometries.length; i++) {
        const res = pickCoordsFromGeometry(geometries[i]);
        if (res.coords.length >= 2) return res;
      }
      return { coords: [], isClosed: false };
    }
    return { coords: [], isClosed: false };
  }

  function pickCoordsFromFeatures(features) {
    if (!features || !features.length) return { coords: [], isClosed: false, name: '' };
    for (let i = 0; i < features.length; i++) {
      const feat = features[i];
      const { coords, isClosed } = pickCoordsFromGeometry(feat && feat.geometry);
      if (coords.length >= 2) {
        const name = (feat && feat.properties && feat.properties.name) || '';
        return { coords, isClosed, name };
      }
    }
    return { coords: [], isClosed: false, name: '' };
  }

  // Fallback parser when toGeoJSON returns no features
  function extractCoordsFromKml(xml) {
    if (!xml) return { coords: [], isClosed: false, name: '' };
    const coordEls = Array.from(xml.getElementsByTagName('coordinates'));
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
    for (let i = 0; i < coordEls.length; i++) {
      const txt = (coordEls[i].textContent || '').trim();
      if (!txt) continue;
      const parts = txt.split(/\s+/).map(s => s.split(',').map(Number)).filter(arr => arr.length >= 2 && arr.every(Number.isFinite));
      if (parts.length < 2) continue;
      const name = getNameFromPlacemark(coordEls[i]);
      const isClosed = isPolygonAncestor(coordEls[i]) || (parts.length >= 3 && parts[0][0] === parts[parts.length - 1][0] && parts[0][1] === parts[parts.length - 1][1]);
      return { coords: parts, isClosed, name };
    }
    return { coords: [], isClosed: false, name: '' };
  }

  // KML import -> create a new object and fill it
  async function importKmlFromText(text) {
    try {
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'text/xml');
      const parseError = xml.getElementsByTagName('parsererror')[0];
      if (parseError) { alert('KML konnte nicht geparst werden.'); return; }
      const fc = window.toGeoJSON ? window.toGeoJSON.kml(xml) : null;
      let coordsMeta = pickCoordsFromFeatures(fc && fc.features);
      if (!coordsMeta || !coordsMeta.coords || coordsMeta.coords.length < 2) {
        coordsMeta = extractCoordsFromKml(xml);
      }
      const { coords, isClosed, name } = coordsMeta || {};
      if (!coords || coords.length < 2) {
        alert('Unterstützte Geometrie nicht gefunden (Linie/Polygon).');
        return;
      }

      const latlngs = [];
      coords.forEach((pair) => {
        const lon = Array.isArray(pair) ? Number(pair[0]) : NaN;
        const lat = Array.isArray(pair) ? Number(pair[1]) : NaN;
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
        latlngs.push([lat, lon]);
      });
      if (latlngs.length < 2) {
        alert('Zu wenige Punkte in der Geometrie.');
        return;
      }

      if (latlngs.length > 1) {
        const first = latlngs[0];
        const last = latlngs[latlngs.length - 1];
        if (first[0] === last[0] && first[1] === last[1]) latlngs.pop();
      }

      const o = createObject();
      if (name) {
        o.name = name;
        renderObjectsList();
      }
      setActive(o.id);
      o.isClosed = latlngs.length >= 3;
      o.polylineLayer = createDrawLayer([]).addTo(map);
      attachPolylineHandlers(o);
      latlngs.forEach(([lat, lon]) => {
        const latlng = L.latLng(lat, lon);
        o.vertices.push(latlng);
        const marker = L.circleMarker(latlng, { radius: 4, color: '#111', weight: 1, fillColor: '#fff', fillOpacity: 1 });
        bindVertexMarkerEvents(o, marker);
        if (o.visible !== false) marker.addTo(map);
        o.vertexMarkers.push(marker);
      });
      updatePolyline(o);
      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds.pad(0.2));
      drawActive = true;
      map.doubleClickZoom.disable();
      setDrawingCursor(true);
      enableButtons();
      updateToolStates();
      updateEditMarkers();
    } catch (e) {
      console.error('KML Import Fehler:', e);
      alert('Fehler beim KML Import.');
    }
  }

  async function readKmlTextFromFile(file) {
    if (!file) throw new Error('Keine Datei ausgewählt.');
    const name = file.name || '';
    const lower = name.toLowerCase();
    if (lower.endsWith('.kmz')) {
      if (typeof JSZip === 'undefined') throw new Error('KMZ-Unterstützung nicht verfügbar.');
      const buf = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buf);
      const kmlEntry = (zip && zip.file && zip.file(/\.kml$/i)[0]) || null;
      if (!kmlEntry) throw new Error('Keine KML-Datei im KMZ gefunden.');
      const text = await kmlEntry.async('text');
      return { text, name: kmlEntry.name || name };
    }
    if (lower.endsWith('.kml') || file.type === 'application/vnd.google-earth.kml+xml') {
      const text = await file.text();
      return { text, name };
    }
    throw new Error('Dateityp wird nicht unterstützt.');
  }

  async function handleKmlFile(file) {
    if (!file) {
      alert('Bitte zuerst eine KML- oder KMZ-Datei auswählen.');
      return;
    }
    try {
      const { text } = await readKmlTextFromFile(file);
      await importKmlFromText(text);
    } catch (e) {
      console.error('KML/KMZ Import Fehler:', e);
      const msg = (e && e.message) ? e.message : 'Fehler beim KML/KMZ Import.';
      alert(msg);
    } finally {
      if (kmlFile) kmlFile.value = '';
    }
  }

  if (importBtn) {
    importBtn.addEventListener('click', async () => {
      if (!kmlFile || !kmlFile.files || !kmlFile.files[0]) {
        alert('Bitte zuerst eine KML- oder KMZ-Datei auswählen.');
        return;
      }
      await handleKmlFile(kmlFile.files[0]);
    });
  }
  if (kmlIconBtn && kmlFile) {
    kmlIconBtn.addEventListener('click', () => kmlFile.click());
  }
  if (kmlFile) {
    kmlFile.addEventListener('change', async () => {
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
    if (file.type && file.type.startsWith('image/')) {
      addPlanFromFile(file);
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
        if (!arr || arr.length === 0) { alert('Kein Treffer gefunden.'); return; }
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
      lastKnownAddress = (r.display_name || q || '').trim();
      lastKnownCoords = { lat, lng: lon };
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

  // ---- Georeferencing helpers ----
  function boundsCorners(b) {
    return {
      nw: b.getNorthWest(),
      ne: b.getNorthEast(),
      se: b.getSouthEast(),
      sw: b.getSouthWest(),
    };
  }

  function distortableAvailable() {
    return !!(L && (L.distortableImageOverlay || L.DistortableImageOverlay));
  }

  function createDistortable(url, opts) {
    if (L.distortableImageOverlay) return L.distortableImageOverlay(url, opts);
    if (L.DistortableImageOverlay) return new L.DistortableImageOverlay(url, opts);
    return null;
  }

  // Minimal rotated image overlay if plugin is unavailable
  if (!L.RotatedImageOverlay) {
    L.RotatedImageOverlay = L.Layer.extend({
      initialize: function (url, corners, options) {
        this._url = url;
        this._corners = [L.latLng(corners[0]), L.latLng(corners[1]), L.latLng(corners[2])];
        L.setOptions(this, options || {});
      },
      onAdd: function (map) {
        this._map = map;
        if (!this._image) this._initImage();
        const paneName = this.options.pane || 'overlayPane';
        map.getPane(paneName).appendChild(this._image);
        map.on('zoom viewreset move', this._reset, this);
        this._reset();
      },
      onRemove: function (map) {
        if (this._image && this._image.parentNode) this._image.parentNode.removeChild(this._image);
        map.off('zoom viewreset move', this._reset, this);
      },
      _initImage: function () {
        const img = this._image = L.DomUtil.create('img', 'leaflet-image-layer');
        img.style.position = 'absolute';
        img.style.transformOrigin = '0 0';
        img.style.pointerEvents = 'auto';
        img.draggable = false;
        if (this.options.opacity != null) L.DomUtil.setOpacity(img, this.options.opacity);
        if (this.options.crossOrigin) img.crossOrigin = '';
        img.src = this._url;
        img.onload = () => { this._reset(); };
      },
      _reset: function () {
        if (!this._map || !this._image) return;
        const img = this._image;
        const w = img.naturalWidth || img.width || 0;
        const h = img.naturalHeight || img.height || 0;
        if (!w || !h) return;
        const tl = this._map.latLngToLayerPoint(this._corners[0]);
        const tr = this._map.latLngToLayerPoint(this._corners[1]);
        const bl = this._map.latLngToLayerPoint(this._corners[2]);
        const e = tl.x, f = tl.y;
        const a = (tr.x - e) / w;
        const b = (tr.y - f) / w;
        const c = (bl.x - e) / h;
        const d = (bl.y - f) / h;
        img.style.transform = `matrix(${a}, ${b}, ${c}, ${d}, ${e}, ${f})`;
      },
      setOpacity: function (o) {
        this.options.opacity = o;
        if (this._image) L.DomUtil.setOpacity(this._image, o);
        return this;
      },
      getElement: function () {
        return this._image;
      },
      getCorners: function () {
        return this._corners.slice();
      },
      setCorners: function (tl, tr, bl) {
        this._corners = [L.latLng(tl), L.latLng(tr), L.latLng(bl)];
        this._reset();
        return this;
      },
      bringToFront: function () {
        if (this._image && this._image.parentNode) this._image.parentNode.appendChild(this._image);
        return this;
      },
      addTo: function (map) { map.addLayer(this); return this; }
    });
  }

  function addPlanOverlayFromUrl(url) {
    const b = map.getBounds();
    const c = boundsCorners(b);
    // Remove any existing overlay
    removePlanOverlay();
    try {
      if (distortableAvailable()) {
        // Place covering current view; ensure in custom pane and selected for handles
        planOverlay = createDistortable(url, {
          corners: [c.nw, c.ne, c.se, c.sw],
          selected: true,
          crossOrigin: true,
          opacity: Number(planOpacity.value) || 0.6,
          pane: 'georefPane',
        }).addTo(map);
        startPlanEditUI(); // sets editing state, zIndex, disables map drag
        // bring overlay to interactable front
        if (planOverlay.bringToFront) planOverlay.bringToFront();
      } else {
        // Try built-in minimal rotated overlay implementation
        if (L.RotatedImageOverlay) {
          planOverlay = new L.RotatedImageOverlay(url, [c.nw, c.ne, c.sw], {
            opacity: Number(planOpacity.value) || 0.6,
            pane: 'georefPane',
            crossOrigin: true,
            interactive: true,
          }).addTo(map);
          attachFallbackDragHandlers();
          startPlanEditUI();
        } else {
          // Fallback: axis-aligned image overlay with drag move only
          planOverlay = L.imageOverlay(url, b, {
            opacity: Number(planOpacity.value) || 0.6,
            pane: 'georefPane',
            crossOrigin: true,
            interactive: true,
            className: 'leaflet-interactive'
          }).addTo(map);
          attachFallbackDragHandlers();
          startPlanEditUI();
        }
      }
      if (planOverlay && planOverlay.on) {
        planOverlay.on('click', (ev) => {
          handleGeorefClick(ev.latlng, true);
        });
      }
      togglePlanEditBtn.disabled = false;
      removePlanBtn.disabled = true; // enable after load event
      planVisibleChk.checked = true;
      // Update button label
      togglePlanEditBtn.textContent = planEditing ? 'Bearbeiten beenden' : 'Bearbeiten';
      if (georefSettings) georefSettings.classList.remove('hidden');

      // Enable remove once image is loaded
      const img = planOverlay.getElement ? planOverlay.getElement() : (planOverlay._image || null);
      if (img) {
        if (img.complete) removePlanBtn.disabled = false;
        else img.addEventListener('load', () => { removePlanBtn.disabled = false; });
      } else {
        removePlanBtn.disabled = false;
      }
      refreshRotationField();
      startTwoPointGeoref();
      renderObjectsList();
    } catch (e) {
      console.warn('Fehler beim Hinzufügen des Plans:', e);
      alert('Plan konnte nicht überlagert werden.');
    }
  }

  function removePlanOverlay() {
    if (planOverlay && map.hasLayer(planOverlay)) map.removeLayer(planOverlay);
    planOverlay = null;
    planEditing = false;
    togglePlanEditBtn.disabled = true;
    removePlanBtn.disabled = true;
    lowerGeorefPane();
    stopPlanEditUI();
    clearTwoPtMarkers();
    refreshRotationField();
    endTwoPointGeoref(true);
    if (georefSettings) georefSettings.classList.add('hidden');
    renderObjectsList();
  }

  function addPlanFromFile(file) {
    const url = URL.createObjectURL(file);
    addPlanOverlayFromUrl(url);
    if (planFile) planFile.value = '';
  }

  function setPlanOpacity(val) {
    if (!planOverlay) return;
    const v = Math.max(0, Math.min(1, Number(val) || 0));
    if (typeof planOverlay.setOpacity === 'function') planOverlay.setOpacity(v);
    else if (planOverlay.getElement) {
      const el = planOverlay.getElement();
      if (el) el.style.opacity = String(v);
    } else if (planOverlay._image) {
      planOverlay._image.style.opacity = String(v);
    }
  }

  function setPlanVisible(visible) {
    if (!planOverlay) return;
    if (visible) {
      if (!map.hasLayer(planOverlay)) planOverlay.addTo(map);
    } else {
      if (map.hasLayer(planOverlay)) map.removeLayer(planOverlay);
      clearTwoPtMarkers();
    }
    refreshRotationField();
    renderObjectsList();
  }

  function startPlanEditUI() {
    planEditing = true;
    raiseGeorefPane();
    if (planOverlay && planOverlay.bringToFront) planOverlay.bringToFront();
    // Avoid conflicts with map interactions
    map.dragging.disable();
    map.doubleClickZoom.disable();
    drawActive = false;
    setDrawingCursor(false);
    removeSnapMarker();
    togglePlanEditBtn.disabled = false;
    togglePlanEditBtn.textContent = 'Bearbeiten beenden';
    if (applyRotationBtn) applyRotationBtn.disabled = false;
    const el = planOverlay && (planOverlay.getElement ? planOverlay.getElement() : planOverlay._image);
    if (el) el.classList.add('georef-draggable');
    refreshRotationField();
  }

  function stopPlanEditUI() {
    planEditing = false;
    lowerGeorefPane();
    map.dragging.enable();
    map.doubleClickZoom.enable();
    togglePlanEditBtn.textContent = 'Bearbeiten';
    if (applyRotationBtn) applyRotationBtn.disabled = true;
    const el = planOverlay && (planOverlay.getElement ? planOverlay.getElement() : planOverlay._image);
    if (el) el.classList.remove('georef-draggable');
  }

  function togglePlanEditing() {
    if (!planOverlay) return;
    // DistortableImage exposes edit handles when selected; try common APIs defensively
    try {
      if (planEditing) {
        // disable
        if (planOverlay.deselect) planOverlay.deselect();
        if (planOverlay.editing && planOverlay.editing.disable) planOverlay.editing.disable();
        if (planOverlay.edit && planOverlay.edit.disable) planOverlay.edit.disable();
        stopPlanEditUI();
        planDragging = false;
        clearTwoPtMarkers();
      } else {
        if (planOverlay.select) planOverlay.select();
        if (planOverlay.editing && planOverlay.editing.enable) planOverlay.editing.enable();
        if (planOverlay.edit && planOverlay.edit.enable) planOverlay.edit.enable();
        startPlanEditUI();
        if (!distortableAvailable()) {
          attachFallbackDragHandlers();
        }
      }
    } catch (e) {
      // Fallback: no-op when plugin not present
      console.warn('Plan-Bearbeitung nicht verfügbar:', e);
      // fallback to rotated overlay or simple drag
      if (!distortableAvailable()) {
        attachFallbackDragHandlers();
        startPlanEditUI();
      } else {
        planEditing = false;
      }
    }
    togglePlanEditBtn.textContent = planEditing ? 'Bearbeiten beenden' : 'Bearbeiten';
    refreshRotationField();
  }

  // Rotated grip handles removed; live 2‑Punkt georef markers are used instead

  function attachFallbackDragHandlers() {
    if (!planOverlay) return;
    const el = planOverlay.getElement ? planOverlay.getElement() : planOverlay._image;
    if (!el) return;
    // Ensure overlay receives events
    el.style.pointerEvents = 'auto';

    const onMouseDown = (ev) => {
      if (!planEditing) return; // only drag in edit mode
      if (twoPtActive) return; // allow click capture for one-point georef
      ev.preventDefault();
      ev.stopPropagation();
      planDragging = true;
      planDragStart = {
        latlng: map.mouseEventToLatLng(ev),
        bounds: planOverlay.getBounds ? planOverlay.getBounds() : null,
        corners: (planOverlay.getCorners && planOverlay.getCorners()) || null,
      };
    };
    const onMouseMove = (ev) => {
      if (!planDragging || !planDragStart || !planOverlay) return;
      const cur = map.mouseEventToLatLng(ev);
      const dLat = cur.lat - planDragStart.latlng.lat;
      const dLng = cur.lng - planDragStart.latlng.lng;
      if (planDragStart.bounds && planOverlay.setBounds) {
        const b = planDragStart.bounds;
        const sw = b.getSouthWest();
        const ne = b.getNorthEast();
        const newSw = L.latLng(sw.lat + dLat, sw.lng + dLng);
        const newNe = L.latLng(ne.lat + dLat, ne.lng + dLng);
        const newBounds = L.latLngBounds(newSw, newNe);
        planOverlay.setBounds(newBounds);
      } else if (planDragStart.corners && planOverlay.setCorners) {
        const c = planDragStart.corners.map(ll => L.latLng(ll.lat + dLat, ll.lng + dLng));
        planOverlay.setCorners(c[0], c[1], c[2]);
        updateTwoPtMarkers();
      }
    };
    const stopDrag = (ev) => {
      if (!planDragging) return;
      planDragging = false;
      planDragStart = null;
      refreshRotationField();
    };

    // Attach only once
    if (!el._kmlDrawerDragBound) {
      el.addEventListener('mousedown', onMouseDown);
      map.getContainer().addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', stopDrag);
      el._kmlDrawerDragBound = true;
    }
  }

  function moveHandlesToCorners() {
    // No rotated grips; keep two‑point markers in sync instead
    updateTwoPtMarkers();
  }

  function computeRotationDeg() {
    if (!planOverlay || !planOverlay.getCorners) return 0;
    const c = planOverlay.getCorners();
    if (!c || c.length < 2) return 0;
    const tl = map.latLngToLayerPoint(c[0]);
    const tr = map.latLngToLayerPoint(c[1]);
    const v = L.point(tr.x - tl.x, tr.y - tl.y);
    const ang = Math.atan2(v.y, v.x) * 180 / Math.PI; // relative to east
    return Math.round(ang);
  }

  function setOverlayRotation(deg) {
    if (!planOverlay || !planOverlay.getCorners || !planOverlay.setCorners) return;
    if (planOverlay.getCorners && planOverlay.setCorners) {
      const c = planOverlay.getCorners();
      if (!c || c.length < 3) return;
      // rotate around center
      const tl = map.latLngToLayerPoint(c[0]);
      const tr = map.latLngToLayerPoint(c[1]);
      const bl = map.latLngToLayerPoint(c[2]);
      const u = L.point(tr.x - tl.x, tr.y - tl.y);
      const v = L.point(bl.x - tl.x, bl.y - tl.y);
      const center = L.point(tl.x + (u.x + v.x) / 2, tl.y + (u.y + v.y) / 2);
      const curDeg = Math.atan2(u.y, u.x) * 180 / Math.PI;
      const delta = (deg - curDeg) * Math.PI / 180;
      const rot = (p) => {
        const dx = p.x - center.x; const dy = p.y - center.y;
        const cos = Math.cos(delta), sin = Math.sin(delta);
        return L.point(center.x + dx * cos - dy * sin, center.y + dx * sin + dy * cos);
      };
      const tl2 = rot(tl);
      const tr2 = rot(tr);
      const bl2 = rot(bl);
      const tlLL = map.layerPointToLatLng(tl2);
      const trLL = map.layerPointToLatLng(tr2);
      const blLL = map.layerPointToLatLng(bl2);
      planOverlay.setCorners(tlLL, trLL, blLL);
      updateTwoPtMarkers();
      refreshRotationField();
    }
  }

  if (applyRotationBtn) {
    applyRotationBtn.addEventListener('click', () => {
      const val = Number(planRotation.value);
      if (isFinite(val)) setOverlayRotation(val);
    });
  }

  // Wire georeferencing controls
  if (planIconBtn && planFile) {
    planIconBtn.addEventListener('click', () => planFile.click());
  }
  if (planFile) {
    planFile.addEventListener('change', () => {
      const f = planFile.files && planFile.files[0];
      if (!f) return;
      addPlanFromFile(f);
    });
  }
  if (togglePlanEditBtn) togglePlanEditBtn.addEventListener('click', () => togglePlanEditing());
  if (removePlanBtn) removePlanBtn.addEventListener('click', () => removePlanOverlay());
  if (planOpacity) planOpacity.addEventListener('input', () => setPlanOpacity(planOpacity.value));
  if (planVisibleChk) planVisibleChk.addEventListener('change', () => setPlanVisible(planVisibleChk.checked));

  // ---- Two-point georef ----
  function setGeorefStatus(msg) { if (georefStatus) georefStatus.textContent = msg || ''; }

  function getImageDims() {
    const el = planOverlay && (planOverlay.getElement ? planOverlay.getElement() : planOverlay._image);
    if (!el) return null;
    const w = el.naturalWidth || el.width || 0;
    const h = el.naturalHeight || el.height || 0;
    return (w && h) ? { w, h } : null;
  }

  function overlayLatLngToImageXY(latlng) {
    if (!planOverlay) return null;
    const dims = getImageDims();
    if (!dims) return null;
    const w = dims.w, h = dims.h;
    if (planOverlay.getCorners) {
      const c = planOverlay.getCorners();
      if (!c || c.length < 3) return null;
      const tl = map.latLngToLayerPoint(c[0]);
      const tr = map.latLngToLayerPoint(c[1]);
      const bl = map.latLngToLayerPoint(c[2]);
      const p = map.latLngToLayerPoint(latlng);
      const u = L.point((tr.x - tl.x) / w, (tr.y - tl.y) / w);
      const v = L.point((bl.x - tl.x) / h, (bl.y - tl.y) / h);
      const d = L.point(p.x - tl.x, p.y - tl.y);
      const det = u.x * v.y - u.y * v.x;
      if (Math.abs(det) < 1e-9) return null;
      const x = (d.x * v.y - d.y * v.x) / det;
      const y = (-d.x * u.y + d.y * u.x) / det;
      return L.point(x, y);
    }
    if (planOverlay.getBounds) {
      const b = planOverlay.getBounds();
      const sw = b.getSouthWest(), ne = b.getNorthEast();
      const lngSpan = ne.lng - sw.lng;
      const latSpan = sw.lat - ne.lat;
      if (Math.abs(lngSpan) < 1e-9 || Math.abs(latSpan) < 1e-9) return null;
      const fx = (latlng.lng - sw.lng) / lngSpan;
      const normY = (latlng.lat - sw.lat) / (ne.lat - sw.lat); // 0 at south, 1 at north
      const fy = 1 - normY; // screen y grows downward
      return L.point(fx * w, fy * h);
    }
    return null;
  }

  function imageXYToLatLng(x, y) {
    if (!planOverlay) return null;
    const dims = getImageDims();
    if (!dims) return null;
    const w = dims.w, h = dims.h;
    if (planOverlay.getCorners) {
      const c = planOverlay.getCorners();
      if (!c || c.length < 3) return null;
      const tl = map.latLngToLayerPoint(c[0]);
      const tr = map.latLngToLayerPoint(c[1]);
      const bl = map.latLngToLayerPoint(c[2]);
      const u = L.point((tr.x - tl.x) / w, (tr.y - tl.y) / w);
      const v = L.point((bl.x - tl.x) / h, (bl.y - tl.y) / h);
      const P = L.point(tl.x + u.x * x + v.x * y, tl.y + u.y * x + v.y * y);
      return map.layerPointToLatLng(P);
    }
    if (planOverlay.getBounds) {
      const b = planOverlay.getBounds();
      const sw = b.getSouthWest(), ne = b.getNorthEast();
      const fx = x / w;
      const fy = y / h;
      const lng = sw.lng + fx * (ne.lng - sw.lng);
      const normY = 1 - fy;
      const lat = sw.lat + normY * (ne.lat - sw.lat);
      return L.latLng(lat, lng);
    }
    return null;
  }

  function translateOverlayByLayerDelta(dx, dy) {
    if (!planOverlay) return;
    if (planOverlay.getCorners && planOverlay.setCorners) {
      const c = planOverlay.getCorners();
      const pts = c.map(ll => map.latLngToLayerPoint(ll));
      const moved = pts.map(p => L.point(p.x + dx, p.y + dy));
      const mll = moved.map(p => map.layerPointToLatLng(p));
      planOverlay.setCorners(mll[0], mll[1], mll[2]);
      return;
    }
    if (planOverlay.getBounds && planOverlay.setBounds) {
      const b = planOverlay.getBounds();
      const swPt = map.latLngToLayerPoint(b.getSouthWest());
      const nePt = map.latLngToLayerPoint(b.getNorthEast());
      const newSw = map.layerPointToLatLng(L.point(swPt.x + dx, swPt.y + dy));
      const newNe = map.layerPointToLatLng(L.point(nePt.x + dx, nePt.y + dy));
      planOverlay.setBounds(L.latLngBounds(newSw, newNe));
    }
  }

  function ensureTwoPtMarkers() {
    if (!twoPtMarkers.img1) {
      twoPtMarkers.img1 = L.circleMarker([0,0], { radius: 6, color: '#d32f2f', weight: 2, fillColor: '#fff', fillOpacity: 1, pane: 'georefHandlesPane' });
    }
    if (!twoPtMarkers.img2) {
      twoPtMarkers.img2 = L.circleMarker([0,0], { radius: 6, color: '#1976d2', weight: 2, fillColor: '#fff', fillOpacity: 1, pane: 'georefHandlesPane' });
    }
    if (!twoPtMarkers.map1) {
      twoPtMarkers.map1 = L.circleMarker([0,0], { radius: 5, color: '#d32f2f', weight: 2, fillColor: '#d32f2f', fillOpacity: 0.6, pane: 'georefHandlesPane' });
    }
    if (!twoPtMarkers.line) {
      twoPtMarkers.line = L.polyline([], { color: '#555', weight: 1, dashArray: '4,4', pane: 'georefHandlesPane' });
    }
  }

  function updateTwoPtMarkers() {
    ensureTwoPtMarkers();
    if (tpImgPts[0]) {
      const ll = imageXYToLatLng(tpImgPts[0].x, tpImgPts[0].y);
      if (ll) { twoPtMarkers.img1.setLatLng(ll); if (!map.hasLayer(twoPtMarkers.img1)) twoPtMarkers.img1.addTo(map); }
    }
    if (tpImgPts[1]) {
      const ll = imageXYToLatLng(tpImgPts[1].x, tpImgPts[1].y);
      if (ll) { twoPtMarkers.img2.setLatLng(ll); if (!map.hasLayer(twoPtMarkers.img2)) twoPtMarkers.img2.addTo(map); }
    }
    if (tpMapPts[0]) {
      twoPtMarkers.map1.setLatLng(tpMapPts[0]); if (!map.hasLayer(twoPtMarkers.map1)) twoPtMarkers.map1.addTo(map);
    }
  }

  function clearTwoPtMarkers() {
    Object.values(twoPtMarkers).forEach(l => { if (l && map.hasLayer(l)) map.removeLayer(l); });
  }

  function startTwoPointGeoref() {
    if (!planOverlay || !planOverlay.getCorners || !planOverlay.setCorners) return;
    startPlanEditUI();
    twoPtActive = true;
    twoPtStep = 1;
    tpImgPts = [];
    tpMapPts = [];
    setGeorefStatus('Punkt 1: Klicke auf das Bild (Anker 1).');
  }

  function endTwoPointGeoref(cancelOnly = false) {
    if (!twoPtActive) return;
    twoPtActive = false;
    twoPtStep = 0;
    setGeorefStatus('');
    if (twoPtMoveHandler) { map.off('mousemove', twoPtMoveHandler); twoPtMoveHandler = null; }
    if (cancelOnly && twoPtSavedCorners && planOverlay && planOverlay.setCorners) {
      planOverlay.setCorners(twoPtSavedCorners[0], twoPtSavedCorners[1], twoPtSavedCorners[2]);
    }
    twoPtSavedCorners = null;
    tpImgPts = [];
    tpMapPts = [];
    clearTwoPtMarkers();
  }

  function applyTwoPointTransform(img1, img2, map1, map2) {
    const dims = getImageDims();
    if (!dims) return;
    const w = dims.w, h = dims.h;
    const p1 = map.latLngToLayerPoint(map1);
    const p2 = map.latLngToLayerPoint(map2);
    const dvImg = L.point(img2.x - img1.x, img2.y - img1.y);
    const dvMap = L.point(p2.x - p1.x, p2.y - p1.y);
    const lenImg = Math.hypot(dvImg.x, dvImg.y);
    const lenMap = Math.hypot(dvMap.x, dvMap.y);
    if (lenImg < 1e-6 || lenMap < 1e-6) { alert('Punkte zu nah beieinander.'); return; }
    const s = lenMap / lenImg;
    const angImg = Math.atan2(dvImg.y, dvImg.x);
    const angMap = Math.atan2(dvMap.y, dvMap.x);
    const ang = angMap - angImg;
    const cos = Math.cos(ang), sin = Math.sin(ang);
    const transform = (x, y) => {
      const dx = x - img1.x, dy = y - img1.y;
      const rx = s * (dx * cos - dy * sin);
      const ry = s * (dx * sin + dy * cos);
      return L.point(p1.x + rx, p1.y + ry);
    };
    const tl = transform(0, 0);
    const tr = transform(w, 0);
    const bl = transform(0, h);
    const tlLL = map.layerPointToLatLng(tl);
    const trLL = map.layerPointToLatLng(tr);
    const blLL = map.layerPointToLatLng(bl);
    if (planOverlay.setCorners) {
      planOverlay.setCorners(tlLL, trLL, blLL);
      updateTwoPtMarkers();
      refreshRotationField();
    }
  }

  // Auto-run two-point flow: capture clicks on overlay/map
  function handleGeorefClick(latlng, onOverlay = false) {
    if (!twoPtActive || !planOverlay) return;
    if (!onOverlay && overlayLatLngToImageXY(latlng)) onOverlay = true;
    if (twoPtStep === 1) {
      if (!onOverlay) { setGeorefStatus('Bitte auf das Bild klicken (Anker 1).'); return; }
      const xy = overlayLatLngToImageXY(latlng);
      if (!xy) { setGeorefStatus('Koordinate auf Bild konnte nicht ermittelt werden.'); return; }
      tpImgPts[0] = xy;
      updateTwoPtMarkers();
      twoPtStep = 2;
      setGeorefStatus('Punkt 1: Klicke auf die Zielkarte (Ort von Anker 1).');
      return;
    }
    if (twoPtStep === 2) {
      tpMapPts[0] = latlng;
      updateTwoPtMarkers();
      const llImg1 = imageXYToLatLng(tpImgPts[0].x, tpImgPts[0].y);
      if (llImg1) {
        const Pcur = map.latLngToLayerPoint(llImg1);
        const Ptar = map.latLngToLayerPoint(tpMapPts[0]);
        translateOverlayByLayerDelta(Ptar.x - Pcur.x, Ptar.y - Pcur.y);
        updateTwoPtMarkers();
      }
      twoPtStep = 3;
      setGeorefStatus('Punkt 2: Klicke auf das Bild (Anker 2).');
      return;
    }
    if (twoPtStep === 3) {
      if (!onOverlay) { setGeorefStatus('Bitte auf das Bild klicken (Anker 2).'); return; }
      const xy = overlayLatLngToImageXY(latlng);
      if (!xy) { setGeorefStatus('Koordinate auf Bild konnte nicht ermittelt werden.'); return; }
      tpImgPts[1] = xy;
      updateTwoPtMarkers();
      twoPtSavedCorners = planOverlay.getCorners ? planOverlay.getCorners().slice() : null;
      twoPtStep = 4;
      setGeorefStatus('Punkt 2: Bewege die Maus – Größe/Rotation live. Klick bestätigt.');
      if (!twoPtMoveHandler) {
        twoPtMoveHandler = (mv) => {
          const ll = mv.latlng;
          applyTwoPointTransform(tpImgPts[0], tpImgPts[1], tpMapPts[0], ll);
          updateTwoPtMarkers();
          ensureTwoPtMarkers();
          twoPtMarkers.line.setLatLngs([tpMapPts[0], ll]);
          if (!map.hasLayer(twoPtMarkers.line)) twoPtMarkers.line.addTo(map);
        };
        map.on('mousemove', twoPtMoveHandler);
      }
      return;
    }
    if (twoPtStep === 4) {
      tpMapPts[1] = latlng;
      if (twoPtMoveHandler) { map.off('mousemove', twoPtMoveHandler); twoPtMoveHandler = null; }
      if (twoPtMarkers.line && map.hasLayer(twoPtMarkers.line)) map.removeLayer(twoPtMarkers.line);
      setGeorefStatus('2‑Punkt Georef angewendet.');
      endTwoPointGeoref();
      return;
    }
  }

  map.on('click', (e) => {
    if (!twoPtActive) return;
    const ev = e.originalEvent;
    let node = ev && ev.target;
    let onOverlay = false;
    while (node) {
      if (node === georefPane || node === georefHandlesPane) { onOverlay = true; break; }
      node = node.parentNode;
    }
    handleGeorefClick(e.latlng, onOverlay);
  });


  // ===== Export selection helpers =====
  function showExportModal(show) {
    if (!exportModal) return;
    exportModal.classList.toggle('hidden', !show);
  }

  // Compose final PDF from SVG template and map image
  const DEFAULT_TEMPLATE_SVG = `<?xml version="1.0" encoding="UTF-8"?>\n<svg id="Ebene_1" data-name="Ebene 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1190.5511 841.8898">\n  <rect id="MAP_FRAME" x="13.9642" y="13.979" width="935.4331" height="813.5433" fill="#8e44ad"/>\n  <text transform="translate(977.224 73.5637)" fill="#878787" font-family="Scandia-Regular, Scandia" font-size="12"><tspan x="0" y="0">{{P</tspan><tspan x="17.7842" y="0" letter-spacing="-.008em">r</tspan><tspan x="22.1289" y="0">oje</tspan><tspan x="39.6484" y="0" letter-spacing="-.005em">k</tspan><tspan x="45.9482" y="0">tname}}</tspan></text>\n  <text transform="translate(977.7317 56.2802)" fill="#1d1d1b" font-family="Scandia-Regular, Scandia" font-size="12"><tspan x="0" y="0" letter-spacing="-.015em">L</tspan><tspan x="6.4678" y="0">ageplan</tspan></text>\n  <text transform="translate(979.4115 181.2732)" fill="#1d1d1b" font-family="Scandia-Medium, Scandia" font-size="8" font-weight="500" letter-spacing=".02em"><tspan x="0" y="0">DIN A3</tspan></text>\n  <text transform="translate(979.4115 265.9789)" fill="#1d1d1b" font-family="Scandia-Medium, Scandia" font-size="8" font-weight="500"><tspan x="0" y="0" letter-spacing=".0071em">A</tspan><tspan x="6.0566" y="0" letter-spacing=".02em">uft</tspan><tspan x="17.3203" y="0" letter-spacing=".012em">r</tspan><tspan x="20.5039" y="0" letter-spacing=".02em">aggeber</tspan></text>\n  <text transform="translate(979.4125 278.183)" fill="#1d1d1b" font-family="Scandia-Regular, Scandia" font-size="8"><tspan x="0" y="0">{</tspan><tspan x="3.4717" y="0" letter-spacing="-.0029em">{</tspan><tspan x="6.9199" y="0" letter-spacing="-.015em">A</tspan><tspan x="12.5596" y="0">uft</tspan><tspan x="23.1182" y="0" letter-spacing="-.0081em">r</tspan><tspan x="26.0137" y="0">aggebe</tspan><tspan x="56.541" y="0" letter-spacing="-.0079em">r</tspan><tspan x="59.4375" y="0">}}</tspan></text>\n  <text transform="translate(979.4125 315.0522)" fill="#1d1d1b" font-family="Scandia-Medium, Scandia" font-size="8" font-weight="500"><tspan x="0" y="0" letter-spacing=".02em">Ansp</tspan><tspan x="20.4961" y="0" letter-spacing=".0121em">r</tspan><tspan x="23.6807" y="0" letter-spacing=".0199em">echpartner Bauleitung</tspan></text>\n  <text transform="translate(979.4125 327.2563)" fill="#1d1d1b" font-family="Scandia-Regular, Scandia" font-size="8"><tspan x="0" y="0">{</tspan><tspan x="3.4717" y="0" letter-spacing="-.0029em">{</tspan><tspan x="6.9199" y="0">Ansp</tspan><tspan x="26.4707" y="0" letter-spacing="-.0081em">r</tspan><tspan x="29.3662" y="0">echpartne</tspan><tspan x="70.0117" y="0" letter-spacing="-.0079em">r</tspan><tspan x="72.9082" y="0" letter-spacing="-.0001em">}}</tspan></text>\n  <text transform="translate(980.2065 413.3927)" fill="#1d1d1b" font-family="Scandia-Medium, Scandia" font-size="8" font-weight="500"><tspan x="0" y="0" letter-spacing=".0171em">P</tspan><tspan x="5.3525" y="0" letter-spacing=".012em">r</tspan><tspan x="8.5361" y="0" letter-spacing=".02em">oje</tspan><tspan x="20.9355" y="0" letter-spacing=".0131em">k</tspan><tspan x="25.5684" y="0" letter-spacing=".02em">tbesch</tspan><tspan x="53.1689" y="0" letter-spacing=".012em">r</tspan><tspan x="56.3525" y="0" letter-spacing=".02em">eibung</tspan></text>\n  <text transform="translate(980.2074 425.5969)" fill="#1d1d1b" font-family="Scandia-Regular, Scandia" font-size="8"><tspan x="0" y="0">{{P</tspan><tspan x="11.8555" y="0" letter-spacing="-.0079em">r</tspan><tspan x="14.752" y="0" letter-spacing="-.0001em">oje</tspan><tspan x="26.4316" y="0" letter-spacing="-.005em">k</tspan><tspan x="30.6318" y="0">tbesch</tspan><tspan x="57.0225" y="0" letter-spacing="-.0081em">r</tspan><tspan x="59.918" y="0">eibung}}</tspan></text>\n  <text transform="translate(980.2064 364.3195)" fill="#1d1d1b" font-family="Scandia-Medium, Scandia" font-size="8" font-weight="500" letter-spacing=".02em"><tspan x="0" y="0">Baubeginn</tspan></text>\n  <text transform="translate(979.0229 735.6275)" fill="#1d1d1b" font-family="Scandia-Medium, Scandia" font-size="8" font-weight="500"><tspan x="0" y="0" letter-spacing="-.0499em">T</tspan><tspan x="4.4961" y="0" letter-spacing=".012em">r</tspan><tspan x="7.6797" y="0" letter-spacing=".02em">a</tspan><tspan x="13.1357" y="0" letter-spacing=".0179em">s</tspan><tspan x="16.9756" y="0" letter-spacing=".02em">si</tspan><tspan x="23.168" y="0" letter-spacing=".03em">f</tspan><tspan x="26.248" y="0" letter-spacing=".02em">y GmbH</tspan></text>\n  <text transform="translate(979.0239 749.3534)" fill="#1d1d1b" font-family="Scandia-Regular, Scandia" font-size="8"><tspan x="0" y="0" letter-spacing=".02em">O</tspan><tspan x="6.9121" y="0" letter-spacing=".012em">s</tspan><tspan x="10.6562" y="0" letter-spacing=".02em">tpar</tspan><tspan x="27.8076" y="0" letter-spacing=".0079em">k</tspan><tspan x="32.1113" y="0" letter-spacing=".0121em">s</tspan><tspan x="35.8555" y="0" letter-spacing=".02em">t</tspan><tspan x="39.0391" y="0" letter-spacing=".0118em">r</tspan><tspan x="42.0938" y="0" letter-spacing=".02em">aße 37</tspan><tspan x="0" y="11" letter-spacing=".02em">60385 F</tspan><tspan x="30.9121" y="11" letter-spacing=".012em">r</tspan><tspan x="33.9678" y="11" letter-spacing=".02em">ankfurt am Main</tspan></text>\n  <text transform="translate(979.0239 777.543)" fill="#1d1d1b" font-family="Scandia-Regular, Scandia" font-size="8"><tspan x="0" y="0">+</tspan><tspan x="4.7676" y="0" letter-spacing="-.04em">4</tspan><tspan x="9.0547" y="0">9 151 5</tspan><tspan x="32.7031" y="0" letter-spacing="-.01em">3</tspan><tspan x="37.2227" y="0">28</tspan><tspan x="46.3906" y="0" letter-spacing="-.0399em">4</tspan><tspan x="50.6787" y="0">985</tspan><tspan x="0" y="9">in</tspan><tspan x="6.832" y="9" letter-spacing="-.014em">f</tspan><tspan x="9.4072" y="9">o@t</tspan><tspan x="25.1748" y="9" letter-spacing="-.0079em">r</tspan><tspan x="28.0713" y="9">a</tspan><tspan x="33.335" y="9" letter-spacing="-.001em">s</tspan><tspan x="36.9746" y="9">si</tspan><tspan x="42.5752" y="9" letter-spacing=".01em">f</tspan><tspan x="45.3438" y="9" letter-spacing="-.0601em">y</tspan><tspan x="49.0547" y="9" letter-spacing="-.005em">.</tspan><tspan x="50.999" y="9">de</tspan></text>\n  <text transform="translate(980.2074 376.5236)" fill="#1d1d1b" font-family="Scandia-Regular, Scandia" font-size="8"><tspan x="0" y="0">{{Baubeginn}}</tspan></text>\n  <text transform="translate(978.5052 236.8396)" fill="#1d1d1b" font-family="Scandia-Regular, Scandia" font-size="8"><tspan x="0" y="0">IN</tspan><tspan x="8.3271" y="0" letter-spacing=".005em">F</tspan><tspan x="12.7354" y="0">OS</tspan></text>\n  <text transform="translate(979.4115 199.0531)" fill="#1d1d1b" font-family="Scandia-Medium, Scandia" font-size="8" font-weight="500" letter-spacing=".02em"><tspan x="0" y="0">{{Datum}}</tspan></text>\n  <text transform="translate(979.4115 162.3275)" fill="#1d1d1b" font-family="Scandia-Medium, Scandia" font-size="8" font-weight="500"><tspan x="0" y="0" letter-spacing=".02em">ID: {{</tspan><tspan x="20.3271" y="0" letter-spacing=".004em">K</tspan><tspan x="25.791" y="0" letter-spacing="-.002em">S</tspan><tspan x="30.4795" y="0" letter-spacing=".02em">T}}</tspan></text>\n  <g>\n    <path d="M980.2066,123.1069v1.7432h-.6396v-5.5972h2.0312c1.1992,0,1.998.8955,1.998,1.9189s-.7988,1.9351-1.998,1.9351h-1.3916ZM981.5337,122.5552c.9277,0,1.4316-.6792,1.4316-1.3833,0-.7031-.5039-1.3672-1.4316-1.3672h-1.3271v2.7505h1.3271Z" fill="#1d1d1b"/>\n    <path d="M984.479,119.2529h.6396v5.0376h2.7588v.5596h-3.3984v-5.5972Z" fill="#1d1d1b"/>\n    <path d="M992.6284,123.6426h-2.9268l-.4873,1.2075h-.6641l2.3506-5.5972h.5283l2.3506,5.5972h-.6641l-.4873-1.2075ZM989.9175,123.1069h2.4951l-1.248-3.1182-1.2471,3.1182Z" fill="#1d1d1b"/>\n    <path d="M994.7661,119.2529h.4961l3.6533,4.5977v-4.5977h.5918v5.5972h-.4961l-3.6533-4.5977v4.5977h-.5918v-5.5972Z" fill="#1d1d1b"/>\n  </g>\n  <line x1="963.9513" y1="827.5223" x2="963.9513" y2="13.979" fill="none" stroke="#000" stroke-miterlimit="10"/>\n  <circle cx="1128.6335" cy="178.4959" r="30.5999" fill="none" stroke="#1d1d1b" stroke-miterlimit="10"/>\n  <polygon points="1128.6335 153.9989 1124.6173 162.8413 1132.6498 162.8413 1128.6335 153.9989 1124.6173 162.8413 1132.6498 162.8413 1128.6335 153.9989" fill="none" stroke="#1d1d1b" stroke-miterlimit="10" stroke-width=".25"/>\n  <path d="M1124.498,175.1406h.7441l5.4805,6.8965v-6.8965h.8877v8.3955h-.7432l-5.4814-6.896v6.896h-.8877v-8.3955Z"/>\n  <line x1="1162.2719" y1="114.8462" x2="978.8118" y2="114.8462" fill="none" stroke="#1d1d1b" stroke-miterlimit="10" stroke-width=".5"/>\n  <line x1="1162.2719" y1="129.7437" x2="978.8118" y2="129.7437" fill="none" stroke="#1d1d1b" stroke-miterlimit="10" stroke-width=".5"/>\n  <line x1="1162.2719" y1="226.6652" x2="978.8118" y2="226.6652" fill="none" stroke="#1d1d1b" stroke-miterlimit="10" stroke-width=".5"/>\n  <line x1="1162.2719" y1="241.5627" x2="978.8118" y2="241.5627" fill="none" stroke="#1d1d1b" stroke-miterlimit="10" stroke-width=".5"/>\n  <text transform="translate(978.5052 708.6373)" fill="#1d1d1b" font-family="Scandia-Regular, Scandia" font-size="8"><tspan x="0" y="0">ANF</tspan><tspan x="16.3115" y="0" letter-spacing=".005em">R</tspan><tspan x="21.6631" y="0" letter-spacing="-.035em">A</tspan><tspan x="27.1426" y="0">GE DURCH</tspan></text>\n  <line x1="1162.2719" y1="698.4629" x2="978.8118" y2="698.4629" fill="none" stroke="#1d1d1b" stroke-miterlimit="10" stroke-width=".5"/>\n  <line x1="1162.2719" y1="713.3604" x2="978.8118" y2="713.3604" fill="none" stroke="#1d1d1b" stroke-miterlimit="10" stroke-width=".5"/>\n  <g>\n    <path d="M999.7937,806.0561h-3.4848v-2.1258h9.2557v2.1258h-3.4848v9.5605h-2.2877v-9.5605h.0016Z"/>\n    <path d="M1006.2092,810.4871c0-2.6624,1.5717-3.9309,3.8769-3.9309s3.8594,1.2685,3.8594,3.9674v.054h-2.1083v-.0889c0-1.4288-.7144-1.948-1.7511-1.948s-1.7511.5191-1.7511,1.948v5.1279h-2.1258v-5.1295Z"/>\n    <path d="M1030.1787,813.2669c-.2286-.9589-1.7162-.697-3.3054-1.6193-.7509-.4366-1.6813-1.459-3.5403-3.507-.2064-.227-.4287-.4779-.8001-.7414-.7668-.543-1.7416-.8446-2.8513-.8446-2.8069,0-4.7723,1.9321-4.7723,4.7342,0,3.0228,2.2528,4.5564,4.396,4.5564,1.3923,0,2.591-.6589,3.1276-1.9654v1.7352h1.9464v-1.9051c-.0365-.543.1111-1.0049.4398-1.1843.3318-.1794.7303.0032.8891.0746.9637.4398.797,1.3431,1.5781,1.8432.9224.5842,2.5878.235,2.8656-.5509.0667-.1794.0826-.3905.0254-.6255h.0016ZM1019.6641,813.8639c-1.5558,0-2.61-1.105-2.61-2.6608s1.0542-2.6608,2.61-2.6608,2.591,1.1097,2.591,2.6608-1.0351,2.6608-2.591,2.6608Z"/>\n    <path d="M1042.4968,802.8047c-.8224,0-1.4114.6065-1.4114,1.4288s.5874,1.4114,1.4114,1.4114,1.4114-.5874,1.4114-1.4114-.5874-1.4288-1.4114-1.4288Z"/>\n    <path d="M1046.0689,806.5927c0-2.6084,1.5733-3.896,3.8769-3.896s3.8594,1.305,3.8594,3.9134h-2.1083c0-1.3939-.7144-1.9305-1.7511-1.9305s-1.7511.5541-1.7511,1.9115v1.4304h4.5389v1.9289h-4.5389v5.6645h-2.1258v-9.0223Z"/>\n    <path d="M1054.861,816.5803h2.1258c.3572.8224,1.0542,1.197,2.1258,1.197,1.4479,0,2.2687-.697,2.2687-2.4116v-1.1081c-.5366.9653-1.4653,1.4828-2.6275,1.4828-2.0369,0-3.9674-1.3225-3.9674-4.4675v-4.485h2.1258v4.485c0,1.6797.8938,2.4846,2.2337,2.4846s2.2337-.8398,2.2337-2.4846v-4.485h2.1258v8.5238c0,3.0736-1.948,4.3071-4.396,4.3071-2.0543,0-3.7515-.9462-4.2532-3.0387h.0048Z"/>\n    <path d="M1043.5494,806.7911v8.8254h-2.1258v-3.1863c-.2683-.9351-1.4923-1.6082-2.3973-1.9051-1.0986-.3604-3.0117-.3239-3.3085-1.6193-.0524-.235-.0413-.4461.0254-.6255.2937-.8192,2.0178-1.1653,2.8656-.5509.6176.4509.4287,1.1542,1.2463,1.6638.1635.1048.5652.3493.9462.2239.2905-.1.5176-.4096.6223-.8414v-1.9845s2.1258,0,2.1258,0Z"/>\n    <path d="M1036.156,814.4434c-.5096-.3382-.7335-.9684-1.1637-1.3844-.1508-.1445-.2635-.1762-.5493-.3382-1.6368-.9367-1.975-1.3415-3.2085-1.8972-.1921-.0857-.3636-.1778-.7287-.3001-1.0954-.362-3.0101-.3239-3.307-1.6193-.3286-1.4272,1.8353-1.8781,2.891-1.1764.5096.3413.7335.9684,1.1637,1.3844.1032.1.1984.1508.3747.2699,1.1208.7557,2.0607,1.3891,3.3848,1.9702.227.1.3874.1857.7271.2969,1.0954.3588,3.0117.3239,3.3085,1.6193.327,1.4272-1.8368,1.8765-2.8926,1.1748Z"/>\n  </g>\n  <path d="M981.9496,805.6408h0c.5075-.5075,1.3305-.5072,1.8383.0006l7.3508,7.3508c.5078.5078.508,1.3308.0006,1.8383h0c-.5075.5075-1.3305.5072-1.8383-.0006l-7.3508-7.3508c-.5078-.5078-.508-1.3308-.0006-1.8383Z" fill="#a6c5a1"/>\n  <path d="M978.8857,808.705h0c.5075-.5075,1.3305-.5072,1.8383.0006l4.5937,4.5937c.5078.5078.508,1.3308.0006,1.8383h0c-.5075.5075-1.3305.5072-1.8383-.0006l-4.5937-4.5937c-.5078-.5078-.508-1.3308-.0006-1.8383Z" fill="#a6c5a1"/>\n  <path d="M990.8765,804.3728h.5273c.5713,0,1.0352.4638,1.0352,1.0352v6.5925c0,.5717-.4641,1.0358-1.0358,1.0358h-.5273c-.5717,0-1.0358-.4641-1.0358-1.0358v-6.5913c0-.572.4644-1.0364,1.0364-1.0364Z" transform="translate(-281.5425 937.7055) rotate(-45)" fill="#a6c5a1"/>\n</svg>`;

  async function loadTemplateSvgText() {
    // Prefer file input if provided to avoid file:// CORS issues
    if (expTemplateFile && expTemplateFile.files && expTemplateFile.files[0]) {
      return await expTemplateFile.files[0].text();
    }
    // On file:// (local open), skip fetch to avoid CORS errors and use built-in template
    if (window.location && window.location.protocol === 'file:') {
      return DEFAULT_TEMPLATE_SVG;
    }
    // Fallback to relative fetch (requires http:// or proper app origin)
    const templatePath = 'template/a3-plan-quer.svg';
    try {
      const res = await fetch(templatePath, { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.text();
    } catch (e) {
      // Fallback to built-in minimal template to avoid blocking export
      return DEFAULT_TEMPLATE_SVG;
    }
  }

  async function makePdfFromTemplate(mapDataUrl, meta) {
    let svgText = await loadTemplateSvgText();
    // First, simple string replacements (catch easy cases)
    const replaceMap = {
      '{{Projektname}}': (meta && meta.projektname) || '',
      '{{KST}}': (meta && meta.kst) || '',
      '{{Datum}}': (meta && meta.datum) || '',
      '{{Auftraggeber}}': (meta && meta.auftraggeber) || '',
      '{{Ansprechpartner}}': (meta && meta.ansprechpartner) || '',
      '{{Baubeginn}}': (meta && meta.baubeginn) || '',
      '{{Bauende}}': (meta && meta.bauende) || '',
      '{{Projektbeschreibung}}': (meta && meta.beschreibung) || '',
      '{{TITLE}}': (meta && meta.projektname) || '',
    };
    Object.entries(replaceMap).forEach(([k, v]) => {
      svgText = svgText.split(k).join(v);
    });
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    const svgEl = svgDoc.documentElement;
    // Replace placeholders in text/tspan nodes (handles duplicates)
    const textEls = Array.from(svgEl.querySelectorAll('text, tspan'));
    for (let i = 0; i < textEls.length; i++) {
      const el = textEls[i];
      let t = el.textContent || '';
      Object.entries(replaceMap).forEach(([k, v]) => { if (t.includes(k)) t = t.split(k).join(v); });
      if (t !== el.textContent) {
        while (el.firstChild) el.removeChild(el.firstChild);
        el.appendChild(svgDoc.createTextNode(t));
      }
    }
    // Insert map image into MAP_FRAME
    const frame = svgEl.querySelector('#MAP_FRAME');
    if (!frame) throw new Error('MAP_FRAME nicht gefunden');
    const fx = parseFloat(frame.getAttribute('x') || '0');
    const fy = parseFloat(frame.getAttribute('y') || '0');
    const fw = parseFloat(frame.getAttribute('width') || '0');
    const fh = parseFloat(frame.getAttribute('height') || '0');
    const img = svgDoc.createElementNS('http://www.w3.org/2000/svg', 'image');
    img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', mapDataUrl);
    img.setAttribute('x', String(fx));
    img.setAttribute('y', String(fy));
    img.setAttribute('width', String(fw));
    img.setAttribute('height', String(fh));
    img.setAttribute('preserveAspectRatio', 'none');
    frame.parentNode.insertBefore(img, frame.nextSibling);
    frame.setAttribute('fill', 'none');
    // Serialize and rasterize
    let composed = new XMLSerializer().serializeToString(svgEl);
    // Final pass replacement on serialized string (safety net)
    Object.entries(replaceMap).forEach(([k, v]) => { composed = composed.split(k).join(v); });
    const viewBox = (svgEl.getAttribute('viewBox') || '').split(/\s+/).map(parseFloat);
    const vbW = viewBox[2] || 1190.55;
    const vbH = viewBox[3] || 841.89;
    const scale = 2.5;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(vbW * scale);
    canvas.height = Math.round(vbH * scale);
    const ctx = canvas.getContext('2d');
    const imgSvg = new Image();
    const svgBlob = new Blob([composed], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    await new Promise(res => { imgSvg.onload = res; imgSvg.src = url; });
    ctx.drawImage(imgSvg, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    const pageDataUrl = canvas.toDataURL('image/png');
    // PDF sized to template (A3 landscape in this file)
    const wmm = vbW * 25.4 / 72;
    const hmm = vbH * 25.4 / 72;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: [wmm, hmm], orientation: wmm >= hmm ? 'l' : 'p' });
    doc.addImage(pageDataUrl, 'PNG', 0, 0, wmm, hmm);
    const blob = doc.output('blob');
    return { blob };
  }

  function qpEncode1252(str) {
    if (!str) return '';
    let out = '';
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      const code = str.charCodeAt(i);
      if (ch === '\r' || ch === '\n') { out += ch; continue; }
      const safe = (code >= 33 && code <= 60 && code !== 61) || (code >= 62 && code <= 126);
      if (ch === ' ' || ch === '\t') { out += ch; continue; }
      if (safe) out += ch;
      else {
        const b = code <= 255 ? code : 63; // '?' fallback for unsupported chars
        out += `=${b.toString(16).toUpperCase().padStart(2, '0')}`;
      }
    }
    return out;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function toHtmlValue(str) {
    return escapeHtml(str || '').replace(/\r?\n/g, '<br>');
  }

  function buildEmailSubject(meta) {
    const m = meta || collectExportMeta();
    const base = (m && m.projektname) ? m.projektname : 'Planauskunft';
    const suffix = (m && m.kst) ? ` (${m.kst})` : '';
    const raw = `Planauskunft ${base}${suffix}`.replace(/\r?\n/g, ' ').trim() || 'Planauskunft';
    const qp = qpEncode1252(raw).replace(/ /g, '_');
    return `=?Windows-1252?Q?${qp}?=`;
  }

  function extractMainBoundary(tpl) {
    const match = tpl && tpl.match(/Content-Type:\s*multipart\/related;[\s\S]*?boundary="([^"]+)"/i);
    return match ? match[1] : null;
  }

  function wrapBase64Lines(str) {
    const out = [];
    for (let i = 0; i < str.length; i += 76) out.push(str.slice(i, i + 76));
    return out.join('\r\n');
  }

  function uint8ToBase64(bytes) {
    if (!bytes || !bytes.length) return '';
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary);
  }

  async function encodeAttachmentData(data) {
    if (!data) return '';
    try {
      if (data instanceof Blob) {
        const ab = await data.arrayBuffer();
        return uint8ToBase64(new Uint8Array(ab));
      }
      if (typeof data === 'string') {
        const bytes = new TextEncoder().encode(data);
        return uint8ToBase64(bytes);
      }
      if (data instanceof ArrayBuffer) return uint8ToBase64(new Uint8Array(data));
      if (ArrayBuffer.isView(data)) return uint8ToBase64(new Uint8Array(data.buffer));
    } catch (e) {
      console.warn('Attachment base64 encoding failed', e);
    }
    return '';
  }

  function getSelectionBoundsForPayload() {
    const b = expRect ? expRect.getBounds() : (map ? map.getBounds() : null);
    if (!b) return null;
    const toObj = (ll) => ({ lat: Number(ll.lat.toFixed(6)), lng: Number(ll.lng.toFixed(6)) });
    return {
      nw: toObj(b.getNorthWest()),
      ne: toObj(b.getNorthEast()),
      se: toObj(b.getSouthEast()),
      sw: toObj(b.getSouthWest()),
      center: toObj(b.getCenter()),
      zoom: map ? map.getZoom() : null,
    };
  }

  async function sendExportWebhook(opts) {
    const url = getWebhookUrl();
    if (!url) return;
    try {
      // Keep webhook payload small (no binary/base64) to avoid 413
      const attachmentsMeta = [];
      if (opts.pdfBlob) {
        attachmentsMeta.push({ filename: `${opts.baseName}.pdf`, mimeType: 'application/pdf', size: opts.pdfBlob.size ?? null });
      }
      if (opts.kmlText) {
        attachmentsMeta.push({ filename: `${opts.baseName}.kml`, mimeType: 'application/vnd.google-earth.kml+xml', size: opts.kmlText.length });
      }
      const payload = {
        event: 'trassify_export',
        project: opts.baseName,
        exportMode: opts.exportMode,
        meta: opts.meta,
        selection: getSelectionBoundsForPayload(),
        attachments: attachmentsMeta,
        attachmentsEmbedded: false,
        generatedAt: new Date().toISOString(),
      };
      const body = JSON.stringify(payload);
      // Versuch 1: normales JSON (kann an CORS scheitern)
      let sent = false;
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          mode: 'cors',
        });
        if (res && res.ok) {
          sent = true;
          console.info('Webhook gesendet (CORS OK)', res.status);
        } else {
          console.warn('Webhook antwortet nicht OK', res && res.status);
        }
      } catch (err1) {
        console.warn('Webhook CORS/Netz Fehler, versuche ohne CORS', err1);
      }
      // Versuch 2: no-cors Fallback (opaque, kein Status lesbar)
      if (!sent) {
        try {
          await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, // simple header -> kein Preflight
            body,
            mode: 'no-cors',
          });
          console.info('Webhook gesendet (no-cors Fallback, Status unbekannt)');
        } catch (err2) {
          console.warn('Webhook konnte nicht gesendet werden (Fallback)', err2);
        }
      }
    } catch (err) {
      console.warn('Webhook konnte nicht gesendet werden', err);
    }
  }

  async function buildEmailAttachmentsSection(attList, boundary) {
    if (!attList || !attList.length || !boundary) return '';
    const CRLF = '\r\n';
    const parts = [];
    for (const att of attList) {
      if (!att || !att.filename || !att.data) continue;
      const mime = att.mimeType || 'application/octet-stream';
      const b64 = await encodeAttachmentData(att.data);
      if (!b64) continue;
      const wrapped = wrapBase64Lines(b64);
      parts.push([
        `--${boundary}`,
        `Content-Type: ${mime};`,
        `\tname="${att.filename}"`,
        `Content-Description: ${att.filename}`,
        'Content-Disposition: attachment;',
        `\tfilename="${att.filename}"`,
        'Content-Transfer-Encoding: base64',
        '',
        wrapped,
        '',
      ].join(CRLF));
    }
    return parts.join('') + (parts.length ? CRLF : '');
  }

  const EMAIL_TEMPLATE_FALLBACK = `Subject:
\t{{SUBJECT}}
Thread-Topic:
\t{{SUBJECT}}
Thread-Index: AQHcYHli5f3rr7KzGEip0ffJdLcOsw==
Date: Fri, 28 Nov 2025 15:12:18 +0000
Message-ID:
\t<BEYP281MB551141F42E2C1CFC0CDF616FBDDCA@BEYP281MB5511.DEUP281.PROD.OUTLOOK.COM>
Content-Language: de-DE
X-MS-Has-Attach: yes
X-MS-TNEF-Correlator:
X-MS-Exchange-Organization-RecordReviewCfmType: 0
Content-Type: multipart/related;
\tboundary="_004_BEYP281MB551141F42E2C1CFC0CDF616FBDDCABEYP281MB5511DEUP_";
\ttype="multipart/alternative"
MIME-Version: 1.0

--_004_BEYP281MB551141F42E2C1CFC0CDF616FBDDCABEYP281MB5511DEUP_
Content-Type: multipart/alternative;
\tboundary="_000_BEYP281MB551141F42E2C1CFC0CDF616FBDDCABEYP281MB5511DEUP_"

--_000_BEYP281MB551141F42E2C1CFC0CDF616FBDDCABEYP281MB5511DEUP_
Content-Type: text/plain; charset="Windows-1252"
Content-Transfer-Encoding: quoted-printable

Sehr geehrte Damen und Herren,

hiermit bitten wir Sie um Planauskunft f=FCr folgendes Vorhaben:
Projektname:
{{PROJECT_NAME}}
KST:
{{KST}}
Projektlage:
{{DESCRIPTION_PLAIN}}
Auftraggeber:
{{CLIENT}}
Ansprechpartner Bauleitung:
{{CONTACT}}
Baubeginn:
{{START_DATE}}

Wenn Sie noch weitere Betreiber kennen, die relevante Leitungen oder Anlage=
n betreiben k=F6nnten, bitte ich h=F6flich um Nennung =96 bestenfalls gleic=
h mit Kontaktdaten.
Insbesondere lokale Antennengemeinschaften oder Erzeuger erneuerbarer Energ=
ien entgehen teilweise unseren Recherchen.

Bei Fragen und Anliegen hierzu kommen Sie gerne auf mich zu.

Vielen Dank vorab und viele Gr=FC=DFe!


--


Tomer Maith

Trassify GmbH

Ostparkstr. 37, 60385 Frankfurt am Main, Deutschland

Mobile: +49 176/76703119

maith@trassify.de<mailto:maith@trassify.de> | www.t<https://www.trassify.de=
/>rassify.de<https://www.trassify.de/>



[cid:466392C6-756C-4845-8223-A5FC2D08083C]<http://www.trassify.de/>

Trassify GmbH | HRB 137523 | Amtsgericht Frankfurt a.M. | Gesch=E4ftsf=FChr=
ung: Lukas Ikenmeyer, Liron Schwick

--_000_BEYP281MB551141F42E2C1CFC0CDF616FBDDCABEYP281MB5511DEUP_
Content-Type: text/html; charset="Windows-1252"
Content-Transfer-Encoding: quoted-printable

<html>
<head>
<meta http-equiv=3D"Content-Type" content=3D"text/html; charset=3DWindows-1=
252">
</head>
<body>
<p dir=3D"ltr" class=3D"MsoNormal" style=3D"text-align: left; text-indent: =
0px; margin: 0cm;">
<span style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; font-siz=
e: 11pt; color: rgb(64, 64, 64);">Sehr geehrte Damen und Herren,</span></p>
<p class=3D"MsoNormal" style=3D"text-align: left; text-indent: 0px; margin:=
 0cm;"><span style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; f=
ont-size: 11pt; color: rgb(64, 64, 64);">&nbsp;</span></p>
<p class=3D"MsoNormal" style=3D"text-align: left; text-indent: 0px; margin:=
 0cm 0cm 12pt;">
<span style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; font-siz=
e: 11pt; color: rgb(64, 64, 64);">hiermit bitten wir Sie um Planauskunft f=
=FCr folgendes Vorhaben:&nbsp;</span></p>
<table class=3D"MsoNormalTable" cellspacing=3D"0" cellpadding=3D"0" style=
=3D"text-align: left; color: rgb(33, 33, 33); box-sizing: border-box; borde=
r-collapse: collapse; border-spacing: 0px;">
<tbody>
<tr>
<td class=3D"MsoNormalTable" style=3D"text-align: left; border-width: 1pt m=
edium medium 1pt; border-style: solid none none solid; border-color: window=
text currentcolor currentcolor windowtext; padding: 0cm 5.4pt; vertical-ali=
gn: top; width: 198.05pt;">
<p class=3D"MsoNormal" style=3D"text-align: left; margin: 0cm; font-family:=
 Aptos, sans-serif; font-size: 12pt;">
<span style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; font-siz=
e: 11pt; color: rgb(64, 64, 64);">Projektname:</span></p>
</td>
<td class=3D"MsoNormalTable" style=3D"text-align: left; border-width: 1pt 1=
pt medium medium; border-style: solid solid none none; border-color: window=
text windowtext currentcolor currentcolor; padding: 0cm 5.4pt; vertical-ali=
gn: top; width: 659.15pt;">
<p class=3D"MsoNormal" style=3D"text-align: left; margin: 0cm 0cm 12pt;"><s=
pan style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; font-size:=
 11pt; color: rgb(64, 64, 64);">{{PROJECT_NAME_HTML}}</span></p>
</td>
</tr>
<tr>
<td class=3D"MsoNormalTable" style=3D"text-align: left; border-width: mediu=
m medium medium 1pt; border-style: none none none solid; border-color: curr=
entcolor currentcolor currentcolor windowtext; padding: 0cm 5.4pt; vertical=
-align: top; width: 198.05pt;">
<p class=3D"MsoNormal" style=3D"text-align: left; margin: 0cm; font-family:=
 Aptos, sans-serif; font-size: 12pt;">
<span style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; font-siz=
e: 11pt; color: rgb(64, 64, 64);">KST:</span></p>
</td>
<td class=3D"MsoNormalTable" style=3D"text-align: left; border-width: mediu=
m 1pt medium medium; border-style: none solid none none; border-color: curr=
entcolor windowtext currentcolor currentcolor; padding: 0cm 5.4pt; vertical=
-align: top; width: 659.15pt;">
<p class=3D"MsoNormal" style=3D"text-align: left; margin: 0cm 0cm 12pt;"><s=
pan style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; font-size:=
 11pt; color: rgb(64, 64, 64);">{{KST_HTML}}</span></p>
</td>
</tr>
<tr>
<td class=3D"MsoNormalTable" style=3D"text-align: left; border-width: mediu=
m medium medium 1pt; border-style: none none none solid; border-color: curr=
entcolor currentcolor currentcolor windowtext; padding: 0cm 5.4pt; vertical=
-align: top; width: 198.05pt;">
<p class=3D"MsoNormal" style=3D"text-align: left; margin: 0cm; font-family:=
 Aptos, sans-serif; font-size: 12pt;">
<span style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; font-siz=
e: 11pt; color: rgb(64, 64, 64);">Projektlage:</span></p>
</td>
<td class=3D"MsoNormalTable" style=3D"text-align: left; border-width: mediu=
m 1pt medium medium; border-style: none solid none none; border-color: curr=
entcolor windowtext currentcolor currentcolor; padding: 0cm 5.4pt; vertical=
-align: top; width: 659.15pt;">
<p class=3D"MsoNormal" style=3D"text-align: justify; margin: 0cm 0cm 12pt; =
font-family: Aptos, sans-serif; font-size: 12pt;">
<span style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; font-siz=
e: 11pt; color: rgb(64, 64, 64);">{{DESCRIPTION_HTML}}</span></p>
</td>
</tr>
<tr>
<td class=3D"MsoNormalTable" style=3D"text-align: left; border-width: mediu=
m medium medium 1pt; border-style: none none none solid; border-color: curr=
entcolor currentcolor currentcolor windowtext; padding: 0cm 5.4pt; vertical=
-align: top; width: 198.05pt;">
<p class=3D"MsoNormal" style=3D"text-align: left; margin: 0cm; font-family:=
 Aptos, sans-serif; font-size: 12pt;">
<span style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; font-siz=
e: 11pt; color: rgb(64, 64, 64);">Auftraggeber:</span></p>
</td>
<td class=3D"MsoNormalTable" style=3D"text-align: left; border-width: mediu=
m 1pt medium medium; border-style: none solid none none; border-color: curr=
entcolor windowtext currentcolor currentcolor; padding: 0cm 5.4pt; vertical=
-align: top; width: 659.15pt;">
<p class=3D"MsoNormal" style=3D"text-align: left; margin: 0cm 0cm 12pt;"><s=
pan style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; font-size:=
 11pt; color: rgb(64, 64, 64);">{{CLIENT_HTML}}</span></p>
</td>
</tr>
<tr>
<td class=3D"MsoNormalTable" style=3D"text-align: left; border-width: mediu=
m medium medium 1pt; border-style: none none none solid; border-color: curr=
entcolor currentcolor currentcolor windowtext; padding: 0cm 5.4pt; vertical=
-align: top; width: 198.05pt;">
<p class=3D"MsoNormal" style=3D"text-align: left; margin: 0cm; font-family:=
 Aptos, sans-serif; font-size: 12pt;">
<span style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; font-siz=
e: 11pt; color: rgb(64, 64, 64);">Ansprechpartner Bauleitung:</span></p>
</td>
<td class=3D"MsoNormalTable" style=3D"text-align: left; border-width: mediu=
m 1pt medium medium; border-style: none solid none none; border-color: curr=
entcolor windowtext currentcolor currentcolor; padding: 0cm 5.4pt; vertical=
-align: top; width: 659.15pt;">
<p class=3D"MsoNormal" style=3D"text-align: left; margin: 0cm 0cm 12pt;"><s=
pan style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; font-size:=
 11pt; color: rgb(64, 64, 64);">{{CONTACT_HTML}}</span></p>
</td>
</tr>
<tr>
<td class=3D"MsoNormalTable" style=3D"text-align: left; border-width: mediu=
m medium 1pt 1pt; border-style: none none solid solid; border-color: curren=
tcolor currentcolor windowtext windowtext; padding: 0cm 5.4pt; vertical-ali=
gn: top; width: 198.05pt;">
<p class=3D"MsoNormal" style=3D"text-align: left; margin: 0cm; font-family:=
 Aptos, sans-serif; font-size: 12pt;">
<span style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; font-siz=
e: 11pt; color: rgb(64, 64, 64);">Baubeginn:</span></p>
</td>
<td class=3D"MsoNormalTable" style=3D"text-align: left; border-width: mediu=
m 1pt 1pt medium; border-style: none solid solid none; border-color: curren=
tcolor windowtext windowtext currentcolor; padding: 0cm 5.4pt; vertical-ali=
gn: top; width: 659.15pt;">
<p class=3D"MsoNormal" style=3D"text-align: left; margin: 0cm 0cm 12pt; fon=
t-family: Aptos, sans-serif; font-size: 12pt;">
<span style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; font-siz=
e: 11pt; color: rgb(64, 64, 64);">{{START_DATE_HTML}}</span></p>
</td>
</tr>
</tbody>
</table>
<p class=3D"MsoNormal" style=3D"text-align: left; text-indent: 0px; margin:=
 0cm;"><span style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; f=
ont-size: 11pt; color: rgb(64, 64, 64);"><br>
Wenn Sie noch weitere Betreiber kennen, die relevante Leitungen oder Anlage=
n betreiben k=F6nnten, bitte ich h=F6flich um Nennung =96 bestenfalls gleic=
h mit Kontaktdaten.&nbsp;<br>
Insbesondere <b>lokale Antennengemeinschaften </b>oder <b>Erzeuger erneuerb=
arer Energien</b>&nbsp;entgehen teilweise unseren Recherchen. &nbsp;&nbsp;<=
br>
<br>
Bei Fragen und Anliegen hierzu kommen Sie gerne auf mich zu.&nbsp;<br>
<br>
Vielen Dank vorab und viele Gr=FC=DFe!</span></p>
<div id=3D"ms-outlook-mobile-signature">
<p style=3D"text-align: left; text-indent: 0px; background-color: white; ma=
rgin: 0cm;">
<span style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; font-siz=
e: 10pt; color: black;"><b><br>
</b></span></p>
<p style=3D"text-align: left; text-indent: 0px; background-color: white; ma=
rgin: 0cm;">
<span style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; font-siz=
e: 10pt; color: black;"><b>--</b></span></p>
<p style=3D"text-align: left; text-indent: 0px; background-color: white; ma=
rgin: 0cm;">
<span style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; font-siz=
e: 10pt; color: black;"><b><br>
</b></span></p>
<p style=3D"text-align: left; text-indent: 0px; background-color: white; ma=
rgin: 0cm;">
<span style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; font-siz=
e: 10pt; color: black;"><b>Tomer Maith</b></span></p>
<p style=3D"text-align: left; text-indent: 0px; background-color: white; ma=
rgin: 0cm;">
<span style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; font-siz=
e: 10pt; color: black;">Trassify GmbH</span></p>
<p style=3D"text-align: left; text-indent: 0px; background-color: white; ma=
rgin: 0cm;">
<span style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; font-siz=
e: 10pt; color: black;">Ostparkstr. 37, 60385 Frankfurt am Main, Deutschlan=
d</span></p>
<p style=3D"text-align: left; text-indent: 0px; background-color: white; ma=
rgin: 0cm;">
<span style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; font-siz=
e: 10pt; color: black;">Mobile:
</span><span style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; f=
ont-size: 10pt; color: rgb(117, 120, 123);">+49 176/76703119</span></p>
<p style=3D"text-align: left; text-indent: 0px; background-color: white; ma=
rgin: 0cm;">
<span style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; font-siz=
e: 13px; color: rgb(166, 196, 161);"><a href=3D"mailto:maith@trassify.de" d=
ata-outlook-id=3D"8e402631-46c1-4d6d-a0ec-a39fa8f313c3" style=3D"margin-top=
: 0px; margin-bottom: 0px;">maith@trassify.de</a></span><span style=3D"font=
-family: &quot;Calibri Light&quot;, sans-serif; font-size: 13px; color: rgb=
(117, 120, 123);">&nbsp;|
</span><span style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; f=
ont-size: 13px; color: rgb(166, 196, 161);"><a href=3D"https://www.trassify=
.de/" data-outlook-id=3D"8c387682-cd7a-4aa2-b688-79e1e00aa1cf" style=3D"mar=
gin-top: 0px; margin-bottom: 0px;">www.t</a><a href=3D"https://www.trassify=
.de/" data-outlook-id=3D"24cf7312-0082-4b01-9b78-0488a28f7a29" style=3D"mar=
gin-top: 0px; margin-bottom: 0px;">rassify.de</a></span></p>
<p style=3D"text-align: left; text-indent: 0px; background-color: rgb(255, =
255, 255); margin: 0cm;">
<span style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; font-siz=
e: 12pt; color: rgb(64, 64, 64);">&nbsp;</span></p>
<p style=3D"text-align: left; text-indent: 0px; background-color: rgb(255, =
255, 255); margin: 0cm;">
<span style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; font-siz=
e: 12pt; color: rgb(64, 64, 64);"><a href=3D"http://www.trassify.de/" targe=
t=3D"_blank" title=3D"http://www.trassify.de/" rel=3D"noopener noreferrer" =
data-auth=3D"NotApplicable" data-linkindex=3D"2" data-outlook-id=3D"93a3b42=
4-289d-46e7-b13f-dbc9033d7660" style=3D"margin: 0px;"><img src=3D"cid:46639=
2C6-756C-4845-8223-A5FC2D08083C" id=3D"x_Bild_x0020_1" data-custom=3D"AAkAL=
gAAAAAAHYQDEapmEc2byACqAC%2FEWg0AF4OSmR1NZEir6RRRicUscwAABWl0%2BAAAARIAEABD=
l9zy0hC9Tq7CTs3zca2K" data-imagetype=3D"AttachmentByCid" width=3D"220" heig=
ht=3D"36" style=3D"width: 2.302in; height: 0.3854in; max-width: 382px; min-=
width: auto; min-height: auto; margin: 0px; vertical-align: top;"></a><br>
<br>
</span><span style=3D"font-family: &quot;Calibri Light&quot;, sans-serif; f=
ont-size: 8pt; color: rgb(64, 64, 64);">Trassify GmbH | HRB 137523 | Amtsge=
richt Frankfurt a.M. | Gesch=E4ftsf=FChrung: Lukas Ikenmeyer, Liron Schwick=
</span></p>
</div>
</body>
</html>

--_000_BEYP281MB551141F42E2C1CFC0CDF616FBDDCABEYP281MB5511DEUP_--

--_004_BEYP281MB551141F42E2C1CFC0CDF616FBDDCABEYP281MB5511DEUP_
Content-Type: application/octet-stream;
\tname="img-63718d35-9fbd-48e2-b744-fc08859f4e87"
Content-Description: img-63718d35-9fbd-48e2-b744-fc08859f4e87
Content-Disposition: inline;
\tfilename="img-63718d35-9fbd-48e2-b744-fc08859f4e87"; size=4945;
\tcreation-date="Fri, 28 Nov 2025 15:12:22 GMT";
\tmodification-date="Fri, 28 Nov 2025 15:12:22 GMT"
Content-ID: <466392C6-756C-4845-8223-A5FC2D08083C>
Content-Transfer-Encoding: base64

iVBORw0KGgoAAAANSUhEUgAAAN0AAAAlCAYAAADGBexuAAAAAXNSR0IArs4c6QAAEZFJREFUeF7t
nQt4HNdVx/8r7eysHivJTvogBQottIWmQEt4RVbSR1KngZBSaMB6WYo/cPxIgEIplJIW4rS0JRT8
Cm6bSLIlJXFoDAVaSAHXtmRaCO8CBQqUZ2lDIsmr1T6lZX/SjH01nt2dfUSW7D3fly+fZ+/cuXPm
/u8553/OvQqpIQ0N1K6B75D01ZL+UdLfV9Ddt0v6TkkvltQmaV7SFyV9RtJfV9DPhmoa2lCjbQx2
vWkgLOmgpJ3OwNKSfknSe8sM9PskvUPSliLt8pI+Len9kv5gvb10rePZyKBrLnyUFkm8Ax+pFmmS
lJGUqqWTK/DebZImfd77ekl/UkQfgPIXAuqK7/qzkj4QsP2GaLaRQfdqSY/VScuAjkkyUKf+rpRu
PizpR31e9mcK7uIHfa7vKLihH61COXdIeryK+9blLRsZdN2Spuqo1c9K+u469ncldPWLku71eVEW
r3HP9S5JfyPpazzXsWbEb/8j6UWSvsXxXsxmxIqvkbRwOSi1LqCbfGry6viX4gs7b9sZWCn7P7G/
I9YSaxp+3fBslYr8Hklnq7zX77ZThTjitXXs70ro6iWSTkr6WuNlWbxukeT9rtsljXqU8gXHUqJ7
wIfHcaOkQwUv5ps8bd8i6cTloNSaQDf22bGrrEU9YEUiN+WXluaz6ezhvp6h/aUUc/z4W5sz17zp
3ohlDzY1hUKZ3OLH/m9m5p333HoPQXglQhB+ppIbyrT9c0nX1bG/K6WrlxcA9hOOBfs7SQ9I+orP
yx+T1G9cz0n6XklP+rS9QdIfSYKoceWApHsuB6XWBLqJqdGxq19w1WB8bl7N4WY1NTUpHp/f1989
VDRQHj81umfT87sOppNp5fN5RVttnZuJP/H07GxvhcB7WWF1fLfzEbxECv/mw5krME1Zlf/LWVHN
78fHxfUpx7pdDt/8Ur3DdAFgECyu4FJ+W5HB8D3+xfP9YDNfd6kGX8/nVg264yePt+ciyc/bUftF
6dSKkQqHm2VFLC0sLLy3r3v45/0GOjl19JOxrrZbACoSCoXUFmtVIp440Tk7t+3Wyi1eMX08IulH
PD/iPuLKVCro6eucmKO1QHcnnRjk3woxzVKlnTnt253+XiDJdtyx/5D05Sr7W8+3wTT/laRrjUH+
niRSB8XkN5wc3qIk7v9LSRAxG16qBt2Rp45Y7emWz7THWl6TiF8I5bB4ETuiZHzh/t6eoXd5NTQx
PTrStblraO7ZufM/rQCvTYn4/BOds3O9dQIebNcPeZ5PrFFJ3mezJGKRXkm4UTGjP1aNf5Z0vOBa
PSTp6YCz4Q1On7jHAA4QI4CXOOhzTp9HJcUD9nmpmkUk4fYR2zF+wIHLD8FiCu0AnRmn/Xbh2ptL
DJz4jv/wWty0EAD8KkmHnWQ6v/FMSBtvvOjtmnbcZ44Vxjpo+qJuOq4adIxg8uyxN0cizSfyeSmb
zq6oBi0AvIilRCL5vv4tQ+80R/vo9NFr1Rw6bduRTcmFC2kxgNcaa9VCPHmic3amHhbPD3RvKjCU
vx9QexA1HylQ1a8M0B527ccknS7R9hpJvyrphwP0RxNIBibEowHb04zKEHe8/1QD0fQ8py8WnYST
Tvlfn3FEC+/zD44X4P5MjLbVB3RYqm82rkOKQI5UKt/gLHbmfej1p8p0BOhYJL/eaMf3grhZU6kJ
dIz06KnRPdGodTDUFFI2kz0/eNfiLcwn7uvbMryKVh4/NfrGSNR6NBwJb0p5gNfW0ab5eOJjMSs5
eNt1wdlQH63VAjomLoE8liioPFNY5bFifuVL0OBPSHpp0M6Mdm+X9Ctl7uuQhDsGoLEOrvyhpGEn
jg366KFCpLDPcX3de4iD9xRo+497OgF0f+ZxG3+roIMfCAA64uu7HEtVbB5yHVLG9CKwVACYd3aF
WNw3nDHauC7qq4xrn5R0a1DF1KtdINAd/9y7I/n4S7daUXvzzPz8mR09O/7VHMD4mbHdtm0dVEgh
L/CI8ZILyX19HnJl4sxDN4Uj9nHLAnjp81bStXiJucSJeDTVv7N64FULOiYtH+ONRZTMyk+doJ8Q
L77eE+fhDrGiskL7CeaeahhzEnnbwdrhxhUTJhxA8RPSKqzmsIXlBPcP99YErnsPseYrPKkA3EZA
x6LiSlDQ4RriLpabg/d53NXLH3RHPnWks6PNfrQt1n5LKNSkZCI5k05l7xq4cYhY5ryMnxnZbUdt
6vAuAh6u5sJ8cl9fz2pW0wHe45ZldaWSq13NFXIleSIbzw8Mbh1kolcq1YLOL+mOCSceIM6akdTp
xHl3S2K1N4UJbrqZDzvWxjt+3EbIHgqE6R/3E/eX1R/3zitYsVU6NxpQ5VGKZKCGkXKqcnKTpE+V
aPQeDwAowwOkAKFS0JUbi/s7oDM9pcsfdJNnxnZ3Pq/zUHwmrqWlJdkttpZyS9lUOrN9oGeISbMK
eJFI5JCfq2lFwkouZPb1dQ+uClyPfXrk5kiL9ZhlWZu8wFuJ8RInsvGvDAxufXulwKsWdHxkLwH0
tgLQPuQzS/b6WKD7jfuxAFgCLIIrWDUA4q3YcH8nFYIr6o0lYasgHvxAgVUuRxDxXlhDnl9MNkmC
2vcmpt32sLaUfU04F/p83iOopWuArpgGJqfHHujo6njb3MzcMr0PlxSJRpRfWsplUpmBvhuGVwX6
5OHs1giuUMhLrpR2NSOPW1akK7mQXHmOk04AeKQTci8JDQy+sCKLVy3ofsdDZUMgfKOz7cSrJlZ6
SBSztMmkwrEMbi7RvRdAA8xSQl0pbqHXimJlv79I+RtgYEHzllmZz6FsjhiRrTPFhIXiSJmSuN91
Uhtv9XGLg4IOtpNcUzn3El2ZrvOVYOlGbmtpb/14JpPVYg4XfIXEBXhL+aVsNpkZ9AIP6xi2w4dQ
Zy5zIZRwWU0/V/PY1MjNtmUdD0esrmQiJQd3ywCMdbbr3Gz8QG/39koqEqoFHXEZiXVXoMDNf3sn
K65kj3HRTPoyyXFXXflvJy5aSVKWFm8Fh9saYgE38G99bsdSkRYhHQH7SnHAVZ52fBCIh1928o1+
oyCmu9kZ+3c5Y/YWGhQbfVDQQVTd6ak68fYJIJ91XHr3t8sfdPl8PjQxNXqgoyu2Z2E+uexiumLZ
FgtVJjWfHBp47Z2rXM1jpx/eG43aB1jIstkLrCYJ9LAT4/V7Yrzxs6NvsJrDT1iW1WFaPPJ+mXTm
3OJi0ysGbhj4UrnZ6vxeDehguHAHsTSufMIpVyr2WNgvLCGKYbJiGdn9QP4NK8jmTleIyYKmDMgN
um6c99kk0SmhIp4qJVg9NonSFxbSLKticcCC/GYAfRLD4u7e5vRVCoBBQVdtyuDyB537QSbOjB5u
72zbhRU6DzzX1czn0+mF9J39Nw6v2ls1fuqhPZGW6MGQB3hYvOXKlfnE/f09d66Kn7B4kbD1WMS2
NvEsrCXgzqay8yHlXr5tyw6q0YNINaADNICOinZXyOtBcFQqpBsAHRPWFepSfzxgR+VIDWh8YqpS
uUHzUdSVEptSpWO6dDC1kEQsLkGqa17o1FqyfcfPNQwKOtIPtwfUhdnMD3RmHF2sy42VMuAt8nmF
Hjk7drAt1rr7IuC1EOPl09lsZrj3eg+5cnrkbjtq71cor6zharoWL5lI3de3ZfuqPN7YyYduammN
PtbW0bo5l83JjtqaefrZB7d1D+2u4COtB9CRoDZTAVTPQ74EEUqkiC9LCZQvxQcPVrABl1wibCZH
JZjC7gCqOsjtkZgvJyS2R2qI6aoFHZ4DebqrjQGyd49FoJRQasd9Jkm0fvN05ptMTI8ebo+178L9
W1p0FkbD4mWS6SFvjHds6uG9UTt6IK+8cuncqsqVYuTKI6c++urmaMtPNoWbrlnMLT4525z40M7r
dl7wU8tNiZVNj94ysHIVKfW0dLiXuH9mBQTkiBnjlXqLn6ugAJtibVITkDhBAMPYftpJI0AGmULp
GTWllG1BuJDE/nyRgbJzHBbWzOs915bOb18eZB5jKSXPd76HmY6BEMJlXlMpxxz5DSY0Oe1YvIXU
eeBRCmZDriwtpdPp7PBF6QQsXktk/3KM56lcAXjpROq+bR6LV6MmLjXoGD70Pm6iK5AYlGoxoUsJ
3wXLQ1tTYPuwLqRPYA69sRWW70+dom7SDuWe860Ok0p8WEzoE1KHMitvLShBPdt5iGldea5Bh5vI
4kWs6sq/OzFnqbQSrixjM6VcvF7jFPS/vRrQLfc0cfbowVh7656FhEGuOBZvcXEpk8mkhwZ6POTK
1NjeqG0tV1b4lYydO5e4d/sNw+ST6iHrAXR+KQNiMGoTS53Hgsvol1YAcDB+CDEjJEixw33Ix1G6
FeR4BFxF4rpSZW/ms93vg8sGyKupSKnWveTZv+YTG3sT9+Ycwpqjd+9+yXI7HeoxDy/qo2rQLQNv
avTBWGf7XcvAM13NlRgvm0lnt/Zt2Y57cl7GT4/c3dLWsn9xcVHEa66ErTBVZPlsNtvd27292KE2
lShhPYCOWktcP3cngTt+ioLZ+EmxsCm4TlS5cHiPn/AbVT+u0P9flCgho1yP0q0gbjluL/GcNzfo
Puucc1SeuSO8ltrLWkBHXMpYvYLeWDzM7VEAjRiW8jyvlNvpUMl8C9y2JtAtA2/66OH2WOvqGK9Q
odve2a75ufmTvd3bL3rZienRe+xo9NeXDOCxobVzU4dmZ8+9o797qB6nP60H0KEi8mEcN+cVXDVy
guTbcBuh95lM7NtDAArW0NxONOi4emZfJN9Z5f2E6hLK0pwEa9l5AbOKFfETXDj2w5k5xksFOuYt
eT6/Ta0Ajlga3UG2wETjBvvJxgTdMvCmRh5s72i/y2Q1oy1RJZOpL/ReP/iyUCh00RF5x6bG9ra2
2gfyS3lycMvbgVrbWjU3E39Lf8/2epyFsV5Ax2ZVVvVKdz2zYjPJzcQ8e/uo/zQF1wlWlKMQzMmF
t0AdJ5a2EnmfY4VNi0dulLMtvWzqpQId74NucBkpCAgiVPPgcpsu9MYFHW88Pj1yqLOrc3cmlVl2
NWObYnrmy88c7NsyhEvkKxPTo7tsO/p+O2rFcrlFJRML4+HO1h13XHtHqfrAIAqmDfHOD3oaB2Ev
n/Ikx6lppMqjFsFtJGFebOeCt28AQ+DPpKCyxBU/0Lm/cfQBdDhxFm4l1TBB8m5+70UinJPRyDFi
Of64ADq/ogRAh77MOlG/iey3iRUAk7CvRdAnaQ52cpQSLD3sJjGuuX+uHmOoePw1u5fmEx85M/qu
5mhkV1MoFM1ls08u5pp39/X0scIUlcmp0VdGo3ZPKpn6Ym/PcNANpkFeFDrYy8pBD3O9mEB9U/XP
LnFX6nVKGKwbcRx5OteF9I6DIJcCA9rgfkLVm2OhvjIIMRJEP/VoA+jQl5kW8VukAB05S45PdwVm
N+giVGqsbJmiwIL0kN+WKypvyOERR3P4lFn4UEtcWbX+6go6RjFycqRr89Wb7dtfdfulPuuDmkEm
g0siACjckVLjQh/EVeyYZnWkbOo/a9iB7fdhcIdwNanXxEViQmJFABiTAGLEFeJh4hJ3LKQROOt/
vQgLCe9i6osSNS8Rhu7RK+/uvotfu1reC/Dxzfk/Lj3fmXgZIg/Pye+cliD5vVrG5Htv3UFX9xE2
OmxooD4aIDlOTtGsZKmkQqg+owiwraJuD2p01NBAnTSA1cSdNF10dm+UO2CIo9m9x/BDNLGNaU2l
YenWVN2Nh9VJA3475Slr46BbP6FekxiSnKUruJwQQEHK5uo07JVuGqCrqzobna2RBgAPJW4wtaaw
FQoiit0dkFLkOKnYoYTNe0YNVs97LuqaDL8BujVRc+Mhz4EGcDGLlQwCOCyZ+6fUvI+HUScVAzjX
XBqgW3OVNx5YRw1QEkfurRKhjI2NxH5/Q6GSfqpu2wBd1apr3LhONLDLOffFzBUWGxo5RIrJzbTM
mr9GA3RrrvLGA58DDZAnZNMvuUC2GbFnjhwrBQYwmyTI2VFQz7/yVPVr/D8FWj1xQx/1bgAAAABJ
RU5ErkJggg==

--_004_BEYP281MB551141F42E2C1CFC0CDF616FBDDCABEYP281MB5511DEUP_--`;

  async function buildEmailTemplate(meta, attachments) {
    const m = meta || collectExportMeta();
    const assemble = async (tplSource) => {
      const boundary = extractMainBoundary(tplSource);
      const attSection = await buildEmailAttachmentsSection(attachments, boundary);
      return replaceEmailPlaceholders(tplSource, m, attSection, boundary);
    };
    // Avoid file:// CORS errors: use built-in template when opened locally
    if (window.location && window.location.protocol === 'file:') {
      const tpl = EMAIL_TEMPLATE_FALLBACK;
      return tpl ? await assemble(tpl) : null;
    }
    try {
      const res = await fetch('template/email-template.emltpl', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const tpl = await res.text();
      return await assemble(tpl);
    } catch (e) {
      console.warn('Email-Template konnte nicht geladen werden, nutze Fallback', e);
      const tpl = EMAIL_TEMPLATE_FALLBACK;
      return tpl ? await assemble(tpl) : null;
    }
  }

  function replaceEmailPlaceholders(tpl, m, attachmentsSection, boundary) {
    const fallbackDesc = (m && m.beschreibung && m.beschreibung.trim()) ? m.beschreibung.trim() : 'Siehe Datei anbei';
    const rep = {
      '{{SUBJECT}}': buildEmailSubject(m),
      '{{PROJECT_NAME}}': qpEncode1252(m.projektname || 'Projekt'),
      '{{PROJECT_NAME_HTML}}': qpEncode1252(toHtmlValue(m.projektname || 'Projekt')),
      '{{KST}}': qpEncode1252(m.kst || ''),
      '{{KST_HTML}}': qpEncode1252(toHtmlValue(m.kst || '')),
      '{{DESCRIPTION_PLAIN}}': qpEncode1252(fallbackDesc),
      '{{DESCRIPTION_HTML}}': qpEncode1252(toHtmlValue(fallbackDesc)),
      '{{CLIENT}}': qpEncode1252(m.auftraggeber || ''),
      '{{CLIENT_HTML}}': qpEncode1252(toHtmlValue(m.auftraggeber || '')),
      '{{CONTACT}}': qpEncode1252(m.ansprechpartner || ''),
      '{{CONTACT_HTML}}': qpEncode1252(toHtmlValue(m.ansprechpartner || '')),
      '{{START_DATE}}': qpEncode1252(m.baubeginn || ''),
      '{{START_DATE_HTML}}': qpEncode1252(toHtmlValue(m.baubeginn || '')),
      '{{END_DATE}}': qpEncode1252(m.bauende || ''),
      '{{END_DATE_HTML}}': qpEncode1252(toHtmlValue(m.bauende || '')),
      '{{ATTACHMENTS}}': attachmentsSection || '',
    };
    let out = tpl;
    Object.entries(rep).forEach(([k, v]) => { out = out.split(k).join(v); });
    if (attachmentsSection && !tpl.includes('{{ATTACHMENTS}}')) {
      const closingBoundary = boundary ? `--${boundary}--` : null;
      if (closingBoundary && out.includes(closingBoundary)) {
        out = out.replace(closingBoundary, `${attachmentsSection}${closingBoundary}`);
      } else {
        out += attachmentsSection;
      }
    }
    return out;
  }

  // Export selection with fixed aspect ratio

  function computeFixedFrameBounds() {
    const size = map.getSize();
    const cx = size.x / 2;
    const cy = size.y / 2;
    const targetScale = 0.7; // fill ~70% der kleineren Kante
    const widthPx = Math.min(size.x * targetScale, size.y * targetScale * expAspect);
    const heightPx = widthPx / expAspect;
    const p1 = L.point(cx - widthPx / 2, cy - heightPx / 2);
    const p2 = L.point(cx + widthPx / 2, cy + heightPx / 2);
    const nw = map.containerPointToLatLng(p1);
    const se = map.containerPointToLatLng(p2);
    return L.latLngBounds(nw, se);
  }

  function updateExportMask() {
    if (!exportMaskEl || !expRect) {
      if (exportMaskEl) exportMaskEl.classList.remove('visible');
      return;
    }
    const b = expRect.getBounds();
    const p1 = map.latLngToContainerPoint(b.getNorthWest());
    const p2 = map.latLngToContainerPoint(b.getSouthEast());
    const size = map.getSize();
    const left = Math.max(0, Math.min(p1.x, p2.x));
    const right = Math.max(0, size.x - Math.max(p1.x, p2.x));
    const top = Math.max(0, Math.min(p1.y, p2.y));
    const bottom = Math.max(0, size.y - Math.max(p1.y, p2.y));
    exportMaskEl.style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px)`;
    exportMaskEl.classList.add('visible');
  }

  function updateFixedExportFrame() {
    if (!expRect) return;
    const b = computeFixedFrameBounds();
    expRect.setBounds(b);
    updateExportMask();
  }

  function attachFrameListeners() {
    if (exportFrameListenersAttached) return;
    map.on('moveend zoomend resize', updateFixedExportFrame);
    exportFrameListenersAttached = true;
  }

  function detachFrameListeners() {
    if (!exportFrameListenersAttached) return;
    map.off('moveend zoomend resize', updateFixedExportFrame);
    exportFrameListenersAttached = false;
  }

  function placeExportSelection() {
    expActive = true;
    if (expRect) { try { map.removeLayer(expRect); } catch(_){} }
    const bounds = computeFixedFrameBounds();
    expRect = L.rectangle(bounds, { color: '#111', weight: 2, dashArray: '6,6', fillOpacity: 0.0, pane: 'exportHandlesPane', interactive: false }).addTo(map);
    updateExportMask();
    attachFrameListeners();
  }

  function getExpCornersPx() {
    const b = expRect.getBounds();
    return {
      nw: map.latLngToContainerPoint(b.getNorthWest()),
      ne: map.latLngToContainerPoint(b.getNorthEast()),
      se: map.latLngToContainerPoint(b.getSouthEast()),
      sw: map.latLngToContainerPoint(b.getSouthWest()),
    };
  }

  function createHandle(latlng, key) {
    const m = L.marker(latlng, {
      draggable: true,
      pane: 'exportHandlesPane',
      icon: L.divIcon({ className: 'georef-handle', iconSize: [14,14], html: '<div style="width:14px;height:14px;border-radius:50%;background:#fff;border:2px solid #111;"></div>' })
    }).addTo(map);
    m.on('drag', () => onHandleDrag(key, m.getLatLng()));
    expHandleMarkers[key] = m;
  }

  function createExportHandles() {
    if (!expRect) return;
    const b = expRect.getBounds();
    ['nw','ne','se','sw'].forEach(k => { if (expHandleMarkers[k]) { try { map.removeLayer(expHandleMarkers[k]); } catch(_){} } });
    createHandle(b.getNorthWest(), 'nw');
    createHandle(b.getNorthEast(), 'ne');
    createHandle(b.getSouthEast(), 'se');
    createHandle(b.getSouthWest(), 'sw');
  }

  function updateExportHandles() {
    // handles removed in fixed-frame mode
  }

  function onHandleDrag(which, latlng) {
    if (!expRect) return;
    const px = getExpCornersPx();
    const anchorMap = { nw: 'se', ne: 'sw', se: 'nw', sw: 'ne' };
    const anchorKey = anchorMap[which];
    const anchor = px[anchorKey];
    const p = map.latLngToContainerPoint(latlng);
    // enforce aspect: width/height = expAspect
    const dx = p.x - anchor.x;
    const dy = p.y - anchor.y;
    const sdx = (dx === 0 ? 1 : Math.sign(dx));
    const sdy = (dy === 0 ? 1 : Math.sign(dy));
    const absdx = Math.abs(dx);
    const absdy = Math.abs(dy);
    // Compute width limited by available deltas
    const widthAbs = Math.min(absdx, absdy * expAspect);
    const heightAbs = widthAbs / expAspect;
    const sx = sdx * widthAbs;
    const sy = sdy * heightAbs;
    const other = L.point(anchor.x + sx, anchor.y + sy);
    const rectPx = {
      nw: L.point(Math.min(anchor.x, other.x), Math.min(anchor.y, other.y)),
      ne: L.point(Math.max(anchor.x, other.x), Math.min(anchor.y, other.y)),
      se: L.point(Math.max(anchor.x, other.x), Math.max(anchor.y, other.y)),
      sw: L.point(Math.min(anchor.x, other.x), Math.max(anchor.y, other.y)),
    };
    const p1 = L.point(rectPx.nw.x, rectPx.nw.y);
    const p2 = L.point(rectPx.se.x, rectPx.se.y);
    const nw = map.containerPointToLatLng(p1);
    const se = map.containerPointToLatLng(p2);
    expRect.setBounds(L.latLngBounds(nw, se));
    if (expCenterMarker) expCenterMarker.setLatLng(expRect.getBounds().getCenter());
    updateExportHandles();
  }

  function resizeExportRectAroundCenter(centerLL) {
    // fixed frame, no manual resize
  }

  function clearExportSelection() {
    if (expRect) { try { map.removeLayer(expRect); } catch(_){} expRect = null; }
    if (expCenterMarker) { try { map.removeLayer(expCenterMarker); } catch(_){} expCenterMarker = null; }
    expActive = false;
    detachFrameListeners();
    if (exportMaskEl) exportMaskEl.classList.remove('visible');
  }

  if (expCancelBtn) expCancelBtn.addEventListener('click', () => { clearExportSelection(); showExportModal(false); });
  if (expNextBtn) expNextBtn.addEventListener('click', async () => {
    try {
      const meta = collectExportMeta();
      const { blob: pdfBlob } = await makeMapPdf(meta);
      const kml = buildKml() || '';
      const projectRaw = meta.projektname || '';
      const projectSafe = sanitizeFileName(projectRaw) || 'Projekt';
      const baseName = projectSafe;
      const projectData = buildProjectDataJson(meta, baseName);
      const projectDataText = JSON.stringify(projectData, null, 2);
      const attachments = [
        { filename: `${baseName}.pdf`, mimeType: 'application/pdf', data: pdfBlob },
      ];
      if (kml) attachments.push({ filename: `${baseName}.kml`, mimeType: 'application/vnd.google-earth.kml+xml', data: kml });
      // fire-and-forget webhook (keine Blockade des Downloads)
      sendExportWebhook({ meta, exportMode, baseName, pdfBlob, kmlText: kml });
      if (exportMode === 'pdfOnly') {
        download(`${baseName}.pdf`, pdfBlob, 'application/pdf');
      } else {
        const emailTpl = await buildEmailTemplate(meta, attachments);
        const zip = new JSZip();
        const root = zip.folder(projectSafe);
        const f1 = root.folder('1_Projektinformationen');
        const f2 = root.folder('2_Leitungsauskünfte');
        const f3 = root.folder('3_Georeferenzierte Pläne');
        const f4 = root.folder('4_Ergebnisse');
        // ensure empty folders are kept
        f2.file('.keep', '');
        f3.file('.keep', '');
        f4.file('.keep', '');
        f1.file(`${baseName}.pdf`, pdfBlob);
        if (kml) f1.file(`${baseName}.kml`, kml);
        f1.file('projekt-daten.json', projectDataText);
        if (emailTpl) {
          const emailName = `${baseName}-leitungsauskunft.emltpl`;
          f1.file(emailName, emailTpl);
          f2.file(emailName, emailTpl);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        download(`${projectSafe}.zip`, zipBlob, 'application/zip');
      }
      showExportModal(false);
      clearExportSelection();
    } catch (e) {
      console.error('Export Fehler:', e);
      alert('Export fehlgeschlagen.');
    }
  });

  function sanitizeFileName(name) {
    return String(name).trim().replace(/[\\/:*?"<>|\n\r]+/g, '_');
  }

  // Default: selection mode active on load
  setSelectMode(true);
  enableButtons();
  updateCursor();

  // Removed folder export button for single-step flow

  // No extra listeners; frame is free square and resizable
  // removed expPaper change handler

  function enableRectDrag() {
    // dragging disabled in fixed-frame mode
  }
})();
