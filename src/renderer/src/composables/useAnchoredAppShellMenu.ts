import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
} from "vue";
import {
  computeAnchoredMenuPosition,
  type AnchoredMenuPlacement,
} from "../utils/appShellMenuPosition";
import { syncDismissibleOverlay } from "../utils/dismissibleOverlayStack";

export type UseAnchoredAppShellMenuOptions = {
  /** 未传则 composable 内部管理 */
  open?: Ref<boolean>;
  anchor: Ref<HTMLElement | null>;
  placement: MaybeRefOrGetter<AnchoredMenuPlacement>;
  /** 首次布局前用于 below-end 的宽度估算 */
  widthPx?: number;
  gap?: number;
  margin?: number;
  zIndex?: number;
  panelMaxHeight?: number;
  disabled?: Ref<boolean>;
  /** 为 false 时不注册外部点击 / Esc 关闭（悬停子菜单由父级关） */
  enableDismiss?: boolean;
  /** 点击这些根节点内部时不关闭 */
  excludeCloseWithin?: Ref<readonly (HTMLElement | null | undefined)[]>;
  onClose?: () => void;
};

/**
 * 锚定按钮/元素的 App Shell 弹出菜单：定位、视口夹取、外点关闭、Esc、resize 重算。
 */
export function useAnchoredAppShellMenu(opts: UseAnchoredAppShellMenuOptions) {
  const internalOpen = ref(false);
  const open = opts.open ?? internalOpen;
  const panelRef = ref<HTMLElement | null>(null);
  const left = ref(0);
  const top = ref(0);
  const availableMaxHeight = ref<number | undefined>(undefined);

  syncDismissibleOverlay(open);

  /** `.appShellMenuPanel` 上下 padding 各 6px，内层滚动高度需扣掉，避免面板本身溢出窗口 */
  const PANEL_PAD_Y = 12;

  function availableHeightForAnchor(rect: DOMRect): number {
    const gap = opts.gap ?? 4;
    const margin = opts.margin ?? 8;
    const placement = toValue(opts.placement);
    if (placement.startsWith("above")) {
      return Math.max(80, rect.top - gap - margin - PANEL_PAD_Y);
    }
    if (placement.startsWith("beside")) {
      return Math.max(80, window.innerHeight - margin * 2 - PANEL_PAD_Y);
    }
    return Math.max(
      80,
      window.innerHeight - rect.bottom - gap - margin - PANEL_PAD_Y,
    );
  }

  async function reposition() {
    const anchor = opts.anchor.value;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const maxH = opts.panelMaxHeight ?? availableHeightForAnchor(rect);
    availableMaxHeight.value = maxH;
    await nextTick();
    const panel = panelRef.value;
    const w = panel?.offsetWidth ?? opts.widthPx ?? 160;
    const h = Math.min(panel?.offsetHeight ?? 0, maxH);
    const pos = computeAnchoredMenuPosition(
      rect,
      { width: w, height: h },
      toValue(opts.placement),
      { gap: opts.gap, margin: opts.margin },
    );
    left.value = pos.left;
    top.value = pos.top;
  }

  async function openMenu() {
    if (opts.disabled?.value) return;
    open.value = true;
    await reposition();
  }

  function closeMenu() {
    if (!open.value) return;
    open.value = false;
    opts.onClose?.();
  }

  async function toggleMenu() {
    if (opts.disabled?.value) return;
    if (open.value) {
      closeMenu();
      return;
    }
    await openMenu();
  }

  function isExcludedTarget(target: Node | null): boolean {
    if (!target) return false;
    if (opts.anchor.value?.contains(target)) return true;
    if (panelRef.value?.contains(target)) return true;
    if (
      target instanceof Element &&
      (target.closest("[data-header-float-panel]") ||
        target.closest(".customSelectPanel"))
    ) {
      return true;
    }
    const extra = opts.excludeCloseWithin?.value ?? [];
    for (const el of extra) {
      if (el?.contains(target)) return true;
    }
    return false;
  }

  function onDocPointerDown(ev: PointerEvent) {
    if (!open.value || opts.enableDismiss === false) return;
    if (isExcludedTarget(ev.target as Node | null)) return;
    closeMenu();
  }

  function onDocKeydown(ev: KeyboardEvent) {
    if (opts.enableDismiss === false) return;
    if (ev.key !== "Escape" || !open.value) return;
    ev.preventDefault();
    ev.stopPropagation();
    closeMenu();
  }

  function onWindowResize() {
    if (!open.value) return;
    void reposition();
  }

  if (opts.enableDismiss !== false) {
    onMounted(() => {
      document.addEventListener("pointerdown", onDocPointerDown, true);
      document.addEventListener("keydown", onDocKeydown, true);
      window.addEventListener("resize", onWindowResize);
    });

    onBeforeUnmount(() => {
      document.removeEventListener("pointerdown", onDocPointerDown, true);
      document.removeEventListener("keydown", onDocKeydown, true);
      window.removeEventListener("resize", onWindowResize);
    });
  } else {
    onMounted(() => {
      window.addEventListener("resize", onWindowResize);
    });
    onBeforeUnmount(() => {
      window.removeEventListener("resize", onWindowResize);
    });
  }

  watch(open, (isOpen) => {
    if (isOpen) void reposition();
  });

  const panelStyle = computed(() => ({
    left: `${left.value}px`,
    top: `${top.value}px`,
    zIndex: opts.zIndex ?? 7200,
    ...(opts.widthPx != null ? { width: `${opts.widthPx}px` } : {}),
    ...(opts.panelMaxHeight != null
      ? { maxHeight: `${opts.panelMaxHeight}px` }
      : availableMaxHeight.value != null
        ? { maxHeight: `${availableMaxHeight.value}px` }
        : {}),
  }));

  return {
    open,
    panelRef,
    left,
    top,
    availableMaxHeight,
    panelStyle,
    openMenu,
    closeMenu,
    toggleMenu,
    reposition,
  };
}
