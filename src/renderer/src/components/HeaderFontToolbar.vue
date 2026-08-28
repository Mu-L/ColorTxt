<script setup lang="ts">
import { computed } from "vue";
import FontPicker from "./FontPicker.vue";
import IconButton from "./IconButton.vue";
import { icons } from "../icons";
import {
  lineHeightMultipleStep,
  maxFontSize,
  maxLineHeightMultipleForFontSize,
  minFontSize,
  minLineHeightMultiple,
  normalizeLineHeightMultiple,
} from "../constants/appUi";

const props = defineProps<{
  monacoFontFamily: string;
  pinnedOtherFonts?: string[];
  disabled?: boolean;
  canIncreaseFont: boolean;
  canDecreaseFont: boolean;
  canIncreaseLineHeight: boolean;
  canDecreaseLineHeight: boolean;
  fontSize: number;
  lineHeightMultiple: number;
}>();

const emit = defineEmits<{
  setMonacoFont: [fontFamily: string];
  togglePinOtherFont: [fontName: string];
  increaseFontSize: [];
  decreaseFontSize: [];
  increaseLineHeight: [];
  decreaseLineHeight: [];
}>();

function valueChangeTitle(label: string, from: string, next: string): string {
  return from === next ? `${label}：${from}` : `${label}：${from} → ${next}`;
}

function formatLineHeight(m: number): string {
  return normalizeLineHeightMultiple(m).toFixed(1);
}

const decreaseFontSizeTitle = computed(() => {
  const from = props.fontSize;
  const next = Math.max(minFontSize, from - 1);
  return valueChangeTitle("减小字号", String(from), String(next));
});
const increaseFontSizeTitle = computed(() => {
  const from = props.fontSize;
  const next = Math.min(maxFontSize, from + 1);
  return valueChangeTitle("加大字号", String(from), String(next));
});
const decreaseLineHeightTitle = computed(() => {
  const from = normalizeLineHeightMultiple(props.lineHeightMultiple);
  const next = Math.max(
    minLineHeightMultiple,
    normalizeLineHeightMultiple(from - lineHeightMultipleStep),
  );
  return valueChangeTitle(
    "减小行间距",
    formatLineHeight(from),
    formatLineHeight(next),
  );
});
const increaseLineHeightTitle = computed(() => {
  const from = normalizeLineHeightMultiple(props.lineHeightMultiple);
  const cap = maxLineHeightMultipleForFontSize(props.fontSize);
  const next = Math.min(
    cap,
    normalizeLineHeightMultiple(from + lineHeightMultipleStep),
  );
  return valueChangeTitle(
    "加大行间距",
    formatLineHeight(from),
    formatLineHeight(next),
  );
});
</script>

<template>
  <div class="headerFontToolbar">
    <FontPicker
      :monaco-font-family="monacoFontFamily"
      :pinned-other-fonts="pinnedOtherFonts"
      :disabled="disabled"
      @set-monaco-font="emit('setMonacoFont', $event)"
      @toggle-pin-other-font="emit('togglePinOtherFont', $event)"
    />
    <IconButton
      :icon-html="icons.fontSizeDown"
      :title="decreaseFontSizeTitle"
      :aria-label="decreaseFontSizeTitle"
      :disabled="disabled || !canDecreaseFont"
      @click="emit('decreaseFontSize')"
    />
    <IconButton
      :icon-html="icons.fontSizeUp"
      :title="increaseFontSizeTitle"
      :aria-label="increaseFontSizeTitle"
      :disabled="disabled || !canIncreaseFont"
      @click="emit('increaseFontSize')"
    />
    <IconButton
      :icon-html="icons.lineHeightDown"
      :title="decreaseLineHeightTitle"
      :aria-label="decreaseLineHeightTitle"
      :disabled="disabled || !canDecreaseLineHeight"
      @click="emit('decreaseLineHeight')"
    />
    <IconButton
      :icon-html="icons.lineHeightUp"
      :title="increaseLineHeightTitle"
      :aria-label="increaseLineHeightTitle"
      :disabled="disabled || !canIncreaseLineHeight"
      @click="emit('increaseLineHeight')"
    />
  </div>
</template>

<style scoped>
.headerFontToolbar {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
</style>
