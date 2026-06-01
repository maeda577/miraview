import { loadConfigFromStorage } from './localconfig.ts';
import { audio_component_types, genre_large, genre_middle } from './const.ts';
import { IgcDialogComponent } from 'igniteui-webcomponents';
import type { components } from './mirakc.d.ts';

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

  // 番組情報をグループ化した結果
  const result = new Map<number, Map<components['schemas']['MirakurunService'], components['schemas']['MirakurunProgram'][]>>();

  programs.forEach(program => {
    // 番組名や諸々のIDが入っていない番組を無視する
    if (!program.name || !program.networkId || !program.serviceId) {
      return;
    }
    // 番組の放送日の5時ちょうどのunixtime 午前4時59分までは前日と判定するため5時間引いておく
    const date = new Date(program.startAt - (5 * 60 * 60 * 1000)).setHours(5, 0, 0, 0);
    // 第一キーがなければMapを新規作成
    if (!result.has(date)) {
      result.set(date, new Map());
    }
    const mapPerDay = result.get(date)!;

    // 第二キーがなければ配列を新規作成して追加
    const service = serviceMap.get(getServiceId(program)!)!;
    if (!mapPerDay.has(service)) {
      mapPerDay.set(service, []);
    }
    mapPerDay.get(service)!.push(program);
  });

  // グループ化した番組の後処理
  result.forEach((prgPerDay, date) => prgPerDay.forEach((prgs, service) => {
    // 番組を放送順に並べ替える 並べ替えないと番組のz-indexの指定が必要になって面倒
    prgs.sort((a, b) => a.startAt - b.startAt);

    // 翌日5時のunixtime
    const tomorrow5h = date + (1000 * 60 * 60 * 24);
    // 最後の番組がAM5時をまたいでいる場合は翌日の番組リストにも加える
    const lastPrg = prgs.at(-1);
    if (lastPrg && (lastPrg.startAt + lastPrg.duration) > tomorrow5h) {
      result.get(tomorrow5h)?.get(service)?.unshift(lastPrg);
    }
  }));

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
  public showSkelton(): void {
    // スケルトンの数が指定されていれば参照し、無ければ適当に6
    const length = this.getAttribute('skelton-length') ?? '6';
    this.replaceChildren();
    for (let index = 0; index < parseInt(length); index++) {
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
    // 時刻表示の左ヘッダを作る
    const timeHeader = document.createElement('div');
    for (let i = 5; i < 29; i++) {
      timeHeader.insertAdjacentHTML('beforeend', `<div>${i % 24}</div>`);
    }
    timeHeader.insertAdjacentHTML('beforeend', '<div class="time-bar"></div>');
    this.replaceChildren(document.createElement('div'), timeHeader);

    // 番組IDキャッシュを作り直す
    this.idToProgram.clear();
    programs.forEach(a => a.forEach(prg => this.idToProgram.set(prg.id, prg)));

    // configを読む（番組ヘッダのリンク用）
    const apiEndpoint = loadConfigFromStorage().getApiEndpoint();
    // 番組divの日付フォーマット
    const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });

    // チャンネルごとに列追加
    programs?.forEach((programsPerService, service) => {
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
    // 番組情報を探す
    const prgid = (ev.target as HTMLElement).dataset['prgid'] ?? '';
    const program = this.idToProgram.get(parseInt(prgid));
    if (!program) { return; }

    // 番組表用に定義されたダイアログを探す
    const dialog = document.querySelector<IgcDialogComponent>('#mrv-pgtable-dialog');
    if (!dialog) { return; }

    // ダイアログの中身を作っていく
    dialog.replaceChildren(...dialog.querySelectorAll('*[slot="footer"]'));
    // タイトル
    dialog.title = program.name ?? '';

    // 各種チップを作るための情報を集める
    const chipInfo: string[][] = [];
    // 各種チップ 有料放送かどうか
    if (!program.isFree) {
      chipInfo.push(['currency_yen', '有料放送']);
    }
    // 各種チップ 映像フォーマット
    if (program.video) {
      chipInfo.push(['videocam', `${program.video.type} ${program.video.resolution}`]);
    }
    // 各種チップ 音声フォーマット
    program.audios?.forEach(item => chipInfo.push([
      'brand_awareness',
      `${audio_component_types.get(item.componentType)} ${item.samplingRate / 1000}kHz ${item.langs.join(',')}`
    ]));

    // チップを作る
    const chipDiv = document.createElement('div');
    dialog.appendChild(chipDiv);
    chipInfo.forEach(item => chipDiv.insertAdjacentHTML('beforeend', `
      <igc-chip disabled>
        <span slot="start" class="material-symbols-outlined">${item[0]}</span>
        <span>${item[1]}</span>
      </igc-chip>`
    ));

    // 番組情報
    const pDiv = document.createElement('div');
    dialog.appendChild(pDiv);
    if (program.description) {
      pDiv.insertAdjacentHTML('beforeend', `<p>${program.description}</p>`);
    }
    if (program.extended) {
      Object.entries(program.extended).forEach(item =>
        pDiv.insertAdjacentHTML('beforeend', `<p>${item.join(': ')}</p>`)
      );
    }

    // 各種チップ カテゴリ
    program.genres?.forEach(item => chipInfo.push([
      'book_2', `${genre_large.get(item.lv1)} - ${genre_middle.get(item.lv1)?.get(item.lv2)}`
    ]));
    dialog.insertAdjacentHTML('beforeend', `<p>Program ID: ${program.id}<br/>Service ID: ${program.serviceId}</p>`);

    // 録画予約ボタン
    document.querySelector<HTMLElement>('#dialog-programinfo-recbutton')!.dataset['prgid'] = program.id.toString();

    // ダイアログ表示
    dialog.show();
  }
}

customElements.define('mrv-pgtable', MrvPgTable);
