import { configureTheme, Theme, ThemeVariant } from 'igniteui-webcomponents';

/** 設定をlocal storageに書き込む時のキー */
const STORAGE_KEYS = {
  /** mirakcのAPI接続先 */
  API_ENDPOINT: 'miraview.config.mirakcApiEndpoint',
  /** 画面テーマ */
  THEME: 'miraview.config.theme',
  /** 画面テーマの配色(light/dark) */
  THEME_VARIANT: 'miraview.config.themeVariant',
} as const;

/** 設定情報 */
export class MiraviewConfig {
  /** mirakcのAPI接続先 通常はgetApiEndpoint()を使う */
  apiEndpoint?: URL;
  /** 画面テーマ */
  theme?: Theme;
  /** 画面テーマの配色(light/dark) */
  themeVariant?: ThemeVariant;

  /** mirakcのAPI接続先 未指定だったらデフォルト値を返す */
  getApiEndpoint(): URL {
    if (!this.apiEndpoint) {
      return getDefaultApiEndpoint();
    }
    const result = new URL(this.apiEndpoint);
    // 末尾に / が無ければつける
    if (!result.pathname.endsWith('/')) {
      result.pathname += '/';
    }
    return result;
  }

  getTheme() {
    return this.theme ?? 'material';
  }

  applyTheme() {
    // テーマ
    const targetTheme = this.getTheme();
    // 値が指定されてれば使い、無ければOSのテーマ設定を読む
    const targetThemeVariant = this.themeVariant ?? (window.matchMedia('(prefers-color-scheme: dark)') ? 'dark' : 'light');

    // CSS差し替え
    const themeLink = document.head.querySelector<HTMLLinkElement>('link[rel="stylesheet"][href^="./themes/"]');
    if (themeLink) {
      themeLink.href = `./themes/${targetThemeVariant}/${this.theme}.css`;
    }
    else {
      document.head.insertAdjacentHTML('beforeend', `<link rel='stylesheet' href='./themes/${targetThemeVariant}/${targetTheme}.css' />`);
    }
    // Igcのテーマも更新
    configureTheme(targetTheme, targetThemeVariant);
  }
}

/** configをローカルストレージからよみこむ */
export function loadConfigFromStorage(): MiraviewConfig {
  const config = new MiraviewConfig();
  try {
    // URLの読み取り
    const mirakcUrlString = localStorage.getItem(STORAGE_KEYS.API_ENDPOINT);
    config.apiEndpoint = (mirakcUrlString && URL.canParse(mirakcUrlString)) ? new URL(mirakcUrlString) : undefined;

    // テーマの読み取り
    config.theme = (localStorage.getItem(STORAGE_KEYS.THEME) ?? undefined) as Theme | undefined;
    config.themeVariant = (localStorage.getItem(STORAGE_KEYS.THEME_VARIANT) ?? undefined) as ThemeVariant | undefined;

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
  // 保存するキーと値のマップ
  const configs: [string, string | undefined][] = [
    [STORAGE_KEYS.API_ENDPOINT, config.apiEndpoint?.href],
    [STORAGE_KEYS.THEME, config.theme],
    [STORAGE_KEYS.THEME_VARIANT, config.themeVariant],
  ];

  configs.forEach(item => {
    // 値があれば保存、無ければキーごと消す
    if (item[1]) {
      localStorage.setItem(item[0], item[1]);
    } else {
      localStorage.removeItem(item[0]);
    }
  });
}

// URLのデフォルト値 config画面のプレースホルダに使う
export function getDefaultApiEndpoint() {
  return new URL('api/', window.location.origin);
}
