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
  groupedPrograms.forEach((prgPerDay, day) => prgPerDay.forEach((prgPerNw, nwId) => prgPerNw.forEach((prgs, svcId) => {
    // 番組を放送順に並べ替える
    prgs.sort((a, b) => a.startAt - b.startAt);
    // 午前5時ちょうどに始まる番組がない場合はダミーの放送情報を入れる
    const dayStart = (new Date(day)).setHours(5, 0, 0, 0);
    const timespan = prgs[0]!.startAt - dayStart;
    if (timespan > 0) {
      const dummy: components['schemas']['MirakurunProgram'] = {
        networkId: nwId,
        serviceId: svcId,
        startAt: dayStart,
        duration: timespan,
        id: -1,
        eventId: -1,
        isFree: true,
      };
      prgs.unshift(dummy);
    }

    prgs.forEach((prg, idx, arr) => {
      const nextPrg = arr.at(idx + 1);
      if (!nextPrg) return;
      // 放送時間が次の番組開始を越えるほどに長くなっている場合は短くする（野球など？）
      if (prg.startAt + prg.duration > nextPrg.startAt) {
        prg.duration = nextPrg.startAt - prg.startAt;
      }
      // 番組間に空き時間があった場合はダミーの放送情報を入れる
      if (prg.startAt + prg.duration !== nextPrg.startAt) {
        const dummy: components['schemas']['MirakurunProgram'] = {
          networkId: nwId,
          serviceId: svcId,
          startAt: prg.startAt + prg.duration,
          duration: nextPrg.startAt - (prg.startAt + prg.duration),
          id: -1,
          eventId: -1,
          isFree: true,
        };
        arr.splice(idx + 1, 0, dummy);
      }
    });
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

/** createElementをinsertAdjacentHTML風に使えるようにするラッパー 要素が複数あっても最初の1個だけを返す */
export function createHTML(htmlString: string) {
  const element = document.createElement('template');
  element.innerHTML = htmlString;
  return element.content.children[0];
}
