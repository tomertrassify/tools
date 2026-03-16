const form = document.getElementById("project-form");
const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("kml-input");
const fileNameText = document.getElementById("file-name");
const statusMessage = document.getElementById("status-message");
const submitButton = form.querySelector(".submit-btn");
const addProjectButton = document.getElementById("add-project-btn");
const copyEntryButton = document.getElementById("copy-entry-btn");
const copyProjectsButton = document.getElementById("copy-projects-btn");
const pendingProjectText = document.getElementById("pending-project");
const projectsNameList = document.getElementById("projects-name-list");

let selectedKmlFile = null;
let projectsList = [];
let latestProjectEntry = null;
let pendingProjectSlug = null;

const GEOMETRY_NAMES = new Set(["Point", "LineString", "Polygon", "MultiGeometry"]);
const PROJECTS_STORAGE_KEY = "kml-projects-json-cache-v1";

function setStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`.trim();
}

function sanitizeName(value, fallback) {
  const cleaned = value
    .trim()
    .replace(/Ä/g, "Ae")
    .replace(/Ö/g, "Oe")
    .replace(/Ü/g, "Ue")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || fallback;
}

function getProjectsJsonText() {
  return JSON.stringify(projectsList, null, 2);
}

function saveProjectsToStorage() {
  try {
    localStorage.setItem(PROJECTS_STORAGE_KEY, getProjectsJsonText());
  } catch (_error) {
    // Ignore storage errors (private mode/full quota).
  }
}

function loadProjectsFromStorage() {
  try {
    const raw = localStorage.getItem(PROJECTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        name: String(item.name ?? "").trim(),
        path: String(item.path ?? "").trim(),
      }))
      .filter((item) => item.name && item.path);
  } catch (_error) {
    return [];
  }
}

function renderProjectNameList() {
  projectsNameList.replaceChildren();

  if (projectsList.length === 0) {
    const item = document.createElement("li");
    item.className = "empty";
    item.textContent = "Noch keine Projekte in _projects.json.";
    projectsNameList.append(item);
    return;
  }

  for (const itemData of projectsList) {
    const item = document.createElement("li");
    item.textContent = itemData.name;
    projectsNameList.append(item);
  }
}

function renderProjectsView() {
  if (pendingProjectSlug) {
    pendingProjectText.textContent = `Neues ZIP: ${pendingProjectSlug}. Optional zur _projects.json hinzufügen.`;
  } else {
    pendingProjectText.textContent = "Kein neues Projekt zum Hinzufügen.";
  }

  addProjectButton.disabled = !pendingProjectSlug;
  copyEntryButton.disabled = !latestProjectEntry;
  copyProjectsButton.disabled = projectsList.length === 0;
  renderProjectNameList();
}

function upsertProjectEntry(projectSlug) {
  const entry = {
    name: projectSlug,
    path: `_projekte/${projectSlug}`,
  };

  const existingIndex = projectsList.findIndex(
    (item) => item.name === entry.name || item.path === entry.path,
  );
  if (existingIndex >= 0) {
    projectsList[existingIndex] = entry;
  } else {
    projectsList.push(entry);
  }

  saveProjectsToStorage();
  latestProjectEntry = entry;
  renderProjectsView();
}

function setPendingProject(projectSlug) {
  pendingProjectSlug = projectSlug || null;
  renderProjectsView();
}

async function loadProjectsJson() {
  try {
    const response = await fetch("./_projects.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const parsed = await response.json();
    if (!Array.isArray(parsed)) {
      throw new Error("Ungültiges Format");
    }

    projectsList = parsed
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        name: String(item.name ?? "").trim(),
        path: String(item.path ?? "").trim(),
      }))
      .filter((item) => item.name && item.path);
    saveProjectsToStorage();
  } catch (_error) {
    projectsList = loadProjectsFromStorage();
    if (projectsList.length > 0) {
      setStatus("Hinweis: _projects.json aus dem Browser-Cache geladen.");
    } else {
      setStatus(
        "Hinweis: _projects.json konnte nicht automatisch geladen werden. Nach Erstellung kannst du den Inhalt kopieren.",
      );
    }
  } finally {
    renderProjectsView();
  }
}

async function copyTextToClipboard(text, successLabel) {
  if (!text) {
    setStatus("Es gibt nichts zu kopieren.", "error");
    return;
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
  } else {
    const helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "absolute";
    helper.style.left = "-9999px";
    document.body.append(helper);
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }

  setStatus(`${successLabel} wurde in die Zwischenablage kopiert.`, "success");
}

function stringOrDefault(value, fallback) {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function nullableOrDefault(value, fallback = null) {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function getCollectionName(fileName) {
  const base = getFileBaseName(fileName).trim();
  if (!base) {
    return "KML_Konvertierung";
  }
  return base.replace(/\s+/g, "_");
}

function extractDownloadToken(value) {
  const input = String(value ?? "").trim();
  if (!input) {
    return "";
  }

  const fromPath = (path) => {
    const match = path.match(/\/s\/([^/?#]+)/i);
    return match ? match[1] : "";
  };

  try {
    const url = new URL(input);
    const token = fromPath(url.pathname);
    if (token) {
      return token;
    }
  } catch (_error) {
    // Keep fallback parsing below for raw strings.
  }

  const fallbackToken = fromPath(input);
  return fallbackToken || input;
}

function getFileBaseName(fileName) {
  return fileName.replace(/\.[^.]+$/, "");
}

function parseCoordinateTuple(rawTuple) {
  const parts = rawTuple.split(",").map((value) => Number(value));
  const [longitude, latitude, altitude] = parts;

  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return null;
  }

  return Number.isFinite(altitude) ? [longitude, latitude, altitude] : [longitude, latitude];
}

function parseCoordinateList(coordinatesNode) {
  if (!coordinatesNode) {
    return [];
  }

  return coordinatesNode.textContent
    .trim()
    .split(/\s+/)
    .map((tuple) => parseCoordinateTuple(tuple))
    .filter(Boolean);
}

function getDirectChildByName(node, localName) {
  return Array.from(node.children).find((child) => child.localName === localName) || null;
}

function getDirectChildrenByName(node, localName) {
  return Array.from(node.children).filter((child) => child.localName === localName);
}

function getFirstDescendantByName(node, localName) {
  return node.getElementsByTagNameNS("*", localName)[0] || null;
}

function getFirstDirectText(node, localName) {
  const child = getDirectChildByName(node, localName);
  return child ? child.textContent.trim() : "";
}

function getFirstDescendantText(node, localName) {
  const child = getFirstDescendantByName(node, localName);
  return child ? child.textContent.trim() : "";
}

function parseExtendedDataMap(placemark) {
  const extendedData = getDirectChildByName(placemark, "ExtendedData");
  if (!extendedData) {
    return {};
  }

  const dataMap = {};
  const dataNodes = Array.from(extendedData.getElementsByTagNameNS("*", "Data"));
  for (const dataNode of dataNodes) {
    const key = dataNode.getAttribute("name");
    if (!key) {
      continue;
    }

    const valueNode = getFirstDescendantByName(dataNode, "value");
    dataMap[key] = valueNode ? valueNode.textContent.trim() : "";
  }

  const simpleDataNodes = Array.from(extendedData.getElementsByTagNameNS("*", "SimpleData"));
  for (const simpleDataNode of simpleDataNodes) {
    const key = simpleDataNode.getAttribute("name");
    if (!key) {
      continue;
    }

    dataMap[key] = simpleDataNode.textContent.trim();
  }

  return dataMap;
}

function parseLinearRingCoordinates(node) {
  const ring = node.localName === "LinearRing" ? node : getFirstDescendantByName(node, "LinearRing");
  if (!ring) {
    return null;
  }

  const coordinates = parseCoordinateList(getFirstDescendantByName(ring, "coordinates"));
  return coordinates.length >= 4 ? coordinates : null;
}

function parsePoint(pointNode) {
  const coordinates = parseCoordinateList(getFirstDescendantByName(pointNode, "coordinates"));
  if (coordinates.length === 0) {
    return null;
  }
  return { type: "Point", coordinates: coordinates[0] };
}

function parseLineString(lineStringNode) {
  const coordinates = parseCoordinateList(getFirstDescendantByName(lineStringNode, "coordinates"));
  if (coordinates.length < 2) {
    return null;
  }
  return { type: "LineString", coordinates };
}

function parsePolygon(polygonNode) {
  const outerBoundary = getDirectChildByName(polygonNode, "outerBoundaryIs");
  const outerRing = outerBoundary
    ? parseLinearRingCoordinates(outerBoundary)
    : parseLinearRingCoordinates(polygonNode);

  if (!outerRing) {
    return null;
  }

  const holes = getDirectChildrenByName(polygonNode, "innerBoundaryIs")
    .map((inner) => parseLinearRingCoordinates(inner))
    .filter(Boolean);

  return {
    type: "Polygon",
    coordinates: [outerRing, ...holes],
  };
}

function parseGeometryFromNode(node) {
  switch (node.localName) {
    case "Point":
      return parsePoint(node);
    case "LineString":
      return parseLineString(node);
    case "Polygon":
      return parsePolygon(node);
    case "MultiGeometry": {
      const geometries = Array.from(node.children)
        .filter((child) => GEOMETRY_NAMES.has(child.localName))
        .map((child) => parseGeometryFromNode(child))
        .filter(Boolean);

      if (geometries.length === 0) {
        return null;
      }

      if (geometries.length === 1) {
        return geometries[0];
      }

      return {
        type: "GeometryCollection",
        geometries,
      };
    }
    default:
      return null;
  }
}

function parsePlacemarkProperties(placemark, index) {
  const extended = parseExtendedDataMap(placemark);
  const name = getFirstDirectText(placemark, "name");
  const description = getFirstDirectText(placemark, "description");
  const timestamp = getFirstDescendantText(placemark, "when");
  const begin = getFirstDescendantText(placemark, "begin");
  const end = getFirstDescendantText(placemark, "end");
  const altitudeMode = getFirstDescendantText(placemark, "altitudeMode");
  const tessellate = getFirstDescendantText(placemark, "tessellate");
  const extrude = getFirstDescendantText(placemark, "extrude");
  const visibility = getFirstDescendantText(placemark, "visibility");
  const drawOrder = getFirstDescendantText(placemark, "drawOrder");
  const icon = getFirstDescendantText(placemark, "href");

  return {
    id: stringOrDefault(extended.id ?? placemark.getAttribute("id"), "NULL"),
    Name: stringOrDefault(extended.Name ?? name, `Objekt ${index + 1}`),
    description: stringOrDefault(extended.description ?? description, "NULL"),
    timestamp: stringOrDefault(extended.timestamp ?? timestamp, "NULL"),
    begin: stringOrDefault(extended.begin ?? begin, "NULL"),
    end: stringOrDefault(extended.end ?? end, "NULL"),
    altitudeMode: stringOrDefault(extended.altitudeMode ?? altitudeMode, "NULL"),
    tessellate: stringOrDefault(extended.tessellate ?? tessellate, "-1"),
    extrude: stringOrDefault(extended.extrude ?? extrude, "0"),
    visibility: stringOrDefault(extended.visibility ?? visibility, "-1"),
    drawOrder: stringOrDefault(extended.drawOrder ?? drawOrder, "NULL"),
    icon: stringOrDefault(extended.icon ?? icon, "NULL"),
    color: stringOrDefault(extended.color, "#ff9e17"),
    fillColor: stringOrDefault(extended.fillColor ?? extended.fillcolor, "#ff9e17"),
    opacity: stringOrDefault(extended.opacity, "1.0"),
    weight: stringOrDefault(extended.weight, "1"),
    svg: nullableOrDefault(extended.svg),
    size: nullableOrDefault(extended.size),
    label_text: nullableOrDefault(extended.label_text ?? extended.labelText),
  };
}

function parseKmlToGeoJSON(kmlText, sourceFileName) {
  const xml = new DOMParser().parseFromString(kmlText, "application/xml");
  const parserError = xml.querySelector("parsererror");
  if (parserError) {
    throw new Error("KML konnte nicht gelesen werden (XML Fehler).");
  }

  const placemarks = Array.from(xml.getElementsByTagNameNS("*", "Placemark"));
  if (placemarks.length === 0) {
    throw new Error("Keine Placemark-Geometrien in der KML gefunden.");
  }

  const features = placemarks
    .map((placemark, index) => {
      const geometryNode = Array.from(placemark.children).find((child) =>
        GEOMETRY_NAMES.has(child.localName),
      );

      if (!geometryNode) {
        return null;
      }

      const geometry = parseGeometryFromNode(geometryNode);
      if (!geometry) {
        return null;
      }

      return {
        type: "Feature",
        properties: parsePlacemarkProperties(placemark, index),
        geometry,
      };
    })
    .filter(Boolean);

  if (features.length === 0) {
    throw new Error("Es konnten keine unterstützten Geometrien konvertiert werden.");
  }

  return {
    type: "FeatureCollection",
    name: getCollectionName(sourceFileName),
    crs: {
      type: "name",
      properties: {
        name: "urn:ogc:def:crs:OGC:1.3:CRS84",
      },
    },
    features,
  };
}

function setSelectedFile(file) {
  if (!file) {
    return;
  }

  if (!file.name.toLowerCase().endsWith(".kml")) {
    setStatus("Bitte eine Datei mit Endung .kml auswählen.", "error");
    return;
  }

  selectedKmlFile = file;
  fileNameText.textContent = `Ausgewählt: ${file.name}`;
  setStatus("");
}

async function buildZipPackage(formData) {
  if (typeof JSZip === "undefined") {
    throw new Error("JSZip ist nicht geladen. Bitte Seite neu laden.");
  }

  if (!selectedKmlFile) {
    throw new Error("Bitte zuerst eine KML-Datei auswählen.");
  }

  const projectNameRaw = String(formData.get("projectName")).trim();
  if (!projectNameRaw) {
    throw new Error("Bitte einen Projektnamen eintragen.");
  }
  const projectName = sanitizeName(projectNameRaw, "projektname");
  const statusUrl = String(formData.get("statusUrl")).trim();
  const downloadTokenRaw = String(formData.get("downloadToken")).trim();
  const downloadToken = extractDownloadToken(downloadTokenRaw);
  const baubeginn = String(formData.get("baubeginn")).trim();

  const kmlContent = await selectedKmlFile.text();
  const geojson = parseKmlToGeoJSON(kmlContent, selectedKmlFile.name);

  const geojsonFileBase = sanitizeName(getFileBaseName(selectedKmlFile.name), "daten");
  const geojsonFileName = `${geojsonFileBase}.geojson`;

  const statusJson = {
    statusUrl,
    status: "Neu",
    downloadToken,
    baubeginn,
  };

  const manifestJson = [geojsonFileName];

  const zip = new JSZip();
  zip.file(`${projectName}/status.json`, JSON.stringify(statusJson, null, 2));
  zip.file(`${projectName}/data/geojson-manifest.json`, JSON.stringify(manifestJson, null, 2));
  zip.file(`${projectName}/data/${geojsonFileName}`, JSON.stringify(geojson, null, 2));

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${projectName}.zip`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  return {
    projectName,
  };
}

