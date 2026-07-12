import {
  defineComponents,
  IgcDialogComponent,
  IgcDividerComponent,
  IgcButtonComponent,
  IgcBadgeComponent,
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
        <igc-badge slot="title" variant="danger">有料放送</igc-badge>
        <igc-divider slot="title"></igc-divider>
        <p slot="message"></p>
        <dl slot="message" id="dl-extended"></dl>
        <igc-divider slot="message"></igc-divider>
        <dl slot="message" id="dl-metadata"></dl>
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
    // 有料バッジ
    const badge = this.querySelector<IgcBadgeComponent>('igc-badge[slot="title"]');
    if (badge) {
      badge.style.display = program.isFree ? 'none' : 'unset';
    }

    // 詳細
    const descriptionP = this.querySelector<HTMLParagraphElement>('p[slot="message"]');
    if (descriptionP) {
      descriptionP.innerText = program.description ?? '';
      descriptionP.style.display = program.description ? 'unset' : 'none';
    }

    // 拡張情報
    const extendedDl = this.querySelector<HTMLDListElement>('#dl-extended');
    if (extendedDl) {
      extendedDl.replaceChildren();
      extendedDl.style.display = program.extended ? 'unset' : 'none';
      if (program.extended) {
        Object.entries(program.extended).forEach(item =>
          extendedDl.insertAdjacentHTML('beforeend', `
            <dt>${item[0]}</dt>
            <dd>${item[1]}</dd>
          `)
        );
      }
    }

    // 各種メタデータ
    const dlMetadata = this.querySelector('#dl-metadata');
    if (dlMetadata) {
      dlMetadata.replaceChildren();
      // ジャンル
      if (program.genres) {
        dlMetadata.insertAdjacentHTML('beforeend', `<dt>Genre</dt>`);
        program.genres.forEach(item => dlMetadata.insertAdjacentHTML('beforeend',
          `<dd>${genre_large.get(item.lv1)} - ${genre_middle.get(item.lv1)?.get(item.lv2) ?? ''}</dd>`
        ));
      }
      // 映像
      if (program.video) {
        dlMetadata.insertAdjacentHTML('beforeend', `
          <dt>Video</dt>
          <dd>${program.video.type} ${program.video.resolution}</dd>
        `);
      }
      // 音声
      if (program.audios) {
        dlMetadata.insertAdjacentHTML('beforeend', `<dt>Audio</dt>`);
        program.audios.forEach(item => dlMetadata.insertAdjacentHTML('beforeend',
          `<dd>${audio_component_types.get(item.componentType)} ${item.samplingRate / 1000}kHz ${item.langs.join(',')}`
        ));
      }
      // ID
      dlMetadata.insertAdjacentHTML('beforeend', `
        <dt>Program ID</dt><dd>${program.id}</dd>
        <dt>Service ID</dt><dd>${program.serviceId}</dd>
      `);
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
    IgcBadgeComponent,
  );
  customElements.define('mrv-pgdialog', MrvPgDialog);
}
