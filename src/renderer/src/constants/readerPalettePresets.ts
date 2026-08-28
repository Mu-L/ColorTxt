/**
 * 阅读器表面配色预设：内置亮/暗各一套完整 9 色，用户预设可增删改名。
 */
import {
  defaultReaderPaletteColorEnabled,
  defaultReaderPaletteDark,
  defaultReaderPaletteLight,
  isValidReaderSurfaceHex,
  parseReaderPaletteOverrides,
  READER_SURFACE_KEYS,
  READER_SURFACE_OPTIONAL_COLOR_KEYS,
  type ReaderSurfaceColorEnabled,
  type ReaderSurfacePalette,
} from "./readerPalette";

export const DEFAULT_READER_PALETTE_PRESET_ID = "default";
export const CURRENT_READER_PALETTE_PRESET_KEY = "current";
export const CURRENT_READER_PALETTE_PRESET_NAME = "当前配色";
export const DEFAULT_USER_READER_PALETTE_PRESET_NAME = "自定义";

export type ReaderPalettePresetSnapshot = {
  light: ReaderSurfacePalette;
  dark: ReaderSurfacePalette;
  colorEnabledLight: ReaderSurfaceColorEnabled;
  colorEnabledDark: ReaderSurfaceColorEnabled;
};

export type ReaderPalettePreset = ReaderPalettePresetSnapshot & {
  id: string;
  name: string;
};

function allEnabled(): ReaderSurfaceColorEnabled {
  return { ...defaultReaderPaletteColorEnabled };
}

function preset(
  id: string,
  name: string,
  light: ReaderSurfacePalette,
  dark: ReaderSurfacePalette,
): ReaderPalettePreset {
  return {
    id,
    name,
    light,
    dark,
    colorEnabledLight: allEnabled(),
    colorEnabledDark: allEnabled(),
  };
}

