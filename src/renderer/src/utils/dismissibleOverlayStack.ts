import { onBeforeUnmount, unref, watch, type MaybeRef } from "vue";

let depth = 0;

export function hasDismissibleOverlay(): boolean {
  return depth > 0;
}

export function registerDismissibleOverlay(): () => void {
  depth += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    depth = Math.max(0, depth - 1);
  };
}

/** 菜单 / 下拉等打开时登记，供点击模式「先关弹层、当次不翻页」判断 */
export function syncDismissibleOverlay(open: MaybeRef<boolean>) {
  let unreg: (() => void) | null = null;
  const stop = watch(
    () => unref(open),
    (isOpen) => {
      if (isOpen) {
        if (!unreg) unreg = registerDismissibleOverlay();
      } else {
        unreg?.();
        unreg = null;
      }
    },
    { immediate: true },
  );
  onBeforeUnmount(() => {
    stop();
    unreg?.();
    unreg = null;
  });
}
