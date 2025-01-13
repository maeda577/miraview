import { defineCustomElements } from '@siemens/ix/loader/index.js';
import { defineCustomElements as defineIxIconCustomElement } from '@siemens/ix-icons/loader/index.js';

// WebComponentsの定義
defineIxIconCustomElement();
defineCustomElements();

// breakpointを切る(smになると左メニューが消えるので避ける)
document.querySelector('ix-basic-navigation')!.breakpoints = ['md'];

// 左メニューの画面表示とHTMLファイル名のマップ
const urlmap = new Map<string, string>([
  ['番組表', 'program'],
]);

// 左メニューにclickイベントを割り当てる
await window.customElements.whenDefined('ix-menu-item');
document.querySelectorAll('ix-menu-item').forEach(item => {
  if (!item.active && urlmap.has(item.textContent!)) {
    item.addEventListener('click', () => window.location.href = `./${urlmap.get(item.textContent!)}.html`);
  }
});
