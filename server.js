const express = require('express');
const path = require('path');
const { createProtectedMidiRouter } = require('./src/protected-midi');

const app = express();
const PORT = 3000;

// MIDI 보호 라우터 설정
// 주의: 프로젝트 루트에 'private_assets' 폴더를 만들고 bgm.mid 파일을 넣어두어야 합니다.
const midiRouter = createProtectedMidiRouter({
    secret: 'dev-secret-key-123', // 보안을 위한 비밀키
    rootDir: path.join(__dirname, 'private_assets', 'Sounds'),
    ttlMs: 60000
});

app.use('/midi', midiRouter);

// 정적 파일 서비스
app.use(express.static(__dirname));

// 404 처리 (API 경로 외의 요청이 실패할 경우)
app.use((req, res) => {
    res.status(404).send('Not Found');
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`MIDI API: http://localhost:${PORT}/midi/token/bgm`);
});