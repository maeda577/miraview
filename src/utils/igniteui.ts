import {
  defineComponents,
  IgcIconButtonComponent,
  IgcNavbarComponent,
  IgcNavDrawerComponent,
  IgcNavDrawerHeaderItemComponent,
  IgcNavDrawerItemComponent,
  IgcInputComponent,
} from 'igniteui-webcomponents';

defineComponents(
  IgcNavbarComponent,
  IgcNavDrawerComponent,
  IgcIconButtonComponent,
  IgcNavDrawerHeaderItemComponent,
  IgcNavDrawerItemComponent,
  IgcInputComponent,
);

// 左メニューのアイテム 左からMaterialIconの名前・表示する文字列・遷移するHTML
const menuItems = [
  ["newspaper", "番組表", "timetable.html"],
  ["settings", "設定", "settings.html"],
];

// ハンバーガーボタンにイベントを割り当てる
document.querySelector('igc-icon-button')?.addEventListener('click', e => drawer!.open = true);

// 今表示しているHTML名
const currentHtml = window.location.pathname.split('/').pop();

// 左メニューを作る
const drawer = document.querySelector('igc-nav-drawer');
menuItems.forEach(item => drawer!.insertAdjacentHTML('beforeend', `
<igc-nav-drawer-item data-html="${item[2]}" ${item[2] === currentHtml ? 'active' : ''}>
  <span slot="icon" class="material-symbols-outlined">${item[0]}</span>
  <span slot="content">${item[1]}</span>
</igc-nav-drawer-item>
`));

// メニューアイテムにクリックイベント割り当て
drawer!.querySelectorAll('igc-nav-drawer-item')?.forEach(item => {
  item.addEventListener('click', e => {
    const item = e.currentTarget as IgcNavDrawerItemComponent | undefined;
    if (item && !item.active && item.dataset.html) {
      window.location.href = `./${item.dataset.html}`;
    }
  });
});
