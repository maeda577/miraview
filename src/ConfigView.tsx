import React from 'react';

import Alert, { AlertColor } from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Paper from '@mui/material/Paper';
import Popover from '@mui/material/Popover';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

import type { MiraviewConfig } from './types';

const protocolPattern = '^[a-zA-Z0-9.+_-]*$';
const urlPattern = '^https?://.*$';

// local storageに書き込む時のキー リバースプロキシ経由で起動される可能性もあるので名前は長めにする
const StorageKeys = {
  config: {
    streamProtocol: 'miraview.config.streamProtocol',
    mirakcUri: 'miraview.config.mirakcUri',
  },
} as const;

// デフォルト値のconfig
function getDefaultConfig(): MiraviewConfig{
  return {
    mirakcUri: new URL(window.location.origin),
    streamProtocol: 'vlc',
  };
}

// configをlocal storageから読み取る local storageの利用はいろいろリスクがあるらしいが、さほど重要な情報でもないので使う
export function loadConfigFromLocalStorage(): MiraviewConfig {
  const config = getDefaultConfig();
  try {
    // URLの読み取り。有効な値がなければデフォルト値のままになる
    const mirakcUrlString = localStorage.getItem(StorageKeys.config.mirakcUri);
    if (mirakcUrlString?.match(urlPattern)) {
      config.mirakcUri = new URL(mirakcUrlString);
    }

    // 選局ボタンのプロトコルの読み取り。空文字なら空文字のまま、値があれば正規表現にマッチするか判定、マッチしなければデフォルト値
    const streamProtocol = localStorage.getItem(StorageKeys.config.streamProtocol);
    if (streamProtocol === ''){
      config.streamProtocol = '';
    }
    else if (streamProtocol?.match(protocolPattern)){
      config.streamProtocol = streamProtocol;
    }

    return config;
  }
  catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error.message);
    }
    // 何かエラーがあったらconfig読み込みは諦める
    return getDefaultConfig();
  }
}

