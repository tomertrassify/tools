const viewerElement = document.getElementById("viewer");
const viewerPanel = document.querySelector(".panel-viewer");
const viewerPlaceholder = document.getElementById("viewerPlaceholder");
const viewerPlaceholderText = viewerPlaceholder?.querySelector("p") || null;
const DEFAULT_PLACEHOLDER_TEXT = viewerPlaceholderText?.textContent || "Datei auf den Canvas ziehen (Drag & Drop).";
const statusElement = document.getElementById("viewerStatus");
const typeListElement = document.getElementById("typeList");
const layerListElement = document.getElementById("layerList");
const globalDropOverlay = document.getElementById("globalDropOverlay");
const typeSortSelect = document.getElementById("typeSortSelect");
const enableAllTypesBtn = document.getElementById("enableAllTypesBtn");
const disableAllTypesBtn = document.getElementById("disableAllTypesBtn");
const enableAllLayersBtn = document.getElementById("enableAllLayersBtn");
const disableAllLayersBtn = document.getElementById("disableAllLayersBtn");
const exportGeoJsonBtn = document.getElementById("exportGeoJsonBtn");

const directlySupported = new Set(["dxf"]);
const conversionFormats = new Set(["dwg", "dwt", "dws", "dgn", "step", "stp", "iges", "igs", "ifc"]);
const SVG_NS = "http://www.w3.org/2000/svg";
const MAX_PIXEL_RATIO = 2.5;

let viewerInstance = null;
let cleanupInteraction = null;
let globalDragDepth = 0;
let sourceParsedDxf = null;
let currentFileBaseName = "dxf-export";
let selectedTypeSort = "count";
const typeVisibility = new Map();
const layerVisibility = new Map();
let lastViewState = null;

document.addEventListener("dragenter", (event) => {
  if (!isFileDragEvent(event)) {
    return;
  }

  event.preventDefault();
  globalDragDepth += 1;
  showGlobalDropOverlay();
});

document.addEventListener("dragover", (event) => {
  if (!isFileDragEvent(event)) {
    return;
  }

  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "copy";
  }
  showGlobalDropOverlay();
});

document.addEventListener("dragleave", (event) => {
  if (!isFileDragEvent(event)) {
    return;
  }

  globalDragDepth = Math.max(0, globalDragDepth - 1);
  if (globalDragDepth === 0) {
    hideGlobalDropOverlay();
  }
});

document.addEventListener("drop", async (event) => {
  if (!isFileDragEvent(event) && !event.dataTransfer?.files?.length) {
    return;
  }

  event.preventDefault();
  globalDragDepth = 0;
  hideGlobalDropOverlay();

  const file = getFirstDroppedCadFile(event.dataTransfer?.files);
  if (!file) {
    setStatus("Keine unterstutzte CAD-Datei erkannt.");
    return;
  }

  await loadCadFile(file);
});

window.addEventListener("dragend", () => {
  globalDragDepth = 0;
  hideGlobalDropOverlay();
});

if (typeSortSelect) {
  typeSortSelect.addEventListener("change", () => {
    selectedTypeSort = typeSortSelect.value === "name" ? "name" : "count";
    if (sourceParsedDxf) {
      applyFiltersAndRender();
    }
  });
}

if (enableAllTypesBtn) {
  enableAllTypesBtn.addEventListener("click", () => {
    setAllMapValues(typeVisibility, true);
    if (sourceParsedDxf) {
      applyFiltersAndRender();
      setStatus("Alle Objekttypen eingeblendet.");
    }
  });
}

if (disableAllTypesBtn) {
  disableAllTypesBtn.addEventListener("click", () => {
    setAllMapValues(typeVisibility, false);
    if (sourceParsedDxf) {
      applyFiltersAndRender();
      setStatus("Alle Objekttypen ausgeblendet.");
    }
  });
}

if (enableAllLayersBtn) {
  enableAllLayersBtn.addEventListener("click", () => {
    setAllMapValues(layerVisibility, true);
    if (sourceParsedDxf) {
      applyFiltersAndRender();
      setStatus("Alle Ebenen eingeblendet.");
    }
  });
}

if (disableAllLayersBtn) {
  disableAllLayersBtn.addEventListener("click", () => {
    setAllMapValues(layerVisibility, false);
    if (sourceParsedDxf) {
      applyFiltersAndRender();
      setStatus("Alle Ebenen ausgeblendet.");
    }
  });
}

if (exportGeoJsonBtn) {
  exportGeoJsonBtn.addEventListener("click", () => {
    exportFilteredGeoJson();
  });
}

window.addEventListener("resize", () => {
  if (!viewerInstance || typeof viewerInstance.resize !== "function") {
    return;
  }
  applyWebGlQuality(viewerInstance);
  viewerInstance.resize(viewerElement.clientWidth, viewerElement.clientHeight);
});

async function loadCadFile(file) {
  const extension = getExtension(file.name);

  try {
    setStatus(`Datei wird verarbeitet: ${file.name} ...`);
    let dxfText;

    if (directlySupported.has(extension)) {
      dxfText = await file.text();
    } else if (conversionFormats.has(extension)) {
      dxfText = await convertToDxf(file);
    } else {
      throw new Error(`Format .${extension || "?"} wird aktuell nicht unterstutzt.`);
    }

    const parsed = parseDxfText(dxfText);
    sourceParsedDxf = parsed;
    currentFileBaseName = getFileBaseName(file.name);
    lastViewState = null;
    initializeFilterState(parsed);
    const result = applyFiltersAndRender();
    setStatus(`Datei geladen: ${result.visibleCount}/${result.totalCount} Objekte sichtbar.`);
  } catch (error) {
    setStatus(error?.message || "Fehler beim Laden der Datei.");
  }
}

function parseDxfText(dxfText) {
  if (!window.DxfParser) {
    throw new Error("DXF Parser konnte nicht geladen werden.");
  }

  try {
    const parser = new window.DxfParser();
    return parser.parseSync(dxfText);
  } catch {
    throw new Error("DXF konnte nicht geparst werden.");
  }
}

