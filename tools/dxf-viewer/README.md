# DXF Viewer (XAMPP)

Kleine Web-App fur einen CAD-Viewer mit Live-Ansicht:

- `DXF`: CAD-kompatibel per WebGL (standardmassig) mit HiDPI-Schriftbild
- `DWG`/weitere CAD-Formate: uber `convert.php` nach DXF konvertieren
- `Objekttypen + Layer links`: sortieren, einzeln ein-/ausblenden oder global alle/keine
- Upload direkt im Canvas per Drag & Drop
- Globales Drop-Overlay erscheint sichtbar, sobald eine Datei uber die Seite gezogen wird
- Export der aktuell gefilterten Auswahl als `GeoJSON` fur QGIS (`Export fur QGIS`)

## Start

1. Stelle sicher, dass Apache in XAMPP lauft.
2. Rufe im Browser auf: `http://localhost/dxf-viewer/`
3. Ziehe eine CAD-Datei direkt in den Viewer (rechte Seite).
4. Filtere bei Bedarf links nach Typ und Layer.
5. Exportiere die sichtbare Auswahl als GeoJSON und lade sie in QGIS.
6. Fur einen Schnelltest kannst du `sample.dxf` laden.

## Architektur

- Frontend: `index.html`, `styles.css`, `app.js`
- DXF Rendering: `WebGL` (CAD-kompatibel)
- Parser/Libs: `dxf-parser` + `three.js` + `three-dxf` (CDN)
- Conversion-Endpoint: `convert.php` (aktuell Stub mit HTTP 501)

## DWG und andere Formate aktivieren

Implementiere in `convert.php`:

1. Upload temporar speichern
2. Externen Converter aufrufen (z.B. ODA File Converter oder eigenen Service)
3. Ergebnis als DXF einlesen
4. JSON zuruckgeben:

```json
{
  "dxfText": "0\nSECTION\n..."
}
```
