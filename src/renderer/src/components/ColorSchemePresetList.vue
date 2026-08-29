<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, useTemplateRef } from "vue";
import {
  READER_SURFACE_LABELS,
  READER_SURFACE_PRESET_CARD_SWATCH_KEYS,
} from "../constants/appUi";
import { icons } from "../icons";

export type ColorSchemePresetListRow = {
  key: string;
  name: string;
  bg: string;
  bodyText: string;
  swatches: string[];
  custom: boolean;
};

const props = defineProps<{
  rows: ColorSchemePresetListRow[];
  activeKey: string;
}>();

const emit = defineEmits<{
  select: [key: string];
}>();

const rootRef = useTemplateRef<HTMLElement>("root");

function swatchTitle(index: number): string {
  const key = READER_SURFACE_PRESET_CARD_SWATCH_KEYS[index];
  return key ? READER_SURFACE_LABELS[key] : "";
}

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

function isLaidOut(el: HTMLElement): boolean {
  return el.getClientRects().length > 0;
}

function scrollActiveIntoView() {
  const root = rootRef.value;
  if (!root) return;
  const el = root.querySelector(
    `[data-preset-key="${CSS.escape(props.activeKey)}"]`,
  );
  if (!(el instanceof HTMLElement) || !isLaidOut(el)) return;
  const scroller = scrollParent(el);
  if (!scroller) {
    el.scrollIntoView({ block: "center", inline: "nearest" });
    return;
  }
  if (!isLaidOut(scroller)) return;
  const er = el.getBoundingClientRect();
  const sr = scroller.getBoundingClientRect();
  /** 弹窗 scale 动画中 getBoundingClientRect 是视觉尺寸，scrollTop 是布局尺寸 */
  const layoutH = scroller.clientHeight;
  const scale = layoutH > 0 && sr.height > 0 ? sr.height / layoutH : 1;
  const elMid = (er.top + er.bottom) / 2;
  const scrollerMid = (sr.top + sr.bottom) / 2;
  scroller.scrollTop += (elMid - scrollerMid) / scale;
}

async function scheduleScrollActiveIntoView() {
  await nextTick();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      scrollActiveIntoView();
      resolve();
    });
  });
}

defineExpose({ scrollActiveIntoView, scheduleScrollActiveIntoView });

let modalPanelEl: HTMLElement | null = null;

function onModalPanelTransitionEnd(ev: Event) {
  if (ev.target !== modalPanelEl) return;
  if (ev instanceof TransitionEvent && ev.propertyName !== "transform") return;
  scrollActiveIntoView();
  modalPanelEl?.removeEventListener("transitionend", onModalPanelTransitionEnd);
}

onMounted(() => {
  void nextTick(() => {
    requestAnimationFrame(() => {
      scrollActiveIntoView();
      modalPanelEl = rootRef.value?.closest(".appModalPanel") ?? null;
      modalPanelEl?.addEventListener("transitionend", onModalPanelTransitionEnd);
    });
  });
});

onBeforeUnmount(() => {
  modalPanelEl?.removeEventListener("transitionend", onModalPanelTransitionEnd);
  modalPanelEl = null;
});
</script>

<template>
  <div
    ref="root"
    class="presetCardGrid"
    role="listbox"
    aria-label="配色方案"
  >
    <div
      v-for="row in rows"
      :key="row.key"
      class="presetCardWrap"
      :data-preset-key="row.key"
    >
      <span
        v-if="row.custom"
        class="presetCardPaletteBadge"
        aria-hidden="true"
        v-html="icons.palette"
      />
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

.presetCardPaletteBadge {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 1;
  display: flex;
  width: 16px;
  height: 16px;
  pointer-events: none;
}

.presetCardPaletteBadge :deep(svg) {
  width: 16px;
  height: 16px;
  display: block;
}
</style>
