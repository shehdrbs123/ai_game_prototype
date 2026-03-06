const express = require('express');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const { createProtectedMidiRouter } = require('./src/protected-midi');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const EDITOR_STORAGE_DIR = path.join(__dirname, 'Editor', 'storage');
const EDITOR_TEMPLATE_PATH = path.join(__dirname, 'Editor', 'templates', 'dungeonOfferingSystem.template.json');
const EDITOR_CONFIG_PATH = path.join(EDITOR_STORAGE_DIR, 'dungeonOfferingSystem.json');

app.use(express.json({ limit: '2mb' }));

async function ensureEditorConfig() {
    await fsp.mkdir(EDITOR_STORAGE_DIR, { recursive: true });
    if (!fs.existsSync(EDITOR_CONFIG_PATH)) {
        const templateRaw = await fsp.readFile(EDITOR_TEMPLATE_PATH, 'utf8');
        await fsp.writeFile(EDITOR_CONFIG_PATH, templateRaw, 'utf8');
    }
}

async function readEditorConfig() {
    await ensureEditorConfig();
    const raw = await fsp.readFile(EDITOR_CONFIG_PATH, 'utf8');
    return JSON.parse(raw);
}

function validateEditorConfig(config) {
    if (!config || typeof config !== 'object') return { ok: false, reason: 'config must be an object' };
    if (!config.slots || typeof config.slots.offeringSlotCount !== 'number') return { ok: false, reason: 'slots.offeringSlotCount is required' };
    if (!config.riskLevels || typeof config.riskLevels !== 'object') return { ok: false, reason: 'riskLevels is required' };
    if (!config.offerings || typeof config.offerings !== 'object') return { ok: false, reason: 'offerings is required' };
    if (!config.dungeons || typeof config.dungeons !== 'object') return { ok: false, reason: 'dungeons is required' };
    if (!config.generationProfiles || typeof config.generationProfiles !== 'object') return { ok: false, reason: 'generationProfiles is required' };
    if (!config.eventOverrides || typeof config.eventOverrides !== 'object') return { ok: false, reason: 'eventOverrides is required' };
    return { ok: true };
}

function buildMonitor(config) {
    const offerings = Object.entries(config.offerings || {});
    const dungeons = Object.keys(config.dungeons || {});
    const profileIds = new Set(Object.keys(config.generationProfiles || {}));
    const offeringPerDungeon = {};
    const warnings = [];

    dungeons.forEach((dungeonId) => {
        offeringPerDungeon[dungeonId] = 0;
    });
    offerings.forEach(([itemId, meta]) => {
        if (!meta || !meta.targetDungeonId) {
            warnings.push(`offering '${itemId}' has no targetDungeonId`);
            return;
        }
        if (!offeringPerDungeon[meta.targetDungeonId] && offeringPerDungeon[meta.targetDungeonId] !== 0) {
            warnings.push(`offering '${itemId}' points to unknown dungeon '${meta.targetDungeonId}'`);
            return;
        }
        offeringPerDungeon[meta.targetDungeonId] += 1;
    });

    Object.entries(config.dungeons || {}).forEach(([dungeonId, dungeonDef]) => {
        if (!profileIds.has(dungeonDef.profileId)) {
            warnings.push(`dungeon '${dungeonId}' points to missing profile '${dungeonDef.profileId}'`);
        }
    });

    if (config.eventOverrides?.enabled && !config.eventOverrides?.forceDungeonId) {
        warnings.push('eventOverrides.enabled is true but forceDungeonId is empty');
    }

    return {
        summary: {
            offerings: offerings.length,
            dungeons: dungeons.length,
            profiles: profileIds.size,
            riskLevels: Object.keys(config.riskLevels || {}).length
        },
        offeringPerDungeon,
        warnings
    };
}

// MIDI 보호 라우터 설정
// 주의: 프로젝트 루트에 'private_assets' 폴더를 만들고 bgm.mid 파일을 넣어두어야 합니다.
const midiRouter = createProtectedMidiRouter({
    secret: 'dev-secret-key-123', // 보안을 위한 비밀키
    rootDir: path.join(__dirname, 'private_assets', 'Sounds'),
    ttlMs: 60000
});

app.use('/midi', midiRouter);

app.get('/editor/api/config', async (req, res) => {
    try {
        const config = await readEditorConfig();
        res.json({ ok: true, config });
    } catch (error) {
        res.status(500).json({ ok: false, error: String(error.message || error) });
    }
});

app.put('/editor/api/config', async (req, res) => {
    try {
        const config = req.body?.config || req.body;
        const valid = validateEditorConfig(config);
        if (!valid.ok) return res.status(400).json({ ok: false, error: valid.reason });

        await ensureEditorConfig();
        await fsp.writeFile(EDITOR_CONFIG_PATH, JSON.stringify(config, null, 4), 'utf8');
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ ok: false, error: String(error.message || error) });
    }
});

app.post('/editor/api/config/reset', async (req, res) => {
    try {
        await ensureEditorConfig();
        const templateRaw = await fsp.readFile(EDITOR_TEMPLATE_PATH, 'utf8');
        await fsp.writeFile(EDITOR_CONFIG_PATH, templateRaw, 'utf8');
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ ok: false, error: String(error.message || error) });
    }
});

app.post('/editor/api/event-override', async (req, res) => {
    try {
        const { enabled, forceDungeonId } = req.body || {};
        const config = await readEditorConfig();
        config.eventOverrides = {
            enabled: Boolean(enabled),
            forceDungeonId: forceDungeonId || null
        };
        await fsp.writeFile(EDITOR_CONFIG_PATH, JSON.stringify(config, null, 4), 'utf8');
        res.json({ ok: true, eventOverrides: config.eventOverrides });
    } catch (error) {
        res.status(500).json({ ok: false, error: String(error.message || error) });
    }
});

app.get('/editor/api/monitor', async (req, res) => {
    try {
        const config = await readEditorConfig();
        res.json({ ok: true, monitor: buildMonitor(config) });
    } catch (error) {
        res.status(500).json({ ok: false, error: String(error.message || error) });
    }
});

// 정적 파일 서비스
app.use(express.static(__dirname));

// 404 처리 (API 경로 외의 요청이 실패할 경우)
app.use((req, res) => {
    res.status(404).send('Not Found');
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`MIDI API: http://localhost:${PORT}/midi/token/bgm`);
    console.log(`Editor: http://localhost:${PORT}/Editor/`);
});
