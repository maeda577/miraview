import { loadConfigFromStorage } from './configManager.js';
import { type ModalConfig, showModal, closeModal } from '@siemens/ix';
import { audio_component_types, genre_large, genre_middle } from './const.js';
import type { components } from '../types/mirakc.d.ts';
// declare globalで定義されているtypeを読みたいだけなので変なimportになっている
import type { } from '@siemens/ix/dist/types/components.d.ts';

// 番組の時刻のフォーマット
const programTimeFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
const programDatetimeFormat = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'narrow', hour: '2-digit', minute: '2-digit' });

/** 番組情報を便利にまとめる 第1キーは日付の0時ちょうどのunixtime、第2キーはnetwork_idで第3キーはservice_id */
// service_id単一では重複する可能性があり、ネットワーク内では一意。ARIB TR-B15のTable 5-9に書いてある
// http://www.arib.or.jp/english/html/overview/doc/8-TR-B15v4_6-2p4-E1.pdf#page=39
function groupPrograms(programs: components['schemas']['MirakurunProgram'][]): Map<number, Map<number, Map<number, components['schemas']['MirakurunProgram'][]>>> {
  // 番組情報をグループ化
  const groupedPrograms = programs.reduce<Map<number, Map<number, Map<number, components['schemas']['MirakurunProgram'][]>>>>((map, program) => {
    // 番組名や諸々のIDが入っていない番組を無視する
    if (!program.name || !program.networkId || !program.serviceId) {
      return map;
    }
    // 番組の放送日 午前5時00分までは前日と判定するため5時間引いておく
    const date = new Date(program.startAt - (5 * 60 * 60 * 1000)).setHours(0, 0, 0, 0);
    // 第一キーがなければMapを新規作成
    if (!map.has(date)) {
      map.set(date, new Map<number, Map<number, components['schemas']['MirakurunProgram'][]>>());
    }
    const mapPerDay = map.get(date)!;

    // 第二キーがなければMapを新規作成
    if (!mapPerDay.has(program.networkId!)) {
      mapPerDay.set(program.networkId!, new Map<number, components['schemas']['MirakurunProgram'][]>());
    }
    const mapPerNetwork = mapPerDay.get(program.networkId!)!;

    // 第三キーがあるか確認してから番組情報を加える
    if (!mapPerNetwork.has(program.serviceId!)) {
      mapPerNetwork.set(program.serviceId!, []);
    }
    mapPerNetwork.get(program.serviceId!)!.push(program);

    return map;
  }, new Map<number, Map<number, Map<number, components['schemas']['MirakurunProgram'][]>>>());

  // グループ化した番組の後処理
  groupedPrograms.forEach((prgPerDay, day) => prgPerDay.forEach((prgPerNw, nwId) => prgPerNw.forEach((prgs, svcId) => {
    // 番組を放送順に並べ替える
    prgs.sort((a, b) => a.startAt - b.startAt);
    // 午前5時ちょうどに始まる番組がない場合はダミーの放送情報を入れる
    const dayStart = (new Date(day)).setHours(5, 0, 0, 0);
    const timespan = prgs[0]!.startAt - dayStart;
    if (timespan > 0) {
      const dummy: components['schemas']['MirakurunProgram'] = {
        networkId: nwId,
        serviceId: svcId,
        startAt: dayStart,
        duration: timespan,
        id: -1,
        eventId: -1,
        isFree: true,
      };
      prgs.unshift(dummy);
    }

    prgs.forEach((prg, idx, arr) => {
      const nextPrg = arr.at(idx + 1);
      if (!nextPrg) return;
      // 放送時間が次の番組開始を越えるほどに長くなっている場合は短くする（野球など？）
      if (prg.startAt + prg.duration > nextPrg.startAt) {
        prg.duration = nextPrg.startAt - prg.startAt;
      }
      // 番組間に空き時間があった場合はダミーの放送情報を入れる
      if (prg.startAt + prg.duration !== nextPrg.startAt) {
        const dummy: components['schemas']['MirakurunProgram'] = {
          networkId: nwId,
          serviceId: svcId,
          startAt: prg.startAt + prg.duration,
          duration: nextPrg.startAt - (prg.startAt + prg.duration),
          id: -1,
          eventId: -1,
          isFree: true,
        };
        arr.splice(idx + 1, 0, dummy);
      }
    });
  })));

  return groupedPrograms;
}

