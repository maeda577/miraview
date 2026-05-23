import { loadConfigFromStorage } from './localconfig';
import type { components } from './mirakc.d.ts';

// service_id単一では重複する可能性があり、ネットワーク内では一意。ARIB TR-B15のTable 5-9に書いてある
// http://www.arib.or.jp/english/html/overview/doc/8-TR-B15v4_6-2p4-E1.pdf#page=39
/** 番組情報を便利にまとめる 第1キーは日付の0時ちょうどのunixtime、第2キーはnetwork_idで第3キーはservice_id */
export function groupPrograms(programs: components['schemas']['MirakurunProgram'][]): Map<number, Map<number, Map<number, components['schemas']['MirakurunProgram'][]>>> {
  // 番組情報をグループ化
  const groupedPrograms = new Map<number, Map<number, Map<number, components['schemas']['MirakurunProgram'][]>>>();
  programs.forEach(program => {
    // 番組名や諸々のIDが入っていない番組を無視する
    if (!program.name || !program.networkId || !program.serviceId) {
      return;
    }
    // 番組の放送日 午前5時00分までは前日と判定するため5時間引いておく
    const date = new Date(program.startAt - (5 * 60 * 60 * 1000)).setHours(0, 0, 0, 0);
    // 第一キーがなければMapを新規作成
    if (!groupedPrograms.has(date)) {
      groupedPrograms.set(date, new Map<number, Map<number, components['schemas']['MirakurunProgram'][]>>());
    }
    const mapPerDay = groupedPrograms.get(date)!;

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
  });

  // グループ化した番組の後処理
  groupedPrograms.forEach((prgPerDay, date) => prgPerDay.forEach(prgPerNw => prgPerNw.forEach(prgs => {
    // 番組を放送順に並べ替える 並べ替えないと番組のz-indexの指定が必要になって面倒
    prgs.sort((a, b) => a.startAt - b.startAt);

    // 翌日0時と5時のunixtime
    const tommorrow0h = date + (1000 * 60 * 60 * 24);
    const tommorrow5h = date + (1000 * 60 * 60 * 29);
    // 最後の番組がAM5時をまたいでいる場合は翌日の番組リストにも加える
    const lastPrg = prgs.at(-1);
    if (lastPrg && (lastPrg.startAt + lastPrg.duration) > tommorrow5h) {
      groupedPrograms.get(tommorrow0h)?.get(lastPrg.networkId)?.get(lastPrg.serviceId)?.unshift(lastPrg);
    }
  })));

  return groupedPrograms;
}

/** サービス情報を便利にまとめる キーはチャンネルタイプ(GR/BS/CS/SKY) */
export function groupServices(services: components['schemas']['MirakurunService'][]): Map<components["schemas"]["ChannelType"], components['schemas']['MirakurunService'][]> {
  const groupedServices = new Map<components["schemas"]["ChannelType"], components['schemas']['MirakurunService'][]>();
  services.forEach(service => {
    if (!groupedServices.has(service.channel.type)) {
      groupedServices.set(service.channel.type, []);
    }
    groupedServices.get(service.channel.type)!.push(service);
  });

  // グループ化した番組の後処理
  groupedServices.forEach((servicesPerType, serviceType) => {
    // 地上波ならリモコンIDで並び替え、それ以外は単純にIDで並び替える
    if (serviceType === 'GR') {
      servicesPerType.sort((a, b) => a.remoteControlKeyId && b.remoteControlKeyId && a.remoteControlKeyId !== b.remoteControlKeyId ?
        a.remoteControlKeyId - b.remoteControlKeyId :
        a.id - b.id);
    }
    else {
      servicesPerType.sort((a, b) => a.id - b.id);
    }
  });

  return groupedServices;
};

/**
 * 番組表のWebComponent
 * shadowRootを使っていないので、普通のHTML要素とほぼ同じ
 */
export class MrvPgTable extends HTMLElement {
  // 番組IDから番組を探すためのキャッシュ
  private idToProgram = new Map<number, components['schemas']['MirakurunProgram']>();

  // 番組表の番組がクリックされた時に呼ばれる関数
  public programClickedCallback: (program: components['schemas']['MirakurunProgram']) => void = () => { };

  constructor() {
    super();
  }

