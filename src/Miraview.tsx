import React from 'react';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import { grey } from '@mui/material/colors';
import CssBaseline from '@mui/material/CssBaseline';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { createTheme, StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

import MenuIcon from '@mui/icons-material/Menu';
import RefreshIcon from '@mui/icons-material/Refresh';

import ConfigView, { loadConfigFromLocalStorage } from './ConfigView';
import ErrorBoundary from './ErrorBoundary';
import LoadingSkelton from './LoadingSkelton';
import MenuDrawer from './MenuDrawer';
import ProgramView from './ProgramView';
import TunerView from './TunerView';
import { ViewTypes } from './types';
import type { MiraviewConfig, Program, Service, Tuner, Version, ViewType } from './types';

// Themeのpaletteを拡張する
// https://mui.com/material-ui/customization/palette/#adding-new-colors
declare module '@mui/material/styles' {
  interface Palette {
    program: Palette['primary'];
  }
  interface PaletteOptions {
    program?: PaletteOptions['primary'];
  }
}

// JSON配列が返ってくるAPIをfetchする
function fetchArrayApi<T>(url: URL, setter: (response: T[] | undefined) => void): Promise<void> {
  setter(undefined);
  return fetch(url.href)
    .then<T[]>(res => res.json())
    .then(res => setter(res))
    .catch((error: Error) => {
      console.error(error.message);
      setter([]);
    });
}

// JSONオブジェクトが返ってくるAPIをfetchする
function fetchObjectApi<T>(url: URL, setter: (response: T | undefined) => void): Promise<void> {
  setter(undefined);
  return fetch(url.href)
    .then<T>(res => res.json())
    .then(res => setter(res))
    .catch((error: Error) => console.error(error.message));
}

function Miraview(): JSX.Element {
  // 今開いているタブ
  const [currentView, setView] = React.useState<ViewType>(ViewTypes.Programs);
  // 左のメニューを開いているか
  const [isDrawerOpen, setDrawerOpen] = React.useState<boolean>(false);
  // 今の設定値
  const [currentConfig, setConfig] = React.useState<MiraviewConfig>(loadConfigFromLocalStorage());
  // チューナー一覧だけで表示されるリロードボタンの画面更新用フラグ
  const [tunerRefreshKey, setTunerRefreshKey] = React.useState<boolean>(false);

  // APIの戻り値群 いずれもundefinedなら読み込み中で空配列なら失敗
  // 番組一覧
  const [programs, setPrograms] = React.useState<Program[] | undefined>(undefined);
  // サービス一覧
  const [services, setServices] = React.useState<Service[] | undefined>(undefined);
  // チューナー一覧
  const [tuners, setTuners] = React.useState<Tuner[] | undefined>(undefined);
  // mirakcバージョン
  const [mirakcVersion, setMirakcVersion] = React.useState<Version | undefined>(undefined);

  // ヘッダの高さを測定するためだけのref
  const headerRef = React.useRef<HTMLDivElement>(null);

  // 番組一覧/サービス一覧の取得
  React.useEffect(() => {
    fetchArrayApi<Program>(new URL('/api/programs', currentConfig.mirakcUri), setPrograms);
    fetchArrayApi<Service>(new URL('/api/services', currentConfig.mirakcUri), setServices);
    fetchObjectApi<Version>(new URL('/api/version', currentConfig.mirakcUri), setMirakcVersion);
  }, [currentConfig.mirakcUri]);

  // チューナー一覧の取得
  React.useEffect(() => {
    fetchArrayApi<Tuner>(new URL('/api/tuners', currentConfig.mirakcUri), setTuners);
  }, [currentConfig.mirakcUri, tunerRefreshKey]);

  const theme = createTheme({
    palette: {
      // mode: useMediaQuery('(prefers-color-scheme: dark)') ? 'dark' : 'light',
      // mode: 'light',
      mode: 'dark',
      program: {
        main: grey[900],  // 番組情報
        light: grey[800], // 番組の上部ヘッダ
      },
    },
  });

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        <MenuDrawer open={isDrawerOpen} onClose={ () => setDrawerOpen(false) } onItemSelected={ setView }/>
        <ErrorBoundary>
          <Stack sx={{ height: '100vh' }}>
            <AppBar ref={headerRef} position='static'>
              <Toolbar>
                <IconButton onClick={ () => setDrawerOpen(true) } >
                  <MenuIcon />
                </IconButton>
                <Typography variant='h6' sx={{ marginLeft: '2rem', flexGrow: 1 }} >
                  { currentView }
                </Typography>
                <IconButton onClick={ () => setTunerRefreshKey(!tunerRefreshKey) } sx={{ display: currentView === ViewTypes.Tuners ? 'block' : 'none' }}>
                  <RefreshIcon />
                </IconButton>
              </Toolbar>
            </AppBar>
            {/* 番組表 */}
            <Box sx={{
              display: currentView === ViewTypes.Programs ? 'block' : 'none',
              height: `calc(100vh - ${headerRef?.current?.getBoundingClientRect()?.bottom ?? 0}px)`
            }}>
              <LoadingSkelton isLoading={ programs === undefined || services === undefined } rows={5} cols={6}>
                <ProgramView config={ currentConfig } programs={ programs } services={ services } />
              </LoadingSkelton>
            </Box>
            {/* チューナー一覧 */}
            <Box sx={{ display: currentView === ViewTypes.Tuners ? 'block' : 'none', overflow: 'auto' }}>
              <LoadingSkelton isLoading={ tuners === undefined } rows={4} cols={1} itemHeight={200}>
                <TunerView config={ currentConfig } tuners={ tuners } version={ mirakcVersion } />
              </LoadingSkelton>
            </Box>
            {/* 設定画面 */}
            <Box sx={{ display: currentView === ViewTypes.Config ? 'block' : 'none', overflow: 'auto' }}>
              <ConfigView onSave={ setConfig } />
            </Box>
          </Stack>
        </ErrorBoundary>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default Miraview;
