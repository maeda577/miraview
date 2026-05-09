import './utils/igniteui';
import { loadConfigFromStorage } from './utils/localconfig';
import { groupPrograms, groupServices } from './utils/pgtable';
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

/**
 * サービスタイプのボタンを更新する
 * @param serviceTypes - ボタンを有効化するサービスタイプ
 */
function updateServiceButtons(serviceTypes: Set<components["schemas"]["ChannelType"]>): void {
  let isSelected = false;
  const buttonGroup = document.querySelector<IgcButtonGroupComponent>("#pgtable-menu>igc-button-group");
  buttonGroup?.querySelectorAll("igc-toggle-button").forEach(toggleButton => {
    toggleButton.disabled = !serviceTypes.has(toggleButton.value as components["schemas"]["ChannelType"]);
    if (!toggleButton.disabled && !isSelected) {
      toggleButton.selected = true;
      isSelected = true;
    }
  });
  buttonGroup?.addEventListener('igcSelect', refreshTable);
}

/**
 * mirakcAPIを叩く
 */
async function getApiData(): Promise<[
  Map<number, Map<number, Map<number, components['schemas']['MirakurunProgram'][]>>>,
  Map<components["schemas"]["ChannelType"], components['schemas']['MirakurunService'][]>
]> {
  try {
    const client = createClient<paths>({ baseUrl: loadConfigFromStorage().getApiEndpoint().href });
    const response = await Promise.all([
      client.GET("/programs"),
      client.GET("/services"),
    ]);
    return [groupPrograms(response[0].data!), groupServices(response[1].data!)];
  } catch (error) {
    const dialog = document.querySelector('igc-dialog');
    dialog!.innerHTML = `
      <p slot="title">mirakc APIへのアクセスに失敗しました</p>
      <p>APIエンドポイントの指定を確認してください。<br />また、ブラウザのコンソールにエラーが出ていないか確認してください。</p>
    `;
    dialog!.show();

    throw error;
  }
}

/**
 * 日付ドロップダウンを作る
 * @param dateNumbers - 日付の0時ちょうどのunixtime
 */
function updateDateDropdown(dateNumbers: number[]): void {
  // 日付ドロップダウンのフォーマット
  const datetimeFormat = new Intl.DateTimeFormat(undefined, { month: 'numeric', day: 'numeric', weekday: 'narrow' });
  // 今日の0時の値 午前5時までは深夜と見なして前日扱いにする
  const today = new Date(Date.now() - (5 * 60 * 60 * 1000)).setHours(0, 0, 0, 0);
  // 日付ドロップダウンを作る
  const daySelect = document.querySelector("#pgtable-menu>igc-select") as IgcSelectComponent;
  dateNumbers.filter(date => date >= today)
    .sort()
    .forEach((dayUnixTime) => daySelect.insertAdjacentHTML('beforeend', `
      <igc-select-item value="${dayUnixTime}">${datetimeFormat.format(dayUnixTime)}</igc-select-item>
    `));
  // ドロップダウンで今日を選んでからイベントを紐づける
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

  const apiEndpoint = loadConfigFromStorage().getApiEndpoint();
  currentServices?.forEach(service => {
    const programsPerService = currentPrograms?.get(service.networkId)?.get(service.serviceId);
    if (!programsPerService) {
      return;
    }
    table.insertAdjacentHTML('beforeend', `
      <div>
        <a href="${apiEndpoint.href}services/${service.id}/stream"
          style="font-size: ${Math.min(9 / service.name.length, 1)}rem;"
        >
          ${service.name}
        </a>
      </div>
    `);
    const programDiv = document.createElement('div');
    // programDiv.className = "ig-typography__caption";
    table.appendChild(programDiv);
    programsPerService.forEach((prg, i) => {
      // 日付またぎの番組用にstartAtとdurationを調整する
      const startAt = prg.startAt >= today5am ? prg.startAt : today5am;
      const duration = prg.startAt >= today5am ? prg.duration : prg.duration - (today5am - prg.startAt);
      programDiv.insertAdjacentHTML('beforeend', `
      <div style="
        min-height: calc((${duration} / 1000 / 60 / 60 * var(--mrv-pgtable-height-per-hour)) + 1px);
        top: calc(${startAt - today5am} / 1000 / 60 / 60 * var(--mrv-pgtable-height-per-hour));
      ">
        <a>${timeFormat.format(prg.startAt)} ${prg.name}</a>
      </div>
      `);
    });
  });
}

// APIを叩く
// 番組情報の第1キーは日付の0時ちょうどのunixtime、第2キーはnetwork_idで第3キーはservice_id
const [programs, services] = await getApiData();

updateDateDropdown([...programs!.keys()]);

// 放送タイプのボタングループの有効無効を切り替える
updateServiceButtons(new Set(services.keys()));

const timeHeader = document.createElement('div');
for (let i = 5; i < 29; i++) {
  timeHeader.insertAdjacentHTML('beforeend', `<div>${i % 24}</div>`);
}
timeHeader.insertAdjacentHTML('beforeend', '<div class="time-bar"></div>');

const table = document.querySelector('.mrv-pgtable') as HTMLElement;
table.replaceChildren(document.createElement('div'), timeHeader);

refreshTable();
