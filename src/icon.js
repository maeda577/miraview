import { toSVG } from '@carbon/icon-helpers';
import {
    TableSplit20,
    VideoPlayer20,
    Search20,
    RecentlyViewed20,
    EventSchedule20,
    Video20,
    Radio20,
    Settings20,
} from '@carbon/icons';

const attrs = {
    preserveAspectRatio: 'xMidYMid meet',
    fill: 'currentColor',
    viewBox: '0 0 32 32',
    width: 20,
    height: 20,
    slot: 'title-icon',
    'aria-hidden': true
};

// carbonのアイコンを左メニューに差し込む
window.document.getElementById('menu-link-program')?.appendChild(toSVG({...TableSplit20, attrs: attrs}))
window.document.getElementById('menu-link-live')?.appendChild(toSVG({...VideoPlayer20, attrs: attrs}))
window.document.getElementById('menu-link-search')?.appendChild(toSVG({...Search20, attrs: attrs}))
window.document.getElementById('menu-link-timeshift')?.appendChild(toSVG({...RecentlyViewed20, attrs: attrs}))
window.document.getElementById('menu-link-schedule')?.appendChild(toSVG({...EventSchedule20, attrs: attrs}))
window.document.getElementById('menu-link-recorded')?.appendChild(toSVG({...Video20, attrs: attrs}))
window.document.getElementById('menu-link-tuner')?.appendChild(toSVG({...Radio20, attrs: attrs}))
window.document.getElementById('menu-link-setting')?.appendChild(toSVG({...Settings20, attrs: attrs}))