function renderParsed(parsed) {
  resetViewer();
  viewerPlaceholder.style.display = "none";
  return renderWebGl(parsed);
}

function renderWebGl(parsed) {
  if (!window.ThreeDxf || !window.THREE) {
    throw new Error("WebGL-Viewer-Libraries konnten nicht geladen werden.");
  }

  viewerInstance = new window.ThreeDxf.Viewer(
    parsed,
    viewerElement,
    viewerElement.clientWidth,
    viewerElement.clientHeight
  );

  const canvas = viewerElement.querySelector("canvas");
  if (canvas) {
    cleanupInteraction = installWebGlInteractionTuning(viewerElement);
  }

  applyWebGlQuality(viewerInstance);
  if (typeof viewerInstance.render === "function") {
    viewerInstance.render();
  }

  return {
    mode: "webgl",
    unsupportedCount: 0
  };
}

function renderSvg(parsed) {
  const scene = buildSvgScene(parsed);
  viewerElement.appendChild(scene.svg);
  cleanupInteraction = installSvgInteraction(viewerElement, scene.svg, scene.initialViewBox);
  viewerInstance = null;

  return {
    mode: "svg",
    unsupportedCount: scene.unsupportedCount
  };
}

function resetViewer() {
  if (cleanupInteraction) {
    cleanupInteraction();
    cleanupInteraction = null;
  }

  while (viewerElement.firstChild) {
    viewerElement.removeChild(viewerElement.firstChild);
  }

  viewerInstance = null;
  viewerPlaceholder.style.display = "grid";
  setViewerPlaceholderText(DEFAULT_PLACEHOLDER_TEXT);
}

function setViewerPlaceholderText(text) {
  if (!viewerPlaceholderText) {
    return;
  }
  viewerPlaceholderText.textContent = text;
}

function initializeFilterState(parsed) {
  typeVisibility.clear();
  layerVisibility.clear();

  const entities = Array.isArray(parsed?.entities) ? parsed.entities : [];
  const layerRecords = parsed?.tables?.layer?.layers || {};

  for (const [layerName, layerRecord] of Object.entries(layerRecords)) {
    layerVisibility.set(normalizeLayerName(layerName), layerRecord?.visible !== false);
  }

  for (const entity of entities) {
    typeVisibility.set(normalizeType(entity?.type), true);
    const normalizedLayer = normalizeLayerName(entity?.layer);
    if (!layerVisibility.has(normalizedLayer)) {
      layerVisibility.set(normalizedLayer, true);
    }
  }
}

function applyFiltersAndRender() {
  if (!sourceParsedDxf) {
    return { totalCount: 0, visibleCount: 0 };
  }

  const previousViewState = captureWebGlViewState() || lastViewState;
  const filteredParsed = buildFilteredParsed(sourceParsedDxf);
  const summary = analyzeDxf(sourceParsedDxf);

  renderTypeList(summary.typeCounts);
  renderLayerList(summary.layers);

  if (filteredParsed.entities.length === 0) {
    if (previousViewState) {
      lastViewState = previousViewState;
    }
    resetViewer();
    setViewerPlaceholderText("Keine Objekte fur die aktuellen Filter.");
  } else {
    renderParsed(filteredParsed);
    if (!restoreWebGlViewState(previousViewState)) {
      lastViewState = captureWebGlViewState();
    } else {
      lastViewState = previousViewState;
    }
    setViewerPlaceholderText("Datei auf den Canvas ziehen (Drag & Drop).");
  }

  return {
    totalCount: summary.totalEntities,
    visibleCount: filteredParsed.entities.length
  };
}

function buildFilteredParsed(parsed) {
  const entities = Array.isArray(parsed?.entities) ? parsed.entities : [];
  const filteredEntities = entities.filter((entity) => {
    const type = normalizeType(entity?.type);
    const layer = normalizeLayerName(entity?.layer);
    const typeEnabled = typeVisibility.get(type) !== false;
    const layerEnabled = layerVisibility.get(layer) !== false;
    return typeEnabled && layerEnabled;
  });

  return {
    ...parsed,
    entities: filteredEntities
  };
}

function analyzeDxf(parsed) {
  const entities = Array.isArray(parsed?.entities) ? parsed.entities : [];
  const layerRecords = parsed?.tables?.layer?.layers || {};
  const typeCounts = new Map();
  const layers = new Map();

  for (const [rawLayerName, record] of Object.entries(layerRecords)) {
    const layerName = normalizeLayerName(rawLayerName);
    const existing = layers.get(layerName);
    if (existing) {
      if (!existing.color) {
        existing.color = resolveLayerColor(record) || existing.color;
      }
      existing.visible = existing.visible && record?.visible !== false;
      continue;
    }

    layers.set(layerName, {
      name: layerName,
      count: 0,
      typeCounts: new Map(),
      color: resolveLayerColor(record),
      visible: record?.visible !== false
    });
  }

  for (const entity of entities) {
    const type = normalizeType(entity?.type);
    const layerName = normalizeLayerName(entity?.layer);
    incrementCount(typeCounts, type);

    if (!layers.has(layerName)) {
      layers.set(layerName, {
        name: layerName,
        count: 0,
        typeCounts: new Map(),
        color: null,
        visible: true
      });
    }

    const layer = layers.get(layerName);
    layer.count += 1;
    incrementCount(layer.typeCounts, type);

    if (!layer.color) {
      layer.color = resolveEntityStroke(entity, parsed) || layer.color;
    }
  }

  return {
    totalEntities: entities.length,
    typeCounts,
    layers: sortLayerStats(Array.from(layers.values()))
  };
}

