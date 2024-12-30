import { defineCustomElements } from '@siemens/ix/loader';
import { defineCustomElements as defineIxIconCustomElement } from '@siemens/ix-icons/loader';

(async () => {
  defineIxIconCustomElement();
  defineCustomElements();
})();
