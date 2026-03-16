(function initPlanTemplatePdfRenderer(globalScope) {
  const scope = globalScope || window;
  const rasterCache = new Map();
  const webFontLoadCache = new Map();
  const FONT_FAMILY = "Scandia";
  const FONT_SOURCE_REGULAR = "assets/fonts/scandia.otf";
  const PDF_FONT_FALLBACK = "helvetica";
  const FONT_FILES = {
    normal: {
      src: "assets/fonts/scandia.otf",
      fileName: "Scandia-Regular.otf"
    },
    bold: {
      src: "assets/fonts/scandia-bold.otf",
      fileName: "Scandia-Bold.otf"
    }
  };
  let fontBinaryCachePromise = null;

  function canEmbedPdfFonts() {
    return Object.values(FONT_FILES).every(config => /\.ttf$/i.test(String(config?.src || "")));
  }

  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    if (!bytes.length) return "";
    let binary = "";
    const chunkSize = 0x8000;
    for (let idx = 0; idx < bytes.length; idx += chunkSize) {
      const chunk = bytes.subarray(idx, idx + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }
    return typeof btoa === "function" ? btoa(binary) : "";
  }

  async function loadFontBinaryCache() {
    if (fontBinaryCachePromise) return fontBinaryCachePromise;
    fontBinaryCachePromise = (async () => {
      const entries = await Promise.all(
        Object.entries(FONT_FILES).map(async ([style, config]) => {
          try {
            const response = await fetch(config.src, { cache: "force-cache" });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const buffer = await response.arrayBuffer();
            const base64 = arrayBufferToBase64(buffer);
            return [style, { ...config, base64 }];
          } catch (_error) {
            return [style, null];
          }
        })
      );
      return Object.fromEntries(entries);
    })();
    return fontBinaryCachePromise;
  }

  async function ensurePdfFonts(doc) {
    if (!doc) return PDF_FONT_FALLBACK;
    if (doc.__planTemplateFontFamily) {
      return doc.__planTemplateFontFamily;
    }
    if (!canEmbedPdfFonts()) {
      doc.__planTemplateFontFamily = PDF_FONT_FALLBACK;
      return doc.__planTemplateFontFamily;
    }
    if (typeof doc.addFileToVFS !== "function" || typeof doc.addFont !== "function") {
      doc.__planTemplateFontFamily = PDF_FONT_FALLBACK;
      return doc.__planTemplateFontFamily;
    }
    try {
      const fontCache = await loadFontBinaryCache();
      const regular = fontCache?.normal;
      const bold = fontCache?.bold;
      if (!regular?.base64 || !bold?.base64) {
        throw new Error("font data missing");
      }
      doc.addFileToVFS(regular.fileName, regular.base64);
      doc.addFont(regular.fileName, FONT_FAMILY, "normal");
      doc.addFileToVFS(bold.fileName, bold.base64);
      doc.addFont(bold.fileName, FONT_FAMILY, "bold");
      doc.__planTemplateFontFamily = FONT_FAMILY;
      return doc.__planTemplateFontFamily;
    } catch (_error) {
      doc.__planTemplateFontFamily = PDF_FONT_FALLBACK;
      return doc.__planTemplateFontFamily;
    }
  }

  function getPdfFontFamily(doc) {
    return String(doc?.__planTemplateFontFamily || PDF_FONT_FALLBACK);
  }

  function rgbToCss(color) {
    const values = Array.isArray(color) ? color : [0, 0, 0];
    return `rgb(${values[0] || 0}, ${values[1] || 0}, ${values[2] || 0})`;
  }

  function getWebFontCacheKey(item) {
    return JSON.stringify([
      String(item?.webFontFamily || ""),
      String(item?.webFontSource || ""),
      String(item?.webFontStyle || "normal"),
      String(item?.webFontWeight ?? "")
    ]);
  }

  async function ensureWebFontLoaded(item) {
    const family = String(item?.webFontFamily || "").trim();
    const source = String(item?.webFontSource || "").trim();
    if (
      !family ||
      !source ||
      typeof FontFace !== "function" ||
      typeof document === "undefined" ||
      !document.fonts
    ) {
      return false;
    }
    const cacheKey = getWebFontCacheKey(item);
    if (!webFontLoadCache.has(cacheKey)) {
      webFontLoadCache.set(
        cacheKey,
        (async () => {
          try {
            const fontFace = new FontFace(family, `url("${source}")`, {
              style: String(item?.webFontStyle || "normal"),
              weight: String(item?.webFontWeight ?? 400)
            });
            const loadedFace = await fontFace.load();
            document.fonts.add(loadedFace);
            if (typeof document.fonts.load === "function") {
              const probeSizePx = Math.max(12, Math.round((Number(item?.fontSizePt) || 8.5) * 2));
              await document.fonts.load(
                `${String(item?.webFontStyle || "normal")} ${String(item?.webFontWeight ?? 400)} ${probeSizePx}px "${family}"`
              );
            }
            return true;
          } catch (_error) {
            return false;
          }
        })()
      );
    }
    try {
      return !!(await webFontLoadCache.get(cacheKey));
    } catch (_error) {
      return false;
    }
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Image load failed: ${src}`));
      image.src = src;
    });
  }

  function getDataUrlImageType(dataUrl) {
    const text = String(dataUrl || "");
    if (/^data:image\/png/i.test(text)) return "PNG";
    return "JPEG";
  }

  function canvasToImageDataUrl(canvas, format = "jpeg", quality = 0.82) {
    if (!canvas || typeof canvas.toDataURL !== "function") return "";
    if (format === "png") {
      return canvas.toDataURL("image/png");
    }
    const outCanvas = document.createElement("canvas");
    outCanvas.width = canvas.width;
    outCanvas.height = canvas.height;
    const outCtx = outCanvas.getContext("2d");
    if (!outCtx) {
      return canvas.toDataURL("image/jpeg", quality);
    }
    outCtx.fillStyle = "#ffffff";
    outCtx.fillRect(0, 0, outCanvas.width, outCanvas.height);
    outCtx.drawImage(canvas, 0, 0);
    return outCanvas.toDataURL("image/jpeg", quality);
  }

  function normalizeScaleDenominator(value, fallback = 1000) {
    const numeric = Number(String(value ?? "").replace(/[^\d]/g, ""));
    return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
  }

  function getScaleLabel(scaleDenominator) {
    return `1:${Math.round(scaleDenominator).toLocaleString("de-DE")}`;
  }

  function getNiceScale(maxMeters) {
    if (!Number.isFinite(maxMeters) || maxMeters <= 0) return 0;
    const steps = [1, 2, 5];
    const exp = Math.floor(Math.log10(maxMeters));
    let best = 0;
    for (let exponent = exp; exponent >= exp - 2; exponent -= 1) {
      const base = Math.pow(10, exponent);
      for (let idx = 0; idx < steps.length; idx += 1) {
        const candidate = steps[idx] * base;
        if (candidate <= maxMeters && candidate > best) best = candidate;
      }
    }
    return best || maxMeters;
  }

  function formatScaleValue(value, unit) {
    if (unit === "km") {
      const rounded =
        value >= 10 || Math.round(value) === value
          ? Math.round(value)
          : Math.round(value * 10) / 10;
      return `${rounded} km`;
    }
    return `${Math.round(value)} m`;
  }

  function applyCapitalization(text, capitalization) {
    const value = String(text || "");
    if (capitalization === 1) return value.toUpperCase();
    if (capitalization === 2) return value.toLowerCase();
    return value;
  }

  function splitPdfTextToWidth(doc, text, maxWidth) {
    const paragraphs = String(text || "").split("\n");
    const lines = [];
    paragraphs.forEach(paragraph => {
      const content = paragraph || " ";
      const wrapped = doc.splitTextToSize(content, maxWidth);
      if (Array.isArray(wrapped) && wrapped.length) {
        wrapped.forEach(line => lines.push(String(line)));
        return;
      }
      lines.push(String(wrapped || ""));
    });
    return lines.length ? lines : [""];
  }

  function clampPdfTextLines(doc, lines, maxLines, maxWidth) {
    if (!Array.isArray(lines) || !lines.length) return [""];
    if (!Number.isFinite(maxLines) || maxLines < 1 || lines.length <= maxLines) {
      return lines;
    }
    const out = lines.slice(0, maxLines);
    const ellipsis = "...";
    let tail = String(out[maxLines - 1] || "").trimEnd();
    while (tail && doc.getTextWidth(`${tail}${ellipsis}`) > maxWidth) {
      tail = tail.slice(0, -1).trimEnd();
    }
    out[maxLines - 1] = tail ? `${tail}${ellipsis}` : ellipsis;
    return out;
  }

  function getTextItemMaxLines(item, defaultMaxLines) {
    const templateText = String(item?.templateText ?? item?.text ?? "").trim();
    const newlineCount = templateText ? templateText.split("\n").length : 1;
    let maxLines = Math.max(defaultMaxLines, newlineCount);
    if (
      templateText === "{{DESCRIPTION}}" ||
      templateText === "{{SITE_CONTACT}}" ||
      templateText === "{{BASEMAP_LICENSE}}" ||
      templateText === "{{LOCATION}}"
    ) {
      maxLines = Math.max(maxLines, 2);
    }
    return maxLines;
  }

  function splitCanvasTextToWidth(ctx, text, maxWidth) {
    const paragraphs = String(text || "").split("\n");
    const lines = [];
    paragraphs.forEach(paragraph => {
      if (!paragraph) {
        lines.push("");
        return;
      }
      const words = paragraph.split(/\s+/).filter(Boolean);
      if (!words.length) {
        lines.push("");
        return;
      }
      let line = words.shift() || "";
      words.forEach(word => {
        const candidate = line ? `${line} ${word}` : word;
        if (!line || ctx.measureText(candidate).width <= maxWidth) {
          line = candidate;
          return;
        }
        lines.push(line);
        line = word;
      });
      lines.push(line);
    });
    return lines.length ? lines : [""];
  }

  function clampCanvasTextLines(ctx, lines, maxLines, maxWidth) {
    if (!Array.isArray(lines) || !lines.length) return [""];
    if (!Number.isFinite(maxLines) || maxLines < 1 || lines.length <= maxLines) {
      return lines;
    }
    const out = lines.slice(0, maxLines);
    const ellipsis = "...";
    let tail = String(out[maxLines - 1] || "").trimEnd();
    while (tail && ctx.measureText(`${tail}${ellipsis}`).width > maxWidth) {
      tail = tail.slice(0, -1).trimEnd();
    }
    out[maxLines - 1] = tail ? `${tail}${ellipsis}` : ellipsis;
    return out;
  }

  function mmToCanvasPx(mm, scale) {
    return Math.max(0, Number(mm) || 0) * scale;
  }

  function normalizeMultilineText(value) {
    return String(value ?? "").replace(/\r\n?/g, "\n").trim();
  }

  function getMetaFieldValue(meta, fieldPath) {
    if (Array.isArray(fieldPath)) {
      for (const entry of fieldPath) {
        const value = getMetaFieldValue(meta, entry);
        if (normalizeMultilineText(value)) return value;
      }
      return "";
    }
    const path = String(fieldPath || "").trim();
    if (!path) return "";
    return path.split(".").reduce((current, key) => (current == null ? "" : current[key]), meta);
  }

  function resolveInfoSections(sectionDefinitions, meta) {
    const sections = Array.isArray(sectionDefinitions) ? sectionDefinitions : [];
    return sections
      .map(section => {
        const label = normalizeMultilineText(section?.label);
        const rawValue =
          typeof section?.resolveValue === "function"
            ? section.resolveValue(meta || {})
            : getMetaFieldValue(meta || {}, section?.field ?? section?.fields);
        const value = normalizeMultilineText(rawValue);
        if (!label || !value) return null;
        return { label, value };
      })
      .filter(Boolean);
  }

  function getInfoBlockSections(item, meta) {
    return resolveInfoSections(item?.sections, meta);
  }

  function getInfoColumnsBlockSections(item, meta) {
    return {
      leftSections: resolveInfoSections(item?.leftSections, meta),
      rightSections: resolveInfoSections(item?.rightSections, meta),
      footerSections: resolveInfoSections(item?.footerSections, meta)
    };
  }

  function buildCanvasFontDeclaration(family, weight, style, sizePx) {
    return `${String(style || "normal")} ${String(weight ?? 400)} ${sizePx}px "${String(
      family || FONT_FAMILY || "Helvetica"
    )}", Helvetica, Arial, sans-serif`;
  }

  function drawInfoSectionsOnCanvas({
    ctx,
    sections,
    startX,
    startY,
    maxHeight,
    contentWidth,
    labelFont,
    valueFont,
    labelColor,
    valueColor,
    labelLineHeightPx,
    valueLineHeightPx,
    labelGapPx,
    sectionGapPx
  }) {
    let cursorY = Math.max(0, Number(startY) || 0);
    const x = Number(startX) || 0;
    const width = Math.max(1, Number(contentWidth) || 0);
    const limitY = Math.max(0, Number(maxHeight) || 0);
    const minLabelSpace = labelLineHeightPx * 0.6;
    const minValueSpace = valueLineHeightPx * 0.6;
    for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
      const section = sections[sectionIndex];
      const isLastSection = sectionIndex === sections.length - 1;
      const remainingForLabel = limitY - cursorY;
      if (remainingForLabel <= minLabelSpace) break;

      ctx.font = labelFont;
      ctx.fillStyle = labelColor;
      const labelLines = clampCanvasTextLines(
        ctx,
        splitCanvasTextToWidth(ctx, section.label, width),
        Math.max(1, Math.floor(remainingForLabel / Math.max(labelLineHeightPx, 1))),
        width
      );
      labelLines.forEach((line, lineIndex) => {
        ctx.fillText(line, x, cursorY + lineIndex * labelLineHeightPx);
      });
      cursorY += labelLines.length * labelLineHeightPx;

      const remainingForValue = limitY - cursorY;
      if (remainingForValue <= minValueSpace) break;
      cursorY += Math.min(labelGapPx, remainingForValue);

      ctx.font = valueFont;
      ctx.fillStyle = valueColor;
      const reservedGap = isLastSection ? 0 : sectionGapPx;
      const availableValueHeight = Math.max(0, limitY - cursorY - reservedGap);
      if (availableValueHeight <= minValueSpace) break;
      const valueLines = clampCanvasTextLines(
        ctx,
        splitCanvasTextToWidth(ctx, section.value, width),
        Math.max(1, Math.floor(availableValueHeight / Math.max(valueLineHeightPx, 1))),
        width
      );
      valueLines.forEach((line, lineIndex) => {
        ctx.fillText(line, x, cursorY + lineIndex * valueLineHeightPx);
      });
      cursorY += valueLines.length * valueLineHeightPx;

      if (!isLastSection) {
        cursorY += Math.min(sectionGapPx, Math.max(0, limitY - cursorY));
      }
    }
    return cursorY;
  }

  async function rasterizeInfoBlockToDataUrl(item, meta) {
    const widthMm = Number(item?.size?.width);
    const heightMm = Number(item?.size?.height);
    if (!Number.isFinite(widthMm) || !Number.isFinite(heightMm) || widthMm <= 0 || heightMm <= 0) {
      return "";
    }
    const sections = getInfoBlockSections(item, meta);
    if (!sections.length) return "";

    const cacheKey = JSON.stringify([
      "infoBlock",
      sections,
      widthMm,
      heightMm,
      item?.labelFontSizePt,
      item?.valueFontSizePt,
      item?.labelLineHeightFactor,
      item?.valueLineHeightFactor,
      item?.labelGapMm,
      item?.sectionGapMm,
      item?.labelColor,
      item?.valueColor,
      item?.labelFontFamily,
      item?.labelFontWeight,
      item?.labelFontStyle,
      item?.labelFontSource,
      item?.valueFontFamily,
      item?.valueFontWeight,
      item?.valueFontStyle,
      item?.valueFontSource
    ]);
    if (rasterCache.has(cacheKey)) return rasterCache.get(cacheKey) || "";

    try {
      await Promise.all([
        ensureWebFontLoaded({
          fontSizePt: item?.labelFontSizePt,
          webFontFamily: item?.labelFontFamily,
          webFontWeight: item?.labelFontWeight,
          webFontStyle: item?.labelFontStyle,
          webFontSource: item?.labelFontSource
        }),
        ensureWebFontLoaded({
          fontSizePt: item?.valueFontSizePt,
          webFontFamily: item?.valueFontFamily,
          webFontWeight: item?.valueFontWeight,
          webFontStyle: item?.valueFontStyle,
          webFontSource: item?.valueFontSource
        })
      ]);

      const scale = 10;
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(64, Math.round(widthMm * scale));
      canvas.height = Math.max(64, Math.round(heightMm * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return "";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      const labelFontSizePx = ((Number(item?.labelFontSizePt) || 7.4) * 25.4 * scale) / 72;
      const valueFontSizePx = ((Number(item?.valueFontSizePt) || 8.4) * 25.4 * scale) / 72;
      const labelLineHeightPx =
        labelFontSizePx * (Number(item?.labelLineHeightFactor) || 1);
      const valueLineHeightPx =
        valueFontSizePx * (Number(item?.valueLineHeightFactor) || 1.08);
      const labelGapPx = mmToCanvasPx(item?.labelGapMm ?? 0.55, scale);
      const sectionGapPx = mmToCanvasPx(item?.sectionGapMm ?? 1.7, scale);
      const labelColor = rgbToCss(item?.labelColor || [0, 0, 0]);
      const valueColor = rgbToCss(item?.valueColor || [0, 0, 0]);
      const labelFont = buildCanvasFontDeclaration(
        item?.labelFontFamily,
        item?.labelFontWeight,
        item?.labelFontStyle,
        labelFontSizePx
      );
      const valueFont = buildCanvasFontDeclaration(
        item?.valueFontFamily,
        item?.valueFontWeight,
        item?.valueFontStyle,
        valueFontSizePx
      );
      drawInfoSectionsOnCanvas({
        ctx,
        sections,
        startX: 0,
        startY: 0,
        maxHeight: canvas.height,
        contentWidth: canvas.width,
        labelFont,
        valueFont,
        labelColor,
        valueColor,
        labelLineHeightPx,
        valueLineHeightPx,
        labelGapPx,
        sectionGapPx
      });

      const dataUrl = canvas.toDataURL("image/png");
      rasterCache.set(cacheKey, dataUrl);
      return dataUrl;
    } catch (_error) {
      rasterCache.set(cacheKey, "");
      return "";
    }
  }

  function flattenInfoBlockText(item, meta) {
    return getInfoBlockSections(item, meta)
      .map(section => `${section.label}\n${section.value}`)
      .join("\n\n");
  }

  async function rasterizeInfoColumnsBlockToDataUrl(item, meta) {
    const widthMm = Number(item?.size?.width);
    const heightMm = Number(item?.size?.height);
    if (!Number.isFinite(widthMm) || !Number.isFinite(heightMm) || widthMm <= 0 || heightMm <= 0) {
      return "";
    }
    const { leftSections, rightSections, footerSections } = getInfoColumnsBlockSections(item, meta);
    if (!leftSections.length && !rightSections.length && !footerSections.length) return "";

    const cacheKey = JSON.stringify([
      "infoColumnsBlock",
      leftSections,
      rightSections,
      footerSections,
      widthMm,
      heightMm,
      item?.columnGapMm,
      item?.footerGapMm,
      item?.labelFontSizePt,
      item?.valueFontSizePt,
      item?.labelLineHeightFactor,
      item?.valueLineHeightFactor,
      item?.labelGapMm,
      item?.sectionGapMm,
      item?.labelColor,
      item?.valueColor,
      item?.labelFontFamily,
      item?.labelFontWeight,
      item?.labelFontStyle,
      item?.labelFontSource,
      item?.valueFontFamily,
      item?.valueFontWeight,
      item?.valueFontStyle,
      item?.valueFontSource
    ]);
    if (rasterCache.has(cacheKey)) return rasterCache.get(cacheKey) || "";

    try {
      await Promise.all([
        ensureWebFontLoaded({
          fontSizePt: item?.labelFontSizePt,
          webFontFamily: item?.labelFontFamily,
          webFontWeight: item?.labelFontWeight,
          webFontStyle: item?.labelFontStyle,
          webFontSource: item?.labelFontSource
        }),
        ensureWebFontLoaded({
          fontSizePt: item?.valueFontSizePt,
          webFontFamily: item?.valueFontFamily,
          webFontWeight: item?.valueFontWeight,
          webFontStyle: item?.valueFontStyle,
          webFontSource: item?.valueFontSource
        })
      ]);

      const scale = 10;
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(64, Math.round(widthMm * scale));
      canvas.height = Math.max(64, Math.round(heightMm * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return "";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      const labelFontSizePx = ((Number(item?.labelFontSizePt) || 7.4) * 25.4 * scale) / 72;
      const valueFontSizePx = ((Number(item?.valueFontSizePt) || 8.4) * 25.4 * scale) / 72;
      const labelLineHeightPx =
        labelFontSizePx * (Number(item?.labelLineHeightFactor) || 1);
      const valueLineHeightPx =
        valueFontSizePx * (Number(item?.valueLineHeightFactor) || 1.08);
      const labelGapPx = mmToCanvasPx(item?.labelGapMm ?? 0.55, scale);
      const sectionGapPx = mmToCanvasPx(item?.sectionGapMm ?? 1.7, scale);
      const footerGapPx = mmToCanvasPx(item?.footerGapMm ?? 0.8, scale);
      const labelColor = rgbToCss(item?.labelColor || [0, 0, 0]);
      const valueColor = rgbToCss(item?.valueColor || [0, 0, 0]);
      const labelFont = buildCanvasFontDeclaration(
        item?.labelFontFamily,
        item?.labelFontWeight,
        item?.labelFontStyle,
        labelFontSizePx
      );
      const valueFont = buildCanvasFontDeclaration(
        item?.valueFontFamily,
        item?.valueFontWeight,
        item?.valueFontStyle,
        valueFontSizePx
      );

      const fullWidth = canvas.width;
      const columnGapPx = mmToCanvasPx(item?.columnGapMm ?? 3, scale);
      const columnWidth = Math.max(1, (fullWidth - columnGapPx) / 2);
      const rightColumnX = columnWidth + columnGapPx;

      const leftBottom = drawInfoSectionsOnCanvas({
        ctx,
        sections: leftSections,
        startX: 0,
        startY: 0,
        maxHeight: canvas.height,
        contentWidth: columnWidth,
        labelFont,
        valueFont,
        labelColor,
        valueColor,
        labelLineHeightPx,
        valueLineHeightPx,
        labelGapPx,
        sectionGapPx
      });

      const rightBottom = drawInfoSectionsOnCanvas({
        ctx,
        sections: rightSections,
        startX: rightColumnX,
        startY: 0,
        maxHeight: canvas.height,
        contentWidth: columnWidth,
        labelFont,
        valueFont,
        labelColor,
        valueColor,
        labelLineHeightPx,
        valueLineHeightPx,
        labelGapPx,
        sectionGapPx
      });

      if (footerSections.length) {
        let footerStart = Math.max(leftBottom, rightBottom);
        if (footerStart > 0) {
          footerStart += Math.min(footerGapPx, Math.max(0, canvas.height - footerStart));
        }
        drawInfoSectionsOnCanvas({
          ctx,
          sections: footerSections,
          startX: 0,
          startY: footerStart,
          maxHeight: canvas.height,
          contentWidth: fullWidth,
          labelFont,
          valueFont,
          labelColor,
          valueColor,
          labelLineHeightPx,
          valueLineHeightPx,
          labelGapPx,
          sectionGapPx
        });
      }

      const dataUrl = canvas.toDataURL("image/png");
      rasterCache.set(cacheKey, dataUrl);
      return dataUrl;
    } catch (_error) {
      rasterCache.set(cacheKey, "");
      return "";
    }
  }

  function flattenInfoColumnsBlockText(item, meta) {
    const { leftSections, rightSections, footerSections } = getInfoColumnsBlockSections(item, meta);
    return [leftSections, rightSections, footerSections]
      .map(sections => sections.map(section => `${section.label}\n${section.value}`).join("\n\n"))
      .filter(Boolean)
      .join("\n\n");
  }

  async function rasterizeTextItemToDataUrl(item, text) {
    const widthMm = Number(item?.size?.width);
    const heightMm = Number(item?.size?.height);
    if (!Number.isFinite(widthMm) || !Number.isFinite(heightMm) || widthMm <= 0 || heightMm <= 0) {
      return "";
    }
    const content = applyCapitalization(text, item?.capitalization);
    const cacheKey = JSON.stringify([
      "text",
      content,
      widthMm,
      heightMm,
      item?.fontSizePt,
      item?.lineHeightFactor,
      item?.hAlign,
      item?.vAlign,
      item?.webFontFamily,
      item?.webFontWeight,
      item?.webFontStyle,
      item?.webFontSource,
      item?.color
    ]);
    if (rasterCache.has(cacheKey)) return rasterCache.get(cacheKey) || "";
    try {
      await ensureWebFontLoaded(item);
      const scale = 12;
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(64, Math.round(widthMm * scale));
      canvas.height = Math.max(32, Math.round(heightMm * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return "";
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const fontSizePx = ((Number(item?.fontSizePt) || 8.5) * 25.4 * scale) / 72;
      const fontFamily = String(item?.webFontFamily || FONT_FAMILY || "Helvetica");
      const fontWeight = String(item?.webFontWeight ?? (item?.fontStyle === "bold" ? 700 : 400));
      const fontStyle = String(item?.webFontStyle || "normal");
      ctx.font = `${fontStyle} ${fontWeight} ${fontSizePx}px "${fontFamily}", Helvetica, Arial, sans-serif`;
      ctx.fillStyle = rgbToCss(item?.color);
      ctx.textAlign = item?.hAlign === "right" ? "right" : item?.hAlign === "center" ? "center" : "left";
      ctx.textBaseline = "top";

      const linesRaw = splitCanvasTextToWidth(ctx, content, canvas.width);
      const lineHeightPx = fontSizePx * (Number(item?.lineHeightFactor) || 1.15);
      const defaultMaxLines = Math.max(1, Math.floor((canvas.height + 2) / Math.max(lineHeightPx, 1)));
      const maxLines = getTextItemMaxLines(item, defaultMaxLines);
      const lines = clampCanvasTextLines(ctx, linesRaw, maxLines, canvas.width);
      const totalHeight = lines.length * lineHeightPx;
      let startY = 0;
      if (item?.vAlign === "middle") {
        startY = Math.max(0, (canvas.height - totalHeight) / 2);
      } else if (item?.vAlign === "bottom") {
        startY = Math.max(0, canvas.height - totalHeight);
      }
      const baseX =
        item?.hAlign === "right"
          ? canvas.width
          : item?.hAlign === "center"
            ? canvas.width / 2
            : 0;
      lines.forEach((line, index) => {
        ctx.fillText(line, baseX, startY + index * lineHeightPx);
      });
      const dataUrl = canvas.toDataURL("image/png");
      rasterCache.set(cacheKey, dataUrl);
      return dataUrl;
    } catch (_error) {
      rasterCache.set(cacheKey, "");
      return "";
    }
  }

  function drawTextItem(doc, item, text) {
    if (!doc || !item) return;
    const content = applyCapitalization(text, item.capitalization);
    const width = Number(item.size?.width);
    const height = Number(item.size?.height);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return;
    doc.setFont(getPdfFontFamily(doc), item.fontStyle === "bold" ? "bold" : "normal");
    doc.setFontSize(item.fontSizePt || 8.5);
    const [r, g, b] = Array.isArray(item.color) ? item.color : [0, 0, 0];
    doc.setTextColor(r, g, b);
    const linesRaw = splitPdfTextToWidth(doc, content, width);
    const lineHeightMm = ((item.fontSizePt || 8.5) * 25.4) / 72 * (item.lineHeightFactor || 1.15);
    const defaultMaxLines = Math.max(1, Math.floor((height + 0.4) / Math.max(lineHeightMm, 0.1)));
    const maxLines = getTextItemMaxLines(item, defaultMaxLines);
    const lines = clampPdfTextLines(doc, linesRaw, maxLines, width);
    const totalHeight = lines.length * lineHeightMm;
    let startY = Number(item.position?.y) || 0;
    if (item.vAlign === "middle") {
      startY += Math.max(0, (height - totalHeight) / 2);
    } else if (item.vAlign === "bottom") {
      startY += Math.max(0, height - totalHeight);
    }
    const baseX =
      item.hAlign === "right"
        ? item.position.x + width
        : item.hAlign === "center"
          ? item.position.x + width / 2
          : item.position.x;
    lines.forEach((line, index) => {
      doc.text(line, baseX, startY + index * lineHeightMm, {
        align: item.hAlign || "left",
        baseline: "top"
      });
    });
    doc.setTextColor(0, 0, 0);
    doc.setFont(getPdfFontFamily(doc), "normal");
  }

  async function rasterizePictureToDataUrl(item) {
    const source = String(item?.source || "").trim();
    const widthMm = Number(item?.size?.width);
    const heightMm = Number(item?.size?.height);
    if (!source || !Number.isFinite(widthMm) || !Number.isFinite(heightMm)) return "";
    const cacheKey = `${source}::${widthMm}::${heightMm}`;
    if (rasterCache.has(cacheKey)) return rasterCache.get(cacheKey) || "";
    try {
      const image = await loadImage(source);
      const scale = 6;
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(24, Math.round(widthMm * scale));
      canvas.height = Math.max(24, Math.round(heightMm * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return "";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const imageWidth = Number(image.naturalWidth || image.width);
      const imageHeight = Number(image.naturalHeight || image.height);
      if (Number.isFinite(imageWidth) && Number.isFinite(imageHeight) && imageWidth > 0 && imageHeight > 0) {
        const fitScale = Math.min(canvas.width / imageWidth, canvas.height / imageHeight);
        const drawWidth = imageWidth * fitScale;
        const drawHeight = imageHeight * fitScale;
        const offsetX = (canvas.width - drawWidth) / 2;
        const offsetY = (canvas.height - drawHeight) / 2;
        ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
      } else {
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      }
      const dataUrl = canvasToImageDataUrl(canvas, "png");
      rasterCache.set(cacheKey, dataUrl);
      return dataUrl;
    } catch (_err) {
      rasterCache.set(cacheKey, "");
      return "";
    }
  }

  async function rasterizeNorthArrowToDataUrl(item) {
    const source = String(item?.source || "").trim();
    const widthMm = Number(item?.size?.width);
    const heightMm = Number(item?.size?.height);
    if (!source || !Number.isFinite(widthMm) || !Number.isFinite(heightMm) || widthMm <= 0 || heightMm <= 0) {
      return "";
    }
    const label = String(item?.label || "").trim();
    const cacheKey = JSON.stringify([
      "northArrow",
      source,
      widthMm,
      heightMm,
      label,
      item?.labelFontSizePt,
      item?.labelColor,
      item?.labelFontFamily,
      item?.labelFontWeight,
      item?.labelFontStyle,
      item?.labelFontSource
    ]);
    if (rasterCache.has(cacheKey)) return rasterCache.get(cacheKey) || "";
    try {
      const image = await loadImage(source);
      const scale = 10;
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(48, Math.round(widthMm * scale));
      canvas.height = Math.max(48, Math.round(heightMm * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return "";
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      if (label) {
        const labelFontFamily = String(item?.labelFontFamily || FONT_FAMILY).trim() || FONT_FAMILY;
        const labelFontWeight = item?.labelFontWeight ?? 400;
        const labelFontStyle = String(item?.labelFontStyle || "normal");
        const labelFontSource =
          String(item?.labelFontSource || "").trim() ||
          (labelFontFamily.toLowerCase().includes("scandia") ? FONT_SOURCE_REGULAR : "");
        await ensureWebFontLoaded({
          fontSizePt: item?.labelFontSizePt,
          webFontFamily: labelFontFamily,
          webFontWeight: labelFontWeight,
          webFontStyle: labelFontStyle,
          webFontSource: labelFontSource
        });
        const color = rgbToCss(item?.labelColor || item?.strokeColor || [29, 29, 27]);
        const fontSizePx = Math.max(
          12,
          ((Number(item?.labelFontSizePt) || 12) * 25.4 * scale) / 72
        );
        ctx.fillStyle = color;
        ctx.font = buildCanvasFontDeclaration(
          labelFontFamily,
          labelFontWeight,
          labelFontStyle,
          fontSizePx
        );
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, canvas.width / 2, canvas.height * 0.58);
      }
      const dataUrl = canvas.toDataURL("image/png");
      rasterCache.set(cacheKey, dataUrl);
      return dataUrl;
    } catch (_error) {
      rasterCache.set(cacheKey, "");
      return "";
    }
  }

  function drawNorthArrow(doc, item) {
    if (!doc || !item) return;
    const x = Number(item.position?.x);
    const y = Number(item.position?.y);
    const width = Number(item.size?.width);
    const height = Number(item.size?.height);
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    ) {
      return;
    }
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radius = Math.max(2, Math.min(width, height) * 0.46);
    const stroke = Array.isArray(item.strokeColor) ? item.strokeColor : [29, 29, 27];
    const fill = Array.isArray(item.fillColor) ? item.fillColor : [255, 255, 255];
    const label = String(item.label || "").trim();
    doc.setDrawColor(stroke[0], stroke[1], stroke[2]);
    doc.setFillColor(fill[0], fill[1], fill[2]);
    doc.setLineWidth(Number(item.lineWidthMm) > 0 ? Number(item.lineWidthMm) : 0.35);
    doc.circle(centerX, centerY, radius, "FD");
    const shaftTopY = centerY - radius + 4.2;
    if (typeof doc.triangle === "function") {
      doc.triangle(
        centerX,
        shaftTopY - 2.8,
        centerX - 2.4,
        shaftTopY + 1.9,
        centerX + 2.4,
        shaftTopY + 1.9,
        "FD"
      );
    } else {
      doc.line(centerX, shaftTopY - 2.8, centerX - 2.4, shaftTopY + 1.9);
      doc.line(centerX, shaftTopY - 2.8, centerX + 2.4, shaftTopY + 1.9);
      doc.line(centerX - 2.4, shaftTopY + 1.9, centerX + 2.4, shaftTopY + 1.9);
    }
    if (label) {
      const labelColor = Array.isArray(item.labelColor) ? item.labelColor : stroke;
      doc.setFont(getPdfFontFamily(doc), "normal");
      doc.setFontSize(Number(item.labelFontSizePt) > 0 ? Number(item.labelFontSizePt) : 12);
      doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
      doc.text(label, centerX, centerY + 4.3, { align: "center", baseline: "middle" });
      doc.setTextColor(0, 0, 0);
    }
  }

  function getScaleBarSpec(item, scaleDenominator) {
    const scale = normalizeScaleDenominator(scaleDenominator);
    const maxBarWidthMm = Math.max(
      20,
      Number(item?.maxBarWidthMm) > 0 ? Number(item.maxBarWidthMm) : Number(item?.size?.width) || 55
    );
    const maxMeters = (maxBarWidthMm / 1000) * scale;
    const totalMeters = Math.max(1, getNiceScale(maxMeters));
    const barWidthMm = (totalMeters * 1000) / scale;
    const unit = totalMeters >= 1000 ? "km" : "m";
    const displayValue = unit === "km" ? totalMeters / 1000 : totalMeters;
    return {
      scaleLabel: getScaleLabel(scale),
      distanceLabel: formatScaleValue(displayValue, unit),
      barWidthMm,
      barHeightMm: Number(item?.barHeightMm) > 0 ? Number(item.barHeightMm) : 1.8,
      segments: Math.max(2, Number.parseInt(item?.segments, 10) || 2)
    };
  }

  async function rasterizeScaleBarToDataUrl(item, scaleDenominator) {
    const widthMm = Number(item?.size?.width);
    const heightMm = Number(item?.size?.height);
    if (!Number.isFinite(widthMm) || !Number.isFinite(heightMm) || widthMm <= 0 || heightMm <= 0) {
      return "";
    }

    const spec = getScaleBarSpec(item, scaleDenominator);
    const cacheKey = JSON.stringify([
      "scaleBar",
      widthMm,
      heightMm,
      scaleDenominator,
      item?.maxBarWidthMm,
      item?.barHeightMm,
      item?.segments,
      item?.labelColor,
      item?.darkColor,
      item?.lightColor,
      item?.scaleFontSizePt,
      item?.distanceFontSizePt,
      item?.scaleLabelFontFamily,
      item?.scaleLabelFontWeight,
      item?.scaleLabelFontStyle,
      item?.scaleLabelFontSource,
      item?.distanceLabelFontFamily,
      item?.distanceLabelFontWeight,
      item?.distanceLabelFontStyle,
      item?.distanceLabelFontSource
    ]);
    if (rasterCache.has(cacheKey)) return rasterCache.get(cacheKey) || "";

    try {
      await Promise.all([
        ensureWebFontLoaded({
          fontSizePt: item?.scaleFontSizePt,
          webFontFamily: item?.scaleLabelFontFamily || FONT_FAMILY,
          webFontWeight: item?.scaleLabelFontWeight ?? 400,
          webFontStyle: item?.scaleLabelFontStyle || "normal",
          webFontSource: item?.scaleLabelFontSource || ""
        }),
        ensureWebFontLoaded({
          fontSizePt: item?.distanceFontSizePt,
          webFontFamily: item?.distanceLabelFontFamily || FONT_FAMILY,
          webFontWeight: item?.distanceLabelFontWeight ?? 400,
          webFontStyle: item?.distanceLabelFontStyle || "normal",
          webFontSource: item?.distanceLabelFontSource || ""
        })
      ]);

      const scale = 12;
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(96, Math.round(widthMm * scale));
      canvas.height = Math.max(48, Math.round(heightMm * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) return "";
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const labelColor = rgbToCss(item?.labelColor || [29, 29, 27]);
      const darkColor = rgbToCss(item?.darkColor || [29, 29, 27]);
      const lightColor = rgbToCss(item?.lightColor || [255, 255, 255]);
      const scaleFontSizePx = ((Number(item?.scaleFontSizePt) || 7) * 25.4 * scale) / 72;
      const distanceFontSizePx =
        ((Number(item?.distanceFontSizePt) || 6.5) * 25.4 * scale) / 72;
      const barHeightPx = mmToCanvasPx(spec.barHeightMm, scale);
      const barY = mmToCanvasPx(heightMm - spec.barHeightMm - 0.2, scale);
      const labelY = mmToCanvasPx(heightMm - spec.barHeightMm - 0.2 - ((Number(item?.scaleFontSizePt) || 7) * 25.4) / 72 - 0.6, scale);
      const barWidthPx = mmToCanvasPx(spec.barWidthMm, scale);
      const segmentWidthPx = barWidthPx / spec.segments;
      const distanceX = barWidthPx + mmToCanvasPx(2.2, scale);

      ctx.textAlign = "left";
      ctx.fillStyle = labelColor;
      ctx.textBaseline = "top";
      ctx.font = buildCanvasFontDeclaration(
        item?.scaleLabelFontFamily || FONT_FAMILY,
        item?.scaleLabelFontWeight ?? 400,
        item?.scaleLabelFontStyle || "normal",
        scaleFontSizePx
      );
      ctx.fillText(spec.scaleLabel, 0, labelY);

      for (let idx = 0; idx < spec.segments; idx += 1) {
        ctx.fillStyle = idx % 2 === 0 ? darkColor : lightColor;
        ctx.fillRect(segmentWidthPx * idx, barY, segmentWidthPx, barHeightPx);
      }

      ctx.fillStyle = labelColor;
      ctx.textBaseline = "middle";
      ctx.font = buildCanvasFontDeclaration(
        item?.distanceLabelFontFamily || FONT_FAMILY,
        item?.distanceLabelFontWeight ?? 400,
        item?.distanceLabelFontStyle || "normal",
        distanceFontSizePx
      );
      ctx.fillText(spec.distanceLabel, distanceX, barY + barHeightPx / 2);

      const dataUrl = canvas.toDataURL("image/png");
      rasterCache.set(cacheKey, dataUrl);
      return dataUrl;
    } catch (_error) {
      rasterCache.set(cacheKey, "");
      return "";
    }
  }

  function drawScaleBar(doc, item, scaleDenominator) {
    if (!doc || !item) return;
    const x = Number(item.position?.x);
    const y = Number(item.position?.y);
    const width = Number(item.size?.width);
    const height = Number(item.size?.height);
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    ) {
      return;
    }
    const spec = getScaleBarSpec(item, scaleDenominator);
    const labelColor = Array.isArray(item.labelColor) ? item.labelColor : [29, 29, 27];
    const barFillDark = Array.isArray(item.darkColor) ? item.darkColor : [29, 29, 27];
    const barFillLight = Array.isArray(item.lightColor) ? item.lightColor : [255, 255, 255];
    const scaleFontSizePt = Number(item.scaleFontSizePt) > 0 ? Number(item.scaleFontSizePt) : 7;
    const distanceFontSizePt =
      Number(item.distanceFontSizePt) > 0 ? Number(item.distanceFontSizePt) : 6.5;
    const scaleLineHeightMm = (scaleFontSizePt * 25.4) / 72;
    const barY = y + Math.max(0, height - spec.barHeightMm - 0.2);
    const labelY = barY - scaleLineHeightMm - 0.6;
    const segmentWidthMm = spec.barWidthMm / spec.segments;

    doc.setFont(getPdfFontFamily(doc), "normal");
    doc.setFontSize(scaleFontSizePt);
    doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
    doc.text(spec.scaleLabel, x, labelY, { baseline: "top" });

    for (let idx = 0; idx < spec.segments; idx += 1) {
      const fill = idx % 2 === 0 ? barFillDark : barFillLight;
      doc.setFillColor(fill[0], fill[1], fill[2]);
      doc.rect(x + segmentWidthMm * idx, barY, segmentWidthMm, spec.barHeightMm, "F");
    }

    doc.setFontSize(distanceFontSizePt);
    doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
    doc.text(spec.distanceLabel, x + spec.barWidthMm + 2.2, barY + spec.barHeightMm / 2, {
      baseline: "middle"
    });
    doc.setTextColor(0, 0, 0);
  }

  function drawDebugOutline(doc, x, y, width, height) {
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      width <= 0 ||
      height <= 0
    ) {
      return;
    }
    doc.setDrawColor(232, 62, 140);
    doc.setLineWidth(0.15);
    doc.rect(x, y, width, height, "S");
  }

  function getPageDimensions(definition) {
    const pageWidthMm = Number(definition?.pageSize?.width) || 420;
    const pageHeightMm = Number(definition?.pageSize?.height) || 297;
    const orientation = pageWidthMm >= pageHeightMm ? "l" : "p";
    return { pageWidthMm, pageHeightMm, orientation };
  }

  async function drawTemplatePage(doc, options = {}, pageOptions = {}) {
    const definition = options.definition;
    const mapDataUrl = String(options.mapDataUrl || "");
    if (!doc || !definition?.pageSize || !definition?.mapFrame) return false;
    const { pageWidthMm, pageHeightMm, orientation } = getPageDimensions(definition);
    if (pageOptions.addPage) {
      doc.addPage([pageWidthMm, pageHeightMm], orientation);
    }

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidthMm, pageHeightMm, "F");

    if (mapDataUrl) {
      const mapFrame = definition.mapFrame;
      const mapImageType = getDataUrlImageType(mapDataUrl);
      doc.addImage(
        mapDataUrl,
        mapImageType,
        mapFrame.x,
        mapFrame.y,
        mapFrame.width,
        mapFrame.height,
        undefined,
        mapImageType === "JPEG" ? options.jpegCompression : undefined
      );
    }

    if (typeof options.drawMapOverlay === "function") {
      await options.drawMapOverlay(doc, definition.mapFrame);
    }

    for (const item of definition.items || []) {
      if (!item) continue;
      if (item.kind === "shape") {
        const [r, g, b] = Array.isArray(item.fillColor) ? item.fillColor : [47, 47, 47];
        doc.setFillColor(r, g, b);
        doc.rect(item.position.x, item.position.y, item.size.width, item.size.height, "F");
        continue;
      }
      if (item.kind === "picture") {
        const pictureDataUrl = await rasterizePictureToDataUrl(item);
        if (!pictureDataUrl) continue;
        doc.addImage(
          pictureDataUrl,
          "PNG",
          item.position.x,
          item.position.y,
          item.size.width,
          item.size.height
        );
        continue;
      }
      if (item.kind === "northArrow") {
        const northArrowDataUrl = await rasterizeNorthArrowToDataUrl(item);
        if (northArrowDataUrl) {
          doc.addImage(
            northArrowDataUrl,
            "PNG",
            item.position.x,
            item.position.y,
            item.size.width,
            item.size.height
          );
          continue;
        }
        drawNorthArrow(doc, item);
        continue;
      }
      if (item.kind === "scaleBar") {
        if (item.renderMode === "raster") {
          const scaleBarDataUrl = await rasterizeScaleBarToDataUrl(item, options.scaleDenominator);
          if (scaleBarDataUrl) {
            doc.addImage(
              scaleBarDataUrl,
              "PNG",
              item.position.x,
              item.position.y,
              item.size.width,
              item.size.height
            );
            continue;
          }
        }
        drawScaleBar(doc, item, options.scaleDenominator);
        continue;
      }
      if (item.kind === "infoBlock") {
        const infoBlockDataUrl = await rasterizeInfoBlockToDataUrl(item, options.meta || {});
        if (infoBlockDataUrl) {
          doc.addImage(
            infoBlockDataUrl,
            "PNG",
            item.position.x,
            item.position.y,
            item.size.width,
            item.size.height
          );
          continue;
        }
        const fallbackText = flattenInfoBlockText(item, options.meta || {});
        if (fallbackText) {
          drawTextItem(
            doc,
            {
              kind: "text",
              position: item.position,
              size: item.size,
              fontSizePt: Number(item.valueFontSizePt) || 8.4,
              fontStyle: "normal",
              color: Array.isArray(item.valueColor) ? item.valueColor : [0, 0, 0],
              lineHeightFactor: Number(item.valueLineHeightFactor) || 1.08,
              capitalization: 0,
              hAlign: "left",
              vAlign: "top"
            },
            fallbackText
          );
        }
        continue;
      }
      if (item.kind === "infoColumnsBlock") {
        const infoColumnsDataUrl = await rasterizeInfoColumnsBlockToDataUrl(item, options.meta || {});
        if (infoColumnsDataUrl) {
          doc.addImage(
            infoColumnsDataUrl,
            "PNG",
            item.position.x,
            item.position.y,
            item.size.width,
            item.size.height
          );
          continue;
        }
        const fallbackText = flattenInfoColumnsBlockText(item, options.meta || {});
        if (fallbackText) {
          drawTextItem(
            doc,
            {
              kind: "text",
              position: item.position,
              size: item.size,
              fontSizePt: Number(item.valueFontSizePt) || 8.4,
              fontStyle: "normal",
              color: Array.isArray(item.valueColor) ? item.valueColor : [0, 0, 0],
              lineHeightFactor: Number(item.valueLineHeightFactor) || 1.08,
              capitalization: 0,
              hAlign: "left",
              vAlign: "top"
            },
            fallbackText
          );
        }
        continue;
      }
      if (item.kind === "text") {
        const text =
          typeof options.resolveText === "function"
            ? options.resolveText(item, options.meta || {}, options.baseName || "")
            : String(item.templateText ?? item.text ?? "");
        const hasExtendedChars = /[^\u0000-\u007f]/.test(String(text || ""));
        const forcePdfForExtendedChars =
          item.preferPdfForExtendedChars === true && hasExtendedChars;
        if (item.renderMode === "raster" && !forcePdfForExtendedChars) {
          const textDataUrl = await rasterizeTextItemToDataUrl(item, text);
          if (textDataUrl) {
            doc.addImage(
              textDataUrl,
              "PNG",
              item.position.x,
              item.position.y,
              item.size.width,
              item.size.height
            );
            continue;
          }
        }
        drawTextItem(doc, item, text);
      }
    }

    if (options.debug) {
      drawDebugOutline(
        doc,
        Number(definition.mapFrame?.x),
        Number(definition.mapFrame?.y),
        Number(definition.mapFrame?.width),
        Number(definition.mapFrame?.height)
      );
      (definition.items || []).forEach(item => {
        drawDebugOutline(
          doc,
          Number(item?.position?.x),
          Number(item?.position?.y),
          Number(item?.size?.width),
          Number(item?.size?.height)
        );
      });
    }

    return true;
  }

  async function buildPdfBlob(options = {}) {
    const definition = options.definition;
    if (!definition?.pageSize || !definition?.mapFrame) return null;
    const { jsPDF } = scope.jspdf || {};
    if (!jsPDF) return null;
    const { pageWidthMm, pageHeightMm, orientation } = getPageDimensions(definition);
    const doc = new jsPDF({
      unit: "mm",
      format: [pageWidthMm, pageHeightMm],
      orientation,
      compress: options.compress !== false
    });
    await ensurePdfFonts(doc);
    const rendered = await drawTemplatePage(doc, options, { addPage: false });
    if (!rendered) return null;
    return doc.output("blob");
  }

  async function buildPdfBlobFromPages(options = {}) {
    const pages = Array.isArray(options.pages) ? options.pages.filter(Boolean) : [];
    if (!pages.length) return null;
    const baseDefinition = pages[0]?.definition || options.definition;
    if (!baseDefinition?.pageSize || !baseDefinition?.mapFrame) return null;
    const { jsPDF } = scope.jspdf || {};
    if (!jsPDF) return null;

    const { pageWidthMm, pageHeightMm, orientation } = getPageDimensions(baseDefinition);
    const doc = new jsPDF({
      unit: "mm",
      format: [pageWidthMm, pageHeightMm],
      orientation,
      compress: options.compress !== false
    });
    await ensurePdfFonts(doc);

    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index];
      const pageOptions = {
        ...options,
        ...page,
        definition: page?.definition || baseDefinition,
        meta: page?.meta ?? options.meta,
        baseName: page?.baseName ?? options.baseName
      };
      const rendered = await drawTemplatePage(doc, pageOptions, { addPage: index > 0 });
      if (!rendered) return null;
    }
    return doc.output("blob");
  }

  function createPlaceholderMapDataUrl(mapFrame, options = {}) {
    const frameWidthMm = Number(mapFrame?.width) || 330;
    const frameHeightMm = Number(mapFrame?.height) || 287;
    const widthPx = Math.max(1200, Math.round(Number(options.widthPx) || 2200));
    const heightPx = Math.max(900, Math.round((widthPx * frameHeightMm) / Math.max(frameWidthMm, 1)));
    const canvas = document.createElement("canvas");
    canvas.width = widthPx;
    canvas.height = heightPx;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    const background = ctx.createLinearGradient(0, 0, widthPx, heightPx);
    background.addColorStop(0, "#e7efe0");
    background.addColorStop(1, "#f7faf4");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, widthPx, heightPx);

    ctx.strokeStyle = "rgba(143,174,139,0.18)";
    ctx.lineWidth = Math.max(1, Math.round(widthPx / 900));
    for (let offset = -heightPx; offset < widthPx; offset += Math.round(widthPx / 12)) {
      ctx.beginPath();
      ctx.moveTo(offset, 0);
      ctx.lineTo(offset + heightPx, heightPx);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(166,196,161,0.24)";
    ctx.beginPath();
    ctx.moveTo(widthPx * 0.08, heightPx * 0.22);
    ctx.lineTo(widthPx * 0.3, heightPx * 0.12);
    ctx.lineTo(widthPx * 0.46, heightPx * 0.28);
    ctx.lineTo(widthPx * 0.32, heightPx * 0.42);
    ctx.lineTo(widthPx * 0.14, heightPx * 0.36);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(widthPx * 0.58, heightPx * 0.58);
    ctx.lineTo(widthPx * 0.82, heightPx * 0.5);
    ctx.lineTo(widthPx * 0.9, heightPx * 0.72);
    ctx.lineTo(widthPx * 0.66, heightPx * 0.82);
    ctx.lineTo(widthPx * 0.52, heightPx * 0.68);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(120,120,120,0.26)";
    ctx.lineWidth = Math.max(2, Math.round(widthPx / 720));
    ctx.beginPath();
    ctx.moveTo(widthPx * 0.12, heightPx * 0.74);
    ctx.bezierCurveTo(widthPx * 0.22, heightPx * 0.56, widthPx * 0.42, heightPx * 0.64, widthPx * 0.55, heightPx * 0.42);
    ctx.bezierCurveTo(widthPx * 0.66, heightPx * 0.24, widthPx * 0.8, heightPx * 0.3, widthPx * 0.9, heightPx * 0.18);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.78)";
    const labelWidth = Math.round(widthPx * 0.18);
    const labelHeight = Math.round(heightPx * 0.055);
    const labelX = Math.round(widthPx * 0.04);
    const labelY = Math.round(heightPx * 0.06);
    if (typeof ctx.roundRect === "function") {
      ctx.beginPath();
      ctx.roundRect(labelX, labelY, labelWidth, labelHeight, Math.round(labelHeight / 2));
      ctx.fill();
      ctx.strokeStyle = "rgba(29,29,27,0.14)";
      ctx.lineWidth = Math.max(1, Math.round(widthPx / 1800));
      ctx.stroke();
    } else {
      ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
    }
    ctx.fillStyle = "rgba(95,101,92,0.88)";
    ctx.font = `${Math.max(16, Math.round(widthPx / 70))}px ${FONT_FAMILY}, Helvetica, Arial, sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillText("Kartenvorschau", labelX + Math.round(labelHeight * 0.45), labelY + labelHeight / 2);

    return canvasToImageDataUrl(canvas, "jpeg", 0.9);
  }

  scope.planTemplatePdfRenderer = {
    buildPdfBlob,
    buildPdfBlobFromPages,
    createPlaceholderMapDataUrl,
    normalizeScaleDenominator,
    getScaleLabel,
    fontFamily: FONT_FAMILY
  };
})(window);
