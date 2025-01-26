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
import './utils/ix.js';

// APIアクセス用のクライアント
const config = loadConfigFromStorage();
const client = createClient<paths>({ baseUrl: config.getApiEndpoint() });

const cardList = document.getElementById('card-list')!;

// 画面更新
async function refreshTuners() {
  // APIを叩く
  const response = await client.GET("/tuners");
  if (response.error !== undefined) {
    console.error(response.error);
    return;
  }

  // 更新ボタンを残してチューナーの要素を全部消す
  cardList.replaceChildren(cardList.children[0]);

  response.data?.forEach(tuner => {
    // チューナーの利用状況に応じて色を変える
    let variant: string;
    if (tuner.isFree) {
      variant = 'success';
    } else if (Math.max(...tuner.users.map(u => u.priority)) <= 0) {
      variant = 'warning';
    } else {
      variant = 'alarm';
    }

    cardList.insertAdjacentHTML('beforeend', `
      <ix-card variant="filled">
        <ix-card-content>
          <span class="typography-display">${tuner.name}</span>
          <span class="typography-label">${tuner.types.join(' : ')}</span>
          <ix-pill variant="${variant}">${tuner.isFree ? 'Free' : 'Using'}</ix-pill>
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

// 画面更新
refreshTuners();

cardList.querySelector('ix-action-card')?.addEventListener('click', refreshTuners);
