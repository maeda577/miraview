import {
  defineComponents,
  IgcNavbarComponent,
  IgcIconButtonComponent,
} from 'igniteui-webcomponents';

export class MrvNavbar extends HTMLElement {
  static get observedAttributes() {
    return ['title'];
  }

  constructor() {
    super();
  }

  connectedCallback() {
    this.insertAdjacentHTML('beforeend', `
      <igc-navbar>
        <igc-icon-button slot="start" variant="flat">
          <span class="material-symbols-outlined">menu</span>
        </igc-icon-button>
        <span>${this.getAttribute('title') || ''}</span>
      </igc-navbar>
    `);

    // ハンバーガーボタンクリック時のイベントリスナー
    this.querySelector('igc-icon-button')?.addEventListener('click', () => {
      const drawer = document.querySelector<any>('mrv-nav-drawer');
      if (drawer && typeof drawer.show === 'function') {
        drawer.show();
      }
    });
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    switch (name) {
      case 'title':
        const span = this.querySelector('igc-navbar>span');
        if (span) { span.textContent = newValue; }
    }
  }
}

export function defineNavbar() {
  defineComponents(
    IgcNavbarComponent,
    IgcIconButtonComponent,
  );
  customElements.define('mrv-navbar', MrvNavbar);
}