function renderTypeList(typeCounts) {
  typeListElement.replaceChildren();

  if (!typeCounts || typeCounts.size === 0) {
    typeListElement.appendChild(createEmptyRow("Keine Objekttypen gefunden."));
    return;
  }

  const sortedTypes = sortTypeEntries(typeCounts, selectedTypeSort);
  for (const [type, count] of sortedTypes) {
    const row = document.createElement("li");
    row.className = "type-row";

    const head = document.createElement("div");
    head.className = "type-row-head";

    const label = document.createElement("label");
    label.className = "row-check";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = typeVisibility.get(type) !== false;
    checkbox.addEventListener("change", () => {
      typeVisibility.set(type, checkbox.checked);
      const result = applyFiltersAndRender();
      setStatus(`Filter aktiv: ${result.visibleCount}/${result.totalCount} Objekte sichtbar.`);
    });

    const name = document.createElement("span");
    name.className = "type-name";
    name.textContent = type;

    label.append(checkbox, name);

    const amount = document.createElement("span");
    amount.className = "type-count";
    amount.textContent = `${count}`;

    head.append(label, amount);
    row.append(head);
    typeListElement.appendChild(row);
  }
}

function renderLayerList(layers) {
  layerListElement.replaceChildren();

  if (!layers.length) {
    layerListElement.appendChild(createEmptyRow("Noch keine Layer gefunden."));
    return;
  }

  for (const layer of layers) {
    const row = document.createElement("li");
    row.className = "layer-row";

    const head = document.createElement("div");
    head.className = "layer-row-head";

    const left = document.createElement("div");
    left.className = "layer-row-left";

    const label = document.createElement("label");
    label.className = "row-check";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = layerVisibility.get(layer.name) !== false;
    checkbox.addEventListener("change", () => {
      layerVisibility.set(layer.name, checkbox.checked);
      const result = applyFiltersAndRender();
      setStatus(`Filter aktiv: ${result.visibleCount}/${result.totalCount} Objekte sichtbar.`);
    });

    const swatch = document.createElement("span");
    swatch.className = "layer-swatch";
    swatch.style.backgroundColor = layer.color || "#d9dde3";

    const name = document.createElement("span");
    name.className = "layer-name";
    name.textContent = layer.name;

    if (!layer.visible) {
      name.textContent += " (off)";
    }

    label.append(checkbox, swatch, name);
    left.append(label);

    const count = document.createElement("span");
    count.className = "layer-count";
    count.textContent = `${layer.count}`;

    head.append(left, count);

    const details = document.createElement("p");
    details.className = "layer-types";
    details.textContent = formatTypeBreakdown(layer.typeCounts);

    row.append(head, details);
    layerListElement.appendChild(row);
  }
}

function createEmptyRow(text) {
  const row = document.createElement("li");
  row.className = "empty-row";
  row.textContent = text;
  return row;
}

function sortLayerStats(layers) {
  return layers.sort((a, b) => {
    if (a.count !== b.count) {
      return b.count - a.count;
    }
    return a.name.localeCompare(b.name, "de");
  });
}

function sortCountEntries(map) {
  return Array.from(map.entries()).sort((a, b) => {
    if (a[1] !== b[1]) {
      return b[1] - a[1];
    }
    return a[0].localeCompare(b[0], "de");
  });
}

function sortTypeEntries(typeCounts, mode) {
  if (mode === "name") {
    return Array.from(typeCounts.entries()).sort((a, b) => a[0].localeCompare(b[0], "de"));
  }
  return sortCountEntries(typeCounts);
}

function formatTypeBreakdown(typeCounts) {
  if (!typeCounts || typeCounts.size === 0) {
    return "Keine Objekte";
  }

  const sorted = sortCountEntries(typeCounts);
  const visibleParts = sorted.slice(0, 4).map(([type, count]) => `${type} ${count}`);
  const extra = sorted.length - visibleParts.length;

  if (extra > 0) {
    visibleParts.push(`+${extra} weitere`);
  }

  return visibleParts.join(", ");
}

function normalizeType(type) {
  return typeof type === "string" && type.trim() ? type.trim().toUpperCase() : "UNKNOWN";
}

function normalizeLayerName(layerName) {
  return typeof layerName === "string" && layerName.trim() ? layerName.trim() : "0";
}

function resolveLayerColor(layerRecord) {
  if (!layerRecord) {
    return null;
  }

  if (typeof layerRecord.color === "number") {
    return numberToHexColor(layerRecord.color);
  }

  return null;
}

