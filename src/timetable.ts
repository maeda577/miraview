import { loadConfigFromStorage } from './utils/localconfig.ts';
import { defineMenu, MrvMenu } from './utils/menu.ts';
import { groupPrograms, definePgTable, MrvPgTable } from './utils/pgtable.ts';
import createClient from 'openapi-fetch';
import type { components, paths } from './utils/mirakc.d.ts';

import {
  defineComponents,
  IgcNavbarComponent,
  IgcIconButtonComponent,
  IgcSelectComponent,
  IgcSelectItemComponent,
  IgcButtonGroupComponent,
  IgcToggleButtonComponent,
  IgcDialogComponent,
  IgcChipComponent,
} from 'igniteui-webcomponents';

defineComponents(
  IgcNavbarComponent,
  IgcIconButtonComponent,
  IgcSelectComponent,
  IgcSelectItemComponent,
  IgcButtonGroupComponent,
  IgcToggleButtonComponent,
  IgcDialogComponent,
  IgcChipComponent,
);

definePgTable();
defineMenu();

// APIを叩く
// 番組情報の第1キーは日付の5時ちょうどのunixtime、第2キーはservice
const programs = await getApiData(loadConfigFromStorage().getApiEndpoint().href);

/**
 * mirakcAPIを叩く
 */
async function getApiData(baseUrl: string): Promise<Map<number, Map<components['schemas']['MirakurunService'], components['schemas']['MirakurunProgram'][]>>> {
  try {
    const client = createClient<paths>({ baseUrl: baseUrl });
    const response = await Promise.all([
      client.GET("/programs"),
      client.GET("/services"),
    ]);
    // throw new Error();
    return groupPrograms(response[0].data!, response[1].data!);
  } catch (error) {
    window.alert("mirakc APIへのアクセスに失敗しました。\nAPIエンドポイントの指定を確認してください。また、ブラウザのコンソールにエラーが出ていないか確認してください。");
    document.querySelector<MrvPgTable>('mrv-pgtable')?.showSkelton(0);
    throw error;
  }
}

/**
 * 日付ドロップダウンを作る
 * @param dateNumbers - 日付の0時ちょうどのunixtime
 */
function createDateDropdown(dateNumbers: number[]): void {
  // 日付ドロップダウンのフォーマット
  const datetimeFormat = new Intl.DateTimeFormat(undefined, { month: 'numeric', day: 'numeric', weekday: 'narrow' });
  // 今日の5時の値 午前4時59分までは深夜と見なして前日扱いにする
  const today = new Date(Date.now() - (5 * 60 * 60 * 1000)).setHours(5, 0, 0, 0);
  // 日付ドロップダウンを作る
  const daySelect = document.querySelector("#pgtable-menu>igc-select") as IgcSelectComponent;
  dateNumbers
    .filter(date => date >= today)
    .sort()
    .forEach((dayUnixTime) => daySelect.insertAdjacentHTML('beforeend', `
      <igc-select-item value="${dayUnixTime}">${datetimeFormat.format(dayUnixTime)}</igc-select-item>
    `));
  // 番組が無い
  if (daySelect.childElementCount == 0) {
    window.alert("表示する番組がありません。\nmirakcの番組スキャンが正しく動作しているか確認してください。");
    document.querySelector<MrvPgTable>('mrv-pgtable')?.showSkelton(0);
    return;
  }
  // ドロップダウンで今日を選ぶ
  daySelect.select(today.toString());
  daySelect.addEventListener('igcChange', updateServiceButtons);
  // イベント相当を手動で起こす
  updateServiceButtons();
}

/**
 * サービスタイプのボタンを更新する
 * @param serviceTypes - ボタンを有効化するサービスタイプ
 */
