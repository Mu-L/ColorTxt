<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { StyleValue } from "vue";
import AppModal from "./AppModal.vue";
import ColorSchemeHighlightPanel, {
  type HighlightColorRow,
} from "./ColorSchemeHighlightPanel.vue";
import ColorSchemeLineationPanel, {
  type LineationColorRow,
} from "./ColorSchemeLineationPanel.vue";
import ColorSchemeReaderPanel, {
  type ColorSchemeReaderPane,
} from "./ColorSchemeReaderPanel.vue";
import ColorSchemePresetList, {
  type ColorSchemePresetListRow,
} from "./ColorSchemePresetList.vue";
import ColorSchemeTabBar, {
  type ColorSchemeTabId,
} from "./ColorSchemeTabBar.vue";
import {
  defaultReaderPaletteColorEnabled,
  defaultReaderPaletteDark,
  defaultReaderPaletteLight,
  mergeReaderPaletteColorEnabled,
  READER_SURFACE_PRESET_CARD_SWATCH_KEYS,
  resolveEffectiveReaderPalette,
  type ReaderSurfaceColorEnabled,
  type ReaderSurfacePalette,
} from "../constants/appUi";
import {
  BUILTIN_READER_PALETTE_PRESETS,
  cloneReaderPaletteSnapshot,
  DEFAULT_READER_PALETTE_PRESET_ID,
  DEFAULT_USER_READER_PALETTE_PRESET_NAME,
  ensureMatchedReaderPalettePreset,
  findNamedReaderPalettePreset,
  newUserReaderPalettePresetId,
  resolveNamedReaderPalettePreset,
  serializeReaderPaletteUserPresets,
  type ReaderPalettePreset,
  type ReaderPalettePresetSnapshot,
} from "../constants/readerPalettePresets";
import {
  DEFAULT_HIGHLIGHT_COLORS_DARK,
  DEFAULT_HIGHLIGHT_COLORS_LIGHT,
  MIN_HIGHLIGHT_COLORS,
} from "../constants/highlightColors";
import {
  DEFAULT_LINEATION_COLORS_DARK,
  DEFAULT_LINEATION_COLORS_LIGHT,
  MIN_LINEATION_COLORS,
} from "../constants/lineationColors";
import { icons } from "../icons";
import { appConfirm, appPrompt } from "../services/appDialog";
import { appToast } from "../services/appToast";
import { pickAndReadJsonFile } from "../utils/readerAnnotationExport";
import {
  buildColorSchemeExportPayload,
  COLOR_SCHEME_EXPORT_DEFAULT_NAME,
  parseColorSchemeExportJson,
  stringifyColorSchemeExport,
  type ColorSchemeExportV1,
} from "../utils/readerColorSchemeExport";

/** 配色「应用」一次提交；字段随 visibleTabs 出现 */
export type ColorSchemeApplyPayload = {
  reader?: {
    light: ReaderSurfacePalette;
    dark: ReaderSurfacePalette;
    colorEnabled: ReaderSurfaceColorEnabled;
    userPresets: ReaderPalettePreset[];
  };
  highlight?: { light: string[]; dark: string[] };
  lineation?: { light: string[]; dark: string[] };
};

const props = withDefaults(
  defineProps<{
    currentTheme: string;
    readerSurfaceLight: ReaderSurfacePalette;
    readerSurfaceDark: ReaderSurfacePalette;
    readerPaletteColorEnabled: ReaderSurfaceColorEnabled;
    monacoFontFamily: string;
    highlightColorsLight?: string[];
    highlightColorsDark?: string[];
    lineationColorsLight?: string[];
    lineationColorsDark?: string[];
    readerPaletteUserPresets?: ReaderPalettePreset[];
    /** 显示的标签；找书窗口仅传 `['reader']` */
    visibleTabs?: ColorSchemeTabId[];
  }>(),
  {
    highlightColorsLight: () => [...DEFAULT_HIGHLIGHT_COLORS_LIGHT],
    highlightColorsDark: () => [...DEFAULT_HIGHLIGHT_COLORS_DARK],
    lineationColorsLight: () => [...DEFAULT_LINEATION_COLORS_LIGHT],
    lineationColorsDark: () => [...DEFAULT_LINEATION_COLORS_DARK],
    readerPaletteUserPresets: () => [],
    visibleTabs: () => ["reader", "highlight", "lineation"],
  },
);