function incrementCount(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

function buildSvgScene(parsed) {
  const svg = createSvgElement("svg");
  svg.classList.add("cad-svg");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  const world = createSvgElement("g");
  world.setAttribute("transform", "scale(1,-1)");
  svg.appendChild(world);

  const bounds = createBounds();
  const entities = Array.isArray(parsed?.entities) ? parsed.entities : [];
  let unsupportedCount = 0;

  for (const entity of entities) {
    const drew = appendEntityToSvg(world, entity, parsed, bounds);
    if (!drew) {
      unsupportedCount += 1;
    }
  }

  if (!hasBounds(bounds)) {
    includePoint(bounds, -50, -50);
    includePoint(bounds, 50, 50);
  }

  const width = Math.max(bounds.maxX - bounds.minX, 1);
  const height = Math.max(bounds.maxY - bounds.minY, 1);
  const margin = Math.max(width, height) * 0.03;
  const initialViewBox = {
    x: bounds.minX - margin,
    y: -(bounds.maxY + margin),
    width: width + margin * 2,
    height: height + margin * 2
  };

  svg.setAttribute("viewBox", formatViewBox(initialViewBox));

  return {
    svg,
    initialViewBox,
    unsupportedCount
  };
}

function appendEntityToSvg(world, entity, parsed, bounds) {
  if (!entity || typeof entity.type !== "string") {
    return false;
  }

  const type = entity.type.toUpperCase();
  const stroke = resolveEntityStroke(entity, parsed);

  if (type === "LINE") {
    return drawPathEntity(world, buildLinePoints(entity), false, stroke, bounds);
  }

  if (type === "LWPOLYLINE" || type === "POLYLINE") {
    const closed = Boolean(entity.shape || entity.closed);
    return drawPathEntity(world, buildPolylinePoints(entity), closed, stroke, bounds);
  }

  if (type === "CIRCLE") {
    const points = buildCirclePoints(entity.center, entity.radius);
    return drawPathEntity(world, points, true, stroke, bounds);
  }

  if (type === "ARC") {
    const points = buildArcPoints(entity.center, entity.radius, entity.startAngle, entity.endAngle);
    return drawPathEntity(world, points, false, stroke, bounds);
  }

  if (type === "ELLIPSE") {
    const ellipse = buildEllipsePoints(entity);
    return drawPathEntity(world, ellipse.points, ellipse.closed, stroke, bounds);
  }

  if (type === "SPLINE") {
    return drawPathEntity(world, buildSplinePoints(entity), false, stroke, bounds);
  }

  return false;
}

function drawPathEntity(world, points, closed, stroke, bounds) {
  const cleanPoints = sanitizePoints(points);
  if (cleanPoints.length < 2) {
    return false;
  }

  includePoints(bounds, cleanPoints);

  const path = createSvgElement("path");
  path.setAttribute("class", "cad-entity");
  path.setAttribute("d", pointsToPath(cleanPoints, closed));
  if (stroke) {
    path.setAttribute("stroke", stroke);
  }

  world.appendChild(path);
  return true;
}

function buildLinePoints(entity) {
  if (Array.isArray(entity.vertices) && entity.vertices.length >= 2) {
    return [toPoint(entity.vertices[0]), toPoint(entity.vertices[1])];
  }

  if (entity.startPoint && entity.endPoint) {
    return [toPoint(entity.startPoint), toPoint(entity.endPoint)];
  }

  return [];
}

function buildPolylinePoints(entity) {
  const vertices = Array.isArray(entity.vertices) ? entity.vertices : [];
  if (vertices.length < 2) {
    return [];
  }

  const closed = Boolean(entity.shape || entity.closed);
  const points = [toPoint(vertices[0])];
  const segmentCount = closed ? vertices.length : vertices.length - 1;

  for (let i = 0; i < segmentCount; i += 1) {
    const current = vertices[i];
    const next = vertices[(i + 1) % vertices.length];

    if (!isFinitePoint(current) || !isFinitePoint(next)) {
      continue;
    }

    const bulge = typeof current.bulge === "number" ? current.bulge : 0;
    if (Math.abs(bulge) > 1e-9) {
      const arcPoints = bulgeToPolylinePoints(current, next, bulge);
      for (let j = 1; j < arcPoints.length; j += 1) {
        points.push(arcPoints[j]);
      }
    } else {
      points.push(toPoint(next));
    }
  }

  if (closed && points.length > 2 && arePointsNear(points[0], points[points.length - 1])) {
    points.pop();
  }

  return points;
}

function bulgeToPolylinePoints(start, end, bulge) {
  const chordLength = Math.hypot(end.x - start.x, end.y - start.y);
  const angle = 4 * Math.atan(bulge);

  if (chordLength === 0 || Math.abs(angle) < 1e-9) {
    return [toPoint(start), toPoint(end)];
  }

  const radiusSigned = chordLength / (2 * Math.sin(angle / 2));
  const baseAngle = Math.atan2(end.y - start.y, end.x - start.x);
  const centerAngle = baseAngle + (Math.PI / 2 - angle / 2);
  const center = {
    x: start.x + radiusSigned * Math.cos(centerAngle),
    y: start.y + radiusSigned * Math.sin(centerAngle)
  };

  const startAngle = Math.atan2(start.y - center.y, start.x - center.x);
  const radius = Math.abs(radiusSigned);
  const segments = Math.max(8, Math.ceil(Math.abs(angle) / (Math.PI / 24)));
  const points = [];

  for (let i = 0; i <= segments; i += 1) {
    const theta = startAngle + (angle * i) / segments;
    points.push({
      x: center.x + radius * Math.cos(theta),
      y: center.y + radius * Math.sin(theta)
    });
  }

  return points;
}

function buildCirclePoints(center, radius) {
  if (!isFinitePoint(center) || !Number.isFinite(radius) || radius <= 0) {
    return [];
  }

  const segments = 96;
  const points = [];
  for (let i = 0; i < segments; i += 1) {
    const angle = (Math.PI * 2 * i) / segments;
    points.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle)
    });
  }
  return points;
}

function buildArcPoints(center, radius, startAngle, endAngle) {
  if (!isFinitePoint(center) || !Number.isFinite(radius) || radius <= 0) {
    return [];
  }

  let start = Number.isFinite(startAngle) ? startAngle : 0;
  let end = Number.isFinite(endAngle) ? endAngle : start + Math.PI * 2;

  while (end < start) {
    end += Math.PI * 2;
  }

  const span = end - start;
  if (span <= 0) {
    return [];
  }

  const segments = Math.max(16, Math.ceil(span / (Math.PI / 36)));
  const points = [];
  for (let i = 0; i <= segments; i += 1) {
    const angle = start + (span * i) / segments;
    points.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y + radius * Math.sin(angle)
    });
  }
  return points;
}

function buildEllipsePoints(entity) {
  const center = entity?.center;
  const major = entity?.majorAxisEndPoint;
  const ratio = Number.isFinite(entity?.axisRatio) ? entity.axisRatio : 1;

  if (!isFinitePoint(center) || !isFinitePoint(major) || ratio <= 0) {
    return { points: [], closed: false };
  }

  let start = Number.isFinite(entity.startAngle) ? entity.startAngle : 0;
  let end = Number.isFinite(entity.endAngle) ? entity.endAngle : start + Math.PI * 2;
  while (end < start) {
    end += Math.PI * 2;
  }

  const span = end - start;
  if (span <= 0) {
    return { points: [], closed: false };
  }

  const segments = Math.max(24, Math.ceil(span / (Math.PI / 48)));
  const points = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = start + (span * i) / segments;
    const cosT = Math.cos(t);
    const sinT = Math.sin(t);
    points.push({
      x: center.x + major.x * cosT - major.y * ratio * sinT,
      y: center.y + major.y * cosT + major.x * ratio * sinT
    });
  }

  const closed = Math.abs(span - Math.PI * 2) < 1e-4;
  if (closed && points.length > 2) {
    points.pop();
  }

  return { points, closed };
}

