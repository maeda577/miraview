// 各種設定
export type MiraviewConfig = {
  mirakcUri: URL;
  streamProtocol: string;
};

// /api/programs の戻り値
export type Program = {
  id?: number;
  eventId?: number;
  serviceId?: number;
  transportStreamId?: number;
  networkId?: number;
  startAt: number;
  duration: number;
  isFree?: boolean;
  name?: string;
  description?: string;
  extended?: any;
  video?: Video;
  audio?: Audio;
  audios?: Audio[];
  genres?: Genre[];
};

// streamContent/componentTypeはARIB STD-B10の[Table 6-5 stream_content and component_type]に書いてある
// http://www.arib.or.jp/english/html/overview/doc/6-STD-B10v4_6-E2.pdf#page=114
// typeとresolutionを見れば十分なので無視する
type Video = {
  type: string;
  resolution: string;
  // 映像は1固定のはず
  streamContent: number;
  componentType: number;
};

// こっちのcomponentTypeはdual monoの判定に使えるので見る
type Audio = {
  componentType: number;
  isMain: boolean;
  samplingRate: number;
  langs: string[];
};

// ジャンル情報 lv1はcontent_nibble_level_1 で un1はuser_nibbleらしい
// unは This 4-bit field is defined by the broadcaster. とあるので放送局ごとに異なる？っぽい。分からないので無視する
// http://www.arib.or.jp/english/html/overview/doc/6-STD-B10v4_6-E2.pdf#page=116
type Genre = {
  lv1: number;
  lv2: number;
  un1: number;
  un2: number;
};

// /api/services の戻り値
export type Service = {
  id: number;
  serviceId: number;
  transportStreamId: number;
  networkId: number;
  type: number;
  logoId: number;
  remoteControlKeyId: number;
  name: string;
  channel: {
    type: string;
    channel: string;
  };
};

// 番組情報とそのチャンネル情報のペア
export type ProgramPair = {
  program: Program;
  service: Service;
}

// /api/tuners の戻り値
export type Tuner = {
  index: number;
  name: string;
  types: string[];
  command?: string;
  pid?: number;
  users?: {
    id: string;
    priority: number;
    agent?: string;
  }[];
  isAvailable: boolean;
  isRemote: boolean;
  isFree: boolean;
  isUsing: boolean;
  isFault: boolean;
};

// /api/version の戻り値 mirakcではlatestが常にcurrentと同じらしい
export type Version = {
  current: string;
  latest: string;
}

// enumの使用は良く無いらしいので代替の記法を使う。これはこれで分かりにくい
export const ViewTypes = {
  Programs: '番組表',
  Tuners: 'チューナー',
  Config: '設定',
} as const;
export type ViewType = typeof ViewTypes[keyof typeof ViewTypes]
