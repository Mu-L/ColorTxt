/** 主进程 Edge TTS 合成请求（与 preload IPC 对齐） */
export type VoiceReadEdgeTtsRequest = {
  text: string;
  voice: string;
  lang: string;
  /** 相对语速，1 为默认（映射到 SSML prosody） */
  rate: number;
  /** 相对音调，1 为默认 */
  pitch: number;
  /** 句末停顿（。！？…）时长 ms；0 或不传表示不插入停顿 */
  pauseSentenceMs?: number;
  /** 句中停顿（，；：、）时长 ms；0 或不传表示不插入停顿 */
  pauseCommaMs?: number;
};
