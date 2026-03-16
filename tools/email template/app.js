const TEMPLATE_PATH = "./plananfrage_tpl.eml";
const PLACEHOLDER_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;
const SPLIT_PLACEHOLDER_PATTERN =
  /\{\{(?:<\/span>\s*<span[^>]*>\s*)+([a-zA-Z0-9_]+)\s*\}\}/gi;

const jsonInput = document.querySelector("#jsonFile");
const dropzone = document.querySelector("#dropzone");
const downloadBtn = document.querySelector("#downloadBtn");
const statusEl = document.querySelector("#status");

let templateRaw = "";
let templateKeys = [];
let generatedEml = "";
let suggestedFilename = "plananfrage_filled.eml";

async function init() {
  try {
    const response = await fetch(TEMPLATE_PATH, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    templateRaw = await response.text();
    templateKeys = detectPlaceholders(templateRaw);
    setStatus("Vorlage geladen. JSON hochladen oder per Drag and Drop ablegen.");
  } catch (error) {
    setStatus(
      "Vorlage konnte nicht geladen werden. Starte die Seite über einen lokalen Webserver.",
      true
    );
    console.error(error);
  }
}

function detectPlaceholders(template) {
  const keys = new Set();

  for (const match of template.matchAll(PLACEHOLDER_PATTERN)) {
    keys.add(match[1]);
  }

  for (const match of template.matchAll(SPLIT_PLACEHOLDER_PATTERN)) {
    keys.add(match[1]);
  }

  return [...keys].sort();
}

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("is-error", isError);
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildFlexibleKeyPattern(key) {
  return key
    .split("")
    .map((char) => `${escapeRegExp(char)}(?:=\\r?\\n)?`)
    .join("");
}

function normalizeValue(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

function buildMimeEncodedHeader(text) {
  const utf8 = new TextEncoder().encode(text);
  let binary = "";
  utf8.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return `=?UTF-8?B?${btoa(binary)}?=`;
}

function replaceHeader(raw, headerName, value) {
  const headerPattern = new RegExp(
    `^${escapeRegExp(headerName)}:[^\\r\\n]*(?:\\r?\\n[ \\t].*)*`,
    "mi"
  );

  if (headerPattern.test(raw)) {
    return raw.replace(headerPattern, `${headerName}: ${value}`);
  }

  const separatorMatch = raw.match(/\r?\n\r?\n/);
  if (!separatorMatch || separatorMatch.index === undefined) {
    return `${headerName}: ${value}\n${raw}`;
  }

  const splitAt = separatorMatch.index;
  return `${raw.slice(0, splitAt)}\n${headerName}: ${value}${raw.slice(splitAt)}`;
}

function replacePlaceholders(raw, values) {
  let output = raw;
  const keys = Object.keys(values);

  keys.forEach((key) => {
    const value = normalizeValue(values[key]);
    const keyPattern = buildFlexibleKeyPattern(key);

    output = output.replace(
      new RegExp(`\\{\\{\\s*${keyPattern}\\s*\\}\\}`, "g"),
      value
    );

    output = output.replace(
      new RegExp(
        `\\{\\{(?:=\\r?\\n\\s*)?(?:<\\/span>\\s*(?:=\\r?\\n\\s*)?<span[^>]*>\\s*(?:=\\r?\\n\\s*)?)+${keyPattern}\\s*\\}\\}`,
        "gi"
      ),
      value
    );
  });

  return output;
}

function parseJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          reject(new Error("JSON muss ein Objekt sein (kein Array)."));
          return;
        }
        resolve(parsed);
      } catch (error) {
        reject(new Error("Ungültige JSON-Datei."));
      }
    };

    reader.onerror = () => reject(new Error("Datei konnte nicht gelesen werden."));
    reader.readAsText(file, "utf-8");
  });
}

function createSubject(data) {
  const costCenter = normalizeValue(data.costCenter).trim();
  const projectName = normalizeValue(data.projectName).trim();
  const tail = [costCenter, projectName].filter(Boolean).join(" ");
  const base = "Planauskunft für Projekt";
  return tail ? `${base} - ${tail}` : base;
}

function createDownloadName(data) {
  const projectName = normalizeValue(data.projectName).trim() || "projekt";
  const safe = projectName
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/gi, "_")
    .replace(/^_+|_+$/g, "");
  return `${safe || "plananfrage"}_filled.eml`;
}

async function processUploadedFile(file) {
  if (!templateRaw) {
    setStatus("Vorlage fehlt. Seite über lokalen Webserver starten.", true);
    return;
  }

  if (!file) {
    return;
  }

  generatedEml = "";
  downloadBtn.disabled = true;

  try {
    setStatus(`JSON wird verarbeitet: ${file.name}`);
    const json = await parseJsonFile(file);

    const values = {};
    templateKeys.forEach((key) => {
      values[key] = normalizeValue(json[key]);
    });

    Object.keys(json).forEach((key) => {
      if (!(key in values)) {
        values[key] = normalizeValue(json[key]);
      }
    });

    let filled = replacePlaceholders(templateRaw, values);

    const subject = createSubject(json);
    const encodedSubject = buildMimeEncodedHeader(subject);
    filled = replaceHeader(filled, "Subject", encodedSubject);
    filled = replaceHeader(filled, "Thread-Topic", encodedSubject);

    generatedEml = filled;
    suggestedFilename = createDownloadName(json);
    downloadBtn.disabled = false;

    const missingKeys = templateKeys.filter(
      (key) => !(key in json) || json[key] === null || json[key] === undefined
    );

    triggerDownload();

    if (missingKeys.length > 0) {
      setStatus(
        `EML erzeugt und heruntergeladen. Fehlende Felder wurden leer gesetzt: ${missingKeys.join(
          ", "
        )}`
      );
    } else {
      setStatus("EML erfolgreich erzeugt und heruntergeladen.");
    }
  } catch (error) {
    setStatus(error.message || "Fehler bei der Verarbeitung.", true);
  }
}

function triggerDownload() {
  if (!generatedEml) {
    return;
  }

  const blob = new Blob([generatedEml], {
    type: "message/rfc822;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = suggestedFilename;
  a.click();
  URL.revokeObjectURL(url);
}

downloadBtn.addEventListener("click", () => {
  triggerDownload();
});

jsonInput.addEventListener("change", () => {
  const file = jsonInput.files?.[0];
  processUploadedFile(file);
});

["dragenter", "dragover"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropzone.classList.add("is-dragover");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    event.stopPropagation();
    dropzone.classList.remove("is-dragover");
  });
});

dropzone.addEventListener("drop", (event) => {
  const file = event.dataTransfer?.files?.[0];
  processUploadedFile(file);
});

dropzone.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    jsonInput.click();
  }
});

init();
