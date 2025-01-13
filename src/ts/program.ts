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
import { loadConfigFromStorage } from './utils/config.js';
import { initPgTable } from './utils/pgtable.js';
import './utils/ix.js';

// configを読んでから必要なAPIを叩く
const config = loadConfigFromStorage();
const client = createClient<paths>({ baseUrl: config.apiEndpoint });
const response = await Promise.all([
  client.GET("/programs"),
  client.GET("/services"),
]);
// エラーがあればコンソールに出してから処理止める
response.forEach(res => {
  if (res.error !== undefined) {
    console.error(res.error);
    return;
  }
});

initPgTable(response[0].data, response[1].data);
