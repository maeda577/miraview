import { defineCustomElements } from '@siemens/ix/loader/index.es2017.js';
import { defineCustomElements as defineIxIconCustomElement } from '@siemens/ix-icons/loader/index.es2017.js';

(async () => {
  defineIxIconCustomElement();
  defineCustomElements();
})();
