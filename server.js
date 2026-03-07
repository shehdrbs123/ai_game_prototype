const express = require('express');
const path = require('path');
const { createProtectedMidiRouter } = require('./src/protected-midi');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// MIDI 보호 라우터 설정
const midiRouter = createProtectedMidiRouter({
    secret: 'dev-secret-key-123',
    rootDir: path.join(__dirname, 'private_assets', 'Sounds'),
    ttlMs: 60000
});

app.use('/midi', midiRouter);

// 루트 서버에서는 Editor 자원을 인식하지 않도록 차단
app.use(['/Editor', '/Editor/*', '/editor', '/editor/*'], (req, res) => {
    res.status(404).send('Not Found');
});

// 게임 정적 파일 서비스
app.use(express.static(__dirname));

app.use((req, res) => {
    res.status(404).send('Not Found');
});

app.listen(PORT, () => {
    console.log(`Game server running at http://localhost:${PORT}/`);
    console.log(`MIDI API: http://localhost:${PORT}/midi/token/bgm`);
});
