# EML JSON Converter

Kleines Browser-Tool zum Befuellen von `plananfrage_tpl.eml` mit Werten aus einer JSON-Datei.

## Start

```bash
cd "/Users/tomermaith/Desktop/email template"
python3 -m http.server 8080
```

Dann im Browser aufrufen:

`http://localhost:8080`

## JSON-Format

Siehe `example.json`.

Wichtige Felder:

- `costCenter`
- `projectName`
- `projectDescription`
- `siteManager`
- `siteManagerContact`
- `startDate`
