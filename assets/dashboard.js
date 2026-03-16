const toolGrid = document.querySelector("#tool-grid");
const template = document.querySelector("#tool-card-template");

function resolveToolPath(rawPath) {
  const path = String(rawPath || "").trim();
  if (!path) {
    return "#";
  }

  const dashboardBaseUrl = new URL("./", window.location.href);
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return new URL(normalizedPath, dashboardBaseUrl).toString();
}

function renderEmptyState(message) {
  toolGrid.innerHTML = "";
  const emptyState = document.createElement("div");
  emptyState.className = "empty-state";
  emptyState.innerHTML = `<strong>${message}</strong>`;
  toolGrid.appendChild(emptyState);
}

function renderTools(tools) {
  toolGrid.innerHTML = "";

  if (!tools.length) {
    renderEmptyState("Noch keine Tools gefunden.");
    return;
  }

  for (const tool of tools) {
    const visualOrder = Number.isFinite(Number(tool.order))
      ? Number(tool.order)
      : tools.indexOf(tool) + 1;
    const fragment = template.content.cloneNode(true);
    const card = fragment.querySelector(".tool-card");
    fragment.querySelector(".tool-icon").textContent = tool.icon || "T";
    fragment.querySelector(".tool-order").textContent = String(visualOrder).padStart(2, "0");
    fragment.querySelector(".tool-category").textContent = tool.category;
    fragment.querySelector(".tool-name").textContent = tool.name;
    fragment.querySelector(".tool-description").textContent =
      tool.description || "Ohne Beschreibung";
    card.href = resolveToolPath(tool.path);
    card.setAttribute("aria-label", `${tool.name} oeffnen`);
    toolGrid.appendChild(fragment);
  }
}

async function loadTools() {
  try {
    const response = await fetch("./tools.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const tools = await response.json();
    if (!Array.isArray(tools)) {
      throw new Error("Ungueltiges tools.json Format");
    }

    renderTools(tools);
  } catch (_error) {
    renderEmptyState("Tool-Liste konnte nicht geladen werden.");
  }
}

loadTools();
