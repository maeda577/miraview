import React from 'react';

import Typography from '@mui/material/Typography';

// 基本的な情報はこれ https://ja.reactjs.org/docs/error-boundaries.html
// 型情報はここらへん https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/react/index.d.ts
// https://github.com/bvaughn/react-error-boundary を使った方が簡単らしい

type Props = {
  children?: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

class ErrorBoundary extends React.Component<Props, ErrorBoundaryState> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 一度エラーになったら通常状態に戻る方法は無く、リロードするしかないのが良くない
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(error.message, errorInfo.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <Typography>エラーが発生しました。ブラウザを再読み込みしてください。エラーの詳細はコンソールを確認してください。</Typography>;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