const emit = defineEmits<{
  apply: [payload: ColorSchemeApplyPayload];
  changeTheme: [theme: "vs" | "vs-dark"];
}>();

const modelValue = defineModel<boolean>({ default: false });

const activeTab = ref<ColorSchemeTabId>("reader");

function ensureActiveTabInVisible() {
  if (!props.visibleTabs.includes(activeTab.value)) {
    activeTab.value = props.visibleTabs[0] ?? "reader";
  }
}

const draftLight = ref<ReaderSurfacePalette>({ ...defaultReaderPaletteLight });
const draftDark = ref<ReaderSurfacePalette>({ ...defaultReaderPaletteDark });
const draftColorEnabled = ref<ReaderSurfaceColorEnabled>({
  ...defaultReaderPaletteColorEnabled,
});

const readerPane = ref<ColorSchemeReaderPane>("list");
const activePresetKey = ref(DEFAULT_READER_PALETTE_PRESET_ID);
const draftUserPresets = ref<ReaderPalettePreset[]>([]);
let draftBaselineJson = "";

let highlightRowIdSeq = 0;

function newHighlightRowId(): string {
  highlightRowIdSeq += 1;
  return `hl-${Date.now()}-${highlightRowIdSeq}`;
}

let lineationRowIdSeq = 0;

function newLineationRowId(): string {
  lineationRowIdSeq += 1;
  return `ln-${Date.now()}-${lineationRowIdSeq}`;
}

function colorsToDraftRows(colors: readonly string[]): HighlightColorRow[] {
  return colors.map((color) => ({ id: newHighlightRowId(), color }));
}

function lineationColorsToDraftRows(colors: readonly string[]): LineationColorRow[] {
  return colors.map((color) => ({ id: newLineationRowId(), color }));
}

const draftHighlightLight = ref<HighlightColorRow[]>(
  colorsToDraftRows(DEFAULT_HIGHLIGHT_COLORS_LIGHT),
);
const draftHighlightDark = ref<HighlightColorRow[]>(
  colorsToDraftRows(DEFAULT_HIGHLIGHT_COLORS_DARK),
);

const draftLineationLight = ref<LineationColorRow[]>(
  lineationColorsToDraftRows(DEFAULT_LINEATION_COLORS_LIGHT),
);
const draftLineationDark = ref<LineationColorRow[]>(
  lineationColorsToDraftRows(DEFAULT_LINEATION_COLORS_DARK),
);

const isLightShell = computed(() => props.currentTheme === "vs");

const activeDraft = computed(() =>
  isLightShell.value ? draftLight.value : draftDark.value,
);

const pickerLive = ref<Partial<Record<keyof ReaderSurfacePalette, string>>>({});

const highlightPickerLive = ref<Partial<Record<number, string>>>({});
const lineationPickerLive = ref<Partial<Record<number, string>>>({});

type ColorSchemeListPanelExpose = { scrollToBottom: () => void | Promise<void> };
type ColorSchemePresetListExpose = {
  scheduleScrollActiveIntoView: () => Promise<void>;
};
const highlightPanelRef = ref<ColorSchemeListPanelExpose | null>(null);
const lineationPanelRef = ref<ColorSchemeListPanelExpose | null>(null);
const presetListRef = ref<ColorSchemePresetListExpose | null>(null);

const displaySurface = computed((): ReaderSurfacePalette => {
  const palette = {
    ...activeDraft.value,
    ...pickerLive.value,
  };
  if (readerPane.value === "colors") return palette;
  return resolveEffectiveReaderPalette(palette, draftColorEnabled.value);
});

const previewBoxStyle = computed(
  (): StyleValue => ({
    backgroundColor: displaySurface.value.readerBg,
    fontFamily: props.monacoFontFamily,
    fontSize: "18px",
    lineHeight: 1.5,
  }),
);

const activeLineationList = computed(() =>
  isLightShell.value ? draftLineationLight.value : draftLineationDark.value,
);

const lineationPreviewHexes = computed(() =>
  activeLineationList.value.map((row, i) =>
    lineationPreviewHex(i, row.color),
  ),
);

const lineationReaderBg = computed(() =>
  isLightShell.value ? draftLight.value.readerBg : draftDark.value.readerBg,
);

const activeHighlightList = computed(() =>
  isLightShell.value ? draftHighlightLight.value : draftHighlightDark.value,
);