function buildSplinePoints(entity) {
  if (Array.isArray(entity?.fitPoints) && entity.fitPoints.length >= 2) {
    return entity.fitPoints.map(toPoint);
  }

  if (Array.isArray(entity?.controlPoints) && entity.controlPoints.length >= 2) {
    return entity.controlPoints.map(toPoint);
  }

  return [];
}

function resolveEntityStroke(entity, parsed) {
  const directColor = typeof entity.color === "number" ? entity.color : null;
  const layerColor = parsed?.tables?.layer?.layers?.[entity.layer]?.color;
  const chosen = directColor ?? layerColor;

  if (typeof chosen !== "number") {
    return null;
  }

  return numberToHexColor(chosen);
}

function numberToHexColor(value) {
  const normalized = Math.abs(Number(value)) & 0xffffff;
  return `#${normalized.toString(16).padStart(6, "0")}`;
}

function pointsToPath(points, closed) {
  let d = `M ${formatNumber(points[0].x)} ${formatNumber(points[0].y)}`;
  for (let i = 1; i < points.length; i += 1) {
    d += ` L ${formatNumber(points[i].x)} ${formatNumber(points[i].y)}`;
  }
  if (closed) {
    d += " Z";
  }
  return d;
}

function sanitizePoints(points) {
  const out = [];
  for (const point of points || []) {
    if (isFinitePoint(point)) {
      out.push({
        x: point.x,
        y: point.y
      });
    }
  }
  return out;
}

function isFinitePoint(point) {
  return point && Number.isFinite(point.x) && Number.isFinite(point.y);
}

function toPoint(point) {
  return {
    x: Number(point.x),
    y: Number(point.y)
  };
}

function arePointsNear(a, b) {
  return Math.abs(a.x - b.x) < 1e-8 && Math.abs(a.y - b.y) < 1e-8;
}

function createSvgElement(name) {
  return document.createElementNS(SVG_NS, name);
}

function createBounds() {
  return {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity
  };
}

function includePoints(bounds, points) {
  for (const point of points) {
    includePoint(bounds, point.x, point.y);
  }
}

function includePoint(bounds, x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return;
  }

  bounds.minX = Math.min(bounds.minX, x);
  bounds.minY = Math.min(bounds.minY, y);
  bounds.maxX = Math.max(bounds.maxX, x);
  bounds.maxY = Math.max(bounds.maxY, y);
}

function hasBounds(bounds) {
  return (
    Number.isFinite(bounds.minX) &&
    Number.isFinite(bounds.minY) &&
    Number.isFinite(bounds.maxX) &&
    Number.isFinite(bounds.maxY)
  );
}

function formatViewBox(viewBox) {
  return [
    formatNumber(viewBox.x),
    formatNumber(viewBox.y),
    formatNumber(viewBox.width),
    formatNumber(viewBox.height)
  ].join(" ");
}

function formatNumber(value) {
  return Number(value.toFixed(6)).toString();
}

function installSvgInteraction(container, svg, initialViewBox) {
  let viewBox = { ...initialViewBox };
  const minWidth = Math.max(initialViewBox.width * 1e-6, 1e-6);
  const minHeight = Math.max(initialViewBox.height * 1e-6, 1e-6);
  const maxWidth = initialViewBox.width * 1e4;
  const maxHeight = initialViewBox.height * 1e4;
  let panState = null;

  const applyViewBox = () => {
    svg.setAttribute("viewBox", formatViewBox(viewBox));
  };

  const onPointerDown = (event) => {
    if (event.button !== 0) {
      return;
    }

    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    event.preventDefault();
    panState = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      rectWidth: rect.width,
      rectHeight: rect.height,
      startViewBox: { ...viewBox }
    };

    container.classList.add("is-grabbing");
    svg.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event) => {
    if (!panState || event.pointerId !== panState.pointerId) {
      return;
    }

    const dx = event.clientX - panState.clientX;
    const dy = event.clientY - panState.clientY;

    viewBox = {
      x: panState.startViewBox.x - (dx * panState.startViewBox.width) / panState.rectWidth,
      y: panState.startViewBox.y - (dy * panState.startViewBox.height) / panState.rectHeight,
      width: panState.startViewBox.width,
      height: panState.startViewBox.height
    };
    applyViewBox();
  };

  const endPan = (event) => {
    if (!panState || event.pointerId !== panState.pointerId) {
      return;
    }

    if (svg.hasPointerCapture(event.pointerId)) {
      svg.releasePointerCapture(event.pointerId);
    }

    panState = null;
    container.classList.remove("is-grabbing");
  };

  const onWheel = (event) => {
    event.preventDefault();

    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const rawDelta = typeof event.deltaY === "number" && event.deltaY !== 0 ? event.deltaY : -getWheelDelta(event);
    if (rawDelta === 0) {
      return;
    }

    const px = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const py = clamp((event.clientY - rect.top) / rect.height, 0, 1);
    const zoomStep = 1 + Math.min(Math.abs(rawDelta) / 650, 0.32);
    const scale = rawDelta > 0 ? zoomStep : 1 / zoomStep;
    const nextWidth = clamp(viewBox.width * scale, minWidth, maxWidth);
    const nextHeight = clamp(viewBox.height * scale, minHeight, maxHeight);
    const anchorX = viewBox.x + px * viewBox.width;
    const anchorY = viewBox.y + py * viewBox.height;

    viewBox = {
      x: anchorX - px * nextWidth,
      y: anchorY - py * nextHeight,
      width: nextWidth,
      height: nextHeight
    };
    applyViewBox();
  };

  const onDoubleClick = (event) => {
    event.preventDefault();
    viewBox = { ...initialViewBox };
    applyViewBox();
  };

  svg.addEventListener("pointerdown", onPointerDown);
  svg.addEventListener("pointermove", onPointerMove);
  svg.addEventListener("pointerup", endPan);
  svg.addEventListener("pointercancel", endPan);
  svg.addEventListener("wheel", onWheel, { passive: false });
  svg.addEventListener("dblclick", onDoubleClick);

  return () => {
    svg.removeEventListener("pointerdown", onPointerDown);
    svg.removeEventListener("pointermove", onPointerMove);
    svg.removeEventListener("pointerup", endPan);
    svg.removeEventListener("pointercancel", endPan);
    svg.removeEventListener("wheel", onWheel);
    svg.removeEventListener("dblclick", onDoubleClick);
    container.classList.remove("is-grabbing");
  };
}

