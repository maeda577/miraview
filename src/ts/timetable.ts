import './utils/igniteui';
import { loadConfigFromStorage } from './utils/localconfig';
import { createHTML, groupPrograms, groupServices } from './utils/pgtable';
import createClient from 'openapi-fetch';
import type { components, paths } from './utils/mirakc.d.ts';

import {
  defineComponents,
  IgcSelectComponent,
  IgcSelectItemComponent,
  IgcButtonGroupComponent,
  IgcToggleButtonComponent,
  IgcDialogComponent,
} from 'igniteui-webcomponents';

defineComponents(
  IgcSelectComponent,
  IgcSelectItemComponent,
  IgcButtonGroupComponent,
  IgcToggleButtonComponent,
  IgcDialogComponent,
);

// 番組情報 第1キーは日付の0時ちょうどのunixtime、第2キーはnetwork_idで第3キーはservice_id
let programs: Map<number, Map<number, Map<number, components['schemas']['MirakurunProgram'][]>>>;
// チャンネル情報
let services: Map<components["schemas"]["ChannelType"], components['schemas']['MirakurunService'][]>;

// APIを叩く
await getApiData();

updateDateDropdown();

// 放送タイプのボタングループの有効無効を切り替える
let isSelected = false;
const buttonGroup = document.querySelector("#pgtable-menu>igc-button-group") as IgcButtonGroupComponent;
buttonGroup.querySelectorAll("igc-toggle-button").forEach(toggleButton => {
  toggleButton.disabled = !services.has(toggleButton.value as components["schemas"]["ChannelType"]);
  if (!toggleButton.disabled && !isSelected) {
    toggleButton.selected = true;
    isSelected = true;
  }
});
buttonGroup.addEventListener('igcSelect', refreshTable);

async function getApiData() {
  try {
    const client = createClient<paths>({ baseUrl: loadConfigFromStorage().getApiEndpoint() });
    const response = await Promise.all([
      client.GET("/programs"),
      client.GET("/services"),
    ]);
    programs = groupPrograms(response[0].data!);
    services = groupServices(response[1].data!);
  } catch (error) {
    const skelton = document.querySelector('.mrv-pgtable-skelton') as HTMLElement;
    skelton.style = "display: none;";
    const dialog = document.createElement('igc-dialog');
    dialog.innerHTML = `
      <p slot="title">mirakc APIへのアクセスに失敗しました</p>
      <p>APIエンドポイントの指定を確認してください。<br />また、ブラウザのコンソールにエラーが出ていないか確認してください。</p>
  `;
    document.body.appendChild(dialog);
    dialog.show();

    throw error;
  }
}

function updateDateDropdown() {
  // 日付ドロップダウンのフォーマット
  const datetimeFormat = new Intl.DateTimeFormat(undefined, { month: 'numeric', day: 'numeric', weekday: 'narrow' });
  // 今日の0時の値 午前5時までは深夜と見なして前日扱いにする
  const today = new Date(Date.now() - (5 * 60 * 60 * 1000)).setHours(0, 0, 0, 0);
  // 日付ドロップダウンを作る
  const daySelect = document.querySelector("#pgtable-menu>igc-select") as IgcSelectComponent;
  [...programs!.keys()]
    .filter(date => date >= today)
    .sort()
    .forEach((dayUnixTime) => daySelect.insertAdjacentHTML('beforeend', `
      <igc-select-item value="${dayUnixTime}">${datetimeFormat.format(dayUnixTime)}</igc-select-item>
    `));
  // ドロップダウンで今日を選ぶ
  daySelect.select(today.toString());
  daySelect.addEventListener('igcChange', refreshTable);
}

function refreshTable(): void {
  const buttonGroup = document.querySelector("#pgtable-menu>igc-button-group") as IgcButtonGroupComponent;
  if (!buttonGroup || buttonGroup.selectedItems.length === 0) {
    return;
  }
  const channelType = buttonGroup.selectedItems[0] as components["schemas"]["ChannelType"];

  const daySelect = document.querySelector("#pgtable-menu>igc-select") as IgcSelectItemComponent;

  const currentPrograms = programs.get(parseInt(daySelect.value));
  const currentServices = services.get(channelType);

  const table = document.querySelector('.mrv-pgtable') as HTMLElement;
  table.replaceChildren(table.children[0], table.children[1]);

  // 日付のフォーマット
  const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
  // 選ばれている日の午前5時の値
  const today5am = new Date(parseInt(daySelect.value)).setHours(5, 0, 0, 0);

  currentServices?.forEach(service => {
    const programsPerService = currentPrograms?.get(service.networkId)?.get(service.serviceId);
    if (!programsPerService) {
      return;
    }
    table.insertAdjacentHTML('beforeend', `
      <div>
        <span>${service.name}</span>
      </div>
    `);
    const programDiv = document.createElement('div');
    programDiv.className = "ig-typography__caption";
    table.appendChild(programDiv);
    programsPerService.forEach((prg, i) => programDiv.insertAdjacentHTML('beforeend', `
      <div style="
        height: calc(${prg.duration} / 1000 / 60 / 60 * var(--mrv-pgtable-height-per-hour));
        top: calc(${prg.startAt - today5am} / 1000 / 60 / 60 * var(--mrv-pgtable-height-per-hour));
      ">
        <a>${timeFormat.format(prg.startAt)} ${prg.name}</a>
      </div>
    `));
  });
}

// ダミー画面を外す
// const skelton = document.querySelector('.mrv-pgtable-skelton') as HTMLElement;
// skelton.style.display = "none";
const table = document.querySelector('.mrv-pgtable') as HTMLElement;
// table.replaceChildren(table.children[0], table.children[1], table.children[2]);
table.style.display = "";

const timeHeader = document.createElement('div');
timeHeader.className = "ig-typography__subtitle-1";
for (let i = 5; i < 29; i++) {
  timeHeader.insertAdjacentHTML('beforeend', `<div>${i % 24}</div>`);
}
timeHeader.insertAdjacentHTML('beforeend', '<div class="time-bar"></div>');

table.replaceChildren(document.createElement('div'), timeHeader);

refreshTable();
