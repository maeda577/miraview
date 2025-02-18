/**
 * SPDX-FileCopyrightText: 2022 maeda577
 *
 * SPDX-License-Identifier: MIT
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import createClient from 'openapi-fetch/dist/index.js';
import type { paths } from './types/mirakc.d.ts';
import { loadConfigFromStorage } from './utils/common.js';
import { initPgTable, showErrorMessage } from './utils/pgtable.js';
import './utils/ix.js';

const content = document.querySelector('ix-content');

// APIを叩く
const client = createClient<paths>({ baseUrl: loadConfigFromStorage().getApiEndpoint() });
try {
  const response = await Promise.all([
    client.GET("/programs"),
    client.GET("/services"),
  ]);
  initPgTable(response[0].data, response[1].data);
} catch (error) {
  content?.replaceChildren();
  content?.insertAdjacentHTML('afterbegin', `
    <ix-empty-state class="flex-center"
      icon="alarm"
      header="mirakc APIへのアクセスに失敗しました"
      sub-header="APIエンドポイントの指定を確認してください。また、CORSが無効化されているか確認してください">
    </ix-empty-state>`
  );
}
