import './utils/igniteui';
import { loadConfigFromStorage } from './utils/localconfig';
import { groupPrograms } from './utils/pgtable';
import createClient from 'openapi-fetch';
import type { components, paths } from './utils/mirakc.d.ts';
import {
  IgcSelectItemComponent,
} from 'igniteui-webcomponents';

// 番組情報 第1キーは日付の0時ちょうどのunixtime、第2キーはnetwork_idで第3キーはservice_id
let programs: Map<number, Map<number, Map<number, components['schemas']['MirakurunProgram'][]>>>;
let services: any;
// APIを叩く
try {
  const client = createClient<paths>({ baseUrl: loadConfigFromStorage().getApiEndpoint() });
  const response = await Promise.all([
    client.GET("/programs"),
    client.GET("/services"),
  ]);
  programs = groupPrograms(response[0].data!);
  services = response[1].data!;
} catch (error) {
  // content?.replaceChildren();
  // content?.insertAdjacentHTML('afterbegin', `
  //   <ix-empty-state class="flex-center"
  //     icon="alarm"
  //     header="mirakc APIへのアクセスに失敗しました"
  //     sub-header="APIエンドポイントの指定を確認してください。また、CORSが無効化されているか確認してください">
  //   </ix-empty-state>`
  // );
}

// 日付ドロップダウンを作る
const datetimeFormat = new Intl.DateTimeFormat(undefined, { month: 'numeric', day: 'numeric', weekday: 'narrow' });
// 今日の0時の値 午前5時までは深夜と見なして前日扱いにする
const today = new Date(Date.now() - (5 * 60 * 60 * 1000)).setHours(0, 0, 0, 0);
const dayselect = document.getElementById("dayselect") as IgcSelectItemComponent;
[...programs!.keys()]
  .filter(date => date >= today)
  .sort()
  .forEach((dayUnixTime) => dayselect.insertAdjacentHTML('beforeend', `
<igc-select-item value="${dayUnixTime}">${datetimeFormat.format(dayUnixTime)}</igc-select-item>
`));
// ドロップダウンで今日を選ぶ
dayselect.value = today.toString();
