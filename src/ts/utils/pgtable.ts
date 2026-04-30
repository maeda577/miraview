import { loadConfigFromStorage } from './localconfig';
import { audio_component_types, genre_large, genre_middle } from './const';
import type { components, paths } from './mirakc.d.ts';

// 番組の時刻のフォーマット
const programTimeFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
const programDatetimeFormat = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'narrow', hour: '2-digit', minute: '2-digit' });

// service_id単一では重複する可能性があり、ネットワーク内では一意。ARIB TR-B15のTable 5-9に書いてある
// http://www.arib.or.jp/english/html/overview/doc/8-TR-B15v4_6-2p4-E1.pdf#page=39
/** 番組情報を便利にまとめる 第1キーは日付の0時ちょうどのunixtime、第2キーはnetwork_idで第3キーはservice_id */
export function groupPrograms(programs: components['schemas']['MirakurunProgram'][]): Map<number, Map<number, Map<number, components['schemas']['MirakurunProgram'][]>>> {
  // 番組情報をグループ化
  const groupedPrograms = new Map<number, Map<number, Map<number, components['schemas']['MirakurunProgram'][]>>>();
  programs.forEach(program => {
    // 番組名や諸々のIDが入っていない番組を無視する
    if (!program.name || !program.networkId || !program.serviceId) {
      return;
    }
    // 番組の放送日 午前5時00分までは前日と判定するため5時間引いておく
    const date = new Date(program.startAt - (5 * 60 * 60 * 1000)).setHours(0, 0, 0, 0);
    // 第一キーがなければMapを新規作成
    if (!groupedPrograms.has(date)) {
      groupedPrograms.set(date, new Map<number, Map<number, components['schemas']['MirakurunProgram'][]>>());
    }
    const mapPerDay = groupedPrograms.get(date)!;

    // 第二キーがなければMapを新規作成
    if (!mapPerDay.has(program.networkId!)) {
      mapPerDay.set(program.networkId!, new Map<number, components['schemas']['MirakurunProgram'][]>());
    }
    const mapPerNetwork = mapPerDay.get(program.networkId!)!;

    // 第三キーがあるか確認してから番組情報を加える
    if (!mapPerNetwork.has(program.serviceId!)) {
      mapPerNetwork.set(program.serviceId!, []);
    }
    mapPerNetwork.get(program.serviceId!)!.push(program);
  });

  // グループ化した番組の後処理
  groupedPrograms.forEach((prgPerDay, date) => prgPerDay.forEach(prgPerNw => prgPerNw.forEach(prgs => {
    // 番組を放送順に並べ替える 並べ替えないと番組のz-indexの指定が必要になって面倒
    prgs.sort((a, b) => a.startAt - b.startAt);

    // 翌日0時と5時のunixtime
    const tommorrow0h = date + (1000 * 60 * 60 * 24);
    const tommorrow5h = date + (1000 * 60 * 60 * 29);
    // 最後の番組がAM5時をまたいでいる場合は翌日の番組リストにも加える
    const lastPrg = prgs.at(-1);
    if (lastPrg && (lastPrg.startAt + lastPrg.duration) > tommorrow5h) {
      groupedPrograms.get(tommorrow0h)?.get(lastPrg.networkId)?.get(lastPrg.serviceId)?.unshift(lastPrg);
    }
  })));

  return groupedPrograms;
}

/** サービス情報を便利にまとめる キーはチャンネルタイプ(GR/BS/CS/SKY) */
export function groupServices(services: components['schemas']['MirakurunService'][]): Map<components["schemas"]["ChannelType"], components['schemas']['MirakurunService'][]> {
  const groupedServices = new Map<components["schemas"]["ChannelType"], components['schemas']['MirakurunService'][]>();
  services.forEach(service => {
    if (!groupedServices.has(service.channel.type)) {
      groupedServices.set(service.channel.type, []);
    }
    groupedServices.get(service.channel.type)!.push(service);
  });

  // グループ化した番組の後処理
  groupedServices.forEach((servicesPerType, serviceType) => {
    // 地上波ならリモコンIDで並び替え、それ以外は単純にIDで並び替える
    if (serviceType === 'GR') {
      servicesPerType.sort((a, b) => a.remoteControlKeyId && b.remoteControlKeyId && a.remoteControlKeyId !== b.remoteControlKeyId ?
        a.remoteControlKeyId - b.remoteControlKeyId :
        a.id - b.id);
    }
    else {
      servicesPerType.sort((a, b) => a.id - b.id);
    }
  });

  return groupedServices;
};
