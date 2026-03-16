(function initLageplanA3QuerTemplate(globalScope) {
  const scope = globalScope || window;
  const registry = (scope.projectPlanTemplateRegistry = scope.projectPlanTemplateRegistry || {});

  const PAGE_SIZE = { width: 420, height: 297 };
  const MAP_FRAME = { x: 5, y: 5, width: 330, height: 286.999 };
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
      fontSizePt: options.fontSizePt ?? 8.5,
      fontStyle: options.fontStyle || "normal",
      color: Array.isArray(options.color) ? options.color : TEXT_COLOR,
      lineHeightFactor: options.lineHeightFactor ?? 1.1,
      capitalization: options.capitalization ?? 0,
      hAlign: options.hAlign || "left",
      vAlign: options.vAlign || "top",
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

  function joinTextParts(parts, fallback = "-") {
    const values = parts.map(text).filter(Boolean);
    return values.length ? values.join(" ") : fallback;
  }

  function formatDate(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "-";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear());
    return `${day}.${month}.${year}`;
  }

  function getTodayDateLabel() {
    return formatDate(new Date());
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

  registry["lageplan-a3-quer"] = {
    id: "lageplan-a3-quer",
    label: "Lageplan A3 quer",
    paperSize: "A3",
    orientation: "landscape",
    definition: {
      pageSize: PAGE_SIZE,
      mapFrame: MAP_FRAME,
      items: [
        divider(340.007, 5, 0.15, 286.995),

        textItem("Lageplan", 345.03, 15.6949, 58.058, 6.2, {
          fontSizePt: 15.5,
          lineHeightFactor: 1,
          renderMode: "raster",
          preferPdfForExtendedChars: true,
          webFontFamily: "Scandia Light",
          webFontWeight: 300,
          webFontSource: SCANDIA_LIGHT_SOURCE
        }),
        textItem("{{LOCATION}}", 345.091, 22.324, 58.5, 6, {
          fontSizePt: 10.5,
          lineHeightFactor: 1,
          color: [156, 156, 156],
          capitalization: 1,
          vAlign: "middle"
        }),

        divider(345.357, 40.4581, 64.644),
        textItem("Plan", 345.357, 40.5331, 64.6419, 5.2, {
          fontSizePt: 8,
          capitalization: 1,
          lineHeightFactor: 1,
          vAlign: "middle"
        }),
        divider(345.355, 45.7071, 64.644),
        textItem("{{EXPORT_ID}}", 345.357, 52.0594, 30.0828, 4.2, {
          fontSizePt: 8.4,
          lineHeightFactor: 1
        }),
        textItem("DIN A3", 345.451, 58.7706, 30.0828, 4.2, {
          fontSizePt: 8.4,
          lineHeightFactor: 1
        }),
        textItem("{{SCALE}}", 345.324, 65.0819, 38, 4.2, {
          fontSizePt: 8.4,
          lineHeightFactor: 1
        }),
        textItem("{{EXPORT_DATE}}", 345.324, 71.3932, 38, 4.2, {
          fontSizePt: 8.4,
          lineHeightFactor: 1
        }),
        {
          kind: "northArrow",
          position: { x: 387.285, y: 52.0594 },
          size: { width: 21.9313, height: 22.1707 },
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

        divider(345.218, 82.9084, 64.644),
        textItem("Infos", 345.218, 82.9834, 64.6419, 5.2, {
          fontSizePt: 8,
          capitalization: 1,
          lineHeightFactor: 1,
          vAlign: "middle"
        }),
        divider(345.216, 88.1574, 64.644),

        infoBlockItem(345.551, 93.7198, 64.8588, 145, {
          labelGapMm: 0.95,
          sectionGapMm: 2.9,
          sections: [
            { label: "Baubeginn", field: "baubeginn" },
            { label: "Bauende", field: "bauende" },
            { label: "Auftraggeber", field: "auftraggeber" },
            { label: "Bauausführendes Unternehmen", field: "bauausfuehrendesUnternehmen" },
            { label: "Art der Tätigkeit", field: "artDerTaetigkeit" },
            { label: "Bauleitung", field: "bauleitung" },
            { label: "Kontakt Bauleitung", field: "kontaktBauleitung" },
            { label: "Projektbeschreibung", field: "beschreibung" }
          ]
        }),

        divider(345.361, 246.405, 64.644),
        textItem("Anfrage durch", 345.361, 246.48, 64.6419, 5.2, {
          fontSizePt: 8,
          capitalization: 1,
          lineHeightFactor: 1,
          vAlign: "middle"
        }),
        divider(345.359, 251.654, 64.644),
        textItem("Trassify GmbH", 345.359, 256.804, 64.6419, 4.2, {
          fontSizePt: 8.5,
          lineHeightFactor: 1
        }),
        textItem("Ostparkstrasse 37\n60385 Frankfurt am Main", 345.359, 261.878, 36.657, 8.2, {
          fontSizePt: 8,
          lineHeightFactor: 1.1
        }),
        textItem("+49 151 53284985\ninfo@trassify.de", 345.359, 271.458, 36.657, 7.6, {
          fontSizePt: 8,
          lineHeightFactor: 1.1
        }),
        {
          kind: "picture",
          position: { x: 345.359, y: 283.367 },
          size: { width: 30.2669, height: 8.46955 },
          source: "assets/img/trassify-logo.svg"
        },
        {
          kind: "scaleBar",
          position: { x: 10.0001, y: 275.85 },
          size: { width: 78, height: 7.8 },
          renderMode: "raster",
          maxBarWidthMm: 55,
          barHeightMm: 1.4,
          segments: 2,
          labelColor: [29, 29, 27],
          strokeColor: [29, 29, 27],
          darkColor: [29, 29, 27],
          lightColor: [255, 255, 255],
          scaleFontSizePt: 6.8,
          distanceFontSizePt: 6.1,
          scaleLabelFontFamily: "Scandia",
          scaleLabelFontWeight: 400,
          scaleLabelFontSource: SCANDIA_REGULAR_SOURCE,
          distanceLabelFontFamily: "Scandia",
          distanceLabelFontWeight: 400,
          distanceLabelFontSource: SCANDIA_REGULAR_SOURCE
        },

        textItem("{{BASEMAP_LICENSE}}", 10.0001, 284.046, 320, 5.6, {
          fontSizePt: 5.4,
          lineHeightFactor: 1,
          color: [80, 80, 80],
          vAlign: "middle"
        })
      ]
    },
    getPdfName(baseName) {
      return `${baseName}-lageplan-a3-quer.pdf`;
    },
    resolveText({ templateText, meta, baseName, helpers }) {
      switch (templateText) {
        case "Lageplan": {
          const title =
            typeof helpers?.getPlanTitle === "function" ? text(helpers.getPlanTitle()) : "";
          return title || "Lageplan";
        }
        case "{{LOCATION}}":
          return buildProjectLine(meta);
        case "{{SCALE}}":
          return typeof helpers?.getScaleLabel === "function"
            ? `Maßstab ${helpers.getScaleLabel() || "1:1000"}`
            : "Maßstab 1:1000";
        case "{{EXPORT_ID}}":
          return buildExportId(meta);
        case "{{EXPORT_DATE}}":
          return getTodayDateLabel();
        case "{{BASEMAP_LICENSE}}":
          return typeof helpers?.getBasemapLicenseText === "function"
            ? helpers.getBasemapLicenseText() || " "
            : " ";
        default:
          return templateText;
      }
    }
  };
})(window);
