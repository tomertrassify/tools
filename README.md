# Tools Trassify

Ein statisches Dashboard fuer mehrere voneinander getrennte Online-Tools.

## Lokal starten

```bash
python3 app.py
```

Das erzeugt zuerst `tools.json` und startet danach einen statischen Server auf `http://127.0.0.1:8000`.

## Fuer Netlify

- `index.html` liegt direkt im Projekt-Root.
- Die Dashboard-Daten liegen in `tools.json`.
- `netlify.toml` laesst Netlify vor jedem Deploy automatisch `tools.json` neu erzeugen.

Wenn du per Drag-and-Drop deployest statt per Git-Deploy, vorher einmal lokal ausfuehren:

```bash
python3 app.py --build-only
```

## Neue Tools anlegen

Jedes Tool bekommt einen eigenen Ordner unter `tools/`.

Beispiel:

```text
tools/
  mein-tool/
    index.html
    tool.json
    style.css
    app.js
```

Minimal noetig:

- `index.html`

Optional empfohlen:

- `tool.json`

Wenn keine `tool.json` vorhanden ist, nimmt das Dashboard automatisch den `<title>` aus der `index.html` als Namen und verwendet Standardwerte fuer den Rest.

### `tool.json` optional

```json
{
  "name": "Mein Tool",
  "description": "Kurze Beschreibung fuer die Uebersicht",
  "category": "Kategorie",
  "icon": "M",
  "order": 10
}
```

Optionale Felder:

- `name`
- `description`
- `category`
- `icon`
- `order`

## Verhalten

- Das Dashboard erkennt alle Tool-Ordner automatisch.
- Jedes Tool wird unter `/tools/<slug>/` ausgeliefert.
- Assets innerhalb eines Tool-Ordners koennen relativ eingebunden werden.
- Tools bleiben voneinander getrennt, solange jedes Tool seine Dateien im eigenen Ordner behaelt.
