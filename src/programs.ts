import '@carbon/web-components/es/components/dropdown/index.js';
import '@carbon/web-components/es/components/dropdown/dropdown-item.js';
import '@carbon/web-components/es/components/ui-shell/index.js';
import { getAttributes, toSVG } from '@carbon/icon-helpers';
import addIcon from '@carbon/icons/es/add/32';

class AddIcon extends HTMLElement{
  connectedCallback() {
    this.appendChild(toSVG({...addIcon, attrs: getAttributes(addIcon.attrs)}))
  }
}
customElements.define('icon-add', AddIcon );

// window.document.getElementById('Notification')?.appendChild(addIconNode);