const highlightPreviewHexes = computed(() =>
  activeHighlightList.value.map((row, i) => highlightPreviewHex(i, row.color)),
);

const highlightReaderBg = computed(() =>
  isLightShell.value ? draftLight.value.readerBg : draftDark.value.readerBg,
);

const bodyTextForHighlightPreview = computed(
  () => displaySurface.value.bodyText,
);

function snapshotFromDraft(): ReaderPalettePresetSnapshot {
  return {
    light: { ...draftLight.value },
    dark: { ...draftDark.value },
  };
}

function applyPaletteToDraft(snap: Pick<ReaderPalettePresetSnapshot, "light" | "dark">) {
  draftLight.value = { ...snap.light };
  draftDark.value = { ...snap.dark };
}

function isEditingUserPreset(): boolean {
  return draftUserPresets.value.some((p) => p.id === activePresetKey.value);
}

const isUserPreset = computed(() => isEditingUserPreset());

function syncSelectionFromColors() {
  const matched = ensureMatchedReaderPalettePreset(
    snapshotFromDraft(),
    draftUserPresets.value,
  );
  draftUserPresets.value = matched.userPresets;
  activePresetKey.value = matched.selected.id;
}

function writeDraftIntoUserPreset(id: string) {
  const idx = draftUserPresets.value.findIndex((p) => p.id === id);
  if (idx < 0) return;
  const current = draftUserPresets.value[idx]!;
  const next = [...draftUserPresets.value];
  next[idx] = {
    ...current,
    ...cloneReaderPaletteSnapshot(snapshotFromDraft()),
  };
  draftUserPresets.value = next;
}

function markManualEdit() {
  if (isEditingUserPreset()) {
    writeDraftIntoUserPreset(activePresetKey.value);
  }
}

function presetListRowFromPalette(
  key: string,
  name: string,
  palette: ReaderSurfacePalette,
  custom: boolean,
): ColorSchemePresetListRow {
  return {
    key,
    name,
    bg: palette.readerBg,
    bodyText: palette.bodyText,
    swatches: READER_SURFACE_PRESET_CARD_SWATCH_KEYS.map((k) => palette[k]),
    custom,
  };
}

const presetListRows = computed((): ColorSchemePresetListRow[] => {
  const isLight = isLightShell.value;
  const rows: ColorSchemePresetListRow[] = [];
  for (const p of BUILTIN_READER_PALETTE_PRESETS) {
    const pal = isLight ? p.light : p.dark;
    rows.push(presetListRowFromPalette(p.id, p.name, pal, false));
  }
  for (const p of draftUserPresets.value) {
    const pal = isLight ? p.light : p.dark;
    rows.push(presetListRowFromPalette(p.id, p.name, pal, true));
  }
  return rows;
});

function onSelectPreset(key: string) {
  const named = findNamedReaderPalettePreset(key, draftUserPresets.value);
  if (!named) return;
  applyPaletteToDraft(named);
  activePresetKey.value = named.id;
}

async function onRenamePreset(id: string) {
  const idx = draftUserPresets.value.findIndex((p) => p.id === id);
  if (idx < 0) return;
  const current = draftUserPresets.value[idx]!;
  const input = await appPrompt("", {
    title: "方案名称",
    defaultValue: current.name,
    placeholder: DEFAULT_USER_READER_PALETTE_PRESET_NAME,
  });
  if (input === null) return;
  const name = input.trim() || DEFAULT_USER_READER_PALETTE_PRESET_NAME;
  const next = [...draftUserPresets.value];
  next[idx] = { ...current, name };
  draftUserPresets.value = next;
}

async function onDuplicatePreset(id: string) {
  const source = findNamedReaderPalettePreset(id, draftUserPresets.value);
  if (!source) return;
  const defaultName = `${source.name} 副本`;
  const input = await appPrompt("", {
    title: "方案名称",
    defaultValue: defaultName,
    placeholder: defaultName,
  });
  if (input === null) return;
  const name = input.trim() || defaultName;
  const snap =
    activePresetKey.value === id
      ? snapshotFromDraft()
      : cloneReaderPaletteSnapshot(source);
  const copy: ReaderPalettePreset = {
    id: newUserReaderPalettePresetId(),
    name,
    ...cloneReaderPaletteSnapshot(snap),
  };
  const userIdx = draftUserPresets.value.findIndex((p) => p.id === id);
  const next = [...draftUserPresets.value];
  if (userIdx >= 0) next.splice(userIdx + 1, 0, copy);
  else next.push(copy);
  draftUserPresets.value = next;
  applyPaletteToDraft(copy);
  activePresetKey.value = copy.id;
  // 进入编辑前先按选中项居中（末项会停在底部）；列表 v-show 会保留 scrollTop
  await presetListRef.value?.scheduleScrollActiveIntoView();
  readerPane.value = "colors";
}

