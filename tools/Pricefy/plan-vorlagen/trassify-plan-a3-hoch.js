(function initTrassifyPlanA3HochTemplate(globalScope) {
  const scope = globalScope || window;
  const registry = (scope.projectPlanTemplateRegistry = scope.projectPlanTemplateRegistry || {});

  const PAGE_SIZE = { width: 297, height: 420 };
  const MAP_FRAME = { x: 5, y: 5, width: 287, height: 330 };
  const DIVIDER_COLOR = [47, 47, 47];
  const TEXT_COLOR = [0, 0, 0];
  const SCANDIA_REGULAR_SOURCE = "assets/fonts/scandia.otf";
  const SCANDIA_LIGHT_SOURCE = "assets/fonts/scandia-light.otf";
  const exportIdRandomSuffixCache = new Map();

  function text(value) {
    return String(value || "").trim();
  }

  function textItem(templateText, x, y, width, height, options = {}) {
    return {
      kind: "text",
      templateText,
      position: { x, y },
      size: { width, height },
      fontSizePt: options.fontSizePt ?? 8,
      fontStyle: options.fontStyle || "normal",
      color: Array.isArray(options.color) ? options.color : TEXT_COLOR,
      lineHeightFactor: options.lineHeightFactor ?? 1.05,
      capitalization: options.capitalization ?? 0,
      hAlign: options.hAlign || "left",
      vAlign: options.vAlign || "middle",
      renderMode: options.renderMode || "raster",
      webFontFamily: options.webFontFamily || "Scandia",
      webFontWeight: options.webFontWeight ?? 400,
      webFontStyle: options.webFontStyle || "normal",
      webFontSource: options.webFontSource || SCANDIA_REGULAR_SOURCE
    };
  }

  function infoBlockItem(x, y, width, height, options = {}) {
    return {
      kind: "infoBlock",
      position: { x, y },
      size: { width, height },
      sections: Array.isArray(options.sections) ? options.sections : [],
      labelFontSizePt: options.labelFontSizePt ?? 7.4,
      valueFontSizePt: options.valueFontSizePt ?? 8.4,
      labelLineHeightFactor: options.labelLineHeightFactor ?? 1,
      valueLineHeightFactor: options.valueLineHeightFactor ?? 1.08,
      labelGapMm: options.labelGapMm ?? 0.55,
      sectionGapMm: options.sectionGapMm ?? 1.7,
      labelColor: Array.isArray(options.labelColor) ? options.labelColor : TEXT_COLOR,
      valueColor: Array.isArray(options.valueColor) ? options.valueColor : TEXT_COLOR,
      labelFontFamily: options.labelFontFamily || "Scandia",
      labelFontWeight: options.labelFontWeight ?? 400,
      labelFontStyle: options.labelFontStyle || "normal",
      labelFontSource: options.labelFontSource || SCANDIA_REGULAR_SOURCE,
      valueFontFamily: options.valueFontFamily || "Scandia Light",
      valueFontWeight: options.valueFontWeight ?? 300,
      valueFontStyle: options.valueFontStyle || "normal",
      valueFontSource: options.valueFontSource || SCANDIA_LIGHT_SOURCE
    };
  }

  function divider(x, y, width, height = 0.15, color = DIVIDER_COLOR) {
    return {
      kind: "shape",
      position: { x, y },
      size: { width, height },
      fillColor: color
    };
  }

  function pictureItem(source, x, y, width, height) {
    return {
      kind: "picture",
      source,
      position: { x, y },
      size: { width, height }
    };
  }

  function joinTextParts(parts, fallback = "-") {
    const values = parts.map(text).filter(Boolean);
    return values.length ? values.join(" ") : fallback;
  }

  function formatDateGerman(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "-";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    return `${day}.${month}.${year}`;
  }

  function getTodayDateLabel() {
    return formatDateGerman(new Date());
  }

  function getTodayIdPrefix() {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  }

  function buildProjectLine(meta, fallback = "-") {
    return joinTextParts([meta?.kst || meta?.costCenter, meta?.projektname], fallback);
  }

  function buildExportId(meta) {
    const costCenter = text(meta?.kst || meta?.costCenter);
    if (costCenter) {
      return `ID: ${costCenter}`;
    }
    const prefix = getTodayIdPrefix();
    const cacheKey =
      [
        prefix,
        text(meta?.projektname),
        text(meta?.kunde || meta?.customer),
        text(meta?.auftraggeber)
      ]
        .filter(Boolean)
        .join("|") || prefix;
    let suffix = exportIdRandomSuffixCache.get(cacheKey);
    if (!suffix) {
      suffix = String(Math.floor(Math.random() * 100)).padStart(2, "0");
      exportIdRandomSuffixCache.set(cacheKey, suffix);
    }
    return `ID: ${prefix}${suffix}`;
  }

  function normalizeTextOutput(value, helpers) {
    if (helpers && typeof helpers.normalizeText === "function") {
      return String(helpers.normalizeText(value));
    }
    return String(value || "");
  }

  registry["trassify-plan-a3-hoch"] = {
    id: "trassify-plan-a3-hoch",
    label: "Trassify Plan A3 hoch",
    paperSize: "A3",
    orientation: "portrait",
    definition: {
      pageSize: PAGE_SIZE,
      mapFrame: MAP_FRAME,
      items: [
        {
          kind: "scaleBar",
          position: { x: 10.002, y: 320.6 },
          size: { width: 62, height: 5.61186 },
          renderMode: "raster",
          maxBarWidthMm: 50,
          barHeightMm: 1.5,
          segments: 2,
          labelColor: [29, 29, 27],
          strokeColor: [29, 29, 27],
          darkColor: [29, 29, 27],
          lightColor: [255, 255, 255],
          scaleFontSizePt: 7,
          distanceFontSizePt: 6.4,
          scaleLabelFontFamily: "Scandia",
          scaleLabelFontWeight: 400,
          scaleLabelFontSource: SCANDIA_REGULAR_SOURCE,
          distanceLabelFontFamily: "Scandia",
          distanceLabelFontWeight: 400,
          distanceLabelFontSource: SCANDIA_REGULAR_SOURCE
        },
        textItem("{{BASEMAP_LICENSE}}", 10.002, 327.4, 145.783, 2.89994, {
          fontSizePt: 5.3,
          lineHeightFactor: 1,
          color: [80, 80, 80],
          vAlign: "middle"
        }),

        textItem("Lageplan", 5.18744, 347.4, 65.0686, 6.2, {
          fontSizePt: 15.5,
          lineHeightFactor: 1,
          renderMode: "raster",
          preferPdfForExtendedChars: true,
          webFontFamily: "Scandia Light",
          webFontWeight: 300,
          webFontSource: SCANDIA_LIGHT_SOURCE
        }),
        textItem("{{LOCATION}}", 5.18744, 353.15, 65.0686, 6, {
          fontSizePt: 10.5,
          lineHeightFactor: 1,
          color: [156, 156, 156],
          capitalization: 1,
          vAlign: "middle"
        }),
        divider(5, 341.245, 287),
        {
          kind: "northArrow",
          position: { x: 41.641, y: 373.493 },
          size: { width: 22.0761, height: 22.1707 },
          source: "plan-vorlagen/nordpfeil-kreis.svg",
          strokeColor: [29, 29, 27],
          fillColor: [255, 255, 255],
          label: "N",
          labelFontSizePt: 12,
          labelFontFamily: "Scandia",
          labelFontWeight: 400,
          labelFontStyle: "normal",
          labelFontSource: SCANDIA_REGULAR_SOURCE
        },
        divider(5.00201, 362.094, 65.0707),
        textItem("PLAN", 5.00201, 362.644, 65.0686, 5.17392, {
          fontSizePt: 8
        }),
        divider(5, 367.343, 65.0707),
        textItem("{{EXPORT_ID}}", 5.229, 373.493, 44.2814, 4.04091, {
          fontSizePt: 8
        }),
        textItem("DIN A3", 5.229, 378.643, 30.2814, 4.04091, {
          fontSizePt: 8
        }),
        textItem("{{SCALE}}", 5.229, 383.793, 44.2814, 4.04091, {
          fontSizePt: 8
        }),
        textItem("{{EXPORT_DATE}}", 5.229, 388.943, 44.2814, 4.04091, {
          fontSizePt: 8
        }),
        divider(93.001, 362.094, 111),
        textItem("INFOS", 93.001, 362.644, 111, 5.17392, {
          fontSizePt: 8
        }),
        divider(93.001, 367.343, 111),
        {
          kind: "infoColumnsBlock",
          position: { x: 93.001, y: 373.493 },
          size: { width: 111, height: 41.4 },
          columnGapMm: 1.5,
          footerGapMm: 1.4,
          labelGapMm: 0.8,
          sectionGapMm: 1.4,
          labelFontSizePt: 7.4,
          valueFontSizePt: 8.4,
          labelLineHeightFactor: 1,
          valueLineHeightFactor: 1.08,
          labelColor: [0, 0, 0],
          valueColor: [0, 0, 0],
          labelFontFamily: "Scandia",
          labelFontWeight: 400,
          labelFontStyle: "normal",
          labelFontSource: SCANDIA_REGULAR_SOURCE,
          valueFontFamily: "Scandia Light",
          valueFontWeight: 300,
          valueFontStyle: "normal",
          valueFontSource: SCANDIA_LIGHT_SOURCE,
          leftSections: [
            { label: "Baubeginn", field: "baubeginn" },
            { label: "Bauende", field: "bauende" },
            { label: "Auftraggeber", field: "auftraggeber" }
          ],
          rightSections: [
            { label: "Bauausführendes Unternehmen", field: "bauausfuehrendesUnternehmen" },
            { label: "Art der Tätigkeit", field: "artDerTaetigkeit" },
            { label: "Bauleitung", field: "bauleitung" },
            { label: "Kontakt Bauleitung", field: "kontaktBauleitung" }
          ],
          footerSections: [
            { label: "Projektbeschreibung", field: "beschreibung" }
          ]
        },
        divider(226.929, 362.094, 65.0707),
        textItem("Anfrage durch", 226.929, 362.644, 65.0686, 5.17392, {
          fontSizePt: 8,
          capitalization: 1,
          lineHeightFactor: 1,
          vAlign: "middle"
        }),
        divider(226.927, 367.343, 65.0707),
        textItem("Trassify GmbH", 226.927, 372.493, 65.0686, 4.2, {
          fontSizePt: 8.5,
          lineHeightFactor: 1
        }),
        textItem("Ostparkstraße 37\n60385 Frankfurt am Main", 226.927, 377.567, 36.899, 8.2, {
          vAlign: "top",
          lineHeightFactor: 1.1,
          fontSizePt: 8
        }),
        textItem("+49 151 53284985\ninfo@trassify.de", 226.927, 387.147, 36.899, 7.6, {
          vAlign: "top",
          lineHeightFactor: 1.1,
          fontSizePt: 8
        }),
        pictureItem("assets/img/trassify-logo.svg", 226.927, 398.056, 30.2669, 8.46955)
      ]
    },
    getPdfName(baseName) {
      return `${baseName}-trassify-plan-a3-hoch.pdf`;
    },
    resolveText({ templateText, meta, helpers }) {
      const raw = String(templateText || "");
      const trimmed = raw.trim();
      if (!trimmed) return "";

      const planTitle =
        (helpers && typeof helpers.getPlanTitle === "function" && text(helpers.getPlanTitle())) ||
        "Lageplan";
      const scaleLabel =
        (helpers && typeof helpers.getScaleLabel === "function" && text(helpers.getScaleLabel())) ||
        "1:1000";
      const todayLabel = getTodayDateLabel();
      if (trimmed === "Lageplan") {
        return normalizeTextOutput(planTitle, helpers);
      }

      const replacements = [
        ["{{LOCATION}}", buildProjectLine(meta)],
        ["{{SCALE}}", `Maßstab ${scaleLabel}`],
        ["{{EXPORT_ID}}", buildExportId(meta)],
        ["{{EXPORT_DATE}}", text(meta?.datum) || todayLabel],
        ["{{BASEMAP_LICENSE}}", (helpers?.getBasemapLicenseText?.() || " ").trim() || " "]
      ];

      let output = raw;
      replacements.forEach(([token, value]) => {
        output = output.split(token).join(String(value));
      });
      output = output.replace(/&lt;br\s*\/?>/gi, "\n").replace(/<br\s*\/?>/gi, "\n");
      return normalizeTextOutput(output, helpers);
    }
  };
})(window);
