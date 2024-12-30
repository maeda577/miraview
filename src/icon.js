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

window.document.getElementById('menu-link-program')?.appendChild(toSVG({...TableSplit20, attrs: { ...TableSplit20.attrs, slot: 'title-icon' }}))
window.document.getElementById('menu-link-live')?.appendChild(toSVG({...VideoPlayer20, attrs: { ...VideoPlayer20.attrs, slot: 'title-icon' }}))
window.document.getElementById('menu-link-search')?.appendChild(toSVG({...Search20, attrs: { ...Search20.attrs, slot: 'title-icon' }}))
window.document.getElementById('menu-link-timeshift')?.appendChild(toSVG({...RecentlyViewed20, attrs: { ...RecentlyViewed20.attrs, slot: 'title-icon' }}))
window.document.getElementById('menu-link-schedule')?.appendChild(toSVG({...EventSchedule20, attrs: { ...EventSchedule20.attrs, slot: 'title-icon' }}))
window.document.getElementById('menu-link-recorded')?.appendChild(toSVG({...Video20, attrs: { ...Video20.attrs, slot: 'title-icon' }}))
window.document.getElementById('menu-link-tuner')?.appendChild(toSVG({...Radio20, attrs: { ...Radio20.attrs, slot: 'title-icon' }}))
window.document.getElementById('menu-link-setting')?.appendChild(toSVG({...Settings20, attrs: { ...Settings20.attrs, slot: 'title-icon' }}))
