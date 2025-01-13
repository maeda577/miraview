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
  // 番組表で並べ替えを無効化するか
  DISABLE_SERVICE_SORTING: 'miraview.config.disableServiceSorting',
} as const;

// 設定情報
export type MiraviewConfig = {
  apiEndpoint: string | undefined;
  disableServiceSorting: boolean;
};

// デフォルト値のconfig
function createDefaultConfig(): MiraviewConfig {
  return {
    apiEndpoint: new URL('api/', window.location.origin).toString(),
    disableServiceSorting: false,
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
    // 並べ替えの無効化。falseの場合は値自体が無くなるので、何らかの文字があればtrue
    config.disableServiceSorting = !!localStorage.getItem(STORAGE_KEYS.DISABLE_SERVICE_SORTING);

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
  // 並べ替えの無効化がされていれば文字を入れる。文字は何でもいい。なければ消す
  if (config.disableServiceSorting) {
    localStorage.setItem(STORAGE_KEYS.DISABLE_SERVICE_SORTING, 'true');
  }
  else {
    localStorage.removeItem(STORAGE_KEYS.DISABLE_SERVICE_SORTING);
  }
}
