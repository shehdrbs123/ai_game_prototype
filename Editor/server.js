const express = require('express');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;

const app = express();
const PORT = Number(process.env.EDITOR_PORT) || 3100;
const PROJECT_ROOT = path.join(__dirname, '..');
const DATA_JSON_DIR = path.join(PROJECT_ROOT, 'src', 'data', 'json');
const EDITOR_TEMPLATE_PATH = path.join(__dirname, 'templates', 'dungeonOfferingSystem.template.json');

const DATASET_FILES = {
    settings: path.join(DATA_JSON_DIR, 'settings.json'),
    items: path.join(DATA_JSON_DIR, 'items.json'),
    armorTemplates: path.join(DATA_JSON_DIR, 'armorTemplates.json'),
    recipes: path.join(DATA_JSON_DIR, 'recipes.json'),
    dungeonOfferingSystem: path.join(DATA_JSON_DIR, 'dungeonOfferingSystem.json'),
    gameplayBalance: path.join(DATA_JSON_DIR, 'gameplayBalance.json')
};

const DATASET_TEMPLATES = {
    dungeonOfferingSystem: EDITOR_TEMPLATE_PATH
};

app.use(express.json({ limit: '2mb' }));

function getDatasetPath(datasetId) {
    return DATASET_FILES[datasetId] || null;
}

function getDatasetTemplatePath(datasetId) {
    return DATASET_TEMPLATES[datasetId] || null;
}

async function ensureDatasetFile(datasetId) {
    const datasetPath = getDatasetPath(datasetId);
    if (!datasetPath) throw new Error(`Unknown dataset '${datasetId}'`);
    await fsp.mkdir(path.dirname(datasetPath), { recursive: true });

    if (!fs.existsSync(datasetPath)) {
        const templatePath = getDatasetTemplatePath(datasetId);
        if (templatePath && fs.existsSync(templatePath)) {
            const templateRaw = await fsp.readFile(templatePath, 'utf8');
            await fsp.writeFile(datasetPath, templateRaw, 'utf8');
            return;
        }
        await fsp.writeFile(datasetPath, '{}', 'utf8');
    }
}

async function readDataset(datasetId) {
    const datasetPath = getDatasetPath(datasetId);
    if (!datasetPath) throw new Error(`Unknown dataset '${datasetId}'`);
    await ensureDatasetFile(datasetId);
    const raw = await fsp.readFile(datasetPath, 'utf8');
    return JSON.parse(raw);
}

async function writeDataset(datasetId, data) {
    const datasetPath = getDatasetPath(datasetId);
    if (!datasetPath) throw new Error(`Unknown dataset '${datasetId}'`);
    await ensureDatasetFile(datasetId);
    await fsp.writeFile(datasetPath, JSON.stringify(data, null, 4), 'utf8');
}

function validateDungeonOfferingConfig(config) {
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
        if (!Object.prototype.hasOwnProperty.call(offeringPerDungeon, meta.targetDungeonId)) {
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

app.get('/api/datasets', async (req, res) => {
    res.json({
        ok: true,
        datasets: Object.keys(DATASET_FILES).map((id) => ({ id, hasTemplate: Boolean(getDatasetTemplatePath(id)) }))
    });
});

app.get('/api/datasets/:datasetId', async (req, res) => {
    try {
        const datasetId = req.params.datasetId;
        const data = await readDataset(datasetId);
        res.json({ ok: true, datasetId, data });
    } catch (error) {
        res.status(400).json({ ok: false, error: String(error.message || error) });
    }
});

app.put('/api/datasets/:datasetId', async (req, res) => {
    try {
        const datasetId = req.params.datasetId;
        const data = req.body?.data ?? req.body;
        if (datasetId === 'dungeonOfferingSystem') {
            const valid = validateDungeonOfferingConfig(data);
            if (!valid.ok) return res.status(400).json({ ok: false, error: valid.reason });
        }
        await writeDataset(datasetId, data);
        res.json({ ok: true, datasetId });
    } catch (error) {
        res.status(400).json({ ok: false, error: String(error.message || error) });
    }
});

app.post('/api/datasets/:datasetId/reset', async (req, res) => {
    try {
        const datasetId = req.params.datasetId;
        const templatePath = getDatasetTemplatePath(datasetId);
        if (!templatePath) return res.status(400).json({ ok: false, error: `No template for dataset '${datasetId}'` });

        const templateRaw = await fsp.readFile(templatePath, 'utf8');
        const data = JSON.parse(templateRaw);
        await writeDataset(datasetId, data);
        res.json({ ok: true, datasetId });
    } catch (error) {
        res.status(400).json({ ok: false, error: String(error.message || error) });
    }
});

app.post('/api/event-override', async (req, res) => {
    try {
        const { enabled, forceDungeonId } = req.body || {};
        const config = await readDataset('dungeonOfferingSystem');
        config.eventOverrides = {
            enabled: Boolean(enabled),
            forceDungeonId: forceDungeonId || null
        };
        await writeDataset('dungeonOfferingSystem', config);
        res.json({ ok: true, eventOverrides: config.eventOverrides });
    } catch (error) {
        res.status(500).json({ ok: false, error: String(error.message || error) });
    }
});

app.get('/api/monitor', async (req, res) => {
    try {
        const config = await readDataset('dungeonOfferingSystem');
        res.json({ ok: true, monitor: buildMonitor(config) });
    } catch (error) {
        res.status(500).json({ ok: false, error: String(error.message || error) });
    }
});

app.use(express.static(__dirname));

app.use((req, res) => {
    res.status(404).send('Not Found');
});

app.listen(PORT, () => {
    console.log(`Editor server running at http://localhost:${PORT}/`);
});
