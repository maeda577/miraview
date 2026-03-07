import {
  defineComponents,
  IgcIconButtonComponent,
  IgcNavbarComponent,
  IgcNavDrawerComponent,
  IgcNavDrawerHeaderItemComponent,
  IgcNavDrawerItemComponent,
  IgcInputComponent,
  IgcSelectComponent,
  IgcSelectItemComponent,
  IgcButtonGroupComponent,
  // IgcTooltipComponent,
} from 'igniteui-webcomponents';

defineComponents(
  IgcNavbarComponent,
  IgcNavDrawerComponent,
  IgcIconButtonComponent,
  IgcNavDrawerHeaderItemComponent,
  IgcNavDrawerItemComponent,
  IgcInputComponent,
  IgcSelectComponent,
  IgcSelectItemComponent,
  IgcButtonGroupComponent,
  // IgcTooltipComponent,
);

// 左メニュー
const drawer = document.querySelector('igc-nav-drawer');

// ハンバーガーボタン
document.querySelector('igc-icon-button')?.addEventListener('click', e => drawer!.open = true);

// 左メニューのアイテム
[
  ["newspaper", "番組表", "timetable.html"],
  ["settings", "設定", "settings.html"],
].forEach(item => drawer!.insertAdjacentHTML('beforeend', `
<igc-nav-drawer-item data-html="${item[2]}">
  <span slot="icon" class="material-symbols-outlined">${item[0]}</span>
  <span slot="content">${item[1]}</span>
</igc-nav-drawer-item>
`));

// メニューアイテムの操作
const currentHtml = window.location.pathname.split('/').pop();
document?.querySelectorAll('igc-nav-drawer-item')?.forEach(item => {
  // active状態切り替え
  item.active = item.dataset.html === currentHtml;
  // クリックイベント割り当て
  item.addEventListener('click', e => {
    const item = e.currentTarget as IgcNavDrawerItemComponent | undefined;
    if (item && !item.active && item.dataset.html) {
      window.location.href = `./${item.dataset.html}`;
    }
  });
});
