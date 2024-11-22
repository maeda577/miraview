// Siemens IXのライブラリを1ファイルにバンドルするためだけのコード
// 公式のインストール手順の通り https://ix.siemens.io/docs/installation/javascript

// CSSはうまくバンドルできなかったのでHTML側で指定する
// import '@siemens/ix/dist/siemens-ix/siemens-ix.css';
import { defineCustomElements } from '@siemens/ix/loader';
import { defineCustomElements as defineIxIconCustomElement } from '@siemens/ix-icons/loader';

(async () => {
  defineIxIconCustomElement();
  defineCustomElements();
})();
