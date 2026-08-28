<script setup lang="ts">
import IconButton from "./IconButton.vue";
import { icons } from "../icons";

const props = withDefaults(
  defineProps<{
    showSidebar: boolean;
    minimalist?: boolean;
  }>(),
  {
    minimalist: false,
  },
);

const emit = defineEmits<{
  toggleSidebar: [];
  toggleMinimalist: [];
}>();

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
    :title="minimalist ? '退出极简视图' : '切换侧边栏'"
    :aria-label="minimalist ? '退出极简视图' : '切换侧边栏'"
    @click="onButtonClick"
  />
</template>
