import http from 'node:http';
import handler from 'serve-handler';

const mirakcBaseUrl = 'http://192.168.1.201:40772/';

const server = http.createServer((req, res) => {

    if (req.url?.startsWith('/api')) {
        // API宛の通信は簡易リバプロする
        fetch(
            new URL(req.url, mirakcBaseUrl),
            { method: req.method, body: req.read() }
        ).then(apiRes => {
            apiRes.headers.forEach((value, key) => res.setHeader(key, value));
            res.statusCode = apiRes.status;
            return apiRes.bytes();
        }).then(bytes => {
            res.write(bytes);
            res.end();
        });
    }
    else {
        // 通常のアクセスはserveに任せる
        // オプションは https://github.com/vercel/serve-handler#options
        return handler(req, res, { cleanUrls: false });
    }
    // CORS Preflight
    // else if (req.method === 'OPTIONS') {

    // }
});

// Webサーバ開始
server.listen(3000, () => {
    console.log('Running at http://localhost:3000');
});