// 番組表の更新関数
function refreshTable(
  groupedPrograms: Map<number, Map<number, Map<number, components['schemas']['MirakurunProgram'][]>>>,
  services: components['schemas']['MirakurunService'][],
  channelType?: components['schemas']['ChannelType'],
  dayNumber?: number,
) {
  // 日付ドロップダウンと放送波タブ
  const tabType = document.getElementById('tab-pgtable-type') as HTMLIxTabsElement | undefined;
  const dropdownDay = document.getElementById('dropdown-pgtable-day') as HTMLIxSelectElement | undefined;
  // 番組情報を詰める行を取得
  const rowHeader = document.getElementById('row-header');
  const rowProgram = document.getElementById('row-program');
  // 各種HTMLのテンプレート
  const templateChHeader = document.getElementById('template-pgtable-ch-header') as HTMLTemplateElement | undefined;
  const templatePrgItem = document.getElementById('template-pgtable-item') as HTMLTemplateElement | undefined;

  // どれかが取れなかった
  if (!tabType || !dropdownDay || !rowHeader || !rowProgram || !templateChHeader || !templatePrgItem) {
    return;
  }

  // 選ばれている日の番組
  const selectedDay = dayNumber ?? Number.parseInt(dropdownDay.value as string);
  const programs = groupedPrograms.get(selectedDay);

  // なぜか番組が無い
  if (!programs) {
    return;
  }

  // 選ばれている放送タイプ
  let selectedType: components['schemas']['ChannelType'] | undefined = channelType ?? undefined;

  // 日付ドロップダウン経由など、放送タイプが引数で指定されてない場合はタブ切り替えなどを行う
  if (!channelType) {
    // 選ばれている日に番組がある放送波タイプ
    const channelTypeSet = new Set(services.filter(e => programs.get(e.networkId)?.has(e.serviceId)).map(e => e.channel.type));

    // タブの有効・無効を切り替えつつ選択されているタブを探す
    tabType.querySelectorAll('ix-tab-item').forEach(item => {
      const pgExists = channelTypeSet.has(item.textContent as components['schemas']['ChannelType']);
      item.disabled = !pgExists;
      if (!pgExists) {
        item.selected = false;
      }
      if (item.selected) {
        selectedType = item.textContent as components['schemas']['ChannelType'];
      }
    });

    // 選択されているタブが無くなったら、有効タブのうち先頭を選ぶ
    if (!selectedType) {
      tabType.querySelectorAll('ix-tab-item').forEach(item => {
        if (!selectedType && !item.disabled) {
          item.selected = true;
          selectedType = item.textContent as components['schemas']['ChannelType'];
        }
      });
    }
  }

  // 表示するサービスリスト
  let serviceList = services.filter(
    svc => svc.channel.type === selectedType && programs?.get(svc.networkId)?.has(svc.serviceId)
  );
  // サービスの並び替え 地上波ならリモコンIDで並べ替え、それ以外はIDで並び替える
  // IDはネットワークIDとサービスIDを組み合わせたものが入っている
  // TODO: GR/BSはこれで良さそう。CSとSKYの場合これでいいのか分からない
  if (loadConfigFromStorage().disableServiceSorting) {
    // 何もしない
  }
  else if (selectedType === 'GR') {
    serviceList = serviceList?.sort((a, b) => a.remoteControlKeyId! - b.remoteControlKeyId!);
  }
  else {
    serviceList = serviceList?.sort((a, b) => a.id - b.id);
  }

  // CSSの変数を書き換える
  document.body.style.setProperty('--service-count', serviceList?.length.toString() ?? '1');

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
        prgLink.addEventListener('click', () => showDetailModal(prg, svc));
      } else {
        // ダミー番組の場合は子要素を全部消す
        programsElem.querySelector('div')!.replaceChildren();
      }
      svcProgramsElem.appendChild(programsElem);
    });
  });
}