function updateServiceButtons(): void {
  // 選ばれている日
  const daySelect = document.querySelector<IgcSelectItemComponent>("#pgtable-menu>igc-select");
  if (!daySelect || daySelect.value === '') {
    return;
  }
  const selectedDay5am = parseInt(daySelect.value);
  // 選ばれている日に番組が存在する放送タイプ
  const channels = programs.get(selectedDay5am)?.keys();
  if (!channels) {
    return;
  }
  const serviceTypes = new Set([...channels].map(item => item.channel.type));

  // 放送タイプのボタングループ
  const buttonGroup = document.querySelector<IgcButtonGroupComponent>("#pgtable-menu>igc-button-group");
  if (!buttonGroup) {
    return;
  }

  // 選ばれた日にある放送タイプを元にボタンの有効無効を切り替える 無効になる場合は選択状態も解除する
  buttonGroup.querySelectorAll("igc-toggle-button").forEach(toggleButton => {
    toggleButton.disabled = !serviceTypes.has(toggleButton.value as components["schemas"]["ChannelType"]);
    if (toggleButton.disabled) {
      toggleButton.selected = false;
    }
  });

  // 何も選ばれていない場合、最初の有効なボタンを選択する
  if (buttonGroup.selectedItems.length === 0) {
    for (const button of buttonGroup.querySelectorAll("igc-toggle-button")) {
      if (!button.disabled) {
        button.selected = true;
        break;
      }
    }
  }
  // 手動で画面更新をかける
  refreshTable();
}

// 番組表を更新する
function refreshTable(): void {
  // console.debug(new Date() + ' timetable.ts refreshTable');
  // 選ばれている日
  const daySelect = document.querySelector<IgcSelectItemComponent>("#pgtable-menu>igc-select");
  if (!daySelect || daySelect.value === '') {
    return;
  }
  const selectedDay5am = parseInt(daySelect!.value);

  // 選ばれている放送タイプ
  const buttonGroup = document.querySelector<IgcButtonGroupComponent>("#pgtable-menu>igc-button-group");
  if (!buttonGroup || buttonGroup.selectedItems.length === 0) {
    return;
  }
  const channelType = buttonGroup.selectedItems[0] as components["schemas"]["ChannelType"];

  // 番組表に渡す、選ばれた日付・放送タイプで絞り込まれた番組情報
  const dayPrograms = new Map(
    [...programs.get(selectedDay5am)!.entries()]
      // 指定されている放送タイプで絞り込む
      .filter(item => item[0].channel.type === channelType)
      // チャンネルを並び替える 両方のサービスにリモコンIDが定義されて異なるならばリモコンIDで並び替え、同じならばIDで並び替える
      .sort((a, b) =>
        a[0].remoteControlKeyId && b[0].remoteControlKeyId && a[0].remoteControlKeyId !== b[0].remoteControlKeyId ?
          a[0].remoteControlKeyId - b[0].remoteControlKeyId :
          a[0].id - b[0].id)
  );

  // 番組表を更新
  document.querySelector<MrvPgTable>('mrv-pgtable')?.refreshTable(dayPrograms, selectedDay5am);
}

// 放送タイプボタンにイベントをつける
document.querySelector<IgcButtonGroupComponent>("#pgtable-menu>igc-button-group")?.addEventListener('igcSelect', refreshTable);

// 日付ドロップダウンを作る
createDateDropdown([...programs.keys()]);

// 初回だけ現在時刻のラインまでスクロールする
document.querySelector('.time-bar')?.scrollIntoView({ block: 'center', behavior: 'auto' });

// 番組ダイアログの閉じるボタン
document.querySelector('#dialog-programinfo-closebutton')?.addEventListener('click',
  () => document.querySelector<IgcDialogComponent>('mrv-pgtable>igc-dialog')?.hide()
);

// 番組ダイアログの録画ボタン
document.querySelector('#dialog-programinfo-recbutton')?.addEventListener('click',
  () => window.alert('未実装')
);

// 上メニューのハンバーガーボタン
document.querySelector('igc-icon-button')?.addEventListener('click',
  () => document.querySelector<MrvMenu>('mrv-menu')?.show()
);