  // 要素がドキュメントに追加された時に呼ばれる関数 実質コンストラクタ
  // https://developer.mozilla.org/ja/docs/Web/API/Web_components/Using_custom_elements
  connectedCallback() {
    this.showSkelton();
    // 関数がイベントとして呼ばれた時にthisがイベント起点の要素になってしまうのを避ける
    this.onProgramClick = this.onProgramClick.bind(this);

    // 現在時刻の横棒を更新するメソッドを定期実行する
    this.updateCssVariableNowTime();
    const intervalId = setInterval(this.updateCssVariableNowTime, 1000 * 60);
    window.addEventListener('beforeunload', () => clearInterval(intervalId));
  }

  /** 読み込み中のスケルトンを出す */
  public showSkelton(): void {
    const length = this.getAttribute('skelton-length') ?? '6';
    this.replaceChildren();
    for (let index = 0; index < parseInt(length); index++) {
      this.insertAdjacentHTML('beforeend', '<div class="skelton"></div>');
    }
  }

  /**
   * CSSに設定した --mrv-pgtable-now-msec-from-5am の値を現在時刻に書き換える 現在時刻の横棒が動く
   */
  updateCssVariableNowTime() {
    const now = Date.now();
    const today5 = new Date(now - (5 * 60 * 60 * 1000)).setHours(5, 0, 0, 0);
    document.body.style.setProperty('--mrv-pgtable-now-msec-from-5am', (now - today5).toString());
  }

  /**
   * 番組表を更新する
   * @param selectedDay5AM - 選ばれている日の午前5時の値
   */
  public refreshTable(
    services: components['schemas']['MirakurunService'][],
    programs: Map<number, Map<number, components['schemas']['MirakurunProgram'][]>>,
    selectedDay5AM: number,
  ): void {
    // 時刻表示の左ヘッダを作る
    const timeHeader = document.createElement('div');
    for (let i = 5; i < 29; i++) {
      timeHeader.insertAdjacentHTML('beforeend', `<div>${i % 24}</div>`);
    }
    timeHeader.insertAdjacentHTML('beforeend', '<div class="time-bar"></div>');
    this.replaceChildren(document.createElement('div'), timeHeader);

    // 番組IDキャッシュを作り直す
    this.idToProgram.clear();
    programs.forEach(a => a.forEach(b => b.forEach(prg => this.idToProgram.set(prg.id, prg))));

    // configを読む（番組ヘッダのリンク用）
    const apiEndpoint = loadConfigFromStorage().getApiEndpoint();
    // 番組divの日付フォーマット
    const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

    // チャンネルごとに列追加
    services?.forEach(service => {
      const programsPerService = programs?.get(service.networkId)?.get(service.serviceId);
      // チャンネルに番組が無い
      if (!programsPerService || programsPerService.length === 0) {
        return;
      }

      // 番組ヘッダ 番組名が長いと表示が崩れるので、長さに応じて文字を小さくする
      this.insertAdjacentHTML('beforeend', `
      <div>
        <a href="${apiEndpoint.href}services/${service.id}/stream"
          style="font-size: ${Math.min(9 / service.name.length, 1)}rem;"
        >
          ${service.name}
        </a>
      </div>
      `);

      // 番組1個分のdiv
      const programDiv = document.createElement('div');
      this.appendChild(programDiv);
      programsPerService.forEach(prg => {
        // 日付またぎの番組用にstartAtとdurationを調整する
        const startAt = prg.startAt >= selectedDay5AM ? prg.startAt : selectedDay5AM;
        const duration = prg.startAt >= selectedDay5AM ? prg.duration : prg.duration - (selectedDay5AM - prg.startAt);
        programDiv.insertAdjacentHTML('beforeend', `
        <div style="
          min-height: calc((${duration} / 1000 / 60 / 60 * var(--mrv-pgtable-height-per-hour)) + 1px);
          top: calc(${startAt - selectedDay5AM} / 1000 / 60 / 60 * var(--mrv-pgtable-height-per-hour));
        ">
          <a data-prgid="${prg.id}">${timeFormat.format(prg.startAt)} ${prg.name}</a>
        </div>
        `);
        // アロー関数を使うとメモリ食うらしいのでちゃんと関数を作っておく
        // https://developer.mozilla.org/ja/docs/Web/API/EventTarget/addEventListener#メモリーの問題
        programDiv.lastElementChild?.querySelector('a')?.addEventListener('click', this.onProgramClick);
      });
    });
  }

  onProgramClick(ev: PointerEvent): void {
    // 番組情報を探し、外部から設定されたcallbackを呼び出す
    const prgid = (ev.target as HTMLElement).dataset['prgid'] ?? '';
    const program = this.idToProgram.get(parseInt(prgid));
    if (program) {
      this.programClickedCallback(program);
    }
  }
}

customElements.define('mrv-pgtable', MrvPgTable);