// 番組詳細のダイアログを出す
function showDetailModal(program: components['schemas']['MirakurunProgram'], service: components['schemas']['MirakurunService']) {
  const templateModal = document.getElementById('template-pgtable-modal') as HTMLTemplateElement;
  const modal = (templateModal.content.cloneNode(true) as DocumentFragment).querySelector('div')!;

  // タイトル
  (modal.querySelector('.modal-title') as HTMLElement).innerText = program.name!;

  // 詳細などはdivの中にpタグを足していく
  const descriptionDiv = modal.querySelector('.modal-description') as HTMLElement;

  // 放送時間
  (modal.querySelector('.modal-time') as HTMLElement).innerText = programDatetimeFormat.format(program.startAt) + ' - ' + programTimeFormat.format(program.startAt + program.duration);

  // 詳細情報
  if (program.description) {
    const descP = document.createElement('p');
    descP.innerText = program.description;
    descriptionDiv.appendChild(descP);
  }

  // extendedはプロパティが特殊
  if (program.extended) {
    Object.entries(program.extended).map(ext => {
      const p = document.createElement('p');
      p.innerText = ext.join(' : ');
      descriptionDiv.appendChild(p);
    });
  }

  // テーブル形式で各種プロパティを出す
  (modal.querySelector('.modal-pay-tv') as HTMLElement).hidden = program.isFree;
  (modal.querySelector('.modal-video') as HTMLElement).innerText = program.video?.type + ' ' + program.video?.resolution;
  (modal.querySelector('.modal-audio') as HTMLElement).innerText = program.audios?.map(audio => `${audio_component_types.get(audio.componentType)} ${audio.samplingRate / 1000}kHz (${audio.langs.join(', ')})`).join('\n') ?? '';
  (modal.querySelector('.modal-genre') as HTMLElement).innerText = program.genres?.map(genre => `${genre_large.get(genre.lv1) ?? ''} - ${genre_middle.get(genre.lv1)?.get(genre.lv2) ?? ''}`).join('\n') ?? '';
  (modal.querySelector('.modal-program-id') as HTMLElement).innerText = program.id.toString();
  (modal.querySelector('.modal-service-id') as HTMLElement).innerText = program.serviceId.toString();

  // ボタン操作
  modal.querySelector('.modal-button-close')?.addEventListener('click', () => closeModal(modal, undefined));
  modal.querySelector('.modal-button-rec')?.addEventListener('click', () => closeModal(modal, undefined));

  // ダイアログ表示
  const modalConfig: ModalConfig = {
    content: modal,
    size: '720',
    closeOnBackdropClick: true,
  };
  showModal(modalConfig);
}

// CSSに設定した --now-msec-from-5am の変数を書き換える関数
// 現在時刻の横棒が動く
function updateCssVariableNowTime() {
  const now = Date.now();
  const today5 = new Date(now - (5 * 60 * 60 * 1000)).setHours(5, 0, 0, 0);
  document.body.style.setProperty('--now-msec-from-5am', (now - today5).toString());
}

/** 番組表を初期化する */
export async function initPgTable(programs?: components['schemas']['MirakurunProgram'][], services?: components['schemas']['MirakurunService'][]) {
  const coverLoading = document.getElementById('cover-loading');
  const coverNotFound = document.getElementById('cover-not-found');
  const pgTable = document.getElementById('pgtable-container');

  // 番組が無い
  if (!programs || !services || programs.length === 0 || services.length === 0) {
    coverLoading!.hidden = true;
    coverNotFound!.hidden = false;
    return;
  }

  // 番組一覧を整える
  const groupedPrograms = groupPrograms(programs);

  // 放送タイプのタブを取得してイベント割り当てる
  const tabs = document.getElementById('tab-pgtable-type') as HTMLIxTabsElement;
  tabs.querySelectorAll('ix-tab-item').forEach(item =>
    item.addEventListener('tabClick', () => refreshTable(groupedPrograms, services, item.textContent as components['schemas']['ChannelType']))
  );

  // 日付ドロップダウンのアイテムを作る
  const tabDateFormat = new Intl.DateTimeFormat(undefined, { month: '2-digit', day: '2-digit', weekday: 'narrow' });
  const dayDropdown = document.getElementById('dropdown-pgtable-day') as HTMLIxSelectElement;
  [...groupedPrograms!.keys()].sort().forEach(day => {
    const item = document.createElement('ix-select-item');
    item.value = day.toString();
    item.label = tabDateFormat.format(day);
    item.addEventListener('itemClick', () => refreshTable(groupedPrograms, services, undefined, day));
    dayDropdown.appendChild(item);
  });
  // ドロップダウンで今日を選ぶ 午前5時までは深夜と見なして前日扱いにする
  dayDropdown.value = new Date(Date.now() - (5 * 60 * 60 * 1000)).setHours(0, 0, 0, 0).toString();

  // WebComponentsが定義されるのを待ってから画面更新
  await window.customElements.whenDefined('ix-select');
  await window.customElements.whenDefined('ix-tabs');
  await window.customElements.whenDefined('ix-tab-item');
  refreshTable(groupedPrograms, services);

  // ロード中の画面を外す
  coverLoading!.hidden = true;
  pgTable!.hidden = false;

  // 現在時刻の横棒を今すぐ一回書き換えた後、1分ごとに書き換える
  updateCssVariableNowTime();
  const intervalId = setInterval(() => updateCssVariableNowTime(), 1000 * 60);
  window.addEventListener('beforeunload', () => clearInterval(intervalId));

  // 初回だけ現在時刻のラインまでスクロールする
  document.getElementById('now-line')?.scrollIntoView({ block: 'center', behavior: 'auto' });
}
