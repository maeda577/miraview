import createClient from 'openapi-fetch';
import type { paths, components } from './api/mirakc';
import { groupPrograms } from './common.js'

// 必要なAPIを叩く
const client = createClient<paths>({ baseUrl: "../api/" });
const response = await Promise.all([
  client.GET("/programs"),
  client.GET("/services"),
]);
// エラーがあれば出す
response.forEach(res => {
  if(res.error !== undefined){
    console.error(res.error)
    return
  }
});
const [programs, services] = response;

// 番組一覧を整える
const groupedPrograms = groupPrograms(programs.data);

// 日付一覧を作る
const tabDateFormat = new Intl.DateTimeFormat(undefined, { month: '2-digit', day: '2-digit', weekday: 'narrow' });
const dayDropdown = document.getElementById('day-dropdown');
[...groupedPrograms.keys()].sort().forEach(day => {
  const item = document.createElement('ix-select-item');
  item.setAttribute('value', day.toString());
  item.setAttribute('label', tabDateFormat.format(day));
  dayDropdown?.appendChild(item);
});

// 全部のサービスを見てChannelTypeを集める
const chTypes = services.data?.reduce<Set<components['schemas']['ChannelType']>>((set, svc) => {
  return set.add(svc.channel.type);
}, new Set<components['schemas']['ChannelType']>());

// 今日のタブを選ぶ 午前5時までは深夜と見なして前日扱いにする
dayDropdown?.setAttribute('value', new Date(Date.now() - (5 * 60 * 60 * 1000)).setHours(0, 0, 0, 0).toString());