/** 内置预设（「默认」为现有阅读器色；其余名称与色调见列表顺序） */
export const BUILTIN_READER_PALETTE_PRESETS: readonly ReaderPalettePreset[] = [
  preset(
    DEFAULT_READER_PALETTE_PRESET_ID,
    "默认",
    { ...defaultReaderPaletteLight },
    { ...defaultReaderPaletteDark },
  ),
  preset(
    "dawn",
    "晨曦",
    {
      readerBg: "#fff6e8",
      chapterTitle: "#c4783a",
      bodyText: "#3d2e24",
      txtrQuoteInner: "#b84a3a",
      txtrBracketInner: "#3a5a88",
      txtrPunctuation: "#3a8a78",
      txtrSpecialMarker: "#d87858",
      txtrNumber: "#a07030",
      txtrEnglish: "#8a5080",
    },
    {
      readerBg: "#2a221c",
      chapterTitle: "#e8b06a",
      bodyText: "#f0e0c8",
      txtrQuoteInner: "#e8a090",
      txtrBracketInner: "#90b0d8",
      txtrPunctuation: "#78c8b0",
      txtrSpecialMarker: "#f0a080",
      txtrNumber: "#e0c080",
      txtrEnglish: "#d0a0c0",
    },
  ),
  preset(
    "dusk",
    "晚霞",
    {
      readerBg: "#fff7f0",
      chapterTitle: "#fe6b64",
      bodyText: "#423126",
      txtrQuoteInner: "#c04030",
      txtrBracketInner: "#405070",
      txtrPunctuation: "#508070",
      txtrSpecialMarker: "#e05040",
      txtrNumber: "#8a6030",
      txtrEnglish: "#804060",
    },
    {
      readerBg: "#3c2b25",
      chapterTitle: "#ff9c94",
      bodyText: "#f6e1d7",
      txtrQuoteInner: "#ffb0a0",
      txtrBracketInner: "#b0c0d8",
      txtrPunctuation: "#a0d0c0",
      txtrSpecialMarker: "#ff9080",
      txtrNumber: "#e0c080",
      txtrEnglish: "#e0b0d0",
    },
  ),
  preset(
    "sunny",
    "晴天",
    {
      readerBg: "#f3f8fd",
      chapterTitle: "#1a73c9",
      bodyText: "#1a2838",
      txtrQuoteInner: "#c04050",
      txtrBracketInner: "#2d53e5",
      txtrPunctuation: "#2a8090",
      txtrSpecialMarker: "#e07070",
      txtrNumber: "#4a6080",
      txtrEnglish: "#6a40a0",
    },
    {
      readerBg: "#1a2838",
      chapterTitle: "#7ec8f0",
      bodyText: "#d4e4f0",
      txtrQuoteInner: "#e09090",
      txtrBracketInner: "#90b0e8",
      txtrPunctuation: "#70c0d0",
      txtrSpecialMarker: "#f07080",
      txtrNumber: "#d0c090",
      txtrEnglish: "#c090d8",
    },
  ),
  preset(
    "rain",
    "雨天",
    {
      readerBg: "#d8dde4",
      chapterTitle: "#4a6a88",
      bodyText: "#2a3038",
      txtrQuoteInner: "#8b3a3a",
      txtrBracketInner: "#3a4a7a",
      txtrPunctuation: "#3a6a78",
      txtrSpecialMarker: "#a85858",
      txtrNumber: "#6b5a40",
      txtrEnglish: "#5a4a7a",
    },
    {
      readerBg: "#2c323c",
      chapterTitle: "#8aa4bc",
      bodyText: "#c8d0d8",
      txtrQuoteInner: "#d09088",
      txtrBracketInner: "#a0b8d8",
      txtrPunctuation: "#78b0b8",
      txtrSpecialMarker: "#d08888",
      txtrNumber: "#c8c0a0",
      txtrEnglish: "#b8a8c8",
    },
  ),
  preset(
    "snow",
    "雪原",
    {
      readerBg: "#eceff4",
      chapterTitle: "#5e81ac",
      bodyText: "#2e3440",
      txtrQuoteInner: "#bf616a",
      txtrBracketInner: "#5e81ac",
      txtrPunctuation: "#8fbcbb",
      txtrSpecialMarker: "#d08770",
      txtrNumber: "#a07840",
      txtrEnglish: "#b48ead",
    },
    {
      readerBg: "#2e3440",
      chapterTitle: "#88c0d0",
      bodyText: "#d8dee9",
      txtrQuoteInner: "#bf616a",
      txtrBracketInner: "#81a1c1",
      txtrPunctuation: "#8fbcbb",
      txtrSpecialMarker: "#d08770",
      txtrNumber: "#ebcb8b",
      txtrEnglish: "#b48ead",
    },
  ),
  preset(
    "bamboo",
    "竹林",
    {
      readerBg: "#d7dbbd",
      chapterTitle: "#177b4d",
      bodyText: "#232c16",
      txtrQuoteInner: "#8b2a1a",
      txtrBracketInner: "#1a4060",
      txtrPunctuation: "#2a6b5a",
      txtrSpecialMarker: "#c45c4c",
      txtrNumber: "#5a6020",
      txtrEnglish: "#5a2a7a",
    },
    {
      readerBg: "#333627",
      chapterTitle: "#a6d608",
      bodyText: "#d8deba",
      txtrQuoteInner: "#e0a080",
      txtrBracketInner: "#9cc8e0",
      txtrPunctuation: "#7ec9a0",
      txtrSpecialMarker: "#f08070",
      txtrNumber: "#c8d080",
      txtrEnglish: "#c8a0d0",
    },
  ),
  preset(
    "peach",
    "桃染",
    {
      readerBg: "#f0d1d5",
      chapterTitle: "#de3838",
      bodyText: "#4e1609",
      txtrQuoteInner: "#a01020",
      txtrBracketInner: "#3a2060",
      txtrPunctuation: "#6a4070",
      txtrSpecialMarker: "#c03040",
      txtrNumber: "#8a4030",
      txtrEnglish: "#7a2060",
    },
    {
      readerBg: "#462f32",
      chapterTitle: "#ff646e",
      bodyText: "#e5c4c8",
      txtrQuoteInner: "#ff9aa0",
      txtrBracketInner: "#c8b0e0",
      txtrPunctuation: "#e0a0b0",
      txtrSpecialMarker: "#ff8088",
      txtrNumber: "#e0c090",
      txtrEnglish: "#e0a0d0",
    },
  ),
  preset(
    "autumn",
    "秋叶",
    {
      readerBg: "#fbf1c7",
      chapterTitle: "#c06020",
      bodyText: "#3c3836",
      txtrQuoteInner: "#9d0006",
      txtrBracketInner: "#076678",
      txtrPunctuation: "#427b58",
      txtrSpecialMarker: "#af3a03",
      txtrNumber: "#b57614",
      txtrEnglish: "#8f3f71",
    },
    {
      readerBg: "#282828",
      chapterTitle: "#fe8019",
      bodyText: "#ebdbb2",
      txtrQuoteInner: "#fb4934",
      txtrBracketInner: "#83a598",
      txtrPunctuation: "#8ec07c",
      txtrSpecialMarker: "#fe8019",
      txtrNumber: "#fabd2f",
      txtrEnglish: "#d3869b",
    },
  ),
  preset(
    "hakimi",
    "哈基米",
    {
      readerBg: "#faf0e8",
      chapterTitle: "#c9887a",
      bodyText: "#5a453c",
      txtrQuoteInner: "#c07070",
      txtrBracketInner: "#7a8ab0",
      txtrPunctuation: "#7aaa9a",
      txtrSpecialMarker: "#e8a0a0",
      txtrNumber: "#c4a070",
      txtrEnglish: "#b080a8",
    },
    {
      readerBg: "#342c2a",
      chapterTitle: "#e8b0a0",
      bodyText: "#efe4dc",
      txtrQuoteInner: "#e8a8a0",
      txtrBracketInner: "#a8b8d8",
      txtrPunctuation: "#a8d0c0",
      txtrSpecialMarker: "#f0b8b0",
      txtrNumber: "#e0c898",
      txtrEnglish: "#d0b0c8",
    },
  ),
];

