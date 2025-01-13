import { defineCustomElements } from '@siemens/ix/loader/index.js';
import { defineCustomElements as defineIxIconCustomElement } from '@siemens/ix-icons/loader/index.js';
import createClient from 'openapi-fetch/dist/index.js';
import type { paths } from '../types/mirakc.d.ts';
import { loadConfigFromStorage } from '../utils/config.js';

import license from '../../json/license.json' with { type: "json" };

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

// configを読んでから必要なAPIを叩く
const config = loadConfigFromStorage();
const client = createClient<paths>({ baseUrl: config.apiEndpoint });
const version = await client.GET("/version");

// バージョン情報
document.getElementById('mirakc-version')!.innerText = version.data?.current ?? 'バージョン情報の取得に失敗しました';
document.getElementById('miraview-version')!.innerText = '3.2.0';

// 依存ライセンスの情報を出す
const licenseContainer = document.getElementById('menu-license');
Object.entries(license).forEach(item => {
  const nameP = document.createElement('p');
  nameP.innerText = item[0];
  licenseContainer?.appendChild(nameP);
  const licenseTextP = document.createElement('p');
  licenseTextP.innerText = item[1].licenseText;
  licenseTextP.classList.add('typography-code');
  licenseTextP.style.backgroundColor = 'var(--theme-color-1)';
  licenseContainer?.appendChild(licenseTextP);
});

