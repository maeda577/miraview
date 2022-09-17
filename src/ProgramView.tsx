import React from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';

import ProgramViewTable from './ProgramViewTable';
import type { MiraviewConfig, Program, Service } from './types';

// 番組情報を便利にまとめる 第1キーは日付の0時ちょうどのunixtime、第2キーはnetwork_idで第3キーはservice_id
// service_id単一では重複する可能性があり、ネットワーク内では一意。ARIB TR-B15のTable 5-9に書いてある
// http://www.arib.or.jp/english/html/overview/doc/8-TR-B15v4_6-2p4-E1.pdf#page=39
function groupPrograms(programs?: Program[]): Map<number, Map<number, Map<number, Program[]>>> {
  if (!programs){
    return new Map<number, Map<number, Map<number, Program[]>>>();
  }

  // この時刻より前は無視するという閾値 午前5時までは前日扱い
  const today5 = new Date(Date.now() - (5 * 60 * 60 * 1000)).setHours(5, 0, 0, 0);

  // 番組情報をグループ化
  const groupedPrograms = programs!.reduce<Map<number, Map<number, Map<number, Program[]>>>>((map, program) => {
    // 当日5時以前の番組は無視して、番組名や諸々のIDが入っていない番組も無視する
    if (program.startAt < today5 || !program.name || !program.networkId || !program.serviceId){
      return map;
    }
    // 番組の放送日 午前5時00分までは前日と判定するため5時間引いておく
    const date = new Date(program.startAt - (5 * 60 * 60 * 1000)).setHours(0, 0, 0, 0);
    // 第一キーがあるか確認してからMap確定させる
    if (!map.has(date)) {
      map.set(date, new Map<number, Map<number, Program[]>>());
    }
    const mapPerDay = map.get(date)!;

    // 第二キーがあるか確認してからMap確定させる
    if (!mapPerDay.has(program.networkId!)) {
      mapPerDay.set(program.networkId!, new Map<number, Program[]>());
    }
    const mapPerNetwork = mapPerDay.get(program.networkId!)!;

    // 第三キーがあるか確認してから番組情報を加える
    if (!mapPerNetwork.has(program.serviceId!)) {
      mapPerNetwork.set(program.serviceId!, []);
    }
    mapPerNetwork.get(program.serviceId!)!.push(program);

    return map;
  }, new Map<number, Map<number, Map<number, Program[]>>>());

  // グループ化した番組の後処理
  groupedPrograms.forEach((prgPerDay, day) => prgPerDay.forEach(prgPerNw => prgPerNw.forEach(prgs => {
    // 番組を放送順に並べ替える
    prgs.sort((a, b) => a.startAt - b.startAt);
    // 午前5時ちょうどに始まる番組がない場合はダミーの放送情報を入れる
    const dayStart = (new Date(day)).setHours(5, 0, 0, 0);
    const timespan = prgs[0].startAt - dayStart;
    if (timespan > 0) {
      const dummy: Program = {
        startAt: dayStart,
        duration: timespan,
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
        const dummy: Program = {
          startAt: prg.startAt + prg.duration,
          duration: nextPrg.startAt - (prg.startAt + prg.duration),
        };
        arr.splice(idx + 1, 0, dummy);
      }
    });
  })));

  return groupedPrograms;
}

// 番組一覧
function ProgramView(props: { config: MiraviewConfig, programs?: Program[], services?: Service[] }): JSX.Element {
  // タブで選ばれている日付の0時ちょうどのunixtime
  const [currentDate, setCurrentDate] = React.useState<number>(new Date(Date.now() - (5 * 60 * 60 * 1000)).setHours(0, 0, 0, 0));

  // 番組情報一覧 第一キーは日付の0時ちょうどのunixtime、第二キーはnetwork_idで第三キーはservice_id
  const programs = React.useMemo(() => groupPrograms(props.programs), [props.programs]);

  const tabDateFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', weekday: 'narrow' });

  // ここから画面表示系 上位画面でタブ切り替えた際に以下エラーが出るが諦めた
  // MUI: The `value` provided to the Tabs component is invalid. The Tab with this `value` ("0") is not part of the document layout. Make sure the tab item is present in the document or that it's not `display: none`.
  return (
    <Stack sx={{ height: '100%'}}>
      <Tabs
        value={ currentDate }
        onChange={ (event: React.SyntheticEvent, newValue: number) => setCurrentDate(newValue) }
        sx={{ backgroundColor: 'program.light' }}
      >
        { Array.from(programs.keys()).sort().map(d => <Tab key={d} label={ tabDateFormat.format(d) } value={d} />) }
      </Tabs>
      <Box sx={{ overflow: 'auto' }}>
        <ProgramViewTable
          config={ props.config }
          services={ props.services }
          programs={ programs.get(currentDate) }
        />
      </Box>
    </Stack>
  );
}

export default ProgramView;
