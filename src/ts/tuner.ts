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

// configを読んでから必要なAPIを叩く
const config = loadConfigFromStorage();
const client = createClient<paths>({ baseUrl: config.getApiEndpoint() });

const templateTuner = document.getElementById('template-tuner') as HTMLTemplateElement;
const cardList = document.getElementById('card-list')!;

// 画面更新
async function refreshTuners() {
  const response = await client.GET("/tuners");
  if (response.error !== undefined) {
    console.error(response.error);
    return;
  }

  // チューナーの要素を全部消す
  cardList.replaceChildren();

  response.data?.forEach(tuner => {
    const card = (templateTuner.content.cloneNode(true) as DocumentFragment).querySelector('ix-card')!;

    // 名前と放送波タイプ
    (card.querySelector('.span-name') as HTMLElement).innerText = tuner.name;
    (card.querySelector('.span-type') as HTMLElement).innerText = tuner.types.join(' : ');

    // チューナーの利用状況
    if (tuner.isFree) {
      (card.querySelector('.pill-free') as HTMLElement).hidden = false;
    } else if (Math.max(...tuner.users.map(u => u.priority)) <= 0) {
      (card.querySelector('.pill-scanning') as HTMLElement).hidden = false;
    } else {
      (card.querySelector('.pill-recording') as HTMLElement).hidden = false;
    }

    const listStatus = card.querySelector('ix-key-value-list');
    if (tuner.command) {
      listStatus?.insertAdjacentHTML('beforeend', `<ix-key-value label="Command" value="${tuner.command}"></ix-key-value>`);
    }
    // チューナーを利用している接続元の情報
    tuner.users.forEach(user => {
      listStatus?.insertAdjacentHTML('beforeend', `<ix-key-value label="User ID" value="${user.id}"></ix-key-value>`);
      listStatus?.insertAdjacentHTML('beforeend', `<ix-key-value label="Priority" value="${user.priority}"></ix-key-value>`);
      if (user.agent) {
        listStatus?.insertAdjacentHTML('beforeend', `<ix-key-value label="User Agent" value="${user.agent}"></ix-key-value>`);
      }
    });

    cardList.appendChild(card);
  });
}

// 画面更新
refreshTuners();

document.getElementById('button-reload')?.addEventListener('click', refreshTuners);
