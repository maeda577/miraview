import React from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import './ProgramViewTable.css';
import type { Program, Service, ProgramPair } from './types';

// 1日あたりの番組表のテーブル
// servicesはその日の放送がなくても入っている
// programsは実際にある放送だけが入っている前提 第1キーはnetwork_idで第2キーはservice_id
function ProgramViewTable(props: { services?: Service[]; programs?: Map<number, Map<number, Program[]>>; onLinkClick: (program: ProgramPair) => void; }): JSX.Element {
  // 現在時刻の横棒のref
  const nowLineRef = React.useRef<HTMLDivElement>(null);
  // 現在時刻の横棒の高さ計算に使う時刻
  const [now, setNow] = React.useState(Date.now());

  React.useEffect(() => {
    // 1回だけ横棒までスクロールする
    nowLineRef?.current?.scrollIntoView({ block: 'center', behavior: 'auto' });
    // 現在時刻の横線を毎分更新する
    const intervalId = setInterval(() => setNow(Date.now()), 1000 * 60);
    // useEffectは関数を返すとアンマウント時に実行してくれる（デストラクタみたいな感じ）
    return () => clearInterval(intervalId);
  }, [props.services]);   // servicesはconfigの変更がない限り置き替わらないはず

  const currentTheme = useTheme();

  // 引数の判定 Reactのhooksより下に書かないと警告が出るので変な場所にある
  if (!props.services || !props.programs || props.services!.length === 0 || props.programs!.size === 0){
    return <Typography>番組情報が見つかりません。チューナー設定を見直してください。ブラウザのコンソールログも確認してください。</Typography>;
  }

  const hours = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4]; // 左側の時刻一覧
  const programTimeFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }); // 番組の時刻のフォーマット
  const channelHeight = 30;     // 放送局のヘッダの高さ
  const channelWidth = '10rem'; // 放送局のヘッダの幅
  const hourWidth = '2rem';     // 左端の時刻表示の幅
  const heightPerHour = 240;    // 1時間あたりの高さ
  const nowLineBorder = 2;      // 現在時刻の線の太さ

  // CSSに受け渡す変数
  const cssVars: React.CSSProperties = {
    '--channel-height': `${channelHeight}px`,
    '--channel-width': channelWidth,
    '--hour-width': hourWidth,
    '--height-per-hour': `${heightPerHour}px`,
    '--now-line-border': `${nowLineBorder}px`,
    '--border-color': currentTheme.palette.divider,
    '--header-color': currentTheme.palette.program.light,
  } as React.CSSProperties;

  // 現在時刻の横線の高さ
  const today5 = new Date(now - (5 * 60 * 60 * 1000)).setHours(5, 0, 0, 0);
  const nowLineHeight = (now - today5) / 1000 / 60 / 60 * heightPerHour;
  // その日に放送のあるチャンネル
  const filteredServices = props.services!.filter(srv => props.programs?.get(srv.networkId)?.get(srv.serviceId));

  return (
    <TableContainer style={ cssVars }>
      <Box className='now_line' ref={nowLineRef} sx={{
        top: channelHeight - nowLineBorder + nowLineHeight,
        width: `calc(${hourWidth} + ${channelWidth} * ${filteredServices.length})`
      }} />
      <Table stickyHeader padding='none'>
        <TableHead>
          <TableRow>
            <TableCell className='_left_sticky hour_header _bordered'/>
            { filteredServices.map(srv => (
              <TableCell key={srv.id} className='channel_header _bordered'>
                {srv.name}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow className='program_row'>
            <TableCell className='_left_sticky'>
              <Stack>
                {hours.map(hr => <Box className='hour _bordered' key={hr}>{hr}</Box>)}
              </Stack>
            </TableCell>
            { filteredServices.map(srv => (
              <TableCell key={`Ch-Prg-${srv.id}`}>
                <Stack>
                  { props.programs?.get(srv.networkId)?.get(srv.serviceId)?.map((prg) => (
                    <Box key={`Prg-${prg.networkId}-${prg.serviceId}-${prg.startAt}`}
                      className='program _bordered'
                      sx={{
                        height: prg.duration / 1000 / 60 / 60 * heightPerHour,
                        backgroundColor: prg.name ? 'program.main' : 'background.default'
                      }}>
                      {
                        prg.name &&
                        <Link component='button' color='inherit' underline='hover'
                          align='left' fontSize='0.85rem' lineHeight='1.5'
                          onClick={() => props.onLinkClick({ program: prg, service: srv })}>
                          { programTimeFormat.format(prg.startAt) + ' ' + prg.name }
                        </Link>
                      }
                    </Box>
                  ))}
                </Stack>
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ProgramViewTable;
