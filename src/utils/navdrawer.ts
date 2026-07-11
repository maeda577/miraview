import {
  defineComponents,
  IgcNavDrawerComponent,
  IgcNavDrawerHeaderItemComponent,
  IgcNavDrawerItemComponent,
} from 'igniteui-webcomponents';
import { loadConfigFromStorage } from './localconfig.ts';
import createClient from 'openapi-fetch';
import type { paths } from './mirakc.d.ts';

export class MrvNavDrawer extends HTMLElement {
  // バージョン情報で出すmiraviewのバージョン
  private readonly MIRAVIEW_VERSION = 'v3.4.1';
  // 左メニューのアイテム 左からMaterialIconの名前・表示する文字列・遷移するHTML
  private menuItems = [
    ["newspaper", "番組表", "timetable.html"],
    ["router", "チューナー", "tuners.html"],
    ["settings", "設定", "settings.html"],
  ];

  constructor() {
    super();
  }

  public show() {
    return this.querySelector('igc-nav-drawer')?.show();
  }

  connectedCallback() {
    this.onMenuClick = this.onMenuClick.bind(this);

    // 今表示しているHTML名
    const currentHtml = window.location.pathname.split('/').pop();

    // 左メニューを作る
    const drawer = document.createElement('igc-nav-drawer');
    drawer.position = 'start';
    drawer.style.zIndex = '99';
    this.replaceChildren(drawer);

    // 左メニューのヘッダ
    drawer.insertAdjacentHTML('beforeend', '<igc-nav-drawer-header-item style="justify-content: center;">miraview</igc-nav-drawer-header-item>');

    // 左メニューのアイテム
    this.menuItems.forEach(item => drawer.insertAdjacentHTML('beforeend', `
      <igc-nav-drawer-item data-html="${item[2]}" ${item[2] === currentHtml ? 'active' : ''}>
        <span slot="icon" class="material-symbols-outlined">${item[0]}</span>
        <span slot="content">${item[1]}</span>
      </igc-nav-drawer-item>
    `));

    // 左メニューの上と下を分けるdiv
    drawer.insertAdjacentHTML('beforeend', '<div style="flex-grow: 1;"></div>');

    drawer.insertAdjacentHTML('beforeend', `
      <igc-nav-drawer-item>
        <span slot="icon" class="material-symbols-outlined">info</span>
        <span slot="content">バージョン情報</span>
      </igc-nav-drawer-item>
    `);
    // メニューアイテムにクリックイベント割り当て
    drawer.querySelectorAll('igc-nav-drawer-item')?.forEach(
      item => item.addEventListener('click', this.onMenuClick)
    );
  }

  // メニューのクリック
  async onMenuClick(ev: PointerEvent) {
    const menuItem = ev.currentTarget as IgcNavDrawerItemComponent | undefined;
    // data-htmlタグがあれば読み、そのhtmlに遷移する
    if (menuItem && !menuItem.active && menuItem.dataset['html']) {
      window.location.href = `./${menuItem.dataset['html']}`;
    }
    // 無ければバージョン表示アイテムのはず
    else {
      const client = createClient<paths>({ baseUrl: loadConfigFromStorage().getApiEndpoint().href });
      let version: string | undefined;
      try {
        const response = await client.GET("/version");
        version = response.data?.current;
      } catch { }
      window.alert(`miraview: ${this.MIRAVIEW_VERSION}\nmirakc: ${version ?? 'バージョン情報を取得できませんでした'}`);
    }
  }
}

export function defineNavDrawer() {
  defineComponents(
    IgcNavDrawerComponent,
    IgcNavDrawerHeaderItemComponent,
    IgcNavDrawerItemComponent,
  );
  customElements.define('mrv-nav-drawer', MrvNavDrawer);
}
