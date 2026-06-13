import {
  defineComponents,
  IgcNavDrawerComponent,
  IgcNavDrawerHeaderItemComponent,
  IgcNavDrawerItemComponent,
} from 'igniteui-webcomponents';

export class MrvNavDrawer extends HTMLElement {
  // 左メニューのアイテム 左からMaterialIconの名前・表示する文字列・遷移するHTML
  private menuItems = [
    ["newspaper", "番組表", "timetable.html"],
    ["settings", "設定", "settings.html"],
  ];

  constructor() {
    super();
  }

  public show() {
    return this.querySelector('igc-nav-drawer')?.show();
  }

  connectedCallback() {
    // 今表示しているHTML名
    const currentHtml = window.location.pathname.split('/').pop();

    // 左メニューを作る
    const drawer = document.createElement('igc-nav-drawer');
    drawer.position = 'start';
    this.replaceChildren(drawer);

    // 左メニューのヘッダ
    drawer.insertAdjacentHTML('beforeend', '<igc-nav-drawer-header-item>miraview</igc-nav-drawer-header-item>');

    // 左メニューのアイテム
    this.menuItems.forEach(item => drawer.insertAdjacentHTML('beforeend', `
      <igc-nav-drawer-item data-html="${item[2]}" ${item[2] === currentHtml ? 'active' : ''}>
        <span slot="icon" class="material-symbols-outlined">${item[0]}</span>
        <span slot="content">${item[1]}</span>
      </igc-nav-drawer-item>
    `));

    // メニューアイテムにクリックイベント割り当て
    drawer.querySelectorAll('igc-nav-drawer-item')?.forEach(
      item => item.addEventListener('click', this.onMenuClick)
    );
  }

  // メニューのクリック data-htmlタグを読み、そのhtmlに遷移する
  onMenuClick(ev: PointerEvent): void {
    const menuItem = ev.target as IgcNavDrawerItemComponent | undefined;
    if (menuItem && !menuItem.active && menuItem.dataset['html']) {
      window.location.href = `./${menuItem.dataset['html']}`;
    }
  }
}

export function defineMenu() {
  defineComponents(
    IgcNavDrawerComponent,
    IgcNavDrawerHeaderItemComponent,
    IgcNavDrawerItemComponent,
  );
  customElements.define('mrv-nav-drawer', MrvNavDrawer);
}