function ConfigView(props: { onSave?: (savedConfig: MiraviewConfig) => void; }): JSX.Element {
  // 保存時に下に出るメッセージ
  const [snackbarMessage, setSnackbarMessage] = React.useState<{message: string, severity: AlertColor} | undefined>(undefined)
  // infoボタンを押した時に出るメッセージ
  const [popoverMessage, setPopoverMessage] = React.useState<{messages: string[], anchorEl: HTMLButtonElement} | undefined>(undefined)
  // 入力欄が書き変わった時に再レンダリングするためだけの無駄なState (正しいやり方なのかは分からない)
  const [isUpdateKey, setUpdateKey] = React.useState<boolean>(false);

  // テキスト入力欄のref
  const inputProtocolRef = React.useRef<HTMLInputElement>(null);
  const inputUrlRef = React.useRef<HTMLInputElement>(null);

  // configの保存関数
  function saveConfigToLocalStorage() {
    try{
      // プロトコルはバリデーションを信じてそのまま入れる
      localStorage.setItem(StorageKeys.config.streamProtocol, inputProtocolRef.current?.value!);

      // URLは指定されていれば入れ、なければ消す（config読む際にデフォルト値に戻る）
      if (inputUrlRef.current?.value){
        localStorage.setItem(StorageKeys.config.mirakcUri, inputUrlRef.current?.value);
      }
      else {
        localStorage.removeItem(StorageKeys.config.mirakcUri);
      }

      props.onSave && props.onSave(loadConfigFromLocalStorage());
      setSnackbarMessage({ message: '設定を保存しました', severity: 'success' })
    }
    catch (error: unknown) {
      if (error instanceof Error) {
        console.error(error.message);
      }
      setSnackbarMessage({ message: '設定を保存できませんでした', severity: 'error' })
    }
  }

  // ディスク読み込みが起きるので一応メモ化するが多分意味ない
  const config = React.useMemo(loadConfigFromLocalStorage, []);

  // 設定画面のレイアウトは以下に従う
  // https://material.io/archive/guidelines/patterns/settings.html
  return (
    <Stack spacing={5} sx={{ margin: '1rem' }} >
      <Paper>
        <List>
          <ListItem>
            <ListItemText primary='設定' primaryTypographyProps={{ variant: 'h6', align: 'center' }} />
          </ListItem>
          <ListSubheader>全般</ListSubheader>
          <ListItem>
            <ListItemText primary='選局ボタンのプロトコル' />
            <ListItemIcon>
              <IconButton color='primary' onClick={ (event: React.MouseEvent<HTMLButtonElement>) => {
                setPopoverMessage({
                  messages: [
                    '番組ダイアログ下部にある選局ボタンの、リンク先プロトコルを指定します',
                    '使用可能な文字は英数字と . + _ - です',
                    'デフォルト値はvlcです',
                    '空欄にした場合、選局ボタンが無効になります',
                  ],
                  anchorEl: event.currentTarget
                });
              }}>
                <InfoOutlinedIcon />
              </IconButton>
            </ListItemIcon>
            <TextField inputRef={ inputProtocolRef } label='Protocol' variant='filled'
              inputProps={{ maxLength: 20, pattern: protocolPattern }}
              error={ !inputProtocolRef?.current?.checkValidity() }
              helperText={ inputProtocolRef?.current?.validationMessage }
              defaultValue={ config.streamProtocol }
              onChange={ () => setUpdateKey(!isUpdateKey) }
            />
          </ListItem>
          <ListSubheader>実験的</ListSubheader>
          <ListItem>
            <ListItemText primary='mirakc/MirakurunのURL' sx={{ minWidth: '18em' }} />
            <ListItemIcon>
              <IconButton color='primary' onClick={ (event: React.MouseEvent<HTMLButtonElement>) => {
                setPopoverMessage({
                  messages: [
                    '接続するmirakc/MirakurunのURLを指定します',
                    '変更した場合、ブラウザのCORS制限により動作しない場合があります',
                    'ブラウザのCORS制限を無効化することで動作する可能性がありますが、セキュリティ上のリスクを認識した上で無効化してください',
                    'デフォルト値はこのmiraviewが動いているホストです',
                    '空欄にした場合デフォルト値に戻ります',
                  ],
                  anchorEl: event.currentTarget
                });
              }}>
                <InfoOutlinedIcon />
              </IconButton>
            </ListItemIcon>
            <TextField inputRef={ inputUrlRef } label='Tuner URL' variant='filled' fullWidth={ true }
              inputProps={{ pattern: urlPattern }}
              error={ !inputUrlRef?.current?.checkValidity() }
              helperText={ inputUrlRef?.current?.validationMessage }
              defaultValue={ config.mirakcUri }
              onChange={ () => setUpdateKey(!isUpdateKey) }
              type='url'
            />
          </ListItem>
          <ListItem />
          <Divider />
          <ListItem>
            <Button type='submit' variant='contained' sx={{ marginLeft: 'auto' }} onClick={ saveConfigToLocalStorage }>保存</Button>
          </ListItem>
          <Snackbar open={ !!snackbarMessage } autoHideDuration={ 5000 } onClose={ () => setSnackbarMessage(undefined) }>
            <Alert severity={ snackbarMessage?.severity } sx={{ width: '100%' }} onClose={ () => setSnackbarMessage(undefined) } >
              { snackbarMessage?.message }
            </Alert>
          </Snackbar>
          <Popover
            open={ !!popoverMessage }
            anchorEl={ popoverMessage?.anchorEl }
            anchorOrigin={{ vertical: 'center', horizontal: 'center' }}
            onClose={ () => setPopoverMessage(undefined) }
          >
            <Box sx={{ padding: 2 }}>
              { popoverMessage?.messages?.map((msg, idx) => <Typography key={idx}>{msg}</Typography>) }
            </Box>
          </Popover>
        </List>
      </Paper>
      <Paper>
        <List>
          <ListItem>
            <ListItemText primary='情報' primaryTypographyProps={{ variant: 'h6', align: 'center' }} />
          </ListItem>
          <ListItem>
            <Stack sx={{ width: '100%' }}>
              <ListItemText primary='miraview' primaryTypographyProps={{ align: 'center' }} />
              <ListItemText primary={ 'version ' + process.env.REACT_APP_VERSION } primaryTypographyProps={{ align: 'center' }} />
              <Link target="_blank" rel="noreferrer" href='https://github.com/maeda577/miraview' align='center'>https://github.com/maeda577/miraview</Link>
            </Stack>
          </ListItem>
        </List>
      </Paper>
    </Stack>
  );
}

export default ConfigView;
