import { defineNavDrawer } from './utils/navdrawer.ts';
import { defineNavbar } from './utils/navbar.ts';
import {
  loadConfigFromStorage,
  saveConfigToStorage,
  getDefaultApiEndpoint,
  MiraviewConfig,
} from './utils/localconfig.ts';
import {
  defineComponents,
  Theme,
  ThemeVariant,
  IgcRadioGroupComponent,
  IgcRadioComponent,
  IgcInputComponent,
  IgcButtonComponent,
  IgcDividerComponent,
} from 'igniteui-webcomponents';

defineComponents(
  IgcRadioGroupComponent,
  IgcRadioComponent,
  IgcInputComponent,
  IgcButtonComponent,
  IgcDividerComponent,
);

defineNavDrawer();
defineNavbar();

// 設定の入力欄
const radioTheme = document.getElementById('radio-theme') as IgcRadioGroupComponent | null;
const radioThemeVariant = document.getElementById('radio-theme-variant') as IgcRadioGroupComponent | null;
const inputEndpoint = document.getElementById('input-endpoint') as IgcInputComponent | null;

if (radioThemeVariant) {
  radioThemeVariant.defaultValue = 'default';
};

// 設定の読込と反映
function loadConfig() {
  const config = loadConfigFromStorage();
  config.applyTheme();

  // テーマの設定
  if (radioTheme) {
    radioTheme.value = config.getTheme();
  }
  if (radioThemeVariant && config.themeVariant) {
    radioThemeVariant.value = config.themeVariant;
  }

  // mirakc接続先の設定
  if (inputEndpoint) {
    inputEndpoint.placeholder = getDefaultApiEndpoint().href;
    if (config.apiEndpoint) {
      inputEndpoint.value = config.apiEndpoint.href;
    }
  }
}

// 保存ボタンの処理
document.getElementById('button-save')?.addEventListener('click', ev => {
  ev.preventDefault();
  if (!inputEndpoint || !inputEndpoint.validity.valid) {
    return;
  }

  const config = new MiraviewConfig();

  // テーマの取得
  if (radioTheme) {
    config.theme = radioTheme.value as Theme;
  }
  if (radioThemeVariant && radioThemeVariant.value !== radioThemeVariant.defaultValue) {
    config.themeVariant = radioThemeVariant.value as ThemeVariant;
  }

  // APIエンドポイント
  if (inputEndpoint && inputEndpoint.value !== '') {
    config.apiEndpoint = new URL(inputEndpoint.value);
  }

  saveConfigToStorage(config);
  window.alert('設定を保存しました');
  loadConfig();
});

// 初回読込
loadConfig();
