import React from 'react';

import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';

// cols,rowsの引数チェックがおかしいかもしれないので、必ず整数を指定する
export default function LoadingSkelton(props: { isLoading: boolean, cols: number, rows: number, itemHeight?: number, children?: React.ReactNode }): JSX.Element {

  if (!Number.isInteger(props.cols) || !Number.isInteger(props.rows) || 12 % props.cols !== 0){
    throw new Error('Invalid argument');
  }
  else if (!props.isLoading) {
    return <React.Fragment>{ props.children }</React.Fragment>;
  }

  return (
    <Grid container spacing={1} sx={{ padding: '1rem' }}>
      {
        Array<number>(props.cols * props.rows).fill(0).map((val, idx) =>
          <Grid item xs={ 12 / props.cols } key={'skelton-' + idx}>
            <Skeleton animation='wave' variant="rectangular" component={ Paper } height={ props.itemHeight || 100 } />
          </Grid>
        )
      }
    </Grid>
  );
}
