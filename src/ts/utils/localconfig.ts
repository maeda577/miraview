// 設定をlocal storageに書き込む時のキー
const STORAGE_KEYS = {
  // mirakcのAPIエンドポイント
  API_ENDPOINT: 'miraview.config.mirakcApiEndpoint',
  // 番組表で並べ替えを無効化するか
  DISABLE_SERVICE_SORTING: 'miraview.config.disableServiceSorting',
  // テーマの名前
  THEME: 'miraview.config.theme',
} as const;

/** 設定情報 */
export class MiraviewConfig {
  /** mirakcのAPI接続先 */
  apiEndpoint: URL | undefined;
  /** 番組一覧の並べ替えてを無効化するか */
  disableServiceSorting: boolean = false;
  /** テーマ */
  theme: 'theme-classic-dark' | 'theme-classic-light' | undefined;

  /** mirakcのAPI接続先 未指定だったらデフォルト値を返す */
  getApiEndpoint(): URL {
    if (!this.apiEndpoint) {
      return new URL('api/', window.location.origin);
    }
    const result = new URL(this.apiEndpoint);
    // 末尾に / が無ければつける
    if (!result.pathname.endsWith('/')) {
      result.pathname += '/';
    }
    return result;
  }
}

/** configをローカルストレージからよみこむ */
export function loadConfigFromStorage(): MiraviewConfig {
  const config = new MiraviewConfig();
  try {
    // URLの読み取り
    const mirakcUrlString = localStorage.getItem(STORAGE_KEYS.API_ENDPOINT);
    config.apiEndpoint = (mirakcUrlString && URL.canParse(mirakcUrlString)) ? new URL(mirakcUrlString) : undefined;

    // 並べ替えの無効化。falseの場合は値自体が無くなるので、何らかの文字があればtrue
    config.disableServiceSorting = !!localStorage.getItem(STORAGE_KEYS.DISABLE_SERVICE_SORTING);

    // テーマ文字列
    config.theme = localStorage.getItem(STORAGE_KEYS.THEME) as 'theme-classic-dark' | 'theme-classic-light' | undefined;
    return config;
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
    // 何かエラーがあったらconfig読み込みは諦める
    return new MiraviewConfig();
  }
}

/** configをローカルストレージに書き込む */
export function saveConfigToStorage(config: MiraviewConfig) {
  // APIエンドポイントは指定されていれば入れ、なければ消す（config読む際にデフォルト値に戻る）
  if (config.apiEndpoint) {
    localStorage.setItem(STORAGE_KEYS.API_ENDPOINT, config.apiEndpoint.href);
  } else {
    localStorage.removeItem(STORAGE_KEYS.API_ENDPOINT);
  }
  // 並べ替えの無効化がされていれば文字を入れる。文字は何でもいい。なければ消す
  if (config.disableServiceSorting) {
    localStorage.setItem(STORAGE_KEYS.DISABLE_SERVICE_SORTING, 'true');
  } else {
    localStorage.removeItem(STORAGE_KEYS.DISABLE_SERVICE_SORTING);
  }
  // テーマの文字列
  if (config.theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, config.theme);
  } else {
    localStorage.removeItem(STORAGE_KEYS.THEME);
  }
}
