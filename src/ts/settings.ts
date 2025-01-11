import type { CDSTextInput } from '@carbon/web-components/es/index.d.ts';
import { loadConfigFromStorage, saveConfigToStorage } from './utils/config';

// エンドポイント接続先の入力欄
const inputEndpoint = document.getElementById('input-endpoint') as CDSTextInput;

// エンドポイント接続先の検証
function validateInputEndpoint() {
  inputEndpoint.warn = !inputEndpoint.value;
  inputEndpoint.invalid = !!inputEndpoint.value && !URL.canParse(inputEndpoint.value);
  return !inputEndpoint.invalid;
}

// 全部のInputを検証する 画面更新も兼ねている
function validateAllInputs() {
  return validateInputEndpoint();
}

// ローカルストレージのconfigを読み込む
function loadConfig() {
  const currentConfig = loadConfigFromStorage();
  inputEndpoint.value = currentConfig.apiEndpoint ?? '';
  return true;
}

// config保存
function onSaveConfig() {
  if (!validateInputEndpoint()) {
    return false;
  }
  const conf = {
    apiEndpoint: inputEndpoint.value,
  };
  try {
    saveConfigToStorage(conf);
    window.alert('設定を保存しました');
    loadConfig();
    validateAllInputs();
  } catch (error) {
    window.alert('設定の保存に失敗しました\nWebブラウザのコンソールを確認してください');
  }
}

// 初回読み込みと画面更新
loadConfig();
validateAllInputs();

// イベント割当
inputEndpoint.addEventListener('input', validateInputEndpoint);
document.getElementById('button-save')?.addEventListener('click', onSaveConfig);
