import './utils/igniteui.ts';
import { loadConfigFromStorage } from './utils/localconfig';
import { groupPrograms, groupServices } from './utils/pgtable';
import type { MrvPgTable } from './utils/pgtable';
import { audio_component_types } from './utils/const.ts';
import createClient from 'openapi-fetch';
import type { components, paths } from './utils/mirakc.d.ts';

import {
  defineComponents,
  IgcSelectComponent,
  IgcSelectItemComponent,
  IgcButtonGroupComponent,
  IgcToggleButtonComponent,
  IgcDialogComponent,
  IgcChipComponent,
} from 'igniteui-webcomponents';

defineComponents(
  IgcSelectComponent,
  IgcSelectItemComponent,
  IgcButtonGroupComponent,
  IgcToggleButtonComponent,
  IgcDialogComponent,
  IgcChipComponent,
);

// APIを叩く
// 番組情報の第1キーは日付の0時ちょうどのunixtime、第2キーはnetwork_idで第3キーはservice_id
const [programs, services] = await getApiData();

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
    // throw new Error();
    return [groupPrograms(response[0].data!), groupServices(response[1].data!)];
  } catch (error) {
    window.alert("mirakc APIへのアクセスに失敗しました。\nAPIエンドポイントの指定を確認してください。また、ブラウザのコンソールにエラーが出ていないか確認してください。");
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

/**
 * 番組情報のダイアログを出す
 */
function showProgramInfoDialog(program: components['schemas']['MirakurunProgram']): void {
  // ダイアログに情報を埋めていく
  const dialog = document.querySelector<IgcDialogComponent>('#dialog-programinfo')!;
  // タイトル
  dialog.title = program.name ?? '';
  // 各種チップ
  const chipDiv = dialog.querySelector('#dialog-programinfo-chips');
  chipDiv?.replaceChildren();
  // 各種チップ 有料放送かどうか
  if (!program.isFree) {
    chipDiv?.insertAdjacentHTML('beforeend', `
      <igc-chip>
        <span slot="start" class="material-symbols-outlined">currency_yen</span>
        <span>有料放送</span>
      </igc-chip>`);
  }
  // 各種チップ 映像フォーマット
  if (program.video) {
    chipDiv?.insertAdjacentHTML('beforeend', `
      <igc-chip>
        <span slot="start" class="material-symbols-outlined">movie</span>
        <span>${program.video.type} ${program.video.resolution}</span>
      </igc-chip>`);
  }
  // 各種チップ 音声フォーマット
  if (program.audios) {
    program.audios.forEach(item =>
      chipDiv?.insertAdjacentHTML('beforeend', `
        <igc-chip>
          <span slot="start" class="material-symbols-outlined">brand_awareness</span>
          <span>${audio_component_types.get(item.componentType)} ${item.samplingRate / 1000}kHz ${item.langs.join(',')}</span>
        </igc-chip>`));
  }
  // 番組情報
  const pDiv = dialog.querySelector('#dialog-programinfo-paragraphs');
  pDiv?.replaceChildren();
  if (program.description) {
    pDiv?.insertAdjacentHTML('beforeend', `<p>${program.description}</p>`);
  }
  if (program.extended) {
    Object.entries(program.extended).forEach(item =>
      pDiv?.insertAdjacentHTML('beforeend', `<p>${item.join(': ')}</p>`)
    );
  }
  // 録画予約ボタン
  document.querySelector<HTMLElement>('#dialog-programinfo-recbutton')!.dataset['prgid'] = program.id.toString();

  // ダイアログ表示
  dialog.show();
}

// 番組表を更新する
function refreshTable(): void {
  const buttonGroup = document.querySelector("#pgtable-menu>igc-button-group") as IgcButtonGroupComponent;
  if (!buttonGroup || buttonGroup.selectedItems.length === 0) {
    return;
  }
  const channelType = buttonGroup.selectedItems[0] as components["schemas"]["ChannelType"];

  const daySelect = document.querySelector("#pgtable-menu>igc-select") as IgcSelectItemComponent;
  // 選ばれている日の午前5時の値
  const today5am = new Date(parseInt(daySelect.value)).setHours(5, 0, 0, 0);

  const currentPrograms = programs.get(parseInt(daySelect.value))!;
  const currentServices = services.get(channelType)!;

  document.querySelector<MrvPgTable>('mrv-pgtable')?.refreshTable(currentServices, currentPrograms, today5am);
}

// 日付ドロップダウンを作る
updateDateDropdown([...programs!.keys()]);

// 放送タイプのボタングループの有効無効を切り替える
updateServiceButtons(new Set(services.keys()));

// 初回の番組表更新を行う
refreshTable();

// 初回だけ現在時刻のラインまでスクロールする
document.querySelector('.time-bar')?.scrollIntoView({ block: 'center', behavior: 'auto' });

// 番組ダイアログの閉じるボタン
document.querySelector('#dialog-programinfo-closebutton')?.addEventListener('click',
  () => document.querySelector<IgcDialogComponent>('#dialog-programinfo')?.hide()
);

// 番組ダイアログの録画ボタン
document.querySelector('#dialog-programinfo-recbutton')?.addEventListener('click',
  () => window.alert('未実装')
);

// 番組リンクのクリック
customElements.whenDefined('mrv-pgtable').then(() => {
  document.querySelector<MrvPgTable>('mrv-pgtable')!.programClickedCallback = showProgramInfoDialog;
});
