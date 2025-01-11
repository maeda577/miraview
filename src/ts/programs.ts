import createClient from 'openapi-fetch/dist/index.js';
import type { CDSTabs, CDSTab, CDSContentSwitcher, CDSContentSwitcherItem } from '@carbon/web-components/es/index.d.ts';
import type { paths, components } from './types/mirakc';
import { audio_component_types, genre_large, genre_middle, groupPrograms } from './utils/common.js';
import { loadConfigFromStorage } from './utils/config.js';

// configを読んでから必要なAPIを叩く
const config = loadConfigFromStorage();
const client = createClient<paths>({ baseUrl: config.apiEndpoint });
const response = await Promise.all([
  client.GET("/programs"),
  client.GET("/services"),
]);
const [programs, services] = response;
// エラーがあればコンソールに出してから処理止める
response.forEach(res => {
  if (res.error !== undefined) {
    console.error(res.error);
    return;
  }
});

// 番組一覧を整える
const groupedPrograms = groupPrograms(programs.data);

// 日付切り替えタブを作る
const tabDateFormat = new Intl.DateTimeFormat(undefined, { month: '2-digit', day: '2-digit', weekday: 'narrow' });
const dayTabs = document.getElementById('day-tabs') as CDSTabs | undefined;
[...groupedPrograms.keys()].filter(day => day >= new Date(Date.now() - (5 * 60 * 60 * 1000)).setHours(0, 0, 0, 0))
  .sort().forEach(day => {
    const item = document.createElement('cds-tab') as CDSTab;
    item.value = day.toString();
    item.innerText = tabDateFormat.format(day);
    dayTabs?.appendChild(item);
  });

// 放送波タブの受信していないタブを無効化し、有効なものの先頭を選択状態にする
const channelTypeSet = new Set(services.data?.map(e => e.channel.type));
const typeSwitcher = document.getElementById('channel-type-switcher') as CDSContentSwitcher;
typeSwitcher?.querySelectorAll('cds-content-switcher-item')?.forEach(item => {
  const switcherItem = item as CDSContentSwitcherItem;
  if (channelTypeSet.has(switcherItem.value as components['schemas']['ChannelType'])) {
    switcherItem.disabled = false;
    if (typeSwitcher.value === '') {
      typeSwitcher.value = switcherItem.value;
    }
  }
});

// 番組表の更新関数
const programTimeFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }); // 番組の時刻のフォーマット
function refreshTable() {
  // 日付ドロップダウンと放送波タブの今選ばれている値を取得
  const selectedType = (document.getElementById('channel-type-switcher') as CDSContentSwitcher | undefined)?.value as components['schemas']['ChannelType'] | undefined;
  const selectedDay = (document.getElementById('day-tabs') as CDSTabs | undefined)?.value;
  // 番組情報を詰める行を取得
  const rowHeader = document.getElementById('row-header');
  const rowProgram = document.getElementById('row-program');
  // 各種HTMLのテンプレート
  const templateChHeader = document.getElementById('template-pgtable-ch-header') as HTMLTemplateElement | undefined;
  const templatePrgItem = document.getElementById('template-pgtable-item') as HTMLTemplateElement | undefined;

  // どれかが取れなかった
  if (selectedDay === undefined ||
    selectedType === undefined ||
    rowHeader === undefined ||
    rowProgram === undefined ||
    templateChHeader === undefined ||
    templatePrgItem === undefined
  ) {
    return;
  }

  const dayNumber = Number.parseInt(selectedDay!);
  const programs = groupedPrograms.get(dayNumber);

  // 表示するサービスリスト
  var serviceList = services.data?.filter(
    svc => svc.channel.type === selectedType && programs?.get(svc.networkId)?.has(svc.serviceId)
  );
  // CSSの変数を書き換える
  document.body.style.setProperty('--service-count', serviceList?.length.toString() ?? '1');

  // サービスの並び替え 地上波ならリモコンIDで並べ替え、それ以外はIDで並び替える
  // IDはネットワークIDとサービスIDを組み合わせたものが入っている
  // TODO: GR/BSはこれで良さそう。CSとSKYの場合これでいいのか分からない
  if (selectedType === 'GR') {
    serviceList = serviceList?.sort((a, b) => a.remoteControlKeyId! - b.remoteControlKeyId!);
  }
  else {
    serviceList = serviceList?.sort((a, b) => a.id - b.id);
  }

  // 1列目を残してすべて消してから詰めていく
  rowHeader!.replaceChildren(rowHeader!.children[0]);
  rowProgram!.replaceChildren(rowProgram!.children[0]);

  serviceList?.forEach(svc => {
    // チャンネル名のヘッダ
    const chHeader = templateChHeader!.content.cloneNode(true) as DocumentFragment;
    chHeader.querySelector('span')!.innerText = svc.name;
    rowHeader!.appendChild(chHeader);

    // 番組を入れるセル
    const svcProgramsElem = document.createElement('td');
    rowProgram!.appendChild(svcProgramsElem);

    // セルに番組を詰める
    programs?.get(svc.networkId)?.get(svc.serviceId)?.forEach(prg => {
      const programsElem = templatePrgItem!.content.cloneNode(true) as DocumentFragment;
      programsElem.querySelector('div')?.style.setProperty('height', `calc(${prg.duration} / 1000 / 60 / 60 * var(--height-per-hour))`);
      if (prg.id !== -1) {
        const prgLink = programsElem.querySelector('a')!;
        prgLink.innerText = programTimeFormat.format(prg.startAt) + ' ' + (prg.name ?? '');
        prgLink.addEventListener('click', () => showModal(prg, svc));
      } else {
        // ダミー番組の場合は子要素を全部消す
        programsElem.querySelector('div')!.replaceChildren();
      }
      svcProgramsElem.appendChild(programsElem);
    });
  });
}