function installWebGlInteractionTuning(container) {
  let lastZoomTick = 0;

  const onMouseDownCapture = (event) => {
    if (!event.isTrusted) {
      return;
    }

    if (event.button === 0) {
      event.preventDefault();
      event.stopImmediatePropagation();
      container.classList.add("is-grabbing");

      // three-dxf pans with right mouse button. Remap left drag to pan.
      const syntheticDown = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        view: window,
        button: 2,
        buttons: 2,
        clientX: event.clientX,
        clientY: event.clientY,
        screenX: event.screenX,
        screenY: event.screenY,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        metaKey: event.metaKey
      });
      container.dispatchEvent(syntheticDown);
    } else if (event.button === 2) {
      container.classList.add("is-grabbing");
    }
  };

  const onMouseUp = () => {
    container.classList.remove("is-grabbing");
  };

  const onWheelCapture = (event) => {
    if (!event.isTrusted) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    const now = performance.now();
    if (now - lastZoomTick < 22) {
      return;
    }
    lastZoomTick = now;

    const rawDelta = getWheelDelta(event);
    if (rawDelta === 0) {
      return;
    }

    const syntheticZoom = new Event("mousewheel", {
      bubbles: true,
      cancelable: true
    });

    Object.defineProperty(syntheticZoom, "wheelDelta", {
      value: rawDelta > 0 ? 120 : -120
    });

    container.dispatchEvent(syntheticZoom);
  };

  container.addEventListener("mousedown", onMouseDownCapture, {
    capture: true
  });
  container.addEventListener("wheel", onWheelCapture, {
    capture: true,
    passive: false
  });
  container.addEventListener("mousewheel", onWheelCapture, {
    capture: true,
    passive: false
  });
  container.addEventListener("DOMMouseScroll", onWheelCapture, {
    capture: true,
    passive: false
  });
  window.addEventListener("mouseup", onMouseUp);

  return () => {
    container.removeEventListener("mousedown", onMouseDownCapture, {
      capture: true
    });
    container.removeEventListener("wheel", onWheelCapture, {
      capture: true
    });
    container.removeEventListener("mousewheel", onWheelCapture, {
      capture: true
    });
    container.removeEventListener("DOMMouseScroll", onWheelCapture, {
      capture: true
    });
    window.removeEventListener("mouseup", onMouseUp);
    container.classList.remove("is-grabbing");
  };
}

