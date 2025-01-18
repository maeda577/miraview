import { loadConfigFromStorage, saveConfigToStorage, MiraviewConfig } from './utils/configManager.js';
import './utils/ix.js';
// declare globalで定義されているtypeを読みたいだけなので変なimportになっている
import type { } from '@siemens/ix/dist/types/components.d.ts';

// デフォルトは2カラム構成なので切る
document.querySelector('ix-layout-auto')!.layout = [{ minWidth: '0', columns: 1 }];

// テーマ入力欄
const selectTheme = document.getElementById('select-theme') as HTMLIxSelectElement;
// ソートの無効化
const toggleSort = document.getElementById('toggle-sorting') as HTMLIxToggleElement;
// エンドポイント接続先の入力欄
const inputEndpoint = document.getElementById('input-api-endpoint') as HTMLIxInputElement;

// ローカルストレージのconfigを読み込んで画面に反映する
function loadConfigToForms() {
  const currentConfig = loadConfigFromStorage();
  inputEndpoint.value = currentConfig.apiEndpoint ?? '';
  toggleSort.checked = currentConfig.disableServiceSorting;
  selectTheme.value = currentConfig.theme ?? 'system';
}

// 画面の入力値からconfigを作る
function createConfigFromForms(): MiraviewConfig {
  const conf = new MiraviewConfig();
  conf.apiEndpoint = inputEndpoint.value ? inputEndpoint.value : undefined;
  conf.disableServiceSorting = toggleSort.checked;
  conf.theme = (selectTheme.value === 'system' ? undefined : selectTheme.value) as 'theme-classic-dark' | 'theme-classic-light' | undefined;
  return conf;
}

// config保存
function onSaveConfig() {
  // バリデーションが通っていない
  if (inputEndpoint.classList.contains('ix-invalid')) {
    return;
  }

  try {
    saveConfigToStorage(createConfigFromForms());
    window.alert('設定を保存しました\nWebページを再読み込みすると設定が反映されます');
  } catch (error) {
    window.alert('設定の保存に失敗しました\nWebブラウザのコンソールを確認してください');
  }
}

// 初回読み込みと画面更新
loadConfigToForms();

// イベント割当
inputEndpoint.addEventListener('ixBlur', () => inputEndpoint.value || inputEndpoint.classList.remove('ix-invalid'));
document.getElementById('button-save')?.addEventListener('click', onSaveConfig);
