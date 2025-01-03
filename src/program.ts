/**
 * SPDX-FileCopyrightText: 2022 maeda577
 *
 * SPDX-License-Identifier: MIT
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import createClient from 'openapi-fetch';
// TODO: Componentsは参照していないが、この行を消すと型推論が効かなくなる。もっと正しい書き方がある気がする
import type { Components } from '@siemens/ix'
import type { paths, components } from './api/mirakc.js';
import { groupPrograms } from './common.js'

// 必要なAPIを叩く
const client = createClient<paths>({ baseUrl: "../api/" });
const response = await Promise.all([
  client.GET("/programs"),
  client.GET("/services"),
]);
const [programs, services] = response;
// エラーがあればコンソールに出してから処理止める
response.forEach(res => {
  if(res.error !== undefined){
    console.error(res.error)
    return
  }
});

// 番組一覧を整える
const groupedPrograms = groupPrograms(programs.data);

// 日付ドロップダウンを作る
const tabDateFormat = new Intl.DateTimeFormat(undefined, { month: '2-digit', day: '2-digit', weekday: 'narrow' });
const dayDropdown = document.getElementById('input-header')?.querySelector('ix-select');
[...groupedPrograms!.keys()].sort().forEach(day => {
  const item = document.createElement('ix-select-item');
  item.setAttribute('value', day.toString());
  item.setAttribute('label', tabDateFormat.format(day));
  dayDropdown?.appendChild(item);
});

// 放送波タブの位置と放送波の対応リスト
const tabIndexToType: components['schemas']['ChannelType'][] = ['GR', 'BS', 'CS', 'SKY']
// 放送波タブの受信していないタブを無効化し、有効なものの先頭を選択状態にする
const channelTypeSet = new Set(services.data?.map(e => e.channel.type));
var tabSelected = false;
document.getElementById('input-header')?.querySelector('ix-tabs')?.querySelectorAll('ix-tab-item').forEach(tab => {
  const canRecieve = channelTypeSet.has(tab.textContent as components['schemas']['ChannelType']);
  tab.disabled = !canRecieve
  if (canRecieve && !tabSelected) {
    tab.selected = true;
    tabSelected = true;
  }
});

// 番組表の更新関数
function refreshTable() {
  // 日付ドロップダウンと放送波タブの今選ばれている値を取得
  // getElementByIdで直接カスタムコンポーネントを取得すると型推論が効かなくなるのでquerySelectorを使う
  const headerDiv = document.getElementById('input-header')
  const selectedDay = headerDiv?.querySelector('ix-select')?.value
  const selectedTabIndex = headerDiv?.querySelector('ix-tabs')?.selected
  // 番組情報を詰める行を取得
  const headerRow = document.getElementById('service-header-row')
  const programRow = document.getElementById('program-row')

  // どれかが取れなかった
  if (selectedDay === undefined || selectedTabIndex === undefined || headerRow === undefined || programRow === undefined) {
    return;
  }

  // 1列目を残してすべて消す
  headerRow?.replaceChildren(headerRow.children[0]);
  programRow?.replaceChildren(programRow.children[0])

  const dayNumber = Number.parseInt(selectedDay as string)
  const programs = groupedPrograms.get(dayNumber);

  // 1時間あたりの高さ
  const heightPerHourStr = getComputedStyle(document.body).getPropertyValue('--height-per-hour')
  const heightPerHour = Number.parseInt(heightPerHourStr.substring(0, heightPerHourStr.indexOf('px')))

  // ソート処理を入れる
  //  && programs?.has([svc.networkId, svc.serviceId])
  services.data?.filter(
    svc => svc.channel.type === tabIndexToType[selectedTabIndex] && programs?.get(svc.networkId)?.has(svc.serviceId)
  )
  .forEach(svc => {
    // チャンネル名のヘッダ
    const svcNameElem = document.createElement('th')
    svcNameElem.textContent = svc.name
    svcNameElem.scope = 'col'
    headerRow?.appendChild(svcNameElem);

    // 番組を入れるセル
    const svcProgramsElem = document.createElement('td')
    programRow?.appendChild(svcProgramsElem);

    // 番組を詰める
    programs?.get(svc.networkId)?.get(svc.serviceId)?.forEach(prg => {
      const programsElem = document.createElement('div')
      programsElem.style.height = (prg.duration / 1000 / 60 / 60 * heightPerHour) + 'px'
      programsElem.innerText = prg.name ?? ''
      svcProgramsElem.appendChild(programsElem);

    })
  });
}

// 今日のタブを選ぶ 午前5時までは深夜と見なして前日扱いにする
dayDropdown?.setAttribute('value', new Date(Date.now() - (5 * 60 * 60 * 1000)).setHours(0, 0, 0, 0).toString());

// 一応WebComponentsが定義されたのを待ってから画面更新
await window.customElements.whenDefined('ix-select');
await window.customElements.whenDefined('ix-tabs');
await window.customElements.whenDefined('ix-tab-item');
refreshTable()

// 変更イベントに画面更新を紐づける
const headerDiv = document.getElementById('input-header')
headerDiv?.querySelector('ix-select')?.addEventListener('valueChange', () => refreshTable());
headerDiv?.querySelector('ix-tabs')?.addEventListener('selectedChange', () => refreshTable());