function applyWebGlQuality(viewer) {
  if (!viewer || !viewer.renderer || typeof viewer.renderer.setPixelRatio !== "function") {
    return;
  }

  const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  viewer.renderer.setPixelRatio(ratio);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getWheelDelta(event) {
  if (typeof event.wheelDelta === "number" && event.wheelDelta !== 0) {
    return event.wheelDelta;
  }

  if (typeof event.deltaY === "number" && event.deltaY !== 0) {
    return -event.deltaY;
  }

  if (typeof event.detail === "number" && event.detail !== 0) {
    return -event.detail;
  }

  return 0;
}

async function convertToDxf(file) {
  const formData = new FormData();
  formData.append("cadFile", file);

  const response = await fetch("convert.php", {
    method: "POST",
    body: formData
  });

  const data = await safeJson(response);
  if (!response.ok || !data?.dxfText) {
    const message =
      data?.message ||
      "Dieses Format braucht eine Server-Konvertierung nach DXF. Implementiere convert.php.";
    throw new Error(message);
  }

  return data.dxfText;
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getExtension(fileName) {
  const segments = fileName.split(".");
  if (segments.length < 2) {
    return "";
  }
  return segments.pop().toLowerCase();
}

function getFirstDroppedCadFile(fileList) {
  if (!fileList || fileList.length === 0) {
    return null;
  }

  const files = Array.from(fileList);
  const supported = files.find((file) => {
    const ext = getExtension(file.name);
    return directlySupported.has(ext) || conversionFormats.has(ext);
  });

  return supported || files[0] || null;
}

function isFileDragEvent(event) {
  const types = event.dataTransfer?.types;
  if (!types) {
    return false;
  }

  return Array.from(types).includes("Files");
}

function showGlobalDropOverlay() {
  if (globalDropOverlay) {
    globalDropOverlay.classList.add("is-visible");
    globalDropOverlay.setAttribute("aria-hidden", "false");
  }

  if (viewerPanel) {
    viewerPanel.classList.add("dragover");
  }
}

function hideGlobalDropOverlay() {
  if (globalDropOverlay) {
    globalDropOverlay.classList.remove("is-visible");
    globalDropOverlay.setAttribute("aria-hidden", "true");
  }

  if (viewerPanel) {
    viewerPanel.classList.remove("dragover");
  }
}

function setStatus(message) {
  if (!statusElement) {
    return;
  }
  statusElement.textContent = message;
}

function captureWebGlViewState() {
  if (!viewerInstance || !viewerInstance.camera) {
    return null;
  }

  const camera = viewerInstance.camera;
  const controls = viewerInstance.controls || null;

  return {
    position: snapshotVector3(camera.position),
    quaternion: snapshotQuaternion(camera.quaternion),
    zoom: Number.isFinite(camera.zoom) ? camera.zoom : null,
    target: snapshotVector3(controls?.target)
  };
}

function restoreWebGlViewState(state) {
  if (!state || !viewerInstance || !viewerInstance.camera) {
    return false;
  }

  const camera = viewerInstance.camera;
  const controls = viewerInstance.controls || null;

  if (state.position) {
    applyVector3(camera.position, state.position);
  }

  if (state.quaternion && camera.quaternion) {
    camera.quaternion.set(
      state.quaternion.x,
      state.quaternion.y,
      state.quaternion.z,
      state.quaternion.w
    );
  }

  if (Number.isFinite(state.zoom) && "zoom" in camera) {
    camera.zoom = state.zoom;
    if (typeof camera.updateProjectionMatrix === "function") {
      camera.updateProjectionMatrix();
    }
  }

  if (controls && state.target && controls.target) {
    applyVector3(controls.target, state.target);
    if (typeof controls.update === "function") {
      controls.update();
    }
  }

  if (typeof viewerInstance.render === "function") {
    viewerInstance.render();
  }

  return true;
}

function snapshotVector3(vector) {
  if (!vector || !Number.isFinite(vector.x) || !Number.isFinite(vector.y) || !Number.isFinite(vector.z)) {
    return null;
  }

  return {
    x: vector.x,
    y: vector.y,
    z: vector.z
  };
}

function snapshotQuaternion(quaternion) {
  if (
    !quaternion ||
    !Number.isFinite(quaternion.x) ||
    !Number.isFinite(quaternion.y) ||
    !Number.isFinite(quaternion.z) ||
    !Number.isFinite(quaternion.w)
  ) {
    return null;
  }

  return {
    x: quaternion.x,
    y: quaternion.y,
    z: quaternion.z,
    w: quaternion.w
  };
}

function applyVector3(target, value) {
  if (!target || !value || typeof target.set !== "function") {
    return;
  }
  target.set(value.x, value.y, value.z);
}

function setAllMapValues(map, value) {
  for (const key of map.keys()) {
    map.set(key, value);
  }
}

function getFileBaseName(fileName) {
  if (typeof fileName !== "string" || !fileName.trim()) {
    return "dxf-export";
  }

  const withoutExt = fileName.replace(/\.[^/.]+$/, "");
  const normalized = withoutExt
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return normalized || "dxf-export";
}

function exportFilteredGeoJson() {
  if (!sourceParsedDxf) {
    setStatus("Keine Datei geladen. Erst DXF/DWG droppen.");
    return;
  }

  const filtered = buildFilteredParsed(sourceParsedDxf);
  const entities = Array.isArray(filtered?.entities) ? filtered.entities : [];

  if (entities.length === 0) {
    setStatus("Keine Objekte fur Export aktiv. Filter pruefen.");
    return;
  }

  const features = [];
  let unsupportedCount = 0;

  for (let i = 0; i < entities.length; i += 1) {
    const entity = entities[i];
    const mapped = entityToGeoJsonFeatures(entity, sourceParsedDxf, i);
    if (!mapped.length) {
      unsupportedCount += 1;
      continue;
    }
    features.push(...mapped);
  }

  if (features.length === 0) {
    setStatus("Export erzeugte keine Geometrien fur QGIS.");
    return;
  }

  withTypeTotals(features);
  features.sort((a, b) => compareFeatureSort(a.properties, b.properties));

  const payload = {
    type: "FeatureCollection",
    name: `${currentFileBaseName}-filtered`,
    features
  };

  const datePart = new Date().toISOString().slice(0, 10);
  const fileName = `${currentFileBaseName}-filtered-${datePart}.geojson`;
  downloadTextFile(fileName, JSON.stringify(payload, null, 2), "application/geo+json");

  const unsupportedText =
    unsupportedCount > 0 ? ` (${unsupportedCount} nicht konvertierbare Objekte ubersprungen)` : "";
  setStatus(`Export erstellt: ${features.length} Features${unsupportedText}.`);
}

function compareFeatureSort(aProps, bProps) {
  const typeA = normalizeType(aProps?.entity_type);
  const typeB = normalizeType(bProps?.entity_type);
  const layerA = normalizeLayerName(aProps?.layer);
  const layerB = normalizeLayerName(bProps?.layer);
  const indexA = Number.isFinite(aProps?.entity_index) ? aProps.entity_index : 0;
  const indexB = Number.isFinite(bProps?.entity_index) ? bProps.entity_index : 0;

  if (selectedTypeSort === "name") {
    const byName = typeA.localeCompare(typeB, "de");
    if (byName !== 0) {
      return byName;
    }
  } else {
    const totalA = Number.isFinite(aProps?.type_total) ? aProps.type_total : 0;
    const totalB = Number.isFinite(bProps?.type_total) ? bProps.type_total : 0;
    if (totalA !== totalB) {
      return totalB - totalA;
    }
    const byName = typeA.localeCompare(typeB, "de");
    if (byName !== 0) {
      return byName;
    }
  }

  const byLayer = layerA.localeCompare(layerB, "de");
  if (byLayer !== 0) {
    return byLayer;
  }

  return indexA - indexB;
}

function entityToGeoJsonFeatures(entity, parsed, entityIndex) {
  if (!entity || typeof entity.type !== "string") {
    return [];
  }

  const type = normalizeType(entity.type);
  const layer = normalizeLayerName(entity.layer);
  const color = resolveEntityStroke(entity, parsed);
  const baseProps = {
    layer,
    entity_type: type,
    entity_index: entityIndex,
    handle: entity.handle || null,
    linetype: entity.lineTypeName || entity.lineType || null,
    lineweight: Number.isFinite(entity.lineweight) ? entity.lineweight : null,
    color,
    text: extractEntityText(entity)
  };

  if (type === "LINE") {
    return featureFromLinePoints(buildLinePoints(entity), baseProps);
  }

  if (type === "LWPOLYLINE" || type === "POLYLINE") {
    const points = buildPolylinePoints(entity);
    const closed = Boolean(entity.shape || entity.closed);
    if (closed) {
      return featureFromPolygonPoints(points, baseProps);
    }
    return featureFromLinePoints(points, baseProps);
  }

  if (type === "CIRCLE") {
    return featureFromPolygonPoints(buildCirclePoints(entity.center, entity.radius), baseProps);
  }

  if (type === "ARC") {
    return featureFromLinePoints(
      buildArcPoints(
        entity.center,
        entity.radius,
        normalizeArcAngle(entity.startAngle),
        normalizeArcAngle(entity.endAngle)
      ),
      baseProps
    );
  }

  if (type === "ELLIPSE") {
    const ellipse = buildEllipsePoints(entity);
    if (ellipse.closed) {
      return featureFromPolygonPoints(ellipse.points, baseProps);
    }
    return featureFromLinePoints(ellipse.points, baseProps);
  }

  if (type === "SPLINE") {
    return featureFromLinePoints(buildSplinePoints(entity), baseProps);
  }

  if (type === "POINT") {
    return featureFromPoint(extractEntityPoint(entity), baseProps);
  }

  if (type === "TEXT" || type === "MTEXT" || type === "ATTDEF" || type === "ATTRIB") {
    return featureFromPoint(extractEntityPoint(entity), baseProps);
  }

  if (type === "INSERT") {
    return featureFromPoint(extractEntityPoint(entity), baseProps);
  }

  if (type === "SOLID" || type === "TRACE" || type === "3DFACE") {
    const points = extractEntityPolygonPoints(entity);
    return featureFromPolygonPoints(points, baseProps);
  }

  if (Array.isArray(entity.vertices) && entity.vertices.length >= 2) {
    return featureFromLinePoints(entity.vertices.map(toPoint), baseProps);
  }

  return [];
}

function featureFromPoint(point, properties) {
  if (!isFinitePoint(point)) {
    return [];
  }

  return [
    {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [point.x, point.y]
      },
      properties
    }
  ];
}

function featureFromLinePoints(points, properties) {
  const coords = toLineStringCoords(points);
  if (!coords) {
    return [];
  }

  return [
    {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: coords
      },
      properties
    }
  ];
}