// ダイアログの表示関数
const programDatetimeFormat = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'narrow', hour: '2-digit', minute: '2-digit' });
function showModal(program: components['schemas']['MirakurunProgram'], service: components['schemas']['MirakurunService']) {
  // タイトルなど
  document.getElementById('modal-title')!.innerText = program.name!;
  document.getElementById('modal-time')!.innerText = programDatetimeFormat.format(program.startAt) + ' - ' + programTimeFormat.format(program.startAt + program.duration);
  document.getElementById('modal-description')!.innerText = program.description ?? '';

  // extendedだけはプロパティが特殊
  const extended = document.getElementById('modal-extended')!;
  if (program.extended) {
    Object.entries(program.extended).map(ext => extended.innerText += ext.join(': '));
    extended.hidden = false;
  } else {
    extended.hidden = true;
  }

  // テーブル形式で各種プロパティを出す
  document.getElementById('modal-pay-tv')!.hidden = program.isFree;
  document.getElementById('modal-video')!.innerText = program.video?.type + ' ' + program.video?.resolution;
  document.getElementById('modal-audio')!.innerText = program.audios?.map(audio => `${audio_component_types.get(audio.componentType)} ${audio.samplingRate / 1000}kHz (${audio.langs.join(', ')})`).join('\n') ?? '';
  document.getElementById('modal-genre')!.innerText = program.genres?.map(genre => `${genre_large.get(genre.lv1) ?? ''} - ${genre_middle.get(genre.lv1)?.get(genre.lv2) ?? ''}`).join('\n') ?? '';
  document.getElementById('modal-program-id')!.innerText = program.id.toString();
  document.getElementById('modal-service-id')!.innerText = program.serviceId.toString();

  // ダイアログ表示
  document.getElementById('modal-program')?.setAttribute('open', 'true');
}

// 今日のタブを選ぶ 午前5時までは深夜と見なして前日扱いにする
dayTabs?.setAttribute('value', new Date(Date.now() - (5 * 60 * 60 * 1000)).setHours(0, 0, 0, 0).toString());

// 一応WebComponentsが定義されたのを待ってから画面更新
await window.customElements.whenDefined('cds-content-switcher');
await window.customElements.whenDefined('cds-content-switcher-item');
await window.customElements.whenDefined('cds-tabs');
await window.customElements.whenDefined('cds-tab');
refreshTable();

// ローディング画面から戻す
document.getElementById('loading-container')?.classList.add('hidden');
document.getElementById('pgtable-container')?.classList.remove('hidden');

// 変更イベントに画面更新を紐づける
document.getElementById('channel-type-switcher')?.addEventListener('cds-content-switcher-selected', refreshTable);
document.getElementById('day-tabs')?.addEventListener('cds-tabs-selected', refreshTable);

// CSSに設定した --now-msec-from-5am の変数を書き換える関数
function updateCssVariableNowTime() {
  const now = Date.now();
  const today5 = new Date(now - (5 * 60 * 60 * 1000)).setHours(5, 0, 0, 0);
  document.body.style.setProperty('--now-msec-from-5am', (now - today5).toString());
}

// 今すぐ一回書き換えた後、1分ごとに書き換える
updateCssVariableNowTime();
const intervalId = setInterval(() => updateCssVariableNowTime(), 1000 * 60);
window.addEventListener('beforeunload', () => clearInterval(intervalId));

// 初回だけ現在時刻のラインまでスクロールする
document.getElementById('now-line')?.scrollIntoView({ block: 'center', behavior: 'auto' });