const BUILTIN_ID_SET = new Set(
  BUILTIN_READER_PALETTE_PRESETS.map((p) => p.id),
);

export function isBuiltinReaderPalettePresetId(id: string): boolean {
  return BUILTIN_ID_SET.has(id);
}

export function cloneReaderSurfacePalette(
  palette: ReaderSurfacePalette,
): ReaderSurfacePalette {
  return { ...palette };
}

export function cloneReaderPaletteColorEnabled(
  enabled: ReaderSurfaceColorEnabled,
): ReaderSurfaceColorEnabled {
  return { ...enabled };
}

export function cloneReaderPaletteSnapshot(
  snap: ReaderPalettePresetSnapshot,
): ReaderPalettePresetSnapshot {
  return {
    light: cloneReaderSurfacePalette(snap.light),
    dark: cloneReaderSurfacePalette(snap.dark),
    colorEnabledLight: cloneReaderPaletteColorEnabled(snap.colorEnabledLight),
    colorEnabledDark: cloneReaderPaletteColorEnabled(snap.colorEnabledDark),
  };
}

export function cloneReaderPalettePreset(
  presetItem: ReaderPalettePreset,
): ReaderPalettePreset {
  return {
    id: presetItem.id,
    name: presetItem.name,
    ...cloneReaderPaletteSnapshot(presetItem),
  };
}

function palettesEqual(
  a: ReaderSurfacePalette,
  b: ReaderSurfacePalette,
): boolean {
  for (const key of READER_SURFACE_KEYS) {
    const av = String(a[key] ?? "")
      .trim()
      .toLowerCase();
    const bv = String(b[key] ?? "")
      .trim()
      .toLowerCase();
    if (av !== bv) return false;
  }
  return true;
}

/** 只比较 9 个色值（忽略 token 开关） */
export function readerPaletteSurfacesEqual(
  a: ReaderSurfacePalette,
  b: ReaderSurfacePalette,
): boolean {
  return palettesEqual(a, b);
}

function isOptionalColorOn(
  enabled: ReaderSurfaceColorEnabled,
  key: (typeof READER_SURFACE_OPTIONAL_COLOR_KEYS)[number],
): boolean {
  return enabled[key] !== false;
}

function colorEnabledEqual(
  a: ReaderSurfaceColorEnabled,
  b: ReaderSurfaceColorEnabled,
): boolean {
  for (const key of READER_SURFACE_OPTIONAL_COLOR_KEYS) {
    if (isOptionalColorOn(a, key) !== isOptionalColorOn(b, key)) return false;
  }
  return true;
}

export function readerPaletteConfigsEqual(
  a: ReaderPalettePresetSnapshot,
  b: ReaderPalettePresetSnapshot,
): boolean {
  return (
    palettesEqual(a.light, b.light) &&
    palettesEqual(a.dark, b.dark) &&
    colorEnabledEqual(a.colorEnabledLight, b.colorEnabledLight) &&
    colorEnabledEqual(a.colorEnabledDark, b.colorEnabledDark)
  );
}

