/**
 * SPDX-FileCopyrightText: 2022 maeda577
 *
 * SPDX-License-Identifier: MIT
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import createClient from 'openapi-fetch/dist/index.js';
import type { paths, components } from './types/mirakc.d.ts';
import { loadConfigFromStorage } from './utils/common.js';
import './utils/ix.js';

// チューナー一覧を取得
async function getTuners() {
  const client = createClient<paths>({ baseUrl: loadConfigFromStorage().getApiEndpoint() });
  try {
    return (await client.GET("/tuners")).data;
  } catch (error) {
    return undefined;
  }
}

// チューナーの利用状況に応じて色を変える
function getVariant(tuner: components['schemas']['MirakurunTuner']) {
  if (tuner.isFree) {
    return 'success';
  } else if (Math.max(...tuner.users.map(u => u.priority)) <= 0) {
    return 'warning';
  } else {
    return 'alarm';
  }
}

// 画面更新
async function refreshTuners() {
  // 更新ボタンを残してチューナーの要素を全部消す
  const cardList = document.getElementById('card-list')!;
  cardList.replaceChildren(cardList.children[0]);
  cardList.insertAdjacentHTML('beforeend', '<ix-spinner></ix-spinner>');

  const tuners = await getTuners();
  cardList.replaceChildren(cardList.children[0]);
  tuners?.forEach(tuner => {
    cardList.insertAdjacentHTML('beforeend', `
      <ix-card variant="filled">
        <ix-card-content>
          <span class="typography-display">${tuner.name}</span>
          <span class="typography-label">${tuner.types.join(' : ')}</span>
          <ix-pill variant="${getVariant(tuner)}">${tuner.isFree ? 'Free' : 'Using'}</ix-pill>
          <ix-key-value-list>
            <ix-key-value label="Command" value="${tuner.command}" ${tuner.command ? '' : 'hidden'}></ix-key-value>
            ${tuner.users.map(user => `
              <ix-key-value label="User ID" value="${user.id}"></ix-key-value>
              <ix-key-value label="Priority" value="${user.priority}"></ix-key-value>
              <ix-key-value label="User Agent" value="${user.agent}" ${user.agent ? '' : 'hidden'}></ix-key-value>
            `).join('')}
          </ix-key-value-list>
        </ix-card-content>
      </ix-card>`);
  });
}

// 即時に画面更新
refreshTuners();

// 更新カードにイベントを割り当てる
document.getElementById('card-refresh')?.addEventListener('click', refreshTuners);
