import '@siemens/ix/dist/siemens-ix/siemens-ix.css';
import { defineCustomElements } from '@siemens/ix/loader';
import { defineCustomElements as defineIxIconCustomElement } from '@siemens/ix-icons/loader';
import createClient from 'openapi-fetch';
import type { paths } from './mirakc.d.ts';
import { loadConfigFromStorage } from './common.js';
import { themeSwitcher } from '@siemens/ix';

// バージョン番号
const miraviewVersion = '3.4.0';

// 設定
const config = loadConfigFromStorage();

// WebComponentsの定義
(async () => {
  defineIxIconCustomElement();
  defineCustomElements();
})();

// mirakcバージョン情報取得
async function getMirakcVersionString() {
  const client = createClient<paths>({ baseUrl: config.getApiEndpoint() });
  try {
    const version = await client.GET("/version");
    return version.data!.current;
  } catch {
    return 'バージョン情報の取得に失敗しました';
  }
}

// 依存ライブラリのライセンス情報が入っているjson
const license = await fetch('../json/license.json').then(res => res.json());

// breakpointを切る
// md,lgだと番組表の横幅が崩れるのでsm固定にしている 直れば可変にする
const navigation = document.querySelector('ix-application');
navigation!.breakpoints = ['sm'];
// メニューを作る
navigation!.insertAdjacentHTML('afterbegin', `
  <ix-menu i-1-8n-legal="バージョン情報">
    <ix-menu-item icon="table" data-html="program.html">番組表</ix-menu-item>
    <ix-menu-item icon="circle-play">ライブ視聴</ix-menu-item>
    <ix-menu-item icon="search">番組検索</ix-menu-item>
    <ix-menu-item icon="history">タイムシフト</ix-menu-item>
    <ix-menu-item icon="scheduler">録画予約</ix-menu-item>
    <ix-menu-item icon="video-file">録画一覧</ix-menu-item>
    <ix-menu-item icon="radio-waves" data-html="tuner.html">チューナー</ix-menu-item>
    <ix-menu-item icon="cogwheel" data-html="setting.html">設定</ix-menu-item>
    <ix-menu-about label="バージョン情報">
      <ix-menu-about-item label="バージョン">
        <ix-key-value-list>
          <ix-key-value label-position="left" label="mirakc" value="${await getMirakcVersionString()}"></ix-key-value>
          <ix-key-value label-position="left" label="miraview" value="${miraviewVersion}"></ix-key-value>
        </ix-key-value-list>
      </ix-menu-about-item>
      <ix-menu-about-item id="menu-license" label="ライセンス" style="height: 80vh; overflow-x: scroll;">
        ${Object.entries<{ repository: string; licenseText: string; }>(license).map(item => `
          <ix-link-button target="_blank" url="${item[1].repository}">
            ${item[0]}
          </ix-link-button>
          <p class="typography-code" style="background-color: var(--theme-color-1);">
            ${item[1].licenseText.replaceAll('\n', '<br />')}
          </p>
        `).join('')}
      </ix-menu-about-item>
    </ix-menu-about>
  </ix-menu>`
);

// メニュークリック時のイベント
function onMenuClick(e: Event) {
  const item = e.currentTarget as HTMLIxMenuItemElement | undefined;
  if (item && !item.active && item.dataset.html) {
    window.location.href = `./${item.dataset.html}`;
  }
}

// メニューへのクリックイベント割り当てとactive状態切り替えを行う
const currentHtml = window.location.pathname.split('/').pop();
await window.customElements.whenDefined('ix-menu-item');
navigation?.querySelectorAll('ix-menu-item')?.forEach(item => {
  item.addEventListener('click', onMenuClick);
  item.active = item.dataset.html === currentHtml;
});

// 画面テーマの切り替え
if (config.theme) {
  themeSwitcher.setTheme(config.theme);
} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  themeSwitcher.setTheme('theme-classic-dark');
} else {
  themeSwitcher.setTheme('theme-classic-light');
}
