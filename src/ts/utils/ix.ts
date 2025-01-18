import { defineCustomElements } from '@siemens/ix/loader/index.js';
import { defineCustomElements as defineIxIconCustomElement } from '@siemens/ix-icons/loader/index.js';
import createClient from 'openapi-fetch/dist/index.js';
import type { paths } from '../types/mirakc.d.ts';
import { loadConfigFromStorage } from './configManager.js';
import { themeSwitcher } from '@siemens/ix';

import license from '../../json/license.json' with { type: "json" };

// バージョン番号
const miraviewVersion = '3.2.0';

// WebComponentsの定義
defineIxIconCustomElement();
defineCustomElements();

/** ix-key-value の要素を作る */
export function createIxKeyValue(label: string, value: string) {
  const itemCommand = document.createElement('ix-key-value');
  itemCommand.label = label;
  itemCommand.value = value;
  return itemCommand;
}

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
    item.addEventListener('click', () => window.location.href = `./${urlmap.get(item.textContent!)}`);
  }
});

// configを読んでから必要なAPIを叩く
const config = loadConfigFromStorage();
const client = createClient<paths>({ baseUrl: config.getApiEndpoint() });
const version = await client.GET("/version");

// 画面テーマの切り替え
if (config.theme) {
  themeSwitcher.setTheme(config.theme);
}
else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  themeSwitcher.setTheme('theme-classic-dark');
}
else {
  themeSwitcher.setTheme('theme-classic-light');
}

// バージョン情報
(document.getElementById('mirakc-version') as HTMLIxKeyValueElement).value = version.data?.current ?? 'バージョン情報の取得に失敗しました';
(document.getElementById('miraview-version') as HTMLIxKeyValueElement).value = miraviewVersion;

// 依存ライセンスの情報を出す
const licenseContainer = document.getElementById('menu-license');
Object.entries(license).forEach(item => {
  const nameLink = document.createElement('ix-link-button');
  nameLink.innerText = item[0];
  nameLink.url = item[1].repository;
  nameLink.target = '_blank';
  licenseContainer?.appendChild(nameLink);
  const licenseTextP = document.createElement('p');
  licenseTextP.innerText = item[1].licenseText;
  licenseTextP.classList.add('typography-code');
  licenseTextP.style.backgroundColor = 'var(--theme-color-1)';
  licenseContainer?.appendChild(licenseTextP);
});
