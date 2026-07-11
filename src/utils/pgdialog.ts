import {
  defineComponents,
  IgcDialogComponent,
  IgcDividerComponent,
  IgcButtonComponent,
} from 'igniteui-webcomponents';
import type { components } from './mirakc.d.ts';
import { audio_component_types, genre_large, genre_middle } from './const.ts';

export class MrvPgDialog extends HTMLElement {
  private dialog!: IgcDialogComponent;
  private program?: components['schemas']['MirakurunProgram'];

  constructor() {
    super();
  }

  connectedCallback() {
    this.insertAdjacentHTML('beforeend', `
      <igc-dialog close-on-outside-click>
        <span slot="title"></span>
        <igc-divider slot="title"></igc-divider>
        <div slot="message">
          <div id="div-chips" style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem;"></div>
          <div id="div-message"></div>
          <table id="table-metadata"></table>
        </div>
        <igc-divider slot="footer"></igc-divider>
        <div slot="footer">
          <igc-button id="button-close" variant="flat" slot="footer">OK</igc-button>
        </div>
      </igc-dialog>
    `);

    this.dialog = this.querySelector<IgcDialogComponent>('igc-dialog')!;

    this.querySelector('#button-close')?.addEventListener('click', () => this.dialog.hide());
  }

  public show(program: components['schemas']['MirakurunProgram']): void {
    this.program = program;

    // タイトル
    const titleSpan = this.querySelector<HTMLSpanElement>('span[slot="title"]');
    if (titleSpan) {
      titleSpan.innerText = program.name || '';
    }

    const chipInfo: string[][] = [];
    if (!program.isFree) {
      chipInfo.push(['currency_yen', '有料放送']);
    }
    if (program.video) {
      chipInfo.push(['videocam', `${program.video.type} ${program.video.resolution}`]);
    }
    program.audios?.forEach(item => chipInfo.push([
      'brand_awareness',
      `${audio_component_types.get(item.componentType)} ${item.samplingRate / 1000}kHz ${item.langs.join(',')}`
    ]));

    const chipDiv = this.querySelector('#div-chips');
    if (chipDiv) {
      chipDiv.replaceChildren();
      chipInfo.forEach(item => chipDiv.insertAdjacentHTML('beforeend', `
        <div class="div-chip">
          <span class="material-symbols-outlined" style="font-size: 1.2rem; vertical-align: middle;">${item[0]}</span>
          <span style="vertical-align: middle;">${item[1]}</span>
        </div>`
      ));
    }

    const messageDiv = this.querySelector('#div-message');
    if (messageDiv) {
      messageDiv.replaceChildren();
      if (program.description) {
        messageDiv.insertAdjacentHTML('beforeend', `<p>${program.description}</p>`);
      }
      if (program.extended) {
        Object.entries(program.extended).forEach(item =>
          messageDiv.insertAdjacentHTML('beforeend', `<p><strong>${item[0]}</strong>: ${item[1]}</p>`)
        );
      }
    }

    const table = this.querySelector('#table-metadata');
    if (table) {
      table.replaceChildren();
      program.genres?.forEach((item, idx) => table.insertAdjacentHTML('beforeend',
        `<tr><td>Genre [${idx + 1}]</td><td> : </td><td>${genre_large.get(item.lv1)} - ${genre_middle.get(item.lv1)?.get(item.lv2) ?? ''}</td></tr>`
      ));
      table.insertAdjacentHTML('beforeend', `<tr><td>Program ID</td><td> : </td><td>${program.id}</td></tr>`);
      table.insertAdjacentHTML('beforeend', `<tr><td>Service ID</td><td> : </td><td>${program.serviceId}</td></tr>`);
    }

    this.querySelectorAll<HTMLElement>('igc-button[slot="footer"]').forEach(item => {
      item.dataset['prgid'] = program.id.toString();
    });

    this.dialog.show();
  }
}

export function definePgDialog() {
  defineComponents(
    IgcDialogComponent,
    IgcDividerComponent,
    IgcButtonComponent,
  );
  customElements.define('mrv-pgdialog', MrvPgDialog);
}
