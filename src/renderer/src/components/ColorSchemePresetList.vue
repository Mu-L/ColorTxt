<script setup lang="ts">
import { nextTick, onMounted, useTemplateRef } from "vue";
import IconButton from "./IconButton.vue";
import { icons } from "../icons";
import {
  READER_SURFACE_LABELS,
  READER_SURFACE_PRESET_CARD_SWATCH_KEYS,
} from "../constants/appUi";

export type ColorSchemePresetListRow = {
  key: string;
  name: string;
  bg: string;
  bodyText: string;
  swatches: string[];
  editable: boolean;
  /** 「当前配色」：悬停显示「添加为预设」 */
  canAddAsPreset?: boolean;
};

const props = defineProps<{
  rows: ColorSchemePresetListRow[];
  activeKey: string;
}>();

const emit = defineEmits<{
  select: [key: string];
  edit: [key: string];
  duplicate: [key: string];
  remove: [key: string];
  add: [key: string];
}>();

const rootRef = useTemplateRef<HTMLElement>("root");

function swatchTitle(index: number): string {
  const key = READER_SURFACE_PRESET_CARD_SWATCH_KEYS[index];
  return key ? READER_SURFACE_LABELS[key] : "";
}

/** 选中项与滚动容器上下边的最小空隙（含已有 padding） */
const SCROLL_GUTTER_PX = 10;

function scrollParent(el: HTMLElement): HTMLElement | null {
  let node: HTMLElement | null = el.parentElement;
  while (node) {
    const style = getComputedStyle(node);
    const overflowY = style.overflowY;
    if (overflowY === "auto" || overflowY === "scroll") return node;
    node = node.parentElement;
  }
  return null;
}

function scrollActiveIntoView() {
  const root = rootRef.value;
  if (!root) return;
  const el = root.querySelector(
    `[data-preset-key="${CSS.escape(props.activeKey)}"]`,
  );
  if (!(el instanceof HTMLElement)) return;
  const scroller = scrollParent(el);
  if (!scroller) {
    el.scrollIntoView({ block: "nearest", inline: "nearest" });
    return;
  }
  const er = el.getBoundingClientRect();
  const sr = scroller.getBoundingClientRect();
  const topLimit = sr.top + SCROLL_GUTTER_PX;
  const bottomLimit = sr.bottom - SCROLL_GUTTER_PX;
  if (er.bottom > bottomLimit) {
    scroller.scrollTop += er.bottom - bottomLimit;
  } else if (er.top < topLimit) {
    scroller.scrollTop -= topLimit - er.top;
  }
}

onMounted(() => {
  void nextTick(() => {
    requestAnimationFrame(scrollActiveIntoView);
  });
});
</script>

<template>
  <div
    ref="root"
    class="presetCardGrid"
    role="listbox"
    aria-label="预设阅读器配色"
  >
    <div
      v-for="row in rows"
      :key="row.key"
      class="presetCardWrap"
      :data-preset-key="row.key"
    >
      <button
        type="button"
        class="presetCard"
        role="option"
        :class="{ 'presetCard--active': row.key === activeKey }"
        :aria-selected="row.key === activeKey"
        :style="{ backgroundColor: row.bg, color: row.bodyText }"
        @click="emit('select', row.key)"
      >
        <span class="presetCardName">{{ row.name }}</span>
        <span class="presetCardSwatches" aria-hidden="true">
          <span
            v-for="(hex, i) in row.swatches"
            :key="i"
            class="presetCardSwatch"
            :style="{ backgroundColor: hex }"
            :title="swatchTitle(i)"
          />
        </span>
      </button>
      <div
        v-if="row.editable || row.canAddAsPreset"
        class="presetCardActions"
      >
        <template v-if="row.editable">
          <IconButton
            :icon-html="icons.edit"
            title="编辑"
            aria-label="编辑预设名称"
            @click="emit('edit', row.key)"
          />
          <IconButton
            :icon-html="icons.copy"
            title="生成副本"
            aria-label="生成副本"
            @click="emit('duplicate', row.key)"
          />
          <IconButton
            :icon-html="icons.remove"
            danger
            title="删除"
            aria-label="删除预设"
            @click="emit('remove', row.key)"
          />
        </template>
        <IconButton
          v-if="row.canAddAsPreset"
          :icon-html="icons.add"
          title="添加为预设"
          aria-label="添加为预设"
          @click="emit('add', row.key)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.presetCardGrid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.presetCardWrap {
  position: relative;
  min-width: 0;
  scroll-margin-block: 10px;
}

.presetCard {
  box-sizing: border-box;
  width: 100%;
  min-height: 92px;
  margin: 0;
  padding: 14px 12px;
  border: 2px solid transparent;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font: inherit;
  text-align: center;
}

.presetCard:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);
}

.presetCard--active {
  border-color: var(--accent);
}

.presetCard:focus {
  outline: none;
}

.presetCard:focus-visible {
  border-color: var(--accent);
}

.presetCardName {
  max-width: 100%;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.presetCardSwatches {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 0;
}

.presetCardSwatch {
  flex: 0 0 14px;
  width: 14px;
  height: 14px;
  border-radius: 3px;
  box-sizing: border-box;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.14);
}

.presetCardActions {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  align-items: center;
  border-radius: 6px;
  overflow: hidden;
  background: color-mix(in srgb, var(--panel) 92%, transparent);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s ease;
}

.presetCardWrap:hover .presetCardActions {
  opacity: 1;
  pointer-events: auto;
}

.presetCardActions :deep(.iconBtn) {
  width: 24px;
  height: 24px;
  border-radius: 0;
}

.presetCardActions :deep(.icon),
.presetCardActions :deep(.icon svg) {
  width: 14px;
  height: 14px;
}
</style>
