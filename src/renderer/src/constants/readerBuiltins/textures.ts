/**
 * 内置阅读区背景图目录（`src/renderer/public/reader-textures/`）。
 * 叠层默认值写在项的 `light` / `dark`；解析/持久化见 `readerBackground.ts`。
 */
import type { ReaderBackgroundLayerSettings } from "../readerBackground";

export const READER_BACKGROUND_NONE_ID = "none";

export type ReaderBuiltinTexture = {
  id: string;
  name: string;
  /** 空串表示无图（纯色） */
  url: string;
  /** 未写入自定义覆盖时的叠层；未写的一侧用全局默认。内置图叠层不可改。 */
  light?: ReaderBackgroundLayerSettings;
  dark?: ReaderBackgroundLayerSettings;
};

export const BUILTIN_READER_TEXTURES: readonly ReaderBuiltinTexture[] = [
  { id: READER_BACKGROUND_NONE_ID, name: "无", url: "" },
  {
    id: "paper",
    name: "素纸",
    url: "/reader-textures/paper.jpg",
    light: {
      opacity: 1,
      size: "auto",
      position: "center center",
      repeat: true,
      blend: "multiply",
    },
    dark: {
      opacity: 1,
      size: "auto",
      position: "center center",
      repeat: true,
      blend: "soft-light",
    },
  },
  {
    id: "parchment",
    name: "羊皮纸",
    url: "/reader-textures/parchment.jpg",
    light: {
      opacity: 1,
      size: "auto",
      position: "center center",
      repeat: true,
      blend: "darken",
    },
    dark: {
      opacity: 1,
      size: "auto",
      position: "center center",
      repeat: true,
      blend: "multiply",
    },
  },
  { id: "concrete", name: "墙面", url: "/reader-textures/concrete.jpg" },
  {
    id: "plush-rug",
    name: "毛绒地毯",
    url: "/reader-textures/plush-rug.jpg",
    light: {
      opacity: 0.6,
      size: "auto",
      position: "center center",
      repeat: true,
      blend: "multiply",
    },
    dark: {
      opacity: 1,
      size: "auto",
      position: "center center",
      repeat: true,
      blend: "soft-light",
    },
  },
  {
    id: "leaves-pattern",
    name: "藤叶",
    url: "/reader-textures/leaves-pattern.jpg",
    light: {
      opacity: 1,
      size: "auto",
      position: "center center",
      repeat: true,
      blend: "overlay",
    },
    dark: {
      opacity: 1,
      size: "auto",
      position: "center center",
      repeat: true,
      blend: "multiply",
    },
  },
  {
    id: "blue-sky",
    name: "蓝天白云",
    url: "/reader-textures/blue-sky.jpg",
    light: {
      opacity: 0.6,
      size: "auto",
      position: "center center",
      repeat: true,
      blend: "normal",
    },
    dark: {
      opacity: 1,
      size: "auto",
      position: "center center",
      repeat: true,
      blend: "multiply",
    },
  },
  {
    id: "night-sky",
    name: "星空",
    url: "/reader-textures/night-sky.jpg",
    light: {
      opacity: 1,
      size: "auto",
      position: "center center",
      repeat: true,
      blend: "overlay",
    },
    dark: {
      opacity: 1,
      size: "auto",
      position: "center center",
      repeat: true,
      blend: "normal",
    },
  },
  {
    id: "bamboo-grove",
    name: "竹林",
    url: "/reader-textures/bamboo-grove.jpg",
    light: {
      opacity: 1,
      size: "cover",
      position: "center bottom",
      repeat: false,
      blend: "multiply",
    },
    dark: {
      opacity: 1,
      size: "cover",
      position: "center bottom",
      repeat: false,
      blend: "multiply",
    },
  },
  {
    id: "jiangnan_rainy_river",
    name: "烟雨江南",
    url: "/reader-textures/jiangnan_rainy_river.jpg",
    light: {
      opacity: 1,
      size: "cover",
      position: "center center",
      repeat: false,
      blend: "multiply",
    },
    dark: {
      opacity: 1,
      size: "cover",
      position: "center center",
      repeat: false,
      blend: "overlay",
    },
  },
];

/** 已下架的内置图 id；读入时当作「无」 */
export const RETIRED_BUILTIN_TEXTURE_IDS = new Set([
  "sand",
  "cardboard",
  "moon",
]);

const BUILTIN_ID_SET = new Set(BUILTIN_READER_TEXTURES.map((t) => t.id));

export function isBuiltinReaderTextureId(id: string): boolean {
  return BUILTIN_ID_SET.has(id);
}

export function getBuiltinReaderTexture(
  id: string,
): ReaderBuiltinTexture | undefined {
  return BUILTIN_READER_TEXTURES.find((t) => t.id === id);
}
