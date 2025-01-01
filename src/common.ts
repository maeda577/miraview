import type { components } from "./api/mirakc";

// 番組情報を便利にまとめる 第1キーは日付の0時ちょうどのunixtime、第2キーはnetwork_idで第3キーはservice_id
// service_id単一では重複する可能性があり、ネットワーク内では一意。ARIB TR-B15のTable 5-9に書いてある
// http://www.arib.or.jp/english/html/overview/doc/8-TR-B15v4_6-2p4-E1.pdf#page=39
export function groupPrograms(programs?: components['schemas']['MirakurunProgram'][]): Map<number, Map<number, Map<number, components['schemas']['MirakurunProgram'][]>>> {
  if (!programs){
    return new Map<number, Map<number, Map<number, components['schemas']['MirakurunProgram'][]>>>();
  }

  // 番組情報をグループ化
  const groupedPrograms = programs!.reduce<Map<number, Map<number, Map<number, components['schemas']['MirakurunProgram'][]>>>>((map, program) => {
    // 番組名や諸々のIDが入っていない番組を無視する
    if (!program.name || !program.networkId || !program.serviceId){
      return map;
    }
    // 番組の放送日 午前5時00分までは前日と判定するため5時間引いておく
    const date = new Date(program.startAt - (5 * 60 * 60 * 1000)).setHours(0, 0, 0, 0);
    // 第一キーがなければMapを新規作成
    if (!map.has(date)) {
      map.set(date, new Map<number, Map<number, components['schemas']['MirakurunProgram'][]>>());
    }
    const mapPerDay = map.get(date)!;

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

    return map;
  }, new Map<number, Map<number, Map<number, components['schemas']['MirakurunProgram'][]>>>());

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
      if (prg.startAt + prg.duration > nextPrg.startAt){
        prg.duration = nextPrg.startAt - prg.startAt;
      }
      // 番組間に空き時間があった場合はダミーの放送情報を入れる
      if (prg.startAt + prg.duration !== nextPrg.startAt){
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
