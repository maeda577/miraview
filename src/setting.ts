import type { CDSInlineNotification, CDSTextInput } from '@carbon/web-components/es/index.d.ts';
import { loadConfigFromStorage, saveConfigToStorage } from './config.js';

// エンドポイント接続先の入力欄
const inputEndpoint = document.getElementById('input-endpoint') as CDSTextInput;
// メッセージ欄
const inlineNotification = document.getElementById('notification-save') as CDSInlineNotification;
inlineNotification.open = false;
inlineNotification.classList.remove('hidden');

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
  inlineNotification.open = false;
  if (!validateInputEndpoint()) {
    return false;
  }
  const conf = {
    apiEndpoint: inputEndpoint.value,
  };
  saveConfigToStorage(conf);
  inlineNotification.open = true;
  loadConfig();
  validateAllInputs();
}

// 初回読み込みと画面更新
loadConfig();
validateAllInputs();

// イベント割当
inputEndpoint.addEventListener('input', validateInputEndpoint);
document.getElementById('button-save')?.addEventListener('click', onSaveConfig);
