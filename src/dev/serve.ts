// 開発中に使うためのWebサーバ nodejsで読むため、Webブラウザ側から参照されることは無い

import http from 'node:http';
import handler from 'serve-handler';

// リバプロするmirakcのURL
const mirakcBaseUrl = 'http://localhost:40772/';

const server = http.createServer(async (req, res) => {
  // 通常のアクセスはserveに任せる
  if (!req.url?.startsWith('/api')) {
    // オプションは https://github.com/vercel/serve-handler#options
    return handler(req, res, { cleanUrls: false });
  }

  // API宛の通信は簡易リバプロする
  const apiRes = await fetch(new URL(req.url, mirakcBaseUrl), { method: req.method, body: req.read() });
  if (!apiRes.ok) {
    res.writeHead(500).end();
    return;
  }
  apiRes.headers.forEach((value, key) => res.setHeader(key, value));
  res.statusCode = apiRes.status;

  const reader = apiRes.body!.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      res.end();
      return;
    }
    res.write(value);
  }
});

// Webサーバ開始
server.listen(3000, () => {
  console.log('Running at http://localhost:3000');
});
