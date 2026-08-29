/**
 * 阅读器表面配色方案：内置亮/暗各一套完整 9 色，用户方案可增删改名。
 */
import {
  defaultReaderPaletteDark,
  defaultReaderPaletteLight,
  isValidReaderSurfaceHex,
  overridesFromColorEnabled,
  overridesFromFullPalette,
  parseReaderPaletteOverrides,
  READER_SURFACE_KEYS,
  type ReaderSurfaceColorEnabled,
  type ReaderSurfacePalette,
} from "./readerPalette";

export const DEFAULT_READER_PALETTE_PRESET_ID = "default";
/** 保留 id，避免用户方案占用（旧草稿曾用「当前配色」） */
export const CURRENT_READER_PALETTE_PRESET_KEY = "current";
export const DEFAULT_USER_READER_PALETTE_PRESET_NAME = "自定义";

export type ReaderPalettePresetSnapshot = {
  light: ReaderSurfacePalette;
  dark: ReaderSurfacePalette;
};

export type ReaderPalettePreset = ReaderPalettePresetSnapshot & {
  id: string;
  name: string;
};

function assertFullPalette(
  id: string,
  side: "light" | "dark",
  palette: ReaderSurfacePalette,
): ReaderSurfacePalette {
  for (const key of READER_SURFACE_KEYS) {
    if (!palette[key]) {
      throw new Error(`配色方案「${id}」${side} 缺少 ${key}`);
    }
  }
  return palette;
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
    light: assertFullPalette(id, "light", light),
    dark: assertFullPalette(id, "dark", dark),
  };
}

