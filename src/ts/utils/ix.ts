import { defineCustomElements } from '@siemens/ix/loader/index.js';
import { defineCustomElements as defineIxIconCustomElement } from '@siemens/ix-icons/loader/index.js';
import createClient from 'openapi-fetch/dist/index.js';
import type { paths } from '../types/mirakc.d.ts';
import { loadConfigFromStorage } from './common.js';
import { themeSwitcher } from '@siemens/ix';

import license from '../../json/license.json' with { type: "json" };

// バージョン番号
const miraviewVersion = '3.2.0';

// WebComponentsの定義
defineIxIconCustomElement();
defineCustomElements();

// breakpointを切る(smになると左メニューが消えるので避ける)
document.querySelector('ix-basic-navigation')!.breakpoints = ['md'];

// 左メニューの画面表示とHTMLファイル名のマップ
const urlmap = new Map<string, string>([
  ['番組表', 'program.html'],
  ['チューナー', 'tuner.html'],
  ['設定', 'setting.html'],
]);

// 左メニューにclickイベントを割り当てる
await window.customElements.whenDefined('ix-menu-item');
document.querySelectorAll('ix-menu-item').forEach(item => {
  if (!item.active && urlmap.has(item.textContent!)) {
    item.addEventListener('click', e => window.location.href = `./${urlmap.get(item.textContent!)}`);
  }
});

// configを読んでから必要なAPIを叩く
const config = loadConfigFromStorage();

// 画面テーマの切り替え
if (config.theme) {
  themeSwitcher.setTheme(config.theme);
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  themeSwitcher.setTheme('theme-classic-dark');
} else {
  themeSwitcher.setTheme('theme-classic-light');
}

// mirakcバージョン情報取得
let mirakcVersion = '';
const client = createClient<paths>({ baseUrl: config.getApiEndpoint() });
try {
  const version = await client.GET("/version");
  mirakcVersion = version.data!.current;
} catch {
  mirakcVersion = 'バージョン情報の取得に失敗しました';
}

// バージョン情報を表示
(document.getElementById('mirakc-version') as HTMLIxKeyValueElement).value = mirakcVersion;
(document.getElementById('miraview-version') as HTMLIxKeyValueElement).value = miraviewVersion;

// 依存ライセンスの情報を出す
const licenseContainer = document.getElementById('menu-license');
Object.entries(license).forEach(item => {
  licenseContainer?.insertAdjacentHTML('beforeend', `
    <ix-link-button target="_blank" url="${item[1].repository}">
      ${item[0]}
    </ix-link-button>
    <p class="typography-code" style="background-color: var(--theme-color-1);">
      ${item[1].licenseText.replaceAll('\n', '<br />')}
    </p>`
  );
});
