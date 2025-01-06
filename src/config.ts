/*
 * SPDX-FileCopyrightText: 2022 maeda577
 *
 * SPDX-License-Identifier: MIT
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// 設定をlocal storageに書き込む時のキー リバースプロキシ経由で起動される可能性もあるので名前は長めにする
const STORAGE_KEYS = {
  // mirakcのAPIエンドポイント
  API_ENDPOINT: 'miraview.config.mirakcApiEndpoint',
} as const;

// 設定情報
export type MiraviewConfig = {
  apiEndpoint: string | undefined;
};

// デフォルト値のconfig
function createDefaultConfig(): MiraviewConfig {
  return {
    apiEndpoint: new URL('api/', window.location.origin).toString(),
  };
}

// configをlocal storageから読み取る local storageの利用はいろいろリスクがあるらしいが、さほど重要な情報でもないので使う
export function loadConfigFromStorage(): MiraviewConfig {
  const config = createDefaultConfig();
  try {
    // URLの読み取り。有効な値がなければデフォルト値のままになる
    const mirakcUrlString = localStorage.getItem(STORAGE_KEYS.API_ENDPOINT);
    if (mirakcUrlString && URL.canParse(mirakcUrlString)) {
      config.apiEndpoint = mirakcUrlString;
    }

    return config;
  }
  catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
    // 何かエラーがあったらconfig読み込みは諦める
    return createDefaultConfig();
  }
}

// configを保存する
export function saveConfigToStorage(config: MiraviewConfig) {
  // APIエンドポイントは指定されていれば入れ、なければ消す（config読む際にデフォルト値に戻る）
  if (config.apiEndpoint) {
    localStorage.setItem(STORAGE_KEYS.API_ENDPOINT, config.apiEndpoint);
  }
  else {
    localStorage.removeItem(STORAGE_KEYS.API_ENDPOINT);
  }
}
