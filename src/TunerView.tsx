import React from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import CircleIcon from '@mui/icons-material/Circle';

import type { MiraviewConfig, Tuner, Version } from './types';

function getStatusColor(tuner: Tuner) {
  if (tuner.isFault) {        // 何故か認識していない
    return 'gray.600';
  } else if (tuner.isFree){   // 使っていない
    return 'success.main';
  } else if (tuner.isUsing && tuner.users?.at(0)?.priority !== undefined && tuner.users!.at(0)!.priority! <= 0){   // 使っているが奪っても良さそう(番組表の取得など)
    return 'warning.main';
  } else if (tuner.isUsing){  // 使っている
    return 'error.main';
  }
  return 'gray.800';          // その他
}

function TunerView(props: { config: MiraviewConfig, tuners?: Tuner[], version?: Version }): JSX.Element {
  // 引数の判定
  if (!props.tuners || props.tuners!.length === 0){
    return <Typography>チューナーが見つかりません。チューナー設定を見直してください。ブラウザのコンソールログも確認してください。</Typography>;
  }

  return (
    <Stack sx={{ margin: '1rem' }} spacing={2}>
      { props.tuners?.map(tuner =>
      <Card key={tuner.name}>
        <CardHeader
          avatar={ <CircleIcon sx={{ color: getStatusColor(tuner) }} /> }
          title={ tuner.name } subheader={ tuner.types.join(' : ') }
          titleTypographyProps={{ variant: 'h6' }}
        />
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1}>
              <Chip color="primary" disabled={ !tuner.isAvailable } label="Available" />
              <Chip color="primary" disabled={ !tuner.isFree } label="Free" />
              <Chip color="primary" disabled={ !tuner.isUsing } label="Using" />
              <Chip color="primary" disabled={ !tuner.isRemote } label="Remote" />
              <Chip color="primary" disabled={ !tuner.isFault } label="Fault" />
            </Stack>
            <Box sx={{ display: tuner.command ? 'block' : 'none' }}>
              <table>
                <tbody>
                  <tr><td>Command</td><td>:</td><td>{ tuner.command }</td></tr>
                  {tuner.users?.map(user =>
                  <React.Fragment key={user.id}>
                    <tr><td>Client ID</td><td>:</td><td>{ user.id }</td></tr>
                    <tr><td>Priority</td><td>:</td><td>{ user.priority }</td></tr>
                    <tr><td>Agent</td><td>:</td><td>{ user.agent }</td></tr>
                  </React.Fragment>
                  )}
                </tbody>
              </table>
            </Box>
          </Stack>
        </CardContent>
      </Card>
      )}
      <Card sx={{ display: props.version ? 'block' : 'none' }}>
        <CardContent>
          <Typography align='center'>{ 'mirakc/Mirakurun version: ' + props.version?.current }</Typography>
          { props.version?.current !== props.version?.latest &&
            <Typography align='center' color='warning.main'>New version available: {props.version?.latest}</Typography>
          }
        </CardContent>
      </Card>
    </Stack>
  );
}

export default TunerView;
