/*
 * SPDX-FileCopyrightText: 2022 maeda577
 *
 * SPDX-License-Identifier: MIT
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import type { components } from "./api/mirakc.js";

// AudioのcomponentType これもARIB STD-B10の[Table 6-5 stream_content and component_type]に書いてある
// http://www.arib.or.jp/english/html/overview/doc/6-STD-B10v4_6-E2.pdf#page=114
export const audio_component_types = new Map<number, string>([
  [0x01, 'single mono'],
  [0x02, 'dual mono'],
  [0x03, 'stereo'],
  [0x04, '2/1 mode'],
  [0x05, '3/0 mode'],
  [0x06, '2/2 mode'],
  [0x07, '3/1 mode'],
  [0x08, '3/2 mode'],
  [0x09, '3/2+LFE mode'],
  [0x40, 'Audio description for the visually impaired'],
  [0x41, 'Audio for the hard of hearing'],
]);

// lv1の番号の対応表 Large genre classification
// http://www.arib.or.jp/english/html/overview/doc/6-STD-B10v4_6-E2.pdf#page=197
export const genre_large = new Map<number, string>([
  [0x0, 'News, report'],
  [0x1, 'Sports'],
  [0x2, 'Information/tabloid show'],
  [0x3, 'Drama'],
  [0x4, 'Music'],
  [0x5, 'Variety show'],
  [0x6, 'Movies'],
  [0x7, 'Animation/special effect movies'],
  [0x8, 'Documentary/culture'],
  [0x9, 'Theatre/public performance'],
  [0xA, 'Hobby/education'],
  [0xB, 'Welfare'],
  [0xE, 'For extension'],   // これの場合はuser_nibbleを見ないといけないはず
  [0xF, 'Others'],
]);

// lv2の番号の対応表 Middle genre classification
export const genre_middle = new Map<number, Map<number, string>>([
  // News/reports
  [0x0, new Map<number, string>([
    [0x0, 'Regular, general'],
    [0x1, 'Weather report'],
    [0x2, 'Special program, documentary'],
    [0x3, 'Politics, national assembly'],
    [0x4, 'Economics, market report'],
    [0x5, 'Overseas, international report'],
    [0x6, 'News analysis'],
    [0x7, 'Discussion, conference'],
    [0x8, 'Special report'],
    [0x9, 'Local program'],
    [0xA, 'Traffic report'],
    [0xF, 'Others'],
  ])],
  // Sports
  [0x1, new Map<number, string>([
    [0x0, 'Sports news'],
    [0x1, 'Baseball'],
    [0x2, 'Soccer'],
    [0x3, 'Golf'],
    [0x4, 'Other ball games'],
    [0x5, 'Sumo, combative sports'],
    [0x6, 'Olympic, international games'],
    [0x7, 'Marathon, athletic sports, swimming'],
    [0x8, 'Motor sports'],
    [0x9, 'Marine sports, winter sports'],
    [0xA, 'Horse race, public race'],
    [0xF, 'Others'],
  ])],
  // Information/tabloid show
  [0x2, new Map<number, string>([
    [0x0, 'Gossip/tabloid show'],
    [0x1, 'Fashion'],
    [0x2, 'Living, home'],
    [0x3, 'Health, medical treatment'],
    [0x4, 'Shopping, mail-order business'],
    [0x5, 'Gourmet, cocking'],
    [0x6, 'Events'],
    [0x7, 'Program guide, information'],
    [0xF, 'Others'],
  ])],
  // Dramas
  [0x3, new Map<number, string>([
    [0x0, 'Japanese dramas'],
    [0x1, 'Overseas dramas'],
    [0x2, 'Period dramas'],
    [0xF, 'Others'],
  ])],
  // Music
  [0x4, new Map<number, string>([
    [0x0, 'Japanese rock, pop music'],
    [0x1, 'Overseas rock, pop music'],
    [0x2, 'Classic, opera'],
    [0x3, 'Jazz, fusion'],
    [0x4, 'Popular songs, Japanese popular songs (enka songs)'],
    [0x5, 'Live concert'],
    [0x6, 'Ranking, request music'],
    [0x7, 'Karaoke, amateur singing contests'],
    [0x8, 'Japanese ballad, Japanese traditional music'],
    [0x9, "Children's song"],
    [0xA, 'Folk music, world music'],
    [0xF, 'Others'],
  ])],
  // Variety
  [0x5, new Map<number, string>([
    [0x0, 'Quiz'],
    [0x1, 'Game'],
    [0x2, 'Talk variety'],
    [0x3, 'Comedy program'],
    [0x4, 'Music variety'],
    [0x5, 'Tour variety'],
    [0x6, 'Cocking variety'],
    [0xF, 'Others'],
  ])],
  // Movies
  [0x6, new Map<number, string>([
    [0x0, 'Overseas movies'],
    [0x1, 'Japanese movies'],
    [0x2, 'Animation'],
    [0xF, 'Others'],
  ])],
  // Animation, special effects
  [0x7, new Map<number, string>([
    [0x0, 'Japanese animation'],
    [0x1, 'Overseas animation'],
    [0x2, 'Special effects'],
    [0xF, 'Others'],
  ])],
  // Documentary/culture
  [0x8, new Map<number, string>([
    [0x0, 'Social, current events'],
    [0x1, 'History, travel record'],
    [0x2, 'Nature, animal, environment'],
    [0x3, 'Space, science, medical science'],
    [0x4, 'Culture, traditional culture'],
    [0x5, 'Literature, literary art'],
    [0x6, 'Sports'],
    [0x7, 'Total documentary'],
    [0x8, 'Interviews, discussions'],
    [0xF, 'Others'],
  ])],
  // Theatre, public performance
  [0x9, new Map<number, string>([
    [0x0, 'Modern drama, Western-style drama'],
    [0x1, 'Musical'],
    [0x2, 'Dance, ballet'],
    [0x3, 'Comic story, entertainment'],
    [0x4, 'Kabuki, classical drama'],
    [0xF, 'Others'],
  ])],
  // Hobby/education
  [0xA, new Map<number, string>([
    [0x0, 'Trip, fishing, outdoor entertainment'],
    [0x1, 'Gardening, pet, handicrafts'],
    [0x2, 'Music, art, industrial art'],
    [0x3, 'Japanese chess (shogi) and "go"'],
    [0x4, 'Mah-jong, pinball games'],
    [0x5, 'Cars, motorbikes'],
    [0x6, 'Computer, TV games'],
    [0x7, 'Conversation, languages'],
    [0x8, 'Little children, schoolchildren'],
    [0x9, 'Junior high school and high school students'],
    [0xA, 'University students, examinations'],
    [0xB, 'Lifelong education, qualifications'],
    [0xC, 'Educational problem'],
    [0xF, 'Others'],
  ])],
  // Welfare
  [0xB, new Map<number, string>([
    [0x0, 'Old aged persons'],
    [0x1, 'Handicapped persons'],
    [0x2, 'Social welfare'],
    [0x3, 'Volunteers'],
    [0x4, 'Sign language'],
    [0x5, 'Text (subtitles)'],
    [0x6, 'Explanation on sound multiplex broadcast'],
    [0xF, 'Others'],
  ])],
  // Extension これの場合はuser_nibbleを見ないといけないはず
  [0xE, new Map<number, string>([
    [0x0, 'Appendix information for BS/terrestrial digital broadcast program'],
    [0x1, 'Extension for broadband CS digital broadcasting'],
    [0x2, 'Extension for digital satellite sound broadcasting'],
    [0x3, 'Appendix information for server-type program'],
    [0x4, 'Appendix information for IP broadcast program'],
  ])],
  // Others
  [0xF, new Map<number, string>([
    [0xF, 'Others'],
  ])],
]);

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
