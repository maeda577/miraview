import { loadConfigFromStorage } from './localconfig.ts';
import type { components } from './mirakc.d.ts';
import { MrvPgDialog } from './pgdialog.ts';

export function getServiceId(program: components['schemas']['MirakurunProgram']): number {
  return parseInt(program.networkId.toString() + program.serviceId.toString().padStart(5, '0'));
}

/**
 * 番組情報を使いやすくまとめる
 * 第1キーは番組の放送日の5時ちょうどのunixtime 第2キーはService
 */
export function groupPrograms(
  programs: components['schemas']['MirakurunProgram'][],
  services: components['schemas']['MirakurunService'][]
): Map<number, Map<components['schemas']['MirakurunService'], components['schemas']['MirakurunProgram'][]>> {
  // サービスIDからサービスを探しやすくするmap
  const serviceMap = new Map<number, components['schemas']['MirakurunService']>(
    services.map(item => [item.id, item])
  );

  // 番組情報をグループ化した結果Map
  const mapAllDay = new Map<number, Map<components['schemas']['MirakurunService'], components['schemas']['MirakurunProgram'][]>>();

  programs.forEach(program => {
    // 番組名や諸々のIDが入っていない番組を無視する
    if (!program.name || !program.networkId || !program.serviceId) {
      return;
    }
    // 番組の放送日の5時ちょうどのunixtime 午前4時59分までは前日と判定するため5時間引いておく
    const date = new Date(program.startAt - (5 * 60 * 60 * 1000)).setHours(5, 0, 0, 0);
    // 第一キーがなければMapを新規作成
    if (!mapAllDay.has(date)) {
      mapAllDay.set(date, new Map());
    }
    const mapPerDay = mapAllDay.get(date)!;

    // 第二キーがなければ配列を新規作成して追加
    const service = serviceMap.get(getServiceId(program)!)!;
    if (!mapPerDay.has(service)) {
      mapPerDay.set(service, []);
    }
    mapPerDay.get(service)!.push(program);
  });

  // グループ化した番組配列の後処理
  mapAllDay.forEach((prgPerDay, date) => prgPerDay.forEach((prgs, service) => {
    // 番組を放送順に並べ替える 並べ替えないと番組のz-indexの指定が必要になって面倒
    prgs.sort((a, b) => a.startAt - b.startAt);

    // 翌日5時のunixtime
    const tomorrow5h = date + (1000 * 60 * 60 * 24);
    // 最後の番組がAM5時をまたいでいる場合は翌日の番組配列の先頭にも加える
    const lastPrg = prgs.at(-1);
    if (lastPrg && (lastPrg.startAt + lastPrg.duration) > tomorrow5h) {
      mapAllDay.get(tomorrow5h)?.get(service)?.unshift(lastPrg);
    }
  }));

  // 番組情報をグループ化した結果Mapのソート後版
  // 第1キーは日付順、第2キーはServiceの順でソートされている
  // Map自体はsort()を持たないが、挿入順に列挙されることが保証されているらしい
  // https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Map
  const result = new Map<number, Map<components['schemas']['MirakurunService'], components['schemas']['MirakurunProgram'][]>>();

  // チャンネルタイプでソートする時に使うマップ
  const typeToNumber = new Map<components["schemas"]["ChannelType"], number>([
    ["GR", 1],
    ["BS", 2],
    ["CS", 3],
    ["SKY", 4],
  ]);

  // グループ化したMapをソートしつつ作り直す
  const sortedDays = [...mapAllDay.keys()].sort();
  sortedDays.forEach(date => {
    const prgPerDay = mapAllDay.get(date)!;
    const sortedServices = [...prgPerDay.keys()].sort((a, b) => {
      // チャンネルタイプ
      if (a.channel.type !== b.channel.type) {
        return typeToNumber.get(a.channel.type)! - typeToNumber.get(b.channel.type)!;
      }
      // リモコンID
      else if (a.remoteControlKeyId && b.remoteControlKeyId && a.remoteControlKeyId !== b.remoteControlKeyId) {
        return a.remoteControlKeyId - b.remoteControlKeyId;
      }
      // サービスID(networkIdとserviceIdをつなげたもの)
      else {
        return a.id - b.id;
      }
    });

    const sortedPrgPerDay = new Map(
      sortedServices.map(item => [item, prgPerDay.get(item)!])
    );
    result.set(date, sortedPrgPerDay);
  });

  return result;
}