dropzone.addEventListener("click", () => fileInput.click());

dropzone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    fileInput.click();
  }
});

fileInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  setSelectedFile(file);
});

dropzone.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropzone.classList.add("active");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("active");
});

dropzone.addEventListener("drop", (event) => {
  event.preventDefault();
  dropzone.classList.remove("active");
  const file = event.dataTransfer?.files?.[0];
  setSelectedFile(file);
});

addProjectButton.addEventListener("click", () => {
  if (!pendingProjectSlug) {
    setStatus("Es gibt aktuell kein neues Projekt zum Hinzufügen.", "error");
    return;
  }

  upsertProjectEntry(pendingProjectSlug);
  setPendingProject(null);
  setStatus(`Projekt ${latestProjectEntry.name} wurde zu _projects.json hinzugefügt.`, "success");
});

copyEntryButton.addEventListener("click", async () => {
  try {
    await copyTextToClipboard(JSON.stringify(latestProjectEntry, null, 2), "Eintrag");
  } catch (_error) {
    setStatus("Kopieren des Eintrags ist fehlgeschlagen.", "error");
  }
});

copyProjectsButton.addEventListener("click", async () => {
  try {
    await copyTextToClipboard(getProjectsJsonText(), "_projects.json");
  } catch (_error) {
    setStatus("Kopieren von _projects.json ist fehlgeschlagen.", "error");
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!form.reportValidity()) {
    return;
  }

  submitButton.disabled = true;
  setStatus("Erzeuge ZIP ...");

  try {
    const formData = new FormData(form);
    const result = await buildZipPackage(formData);
    setPendingProject(result.projectName);
    setStatus("ZIP erstellt. Du kannst das Projekt jetzt optional zu _projects.json hinzufügen.", "success");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Unbekannter Fehler.", "error");
  } finally {
    submitButton.disabled = false;
  }
});

loadProjectsJson();