function onCreateScheme() {
  void onDuplicatePreset(activePresetKey.value);
}

async function onDeletePreset(id: string) {
  const current = draftUserPresets.value.find((p) => p.id === id);
  if (!current) return;
  const ok = await appConfirm(`确定要删除配色方案「${current.name}」吗？`);
  if (!ok) return;
  const wasActive = activePresetKey.value === id;
  draftUserPresets.value = draftUserPresets.value.filter((p) => p.id !== id);
  if (wasActive) {
    const fallback = resolveNamedReaderPalettePreset(
      DEFAULT_READER_PALETTE_PRESET_ID,
      draftUserPresets.value,
    );
    applyPaletteToDraft(fallback);
    activePresetKey.value = fallback.id;
    readerPane.value = "list";
  }
}

function captureDraftBaseline() {
  draftBaselineJson = serializeDraftForCompare();
}

function serializeDraftForCompare(): string {
  return JSON.stringify({
    reader: props.visibleTabs.includes("reader")
      ? {
          light: draftLight.value,
          dark: draftDark.value,
          colorEnabled: draftColorEnabled.value,
          userPresets: draftUserPresets.value,
        }
      : null,
    highlight: props.visibleTabs.includes("highlight")
      ? {
          light: draftHighlightLight.value.map((r) => r.color),
          dark: draftHighlightDark.value.map((r) => r.color),
        }
      : null,
    lineation: props.visibleTabs.includes("lineation")
      ? {
          light: draftLineationLight.value.map((r) => r.color),
          dark: draftLineationDark.value.map((r) => r.color),
        }
      : null,
  });
}

function isDraftDirty(): boolean {
  if (Object.keys(pickerLive.value).length) return true;
  if (Object.keys(highlightPickerLive.value).length) return true;
  if (Object.keys(lineationPickerLive.value).length) return true;
  return serializeDraftForCompare() !== draftBaselineJson;
}

async function confirmDiscardIfDirty(): Promise<boolean> {
  if (!isDraftDirty()) return true;
  return appConfirm("配色已修改，确定要放弃这些改动吗？", "修改未保存");
}

function syncDraftFromProps() {
  draftLight.value = { ...props.readerSurfaceLight };
  draftDark.value = { ...props.readerSurfaceDark };
  draftColorEnabled.value = mergeReaderPaletteColorEnabled(
    props.readerPaletteColorEnabled,
  );
}

function syncPresetDraftFromProps() {
  draftUserPresets.value = serializeReaderPaletteUserPresets(
    props.readerPaletteUserPresets,
  );
  syncSelectionFromColors();
  readerPane.value = "list";
}

function syncHighlightDraftFromProps() {
  draftHighlightLight.value = colorsToDraftRows(props.highlightColorsLight);
  draftHighlightDark.value = colorsToDraftRows(props.highlightColorsDark);
}

function syncLineationDraftFromProps() {
  draftLineationLight.value = lineationColorsToDraftRows(props.lineationColorsLight);
  draftLineationDark.value = lineationColorsToDraftRows(props.lineationColorsDark);
}

function onPickerUpdate(key: keyof ReaderSurfacePalette, color: string) {
  const hex = color.startsWith("#") ? color : `#${color}`;
  const current = isLightShell.value
    ? draftLight.value[key]
    : draftDark.value[key];
  if (current.toLowerCase() === hex.toLowerCase()) return;
  if (isLightShell.value) {
    draftLight.value = { ...draftLight.value, [key]: hex };
  } else {
    draftDark.value = { ...draftDark.value, [key]: hex };
  }
  markManualEdit();
}

function onPickerDraftHex(key: keyof ReaderSurfacePalette, hex: string) {
  const v = hex.startsWith("#") ? hex : `#${hex}`;
  pickerLive.value = { ...pickerLive.value, [key]: v };
}

function onPickerDraftEnd() {
  pickerLive.value = {};
}

