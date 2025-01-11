import React from 'react';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';

import type { MiraviewConfig, ProgramPair } from './types';

// AudioのcomponentType これもARIB STD-B10の[Table 6-5 stream_content and component_type]に書いてある
// http://www.arib.or.jp/english/html/overview/doc/6-STD-B10v4_6-E2.pdf#page=114
const audio_component_types = new Map<number, string>([
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
const genre_large = new Map<number, string>([
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
const genre_middle = new Map<number, Map<number, string>>([
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

// 番組をクリックした時のダイアログ
function ProgramViewDialog(props: { pgPair?: ProgramPair; config: MiraviewConfig; onClose: () => void; }): JSX.Element {
  const streamUrl = new URL(`/api/services/${props.pgPair?.service?.id}/stream`, props.config.mirakcUri);
  streamUrl.protocol = props.config.streamProtocol;

  return (
    <Dialog onClose={ props.onClose } open={ !!props.pgPair }>
      <DialogTitle>
        { props.pgPair?.program.name }
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          { props.pgPair?.program.isFree === false && <DialogContentText>[有料放送]</DialogContentText> }
          <DialogContentText>
            {
              // 日付
              props.pgPair &&
              (new Date(props.pgPair!.program.startAt)).toLocaleString() +
              ' - ' +
              (new Date(props.pgPair!.program.startAt + props.pgPair!.program.duration)).toLocaleTimeString()
            }
          </DialogContentText>
          <DialogContentText>{ props.pgPair?.program.description }</DialogContentText>
          {
            // extendedはプロパティ名が不定
            props.pgPair?.program.extended &&
            Object.entries(props.pgPair!.program.extended).map(k =>
              <DialogContentText key={k[0]}>{k.join(': ')}</DialogContentText>
            )
          }
        </Stack>
      </DialogContent>
      <DialogContent>
        <table>
          <tbody>
            <tr>
              <td><DialogContentText>Video</DialogContentText></td>
              <td><DialogContentText>:</DialogContentText></td>
              <td><DialogContentText>{ props.pgPair?.program.video?.type + ' ' + props.pgPair?.program.video?.resolution }</DialogContentText></td>
            </tr>
            { // 音声一覧
              props.pgPair?.program.audios?.map((audio, i) =>
              <tr key={'audio-' + i}>
                {
                  i === 0 &&
                  <React.Fragment>
                    <td rowSpan={props.pgPair!.program.audios!.length}><DialogContentText>Audio</DialogContentText></td>
                    <td rowSpan={props.pgPair!.program.audios!.length}><DialogContentText>:</DialogContentText></td>
                  </React.Fragment>
                }
                <td>
                  <DialogContentText>
                    {
                      (props.pgPair!.program.audios!.length !== 1 ? `[${i}] ` : '') +
                      (audio_component_types.get(audio.componentType) || '') + ' ' +
                      (audio.samplingRate / 1000) + 'kHz ' +
                      audio.langs.join(',')
                    }
                  </DialogContentText>
                </td>
              </tr>
            )}
            { // ジャンル一覧
              props.pgPair?.program.genres?.map((genre, i) =>
              <tr key={'program-' + i}>
                {
                  i === 0 &&
                  <React.Fragment>
                    <td rowSpan={props.pgPair!.program.genres!.length}><DialogContentText>Genre</DialogContentText></td>
                    <td rowSpan={props.pgPair!.program.genres!.length}><DialogContentText>:</DialogContentText></td>
                  </React.Fragment>
                }
                <td>
                  <DialogContentText>
                    {
                      (props.pgPair!.program.genres!.length !== 1 ? `[${i}] ` : '') +
                      (genre_large.get(genre.lv1) || '') + ' - ' +
                      (genre_middle.get(genre.lv1)?.get(genre.lv2) || '')
                    }
                  </DialogContentText>
                </td>
              </tr>
            )}
            <tr>
              <td><DialogContentText>ProgramID</DialogContentText></td>
              <td><DialogContentText>:</DialogContentText></td>
              <td><DialogContentText>{props.pgPair?.program.id}</DialogContentText></td>
            </tr>
            <tr>
              <td><DialogContentText>ServiceID</DialogContentText></td>
              <td><DialogContentText>:</DialogContentText></td>
              <td><DialogContentText>{props.pgPair?.program.serviceId}</DialogContentText></td>
            </tr>
          </tbody>
        </table>
      </DialogContent>
      <DialogActions>
        <Button disabled={ !props.pgPair || !props.config.streamProtocol } autoFocus href={ streamUrl.href }>選局</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ProgramViewDialog;