/**
 * 番組表のWebComponent
 * shadowRootを使っていないので、普通のHTML要素とほぼ同じ
 */
export class MrvPgTable extends HTMLElement {
  // 番組IDから番組を探すためのキャッシュ
  private idToProgram = new Map<number, components['schemas']['MirakurunProgram']>();

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
  public showSkelton(skeltonCount: number = 6): void {
    this.replaceChildren();
    for (let index = 0; index < skeltonCount * 2; index++) {
      this.insertAdjacentHTML('beforeend', '<div class="skelton"></div>');
    }
  }

  /** CSSに設定した --mrv-pgtable-now-msec-from-5am の値を現在時刻に書き換える 現在時刻の横棒が動く */
  private updateCssVariableNowTime() {
    const now = Date.now();
    const today5 = new Date(now - (5 * 60 * 60 * 1000)).setHours(5, 0, 0, 0);
    document.body.style.setProperty('--mrv-pgtable-now-msec-from-5am', (now - today5).toString());
  }

  /**
   * 番組表を更新する
   * @param selectedDay5AM - 選ばれている日の午前5時の値
   */
  public refreshTable(
    programs: Map<components['schemas']['MirakurunService'], components['schemas']['MirakurunProgram'][]>,
    selectedDay5AM: number,
  ): void {
    // 全ての子要素を消す
    this.replaceChildren();

    // 番組IDキャッシュを作り直す
    this.idToProgram.clear();
    programs.forEach(a => a.forEach(prg => this.idToProgram.set(prg.id, prg)));

    // configを読む（番組ヘッダのリンク用）
    const apiEndpoint = loadConfigFromStorage().getApiEndpoint();
    // 番組divの日付フォーマット
    const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

    // サービス数 時刻の横棒の長さ計算に使う
    document.body.style.setProperty('--mrv-pgtable-service-count', programs.size.toString());
    // 時刻ヘッダ数 時刻の横棒の長さ計算に使う
    document.body.style.setProperty('--mrv-pgtable-timeheader-count',
      new Set([...programs.keys()].map(item => item.channel.type)).size.toString()
    );

    // 最後に追加したチャンネルタイプ(GR/BS/CS/SKY) 切り替わりのタイミングで時刻ヘッダを入れる
    let lastChannelType: components["schemas"]["ChannelType"] | undefined = undefined;

    // チャンネルごとに列追加
    programs?.forEach((programsPerService, service) => {
      // チャンネルに番組が無い
      if (!programsPerService || programsPerService.length === 0) {
        return;
      }

      // 最初とチャンネルタイプの変わり目で時刻表示の列を作る
      if (lastChannelType !== service.channel.type) {
        const timeHeader = document.createElement('div');
        timeHeader.classList.add('timeheader');
        for (let i = 5; i < 29; i++) {
          timeHeader.insertAdjacentHTML('beforeend', `<div>${i % 24}</div>`);
        }
        this.appendChild(document.createElement('div'));
        this.appendChild(timeHeader);
        lastChannelType = service.channel.type;
      }

      // サービスのヘッダ 番組名が長いと表示が崩れるので、長さに応じて文字を小さくする
      this.insertAdjacentHTML('beforeend', `
      <div class="serviceheader">
        <a href="${apiEndpoint.href}services/${service.id}/stream"
          style="font-size: ${Math.min(9 / service.name.length, 1)}rem;"
        >
          ${service.name}
        </a>
      </div>
      `);

      // サービスごとの各番組を入れるdiv
      const programDiv = document.createElement('div');
      programDiv.classList.add('serviceprograms');
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

    // 最後に時刻表示の横棒を入れる
    this.insertAdjacentHTML('beforeend', '<div class="time-bar"></div>');
  }

  onProgramClick(ev: PointerEvent): void {
    // 番組情報を探す
    const prgid = (ev.target as HTMLElement).dataset['prgid'] ?? '';
    const program = this.idToProgram.get(parseInt(prgid));
    if (!program) { return; }

    // 番組詳細ダイアログを表示する
    const dialog = document.querySelector('mrv-pgdialog') as MrvPgDialog | undefined;
    if (dialog && typeof dialog.show === 'function') {
      dialog.show(program);
    }
  }
}

export function definePgTable() {
  customElements.define('mrv-pgtable', MrvPgTable);
}