function onColorEnabledUpdate(
  key: keyof ReaderSurfaceColorEnabled,
  enabled: boolean,
) {
  if (draftColorEnabled.value[key] === enabled) return;
  draftColorEnabled.value = {
    ...draftColorEnabled.value,
    [key]: enabled,
  };
}

function onApplyAll() {
  const payload: ColorSchemeApplyPayload = {};
  if (props.visibleTabs.includes("reader")) {
    payload.reader = {
      light: { ...draftLight.value },
      dark: { ...draftDark.value },
      colorEnabled: { ...draftColorEnabled.value },
      userPresets: serializeReaderPaletteUserPresets(draftUserPresets.value),
    };
  }
  if (props.visibleTabs.includes("highlight")) {
    payload.highlight = {
      light: draftHighlightLight.value.map((r) => r.color),
      dark: draftHighlightDark.value.map((r) => r.color),
    };
  }
  if (props.visibleTabs.includes("lineation")) {
    payload.lineation = {
      light: draftLineationLight.value.map((r) => r.color),
      dark: draftLineationDark.value.map((r) => r.color),
    };
  }
  emit("apply", payload);
  modelValue.value = false;
}

function onCancel() {
  void confirmDiscardIfDirty().then((ok) => {
    if (ok) modelValue.value = false;
  });
}

function mutActiveHighlightDraft(updater: (arr: HighlightColorRow[]) => void) {
  if (isLightShell.value) {
    const n = [...draftHighlightLight.value];
    updater(n);
    draftHighlightLight.value = n;
  } else {
    const n = [...draftHighlightDark.value];
    updater(n);
    draftHighlightDark.value = n;
  }
}

function onHighlightColorUpdate(rowIndex: number, color: string) {
  const hex = color.startsWith("#") ? color : `#${color}`;
  mutActiveHighlightDraft((arr) => {
    if (rowIndex >= 0 && rowIndex < arr.length) {
      arr[rowIndex] = { ...arr[rowIndex]!, color: hex };
    }
  });
}

function onHighlightPickerDraftHex(rowIndex: number, hex: string) {
  const v = hex.startsWith("#") ? hex : `#${hex}`;
  highlightPickerLive.value = { ...highlightPickerLive.value, [rowIndex]: v };
}

function onHighlightPickerDraftEnd() {
  highlightPickerLive.value = {};
}

function highlightPreviewHex(rowIndex: number, committedHex: string): string {
  const live = highlightPickerLive.value[rowIndex];
  if (live) return live;
  return committedHex.startsWith("#") ? committedHex : `#${committedHex}`;
}

function reorderHighlight(fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) return;
  mutActiveHighlightDraft((arr) => {
    const [item] = arr.splice(fromIndex, 1);
    if (!item) return;
    arr.splice(toIndex, 0, item);
  });
}

function removeHighlightRow(index: number) {
  mutActiveHighlightDraft((arr) => {
    if (arr.length <= MIN_HIGHLIGHT_COLORS) return;
    arr.splice(index, 1);
  });
}

function addHighlightRow() {
  mutActiveHighlightDraft((arr) => {
    const last = arr[arr.length - 1]?.color ?? "#999999";
    arr.push({ id: newHighlightRowId(), color: last });
  });
}

function onAddHighlightClick() {
  addHighlightRow();
  void highlightPanelRef.value?.scrollToBottom();
}

function onResetHighlightDefaults() {
  draftHighlightLight.value = colorsToDraftRows(DEFAULT_HIGHLIGHT_COLORS_LIGHT);
  draftHighlightDark.value = colorsToDraftRows(DEFAULT_HIGHLIGHT_COLORS_DARK);
}

function mutActiveLineationDraft(updater: (arr: LineationColorRow[]) => void) {
  if (isLightShell.value) {
    const n = [...draftLineationLight.value];
    updater(n);
    draftLineationLight.value = n;
  } else {
    const n = [...draftLineationDark.value];
    updater(n);
    draftLineationDark.value = n;
  }
}

function onLineationColorUpdate(rowIndex: number, color: string) {
  const hex = color.startsWith("#") ? color : `#${color}`;
  mutActiveLineationDraft((arr) => {
    if (rowIndex >= 0 && rowIndex < arr.length) {
      arr[rowIndex] = { ...arr[rowIndex]!, color: hex };
    }
  });
}

