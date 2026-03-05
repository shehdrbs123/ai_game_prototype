const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.ico': 'image/x-icon',
    '.mid': 'audio/midi',
    '.midi': 'audio/midi',
};

const server = http.createServer((req, res) => {
    // URL 객체를 사용하여 쿼리 스트링(?t=...) 제거 및 경로 추출
    const url = new URL(req.url, `http://${req.headers.host}`);
    let filePath = '.' + url.pathname;

    // 루트 경로 요청 시 index.html 제공
    if (filePath === './') {
        filePath = './index.html';
    }

    const extname = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                console.log(`404 Not Found: ${filePath}`);
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                console.error(`Server Error: ${error.code}`);
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            // 성공 시 올바른 Content-Type 헤더와 함께 파일 전송
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});