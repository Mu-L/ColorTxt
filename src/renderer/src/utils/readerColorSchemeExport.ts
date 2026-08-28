/**
 * 配色面板导入/导出 JSON（阅读器表面色 + 高亮色 + 标注色）。
 */
import {
  defaultReaderPaletteColorEnabled,
  defaultReaderPaletteDark,
  defaultReaderPaletteLight,
  mergeReaderPaletteColorEnabled,
  mergeReaderSurfacePalette,
  parseReaderPaletteOverrides,
  READER_SURFACE_OPTIONAL_COLOR_KEYS,
  type ReaderSurfaceColorEnabled,
  type ReaderSurfacePalette,
} from "../constants/readerPalette";
import {
  parseReaderPaletteSelectedPresetId,
  parseReaderPaletteUserPresets,
  serializeReaderPaletteUserPresets,
  type ReaderPalettePreset,
} from "../constants/readerPalettePresets";
import { parseHighlightColorsArray } from "../constants/highlightColors";
import { parseLineationColorsArray } from "../constants/lineationColors";

export const COLOR_SCHEME_EXPORT_KIND = "colortxt-color-scheme";
export const COLOR_SCHEME_EXPORT_SCHEMA_VERSION = 1;
export const COLOR_SCHEME_EXPORT_DEFAULT_NAME = "colortxt-color-scheme.json";

export type ColorSchemeExportReader = {
  light: ReaderSurfacePalette;
  dark: ReaderSurfacePalette;
  colorEnabledLight: ReaderSurfaceColorEnabled;
  colorEnabledDark: ReaderSurfaceColorEnabled;
  userPresets: ReaderPalettePreset[];
  selectedPresetId: string;
};

export type ColorSchemeExportColors = {
  light: string[];
  dark: string[];
};

export type ColorSchemeExportV1 = {
  kind: typeof COLOR_SCHEME_EXPORT_KIND;
  schemaVersion: typeof COLOR_SCHEME_EXPORT_SCHEMA_VERSION;
  exportedAt: number;
  reader?: ColorSchemeExportReader;
  highlight?: ColorSchemeExportColors;
  lineation?: ColorSchemeExportColors;
};

function parseExportedColorEnabled(raw: unknown): ReaderSurfaceColorEnabled {
  if (!raw || typeof raw !== "object") {
    return { ...defaultReaderPaletteColorEnabled };
  }
  const o = raw as Record<string, unknown>;
  const partial: Partial<ReaderSurfaceColorEnabled> = {};
  for (const key of READER_SURFACE_OPTIONAL_COLOR_KEYS) {
    if (o[key] === false) partial[key] = false;
    else if (o[key] === true) partial[key] = true;
  }
  return mergeReaderPaletteColorEnabled(partial);
}

function parseExportedPalette(
  raw: unknown,
  fallback: ReaderSurfacePalette,
): ReaderSurfacePalette | null {
  const partial = parseReaderPaletteOverrides(raw);
  if (Object.keys(partial).length === 0) return null;
  return mergeReaderSurfacePalette(fallback, partial);
}

function parseExportedReader(raw: unknown): ColorSchemeExportReader | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const light = parseExportedPalette(o.light, defaultReaderPaletteLight);
  const dark = parseExportedPalette(o.dark, defaultReaderPaletteDark);
  if (!light || !dark) return null;
  const userPresets = parseReaderPaletteUserPresets(o.userPresets);
  return {
    light,
    dark,
    colorEnabledLight: parseExportedColorEnabled(o.colorEnabledLight),
    colorEnabledDark: parseExportedColorEnabled(o.colorEnabledDark),
    userPresets,
    selectedPresetId: parseReaderPaletteSelectedPresetId(
      o.selectedPresetId,
      userPresets,
    ),
  };
}

function parseExportedColorPair(raw: unknown, kind: "highlight" | "lineation") {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const parse =
    kind === "highlight" ? parseHighlightColorsArray : parseLineationColorsArray;
  const light = parse(o.light);
  const dark = parse(o.dark);
  if (!light || !dark) return undefined;
  return { light, dark };
}

export function buildColorSchemeExportPayload(input: {
  reader?: ColorSchemeExportReader;
  highlight?: ColorSchemeExportColors;
  lineation?: ColorSchemeExportColors;
}): ColorSchemeExportV1 {
  const payload: ColorSchemeExportV1 = {
    kind: COLOR_SCHEME_EXPORT_KIND,
    schemaVersion: COLOR_SCHEME_EXPORT_SCHEMA_VERSION,
    exportedAt: Date.now(),
  };
  if (input.reader) {
    payload.reader = {
      light: { ...input.reader.light },
      dark: { ...input.reader.dark },
      colorEnabledLight: { ...input.reader.colorEnabledLight },
      colorEnabledDark: { ...input.reader.colorEnabledDark },
      userPresets: serializeReaderPaletteUserPresets(input.reader.userPresets),
      selectedPresetId: input.reader.selectedPresetId,
    };
  }
  if (input.highlight) {
    payload.highlight = {
      light: [...input.highlight.light],
      dark: [...input.highlight.dark],
    };
  }
  if (input.lineation) {
    payload.lineation = {
      light: [...input.lineation.light],
      dark: [...input.lineation.dark],
    };
  }
  return payload;
}

export function stringifyColorSchemeExport(payload: ColorSchemeExportV1): string {
  return `${JSON.stringify(payload, null, 2)}\n`;
}

export function parseColorSchemeExportJson(
  raw: string,
): ColorSchemeExportV1 | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    const o = parsed as Record<string, unknown>;
    if (o.kind != null && o.kind !== COLOR_SCHEME_EXPORT_KIND) return null;
    if (o.schemaVersion !== COLOR_SCHEME_EXPORT_SCHEMA_VERSION) return null;
    const reader = parseExportedReader(o.reader);
    const highlight = parseExportedColorPair(o.highlight, "highlight");
    const lineation = parseExportedColorPair(o.lineation, "lineation");
    if (!reader && !highlight && !lineation) return null;
    return {
      kind: COLOR_SCHEME_EXPORT_KIND,
      schemaVersion: COLOR_SCHEME_EXPORT_SCHEMA_VERSION,
      exportedAt:
        typeof o.exportedAt === "number" && Number.isFinite(o.exportedAt)
          ? o.exportedAt
          : Date.now(),
      ...(reader ? { reader } : {}),
      ...(highlight ? { highlight } : {}),
      ...(lineation ? { lineation } : {}),
    };
  } catch {
    return null;
  }
}