function onLineationPickerDraftHex(rowIndex: number, hex: string) {
  const v = hex.startsWith("#") ? hex : `#${hex}`;
  lineationPickerLive.value = { ...lineationPickerLive.value, [rowIndex]: v };
}

function onLineationPickerDraftEnd() {
  lineationPickerLive.value = {};
}

function lineationPreviewHex(rowIndex: number, committedHex: string): string {
  const live = lineationPickerLive.value[rowIndex];
  if (live) return live;
  return committedHex.startsWith("#") ? committedHex : `#${committedHex}`;
}

function reorderLineation(fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) return;
  mutActiveLineationDraft((arr) => {
    const [item] = arr.splice(fromIndex, 1);
    if (!item) return;
    arr.splice(toIndex, 0, item);
  });
}

function removeLineationRow(index: number) {
  mutActiveLineationDraft((arr) => {
    if (arr.length <= MIN_LINEATION_COLORS) return;
    arr.splice(index, 1);
  });
}

function addLineationRow() {
  mutActiveLineationDraft((arr) => {
    const last = arr[arr.length - 1]?.color ?? "#999999";
    arr.push({ id: newLineationRowId(), color: last });
  });
}

function onAddLineationClick() {
  addLineationRow();
  void lineationPanelRef.value?.scrollToBottom();
}

function onResetLineationDefaults() {
  draftLineationLight.value = lineationColorsToDraftRows(
    DEFAULT_LINEATION_COLORS_LIGHT,
  );
  draftLineationDark.value = lineationColorsToDraftRows(
    DEFAULT_LINEATION_COLORS_DARK,
  );
}