export function getBuiltinReaderPalettePreset(
  id: string,
): ReaderPalettePreset | undefined {
  return BUILTIN_READER_PALETTE_PRESETS.find((p) => p.id === id);
}

export function findNamedReaderPalettePreset(
  id: string,
  userPresets: readonly ReaderPalettePreset[],
): ReaderPalettePreset | undefined {
  const builtin = getBuiltinReaderPalettePreset(id);
  if (builtin) return builtin;
  return userPresets.find((p) => p.id === id);
}

/** 找不到 id 时回退为内置「默认」 */
export function resolveNamedReaderPalettePreset(
  id: string,
  userPresets: readonly ReaderPalettePreset[],
): ReaderPalettePreset {
  return (
    findNamedReaderPalettePreset(id, userPresets) ??
    getBuiltinReaderPalettePreset(DEFAULT_READER_PALETTE_PRESET_ID)!
  );
}

export function newUserReaderPalettePresetId(): string {
  return `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function parseFullPalette(raw: unknown): ReaderSurfacePalette | null {
  const partial = parseReaderPaletteOverrides(raw);
  for (const key of READER_SURFACE_KEYS) {
    if (!partial[key] || !isValidReaderSurfaceHex(partial[key]!)) return null;
  }
  return {
    readerBg: partial.readerBg!,
    chapterTitle: partial.chapterTitle!,
    bodyText: partial.bodyText!,
    txtrQuoteInner: partial.txtrQuoteInner!,
    txtrBracketInner: partial.txtrBracketInner!,
    txtrPunctuation: partial.txtrPunctuation!,
    txtrSpecialMarker: partial.txtrSpecialMarker!,
    txtrNumber: partial.txtrNumber!,
    txtrEnglish: partial.txtrEnglish!,
  };
}

function parsePresetColorEnabled(raw: unknown): ReaderSurfaceColorEnabled {
  const out = allEnabled();
  if (!raw || typeof raw !== "object") return out;
  const o = raw as Record<string, unknown>;
  for (const key of READER_SURFACE_OPTIONAL_COLOR_KEYS) {
    if (o[key] === false) out[key] = false;
    else if (o[key] === true) out[key] = true;
  }
  return out;
}

function isReservedPresetId(id: string): boolean {
  return (
    id === CURRENT_READER_PALETTE_PRESET_KEY ||
    isBuiltinReaderPalettePresetId(id)
  );
}

/** 从持久化 JSON 解析用户预设；非法项丢弃 */
export function parseReaderPaletteUserPresets(
  raw: unknown,
): ReaderPalettePreset[] {
  if (!Array.isArray(raw)) return [];
  const out: ReaderPalettePreset[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    if (typeof o.id !== "string") continue;
    const id = o.id.trim();
    if (!id || isReservedPresetId(id) || seen.has(id)) continue;
    if (typeof o.name !== "string") continue;
    const name = o.name.trim() || DEFAULT_USER_READER_PALETTE_PRESET_NAME;
    const light = parseFullPalette(o.light);
    const dark = parseFullPalette(o.dark);
    if (!light || !dark) continue;
    seen.add(id);
    out.push({
      id,
      name,
      light,
      dark,
      colorEnabledLight: parsePresetColorEnabled(o.colorEnabledLight),
      colorEnabledDark: parsePresetColorEnabled(o.colorEnabledDark),
    });
  }
  return out;
}

/** 校验已点选的命名预设 id；无效则回退「默认」 */
export function parseReaderPaletteSelectedPresetId(
  raw: unknown,
  userPresets: readonly ReaderPalettePreset[],
): string {
  if (typeof raw !== "string") return DEFAULT_READER_PALETTE_PRESET_ID;
  const id = raw.trim();
  if (!id || id === CURRENT_READER_PALETTE_PRESET_KEY) {
    return DEFAULT_READER_PALETTE_PRESET_ID;
  }
  if (findNamedReaderPalettePreset(id, userPresets)) return id;
  return DEFAULT_READER_PALETTE_PRESET_ID;
}

export function serializeReaderPaletteUserPresets(
  presets: readonly ReaderPalettePreset[],
): ReaderPalettePreset[] {
  return presets.map((p) => cloneReaderPalettePreset(p));
}
