import http from 'node:http'
import handler from 'serve-handler';

const server = http.createServer((req, res) => {
    // オプションは https://github.com/vercel/serve-handler#options
    return handler(req, res, { cleanUrls: false });
});

// Webサーバ開始
server.listen(3000, () => {
    console.log('Running at http://localhost:3000');
});