function featureFromPolygonPoints(points, properties) {
  const ring = toPolygonRing(points);
  if (!ring) {
    return [];
  }

  return [
    {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [ring]
      },
      properties
    }
  ];
}

function toLineStringCoords(points) {
  const clean = sanitizePoints(points);
  if (clean.length < 2) {
    return null;
  }
  return clean.map((point) => [point.x, point.y]);
}

function toPolygonRing(points) {
  const clean = sanitizePoints(points);
  if (clean.length < 3) {
    return null;
  }

  const ring = clean.map((point) => [point.x, point.y]);
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (Math.abs(first[0] - last[0]) > 1e-8 || Math.abs(first[1] - last[1]) > 1e-8) {
    ring.push([first[0], first[1]]);
  }

  return ring.length >= 4 ? ring : null;
}

function extractEntityPoint(entity) {
  if (isFinitePoint(entity?.position)) {
    return toPoint(entity.position);
  }

  if (isFinitePoint(entity?.startPoint)) {
    return toPoint(entity.startPoint);
  }

  if (isFinitePoint(entity?.insertionPoint)) {
    return toPoint(entity.insertionPoint);
  }

  if (isFinitePoint(entity?.center)) {
    return toPoint(entity.center);
  }

  if (Array.isArray(entity?.vertices) && entity.vertices.length > 0 && isFinitePoint(entity.vertices[0])) {
    return toPoint(entity.vertices[0]);
  }

  return null;
}

function extractEntityPolygonPoints(entity) {
  if (Array.isArray(entity?.points) && entity.points.length >= 3) {
    return entity.points.map(toPoint);
  }

  if (Array.isArray(entity?.vertices) && entity.vertices.length >= 3) {
    return entity.vertices.map(toPoint);
  }

  const maybe = [];
  if (isFinitePoint(entity?.firstCorner)) maybe.push(toPoint(entity.firstCorner));
  if (isFinitePoint(entity?.secondCorner)) maybe.push(toPoint(entity.secondCorner));
  if (isFinitePoint(entity?.thirdCorner)) maybe.push(toPoint(entity.thirdCorner));
  if (isFinitePoint(entity?.fourthCorner)) maybe.push(toPoint(entity.fourthCorner));
  return maybe;
}

function extractEntityText(entity) {
  if (typeof entity?.text === "string" && entity.text.trim()) {
    return entity.text;
  }
  if (typeof entity?.string === "string" && entity.string.trim()) {
    return entity.string;
  }
  if (typeof entity?.name === "string" && entity.name.trim()) {
    return entity.name;
  }
  return null;
}

function normalizeArcAngle(angle) {
  if (!Number.isFinite(angle)) {
    return angle;
  }

  // Some DXF parsers provide ARC angles in degrees, others in radians.
  if (Math.abs(angle) > Math.PI * 2 + 1e-6) {
    return (angle * Math.PI) / 180;
  }
  return angle;
}

function withTypeTotals(features) {
  const totals = new Map();
  for (const feature of features) {
    const type = normalizeType(feature?.properties?.entity_type);
    totals.set(type, (totals.get(type) || 0) + 1);
  }

  for (const feature of features) {
    const type = normalizeType(feature?.properties?.entity_type);
    feature.properties.type_total = totals.get(type) || 0;
  }
}

function downloadTextFile(fileName, text, mimeType) {
  const blob = new Blob([text], {
    type: mimeType || "text/plain;charset=utf-8"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
