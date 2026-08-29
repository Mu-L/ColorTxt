<script setup lang="ts">
import IconButton from "./IconButton.vue";
import { icons } from "../icons";
import type { ShortcutBindingMap } from "../services/shortcutRegistry";
import { titleWithShortcut } from "../services/shortcutUtils";
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    showSidebar: boolean;
    minimalist?: boolean;
    shortcutBindings?: ShortcutBindingMap;
  }>(),
  {
    minimalist: false,
  },
);

const emit = defineEmits<{
  toggleSidebar: [];
  toggleMinimalist: [];
}>();

const isMacPlatform = /mac|iphone|ipad|ipod/i.test(navigator.platform || "");

const buttonTitle = computed(() => {
  const base = props.minimalist ? "退出极简视图" : "切换侧边栏";
  const action = props.minimalist ? "toggleMinimalistView" : "toggleSidebar";
  const accel = props.shortcutBindings?.[action];
  return accel ? titleWithShortcut(base, accel, isMacPlatform) : base;
});

function onButtonClick() {
  if (props.minimalist) {
    emit("toggleMinimalist");
    return;
  }
  emit("toggleSidebar");
}
</script>

<template>
  <IconButton
    :icon-html="minimalist ? icons.leaveMinimalistView : icons.sidebar"
    :active="!minimalist && showSidebar"
    :pressed="!minimalist && showSidebar"
    :title="buttonTitle"
    :aria-label="buttonTitle"
    @click="onButtonClick"
  />
</template>