async function onExportColorScheme() {
  const payload = buildColorSchemeExportPayload({
    ...(props.visibleTabs.includes("reader")
      ? {
          reader: {
            light: { ...draftLight.value },
            dark: { ...draftDark.value },
            colorEnabled: { ...draftColorEnabled.value },
            userPresets: draftUserPresets.value,
          },
        }
      : {}),
    ...(props.visibleTabs.includes("highlight")
      ? {
          highlight: {
            light: draftHighlightLight.value.map((r) => r.color),
            dark: draftHighlightDark.value.map((r) => r.color),
          },
        }
      : {}),
    ...(props.visibleTabs.includes("lineation")
      ? {
          lineation: {
            light: draftLineationLight.value.map((r) => r.color),
            dark: draftLineationDark.value.map((r) => r.color),
          },
        }
      : {}),
  });
  const save = await window.colorTxt.showSaveDialog({
    title: "导出配色",
    defaultPath: COLOR_SCHEME_EXPORT_DEFAULT_NAME,
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (save.canceled || !save.filePath) return;
  const written = await window.colorTxt.writeTextFile(
    save.filePath,
    stringifyColorSchemeExport(payload),
    "utf8",
  );
  if (!written.ok) {
    appToast(written.message || "导出失败", { kind: "warning" });
    return;
  }
  appToast("已导出配色", { kind: "success" });
}

function applyImportedColorScheme(data: ColorSchemeExportV1) {
  let applied = 0;
  if (data.reader && props.visibleTabs.includes("reader")) {
    draftLight.value = { ...data.reader.light };
    draftDark.value = { ...data.reader.dark };
    draftColorEnabled.value = { ...data.reader.colorEnabled };
    draftUserPresets.value = serializeReaderPaletteUserPresets(
      data.reader.userPresets,
    );
    syncSelectionFromColors();
    pickerLive.value = {};
    applied += 1;
  }
  if (data.highlight && props.visibleTabs.includes("highlight")) {
    draftHighlightLight.value = colorsToDraftRows(data.highlight.light);
    draftHighlightDark.value = colorsToDraftRows(data.highlight.dark);
    highlightPickerLive.value = {};
    applied += 1;
  }
  if (data.lineation && props.visibleTabs.includes("lineation")) {
    draftLineationLight.value = lineationColorsToDraftRows(data.lineation.light);
    draftLineationDark.value = lineationColorsToDraftRows(data.lineation.dark);
    lineationPickerLive.value = {};
    applied += 1;
  }
  return applied;
}

async function onImportColorScheme() {
  const picked = await pickAndReadJsonFile("导入配色", "JSON");
  if (picked.ok) {
    const data = parseColorSchemeExportJson(picked.text);
    if (!data) {
      appToast("无法解析配色文件", { kind: "warning" });
      return;
    }
    const ok = await appConfirm(
      "导入将替换当前配色草稿（点「应用」后才会保存），是否继续？",
    );
    if (!ok) return;
    const applied = applyImportedColorScheme(data);
    if (!applied) {
      appToast("文件中没有可导入到当前面板的配色", { kind: "warning" });
      return;
    }
    appToast("已导入配色（点「应用」后生效）", { kind: "success" });
    return;
  }
  if ("error" in picked) {
    appToast(picked.error || "读取文件失败", { kind: "warning" });
  }
}

watch(modelValue, (open) => {
  if (!open) {
    // 保留 activeTab：同窗口再次打开配色时回到上次标签（不持久化）
    pickerLive.value = {};
    highlightPickerLive.value = {};
    lineationPickerLive.value = {};
    return;
  }
  ensureActiveTabInVisible();
  syncDraftFromProps();
  syncPresetDraftFromProps();
  if (props.visibleTabs.includes("highlight")) syncHighlightDraftFromProps();
  if (props.visibleTabs.includes("lineation")) syncLineationDraftFromProps();
  captureDraftBaseline();
});

watch(activeTab, (tab) => {
  if (tab !== "reader") readerPane.value = "list";
  if (tab !== "highlight") highlightPickerLive.value = {};
  if (tab !== "lineation") lineationPickerLive.value = {};
});

watch(readerPane, (pane) => {
  if (pane !== "list") return;
  void presetListRef.value?.scheduleScrollActiveIntoView();
});

function clearPickerLive() {
  pickerLive.value = {};
  highlightPickerLive.value = {};
  lineationPickerLive.value = {};
}

watch(
  () => props.currentTheme,
  () => {
    clearPickerLive();
  },
);

function onChangeTheme(theme: "vs" | "vs-dark") {
  if ((theme === "vs") === isLightShell.value) return;
  clearPickerLive();
  emit("changeTheme", theme);
}
</script>

<template>
  <AppModal
    v-model="modelValue"
    title="配色"
    max-width="720px"
    panel-class="colorSchemePanel"
    :mask-closable="false"
    :esc-closable="true"
    :body-scroll="false"
    :before-close="confirmDiscardIfDirty"
  >
    <div class="colorSchemeLayout">
      <ColorSchemeTabBar
        :active-tab="activeTab"
        :visible-tabs="visibleTabs"
        :current-theme="currentTheme"
        :panel-open="modelValue"
        @update:active-tab="activeTab = $event"
        @change-theme="onChangeTheme"
        @export-color-scheme="void onExportColorScheme()"
        @import-color-scheme="void onImportColorScheme()"
      />

      <div class="colorSchemeScroll">
        <ColorSchemeReaderPanel
          v-show="activeTab === 'reader'"
          :display-surface="displaySurface"
          :editing-surface="activeDraft"
          :color-enabled="draftColorEnabled"
          :preview-box-style="previewBoxStyle"
          :reader-pane="readerPane"
          @update-surface-key="onPickerUpdate"
          @update-color-enabled="onColorEnabledUpdate"
          @draft-hex="onPickerDraftHex"
          @draft-end="onPickerDraftEnd"
        >
          <template #presetList>
            <ColorSchemePresetList
              ref="presetListRef"
              :rows="presetListRows"
              :active-key="activePresetKey"
              @select="onSelectPreset"
            />
          </template>
        </ColorSchemeReaderPanel>

        <ColorSchemeHighlightPanel
          v-show="activeTab === 'highlight'"
          ref="highlightPanelRef"
          :rows="activeHighlightList"
          :preview-hexes="highlightPreviewHexes"
          :highlight-reader-bg="highlightReaderBg"
          :body-text-color="bodyTextForHighlightPreview"
          :monaco-font-family="monacoFontFamily"
          :min-highlight-colors="MIN_HIGHLIGHT_COLORS"
          @update-color="onHighlightColorUpdate"
          @draft-hex="onHighlightPickerDraftHex"
          @draft-end="onHighlightPickerDraftEnd"
          @reorder="reorderHighlight"
          @remove="removeHighlightRow"
        />

        <ColorSchemeLineationPanel
          v-show="activeTab === 'lineation'"
          ref="lineationPanelRef"
          :rows="activeLineationList"
          :preview-hexes="lineationPreviewHexes"
          :lineation-reader-bg="lineationReaderBg"
          :body-text-color="bodyTextForHighlightPreview"
          :monaco-font-family="monacoFontFamily"
          :min-lineation-colors="MIN_LINEATION_COLORS"
          @update-color="onLineationColorUpdate"
          @draft-hex="onLineationPickerDraftHex"
          @draft-end="onLineationPickerDraftEnd"
          @reorder="reorderLineation"
          @remove="removeLineationRow"
        />
      </div>
    </div>

    <template #footer>
      <div class="colorSchemePanelFooter">
        <div v-if="activeTab === 'reader'" class="colorSchemePanelFooterStart">
          <button
            v-if="readerPane !== 'list'"
            type="button"
            class="btn"
            size="large"
            @click="readerPane = 'list'"
          >
            <span
              class="colorSchemeFooterBtnIcon"
              aria-hidden="true"
              v-html="icons.back"
            />
            退出编辑
          </button>
          <template v-else>
            <button
              type="button"
              class="btn"
              size="large"
              @click="readerPane = 'switches'"
            >
              <span
                class="colorSchemeFooterBtnIcon"
                aria-hidden="true"
                v-html="icons.switch"
              />
              编辑开关
            </button>
            <button
              type="button"
              class="btn btnIconColorful"
              size="large"
              :disabled="!isUserPreset"
              :title="isUserPreset ? undefined : '内置方案不支持改色，请通过「新增配色方案」来创建自定义方案'"
              @click="readerPane = 'colors'"
            >
              <span
                class="colorSchemeFooterBtnIcon"
                aria-hidden="true"
                v-html="icons.palette"
              />
              编辑配色
            </button>
            <button
              type="button"
              class="btn"
              size="large"
              @click="onCreateScheme"
            >
              <span
                class="colorSchemeFooterBtnIcon"
                aria-hidden="true"
                v-html="icons.add"
              />
              新增配色方案
            </button>
          </template>
          <template v-if="readerPane === 'colors' && isUserPreset">
            <button
              type="button"
              class="btn"
              size="large"
              @click="onRenamePreset(activePresetKey)"
            >
              <span
                class="colorSchemeFooterBtnIcon"
                aria-hidden="true"
                v-html="icons.edit"
              />
              重命名
            </button>
            <button
              type="button"
              class="btn danger"
              size="large"
              @click="onDeletePreset(activePresetKey)"
            >
              <span
                class="colorSchemeFooterBtnIcon"
                aria-hidden="true"
                v-html="icons.remove"
              />
              删除
            </button>
          </template>
        </div>
        <div
          v-else-if="activeTab === 'highlight'"
          class="colorSchemePanelFooterStart"
        >
          <button
            type="button"
            class="btn"
            size="large"
            @click="onResetHighlightDefaults"
          >
            恢复默认高亮配色
          </button>
          <button
            type="button"
            class="btn"
            size="large"
            @click="onAddHighlightClick"
          >
            <span
              class="colorSchemeFooterBtnIcon"
              aria-hidden="true"
              v-html="icons.add"
            />
            新增高亮色
          </button>
        </div>
        <div v-else class="colorSchemePanelFooterStart">
          <button
            type="button"
            class="btn"
            size="large"
            @click="onResetLineationDefaults"
          >
            恢复默认标注配色
          </button>
          <button
            type="button"
            class="btn"
            size="large"
            @click="onAddLineationClick"
          >
            <span
              class="colorSchemeFooterBtnIcon"
              aria-hidden="true"
              v-html="icons.add"
            />
            新增标注色
          </button>
        </div>
        <div class="colorSchemePanelFooterEnd">
          <button type="button" class="btn" size="large" @click="onCancel">
            取消
          </button>
          <button
            type="button"
            class="btn primary"
            size="large"
            @click="onApplyAll"
          >
            应用
          </button>
        </div>
      </div>
    </template>
  </AppModal>
</template>

<style scoped>
.colorSchemeLayout {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}

.colorSchemeScroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  padding-top: 8px;
  display: flex;
  flex-direction: column;
}

.colorSchemePanelFooter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  width: 100%;
}

.colorSchemePanelFooterStart {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.colorSchemeFooterBtnIcon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.colorSchemeFooterBtnIcon :deep(svg) {
  width: 16px;
  height: 16px;
  display: block;
}

.colorSchemePanelFooterEnd {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
</style>

<style>
.colorSchemePanel {
  height: 560px;
  min-height: 560px;
}
</style>