/** 内置方案（「默认」为现有阅读器色；其余名称与色调见列表顺序） */
export const BUILTIN_READER_PALETTE_PRESETS: readonly ReaderPalettePreset[] = [
  preset(
    DEFAULT_READER_PALETTE_PRESET_ID,
    "默认",
    { ...defaultReaderPaletteLight },
    { ...defaultReaderPaletteDark },
  ),
  /** VS Code Light High Contrast / Default High Contrast（Monaco hc-light / hc-black）映射到 9 槽；背景纯白/纯黑 */
  preset(
    "highContrast",
    "高对比度",
    {
      readerBg: "#ffffff",
      chapterTitle: "#0f4a85",
      bodyText: "#292929",
      txtrQuoteInner: "#811f3f",
      txtrBracketInner: "#185e73",
      txtrPunctuation: "#000000",
      txtrSpecialMarker: "#b5200d",
      txtrNumber: "#096d48",
      txtrEnglish: "#5e2cbc",
    },
    {
      readerBg: "#000000",
      chapterTitle: "#569cd6",
      bodyText: "#ffffff",
      txtrQuoteInner: "#ce9178",
      txtrBracketInner: "#3dc9b0",
      txtrPunctuation: "#ffff00",
      txtrSpecialMarker: "#f44747",
      txtrNumber: "#b5cea8",
      txtrEnglish: "#1aebff",
    },
  ),
  preset(
    "dawn",
    "晨曦",
    {
      readerBg: "#fff6e8",
      chapterTitle: "#c4783a",
      bodyText: "#3d2e24",
      txtrQuoteInner: "#5340a0",
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
      txtrQuoteInner: "#cbb8f5",
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
      txtrQuoteInner: "#6b2e90",
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
      txtrQuoteInner: "#d8b0ff",
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
      txtrQuoteInner: "#9a6808",
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
      txtrQuoteInner: "#f5d15c",
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
      txtrQuoteInner: "#27664f",
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
      txtrQuoteInner: "#8fcfb4",
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
      txtrQuoteInner: "#3f6f4e",
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
      txtrQuoteInner: "#a3be8c",
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
      txtrQuoteInner: "#9c3470",
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
      txtrQuoteInner: "#f2b0d0",
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
      txtrQuoteInner: "#2f6a36",
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
      txtrQuoteInner: "#9fd4a0",
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
      txtrQuoteInner: "#6b6410",
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
      txtrQuoteInner: "#b8bb26",
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
      txtrQuoteInner: "#6e52a8",
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
      txtrQuoteInner: "#d4c0f8",
      txtrBracketInner: "#a8b8d8",
      txtrPunctuation: "#a8d0c0",
      txtrSpecialMarker: "#f0b8b0",
      txtrNumber: "#e0c898",
      txtrEnglish: "#d0b0c8",
    },
  ),
  /** 下列四套按开源编辑器主题色板映射到 9 槽（非官方移植；名称自拟） */
  preset(
    "nord",
    "北境",
    {
      readerBg: "#eceff4",
      chapterTitle: "#3d6494",
      bodyText: "#2e3440",
      txtrQuoteInner: "#3d8b48",
      txtrBracketInner: "#5e81ac",
      txtrPunctuation: "#2a6a88",
      txtrSpecialMarker: "#bf616a",
      txtrNumber: "#b48ead",
      txtrEnglish: "#c07850",
    },
    {
      readerBg: "#2e3440",
      chapterTitle: "#88c0d0",
      bodyText: "#d8dee9",
      txtrQuoteInner: "#a3be8c",
      txtrBracketInner: "#81a1c1",
      txtrPunctuation: "#8fbcbb",
      txtrSpecialMarker: "#bf616a",
      txtrNumber: "#b48ead",
      txtrEnglish: "#d08770",
    },
  ),
  preset(
    "solarized",
    "日晖",
    {
      readerBg: "#fdf6e3",
      chapterTitle: "#268bd2",
      bodyText: "#4a5c63",
      txtrQuoteInner: "#2aa198",
      txtrBracketInner: "#6c71c4",
      txtrPunctuation: "#d4b01c",
      txtrSpecialMarker: "#e04a88",
      txtrNumber: "#c44510",
      txtrEnglish: "#859900",
    },
    {
      readerBg: "#1a2428",
      chapterTitle: "#84b8d8",
      bodyText: "#c5d0d0",
      txtrQuoteInner: "#7ab8b0",
      txtrBracketInner: "#b4b8ea",
      txtrPunctuation: "#b58900",
      txtrSpecialMarker: "#c87e7a",
      txtrNumber: "#cb4b16",
      txtrEnglish: "#859900",
    },
  ),
  preset(
    "catppuccin",
    "奶茶",
    {
      readerBg: "#eff1f5",
      chapterTitle: "#1e66f5",
      bodyText: "#4c4f69",
      txtrQuoteInner: "#40a02b",
      txtrBracketInner: "#1a7ab8",
      txtrPunctuation: "#179299",
      txtrSpecialMarker: "#c04a5c",
      txtrNumber: "#d07848",
      txtrEnglish: "#8839ef",
    },
    {
      readerBg: "#1e1e2e",
      chapterTitle: "#89b4fa",
      bodyText: "#cdd6f4",
      txtrQuoteInner: "#a6e3a1",
      txtrBracketInner: "#74c7ec",
      txtrPunctuation: "#94e2d5",
      txtrSpecialMarker: "#f38ba8",
      txtrNumber: "#fab387",
      txtrEnglish: "#cba6f7",
    },
  ),
  preset(
    "gruvbox",
    "暖木",
    {
      readerBg: "#fbf1c7",
      chapterTitle: "#076678",
      bodyText: "#3c3836",
      txtrQuoteInner: "#79740e",
      txtrBracketInner: "#427b58",
      txtrPunctuation: "#c4b49a",
      txtrSpecialMarker: "#b84842",
      txtrNumber: "#8f3f71",
      txtrEnglish: "#af3a03",
    },
    {
      readerBg: "#282828",
      chapterTitle: "#83a598",
      bodyText: "#ebdbb2",
      txtrQuoteInner: "#b8bb26",
      txtrBracketInner: "#8ec07c",
      txtrPunctuation: "#928374",
      txtrSpecialMarker: "#d09088",
      txtrNumber: "#d3869b",
      txtrEnglish: "#fe8019",
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

export function cloneReaderPaletteSnapshot(
  snap: ReaderPalettePresetSnapshot,
): ReaderPalettePresetSnapshot {
  return {
    light: cloneReaderSurfacePalette(snap.light),
    dark: cloneReaderSurfacePalette(snap.dark),
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

export function readerPaletteConfigsEqual(
  a: ReaderPalettePresetSnapshot,
  b: ReaderPalettePresetSnapshot,
): boolean {
  return palettesEqual(a.light, b.light) && palettesEqual(a.dark, b.dark);
}

/**
 * 按亮/暗 9 色匹配方案：先用户方案（相同色时保留副本为选中），再内置。
 */
export function findReaderPalettePresetByColors(
  snap: ReaderPalettePresetSnapshot,
  userPresets: readonly ReaderPalettePreset[],
): ReaderPalettePreset | undefined {
  for (const p of userPresets) {
    if (readerPaletteConfigsEqual(p, snap)) return p;
  }
  for (const p of BUILTIN_READER_PALETTE_PRESETS) {
    if (readerPaletteConfigsEqual(p, snap)) return p;
  }
  return undefined;
}

/** 当前色匹配不到任何方案时，追加名为「自定义」的用户方案并选中 */
export function ensureMatchedReaderPalettePreset(
  snap: ReaderPalettePresetSnapshot,
  userPresets: readonly ReaderPalettePreset[],
): { userPresets: ReaderPalettePreset[]; selected: ReaderPalettePreset } {
  const found = findReaderPalettePresetByColors(snap, userPresets);
  if (found) {
    return {
      userPresets: serializeReaderPaletteUserPresets(userPresets),
      selected: found,
    };
  }
  const custom: ReaderPalettePreset = {
    id: newUserReaderPalettePresetId(),
    name: DEFAULT_USER_READER_PALETTE_PRESET_NAME,
    ...cloneReaderPaletteSnapshot(snap),
  };
  return {
    userPresets: [...serializeReaderPaletteUserPresets(userPresets), custom],
    selected: custom,
  };
}

export type PersistedReaderPaletteState = {
  readerPaletteOverridesLight: Partial<ReaderSurfacePalette>;
  readerPaletteOverridesDark: Partial<ReaderSurfacePalette>;
  readerPaletteColorEnabledOverrides: Partial<ReaderSurfaceColorEnabled>;
  readerPaletteUserPresets: ReaderPalettePreset[];
};

export function toPersistedReaderPaletteState(input: {
  light: ReaderSurfacePalette;
  dark: ReaderSurfacePalette;
  colorEnabled: ReaderSurfaceColorEnabled;
  userPresets: readonly ReaderPalettePreset[];
}): PersistedReaderPaletteState {
  return {
    readerPaletteOverridesLight: overridesFromFullPalette(
      input.light,
      defaultReaderPaletteLight,
    ),
    readerPaletteOverridesDark: overridesFromFullPalette(
      input.dark,
      defaultReaderPaletteDark,
    ),
    readerPaletteColorEnabledOverrides: overridesFromColorEnabled(
      input.colorEnabled,
    ),
    readerPaletteUserPresets: serializeReaderPaletteUserPresets(
      input.userPresets,
    ),
  };
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

function isReservedPresetId(id: string): boolean {
  return (
    id === CURRENT_READER_PALETTE_PRESET_KEY ||
    isBuiltinReaderPalettePresetId(id)
  );
}

/** 从持久化 JSON 解析用户配色方案；非法项丢弃 */
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
    });
  }
  return out;
}

export function serializeReaderPaletteUserPresets(
  presets: readonly ReaderPalettePreset[],
): ReaderPalettePreset[] {
  return presets.map((p) => cloneReaderPalettePreset(p));
}
