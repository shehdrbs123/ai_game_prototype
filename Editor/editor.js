const statusEl = document.getElementById('status');
const editorEl = document.getElementById('configEditor');
const monitorEl = document.getElementById('monitorBox');
const evtEnabledEl = document.getElementById('evtEnabled');
const evtDungeonIdEl = document.getElementById('evtDungeonId');
const datasetSelectEl = document.getElementById('datasetSelect');
const eventPanelEl = document.querySelector('.panel.event');
const btnResetEl = document.getElementById('btnReset');
const btnSaveEl = document.getElementById('btnSave');
const btnPreviewDiffEl = document.getElementById('btnPreviewDiff');
const btnRevertLocalEl = document.getElementById('btnRevertLocal');
const datasetTabsEl = document.getElementById('datasetTabs');
const viewModeToggleEl = document.getElementById('viewModeToggle');
const validationSummaryEl = document.getElementById('validationSummary');
const formPanelEl = document.getElementById('formPanel');
const gridPanelEl = document.getElementById('gridPanel');
const rawPanelEl = document.getElementById('rawPanel');
const formContainerEl = document.getElementById('formContainer');
const gridContainerEl = document.getElementById('gridContainer');

const DATASET_UI_META = {
    settings: { defaultView: 'form', views: ['form', 'raw'] },
    items: { defaultView: 'grid', views: ['grid', 'raw'] },
    recipes: { defaultView: 'grid', views: ['grid', 'raw'] },
    dungeonOfferingSystem: { defaultView: 'form', views: ['form', 'raw'] }
};

const uiState = {
    datasets: [],
    currentDatasetId: '',
    currentViewMode: 'form',
    currentData: null,
    lastLoadedData: null,
    dirty: false,
    lastValidation: { errors: [], warnings: [] }
};

function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
}

function setStatus(message, tone = 'info') {
    statusEl.textContent = message;
    statusEl.classList.remove('dirty', 'error');
    if (tone === 'dirty') {
        statusEl.classList.add('dirty');
    }
    if (tone === 'error') {
        statusEl.classList.add('error');
    }
}

function getSelectedDatasetId() {
    return datasetSelectEl.value;
}

function isDungeonDataset() {
    return getSelectedDatasetId() === 'dungeonOfferingSystem';
}

function getDatasetMeta(datasetId) {
    return DATASET_UI_META[datasetId] || { defaultView: 'raw', views: ['raw'] };
}

function isViewAllowed(datasetId, viewMode) {
    return getDatasetMeta(datasetId).views.includes(viewMode);
}

function setDirtyState(isDirty) {
    uiState.dirty = Boolean(isDirty);
    if (uiState.dirty) {
        setStatus('Unsaved local changes', 'dirty');
    } else {
        setStatus('Ready');
    }
}

function updateDirtyFromState() {
    const now = JSON.stringify(uiState.currentData) !== JSON.stringify(uiState.lastLoadedData);
    setDirtyState(now);
}

function getDataByPath(data, path) {
    return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), data);
}

function setDataByPath(data, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let cursor = data;
    keys.forEach((key) => {
        if (!cursor[key] || typeof cursor[key] !== 'object') {
            cursor[key] = {};
        }
        cursor = cursor[key];
    });
    cursor[lastKey] = value;
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok || data.ok === false) {
        throw new Error(data.error || `HTTP ${response.status}`);
    }
    return data;
}

function renderDatasetTabs() {
    datasetTabsEl.innerHTML = '';
    uiState.datasets.forEach((dataset) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'tab-btn';
        if (dataset.id === uiState.currentDatasetId) {
            button.classList.add('active');
        }
        button.textContent = dataset.id;
        button.addEventListener('click', async () => {
            if (dataset.id === uiState.currentDatasetId) return;
            datasetSelectEl.value = dataset.id;
            await onDatasetChange();
        });
        datasetTabsEl.appendChild(button);
    });
}

function renderViewToggle() {
    const datasetId = uiState.currentDatasetId;
    const allowedViews = getDatasetMeta(datasetId).views;
    viewModeToggleEl.querySelectorAll('button').forEach((button) => {
        const mode = button.dataset.viewMode;
        button.classList.toggle('mode-btn', true);
        button.classList.toggle('active', mode === uiState.currentViewMode);
        button.disabled = !allowedViews.includes(mode);
    });
}

function refreshPanelState() {
    const dungeonMode = isDungeonDataset();
    eventPanelEl.style.opacity = dungeonMode ? '1' : '0.55';
    eventPanelEl.style.pointerEvents = dungeonMode ? 'auto' : 'none';

    const selected = uiState.datasets.find((item) => item.id === getSelectedDatasetId());
    btnResetEl.disabled = !(selected && selected.hasTemplate);

    formPanelEl.classList.toggle('panel-hidden', uiState.currentViewMode !== 'form');
    gridPanelEl.classList.toggle('panel-hidden', uiState.currentViewMode !== 'grid');
    rawPanelEl.classList.toggle('panel-hidden', uiState.currentViewMode !== 'raw');
}

function loadEventInputs(config) {
    evtEnabledEl.checked = Boolean(config?.eventOverrides?.enabled);
    evtDungeonIdEl.value = config?.eventOverrides?.forceDungeonId || '';
}

function validateDataset(datasetId, data) {
    const errors = [];
    const warnings = [];

    if (datasetId === 'settings') {
        Object.entries(data || {}).forEach(([key, value]) => {
            if (typeof value !== 'number' || Number.isNaN(value)) {
                errors.push(`settings.${key} must be a number`);
            }
        });
    }

    if (datasetId === 'dungeonOfferingSystem') {
        const offeringSlotCount = Number(data?.slots?.offeringSlotCount);
        if (!Number.isFinite(offeringSlotCount) || offeringSlotCount < 0) {
            errors.push('slots.offeringSlotCount must be a non-negative number');
        }

        const jadeSlotCount = Number(data?.slots?.jadeSlotCount);
        if (!Number.isFinite(jadeSlotCount) || jadeSlotCount < 0) {
            errors.push('slots.jadeSlotCount must be a non-negative number');
        }

        if (!data?.dungeons || typeof data.dungeons !== 'object') {
            errors.push('dungeons is required');
        }

        if (data?.eventOverrides?.enabled && !data?.eventOverrides?.forceDungeonId) {
            warnings.push('eventOverrides.enabled is true but forceDungeonId is empty');
        }
    }

    if (datasetId === 'items') {
        if (!Array.isArray(data)) {
            errors.push('items must be an array');
        }
    }

    if (datasetId === 'recipes') {
        if (!Array.isArray(data)) {
            errors.push('recipes must be an array');
        }
    }

    return { errors, warnings };
}

function updateValidationSummary(extraLines = []) {
    const lines = [];
    const { errors, warnings } = uiState.lastValidation;

    if (errors.length === 0 && warnings.length === 0 && extraLines.length === 0) {
        validationSummaryEl.textContent = 'No issues';
        return;
    }

    if (errors.length > 0) {
        lines.push(`[Errors: ${errors.length}]`);
        errors.slice(0, 8).forEach((error) => lines.push(`- ${error}`));
    }

    if (warnings.length > 0) {
        lines.push(`[Warnings: ${warnings.length}]`);
        warnings.slice(0, 8).forEach((warning) => lines.push(`- ${warning}`));
    }

    extraLines.forEach((line) => lines.push(line));
    validationSummaryEl.textContent = lines.join('\n');
}

function syncRawEditorFromData() {
    editorEl.value = JSON.stringify(uiState.currentData, null, 4);
}

function tryApplyRawEditorToData() {
    try {
        const parsed = JSON.parse(editorEl.value);
        uiState.currentData = parsed;
        return { ok: true };
    } catch (error) {
        return { ok: false, error: error.message };
    }
}

function applyDataMutation(mutator) {
    mutator(uiState.currentData);
    uiState.lastValidation = validateDataset(uiState.currentDatasetId, uiState.currentData);
    updateValidationSummary();
    updateDirtyFromState();
    if (uiState.currentViewMode === 'raw') {
        syncRawEditorFromData();
    }
}

function renderSettingsForm(data) {
    const fields = Object.keys(data || {}).filter((key) => typeof data[key] === 'number');
    const wrapper = document.createElement('div');
    wrapper.className = 'form-grid';

    fields.forEach((fieldKey) => {
        const field = document.createElement('div');
        field.className = 'field';

        const label = document.createElement('label');
        label.textContent = fieldKey;

        const input = document.createElement('input');
        input.type = 'number';
        input.value = data[fieldKey];
        input.addEventListener('change', () => {
            const nextValue = Number(input.value);
            applyDataMutation((draft) => {
                draft[fieldKey] = nextValue;
            });
        });

        field.appendChild(label);
        field.appendChild(input);
        wrapper.appendChild(field);
    });

    formContainerEl.innerHTML = '';
    formContainerEl.appendChild(wrapper);
}

function renderDungeonForm(data) {
    const wrapper = document.createElement('div');
    wrapper.className = 'form-grid';

    const fields = [
        { label: 'offeringSlotCount', path: 'slots.offeringSlotCount' },
        { label: 'jadeSlotCount', path: 'slots.jadeSlotCount' },
        { label: 'eventOverrides.forceDungeonId', path: 'eventOverrides.forceDungeonId', type: 'text' }
    ];

    fields.forEach((entry) => {
        const field = document.createElement('div');
        field.className = 'field';

        const label = document.createElement('label');
        label.textContent = entry.label;

        const input = document.createElement('input');
        input.type = entry.type || 'number';
        const currentValue = getDataByPath(data, entry.path);
        input.value = currentValue ?? '';

        input.addEventListener('change', () => {
            applyDataMutation((draft) => {
                if (entry.type === 'text') {
                    setDataByPath(draft, entry.path, input.value.trim() || null);
                } else {
                    setDataByPath(draft, entry.path, Number(input.value));
                }
            });
        });

        field.appendChild(label);
        field.appendChild(input);
        wrapper.appendChild(field);
    });

    formContainerEl.innerHTML = '';
    formContainerEl.appendChild(wrapper);
}

function renderFallbackForm(datasetId) {
    formContainerEl.innerHTML = '';
    const message = document.createElement('div');
    message.textContent = `${datasetId} does not provide a dedicated form yet. Use Raw JSON mode.`;
    formContainerEl.appendChild(message);
}

function renderFormView() {
    const datasetId = uiState.currentDatasetId;
    const data = uiState.currentData;

    if (datasetId === 'settings') {
        renderSettingsForm(data);
        return;
    }

    if (datasetId === 'dungeonOfferingSystem') {
        renderDungeonForm(data);
        return;
    }

    renderFallbackForm(datasetId);
}

function parseRecipeIngredients(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    return trimmed.split(',').map((chunk) => {
        const [idPart, qtyPart] = chunk.trim().split(':');
        return {
            id: (idPart || '').trim(),
            qty: Number((qtyPart || '').trim() || 0)
        };
    }).filter((entry) => entry.id);
}

function stringifyRecipeIngredients(list) {
    if (!Array.isArray(list)) return '';
    return list.map((entry) => `${entry.id}:${entry.qty}`).join(', ');
}

function makeEditableCell(value, onCommit, isDirty = false) {
    const td = document.createElement('td');
    if (isDirty) td.classList.add('cell-dirty');
    const input = document.createElement('input');
    input.value = value ?? '';
    input.addEventListener('change', () => onCommit(input.value));
    td.appendChild(input);
    return td;
}

function renderItemsGrid() {
    const rows = Array.isArray(uiState.currentData) ? uiState.currentData : [];
    const snapshotRows = Array.isArray(uiState.lastLoadedData) ? uiState.lastLoadedData : [];

    const columns = [
        { key: 'id', type: 'string' },
        { key: 'type', type: 'string' },
        { key: 'name', type: 'string' },
        { key: 'value', type: 'number' },
        { key: 'slot', type: 'string' },
        { key: 'dmg', type: 'number' },
        { key: 'range', type: 'number' },
        { key: 'cd', type: 'number' }
    ];

    const table = document.createElement('table');
    table.className = 'grid-table';

    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    columns.forEach((column) => {
        const th = document.createElement('th');
        th.textContent = column.key;
        headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    rows.forEach((row, rowIndex) => {
        const tr = document.createElement('tr');
        columns.forEach((column) => {
            const originalValue = snapshotRows[rowIndex] ? snapshotRows[rowIndex][column.key] : undefined;
            const isDirty = JSON.stringify(row[column.key]) !== JSON.stringify(originalValue);

            tr.appendChild(makeEditableCell(row[column.key], (nextRawValue) => {
                applyDataMutation((draft) => {
                    if (column.type === 'number') {
                        const parsed = Number(nextRawValue);
                        draft[rowIndex][column.key] = Number.isFinite(parsed) ? parsed : 0;
                    } else {
                        draft[rowIndex][column.key] = nextRawValue;
                    }
                });
                renderGridView();
            }, isDirty));
        });
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    gridContainerEl.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'grid-table-wrap';
    wrap.appendChild(table);
    gridContainerEl.appendChild(wrap);
}

function renderRecipesGrid() {
    const rows = Array.isArray(uiState.currentData) ? uiState.currentData : [];
    const snapshotRows = Array.isArray(uiState.lastLoadedData) ? uiState.lastLoadedData : [];

    const table = document.createElement('table');
    table.className = 'grid-table';

    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th>targetId</th><th>ingredients (id:qty, ...)</th></tr>';
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    rows.forEach((row, rowIndex) => {
        const tr = document.createElement('tr');

        const targetDirty = JSON.stringify(row.targetId) !== JSON.stringify(snapshotRows[rowIndex]?.targetId);
        tr.appendChild(makeEditableCell(row.targetId, (nextValue) => {
            applyDataMutation((draft) => {
                draft[rowIndex].targetId = nextValue.trim();
            });
            renderGridView();
        }, targetDirty));

        const ingredientsString = stringifyRecipeIngredients(row.ingredients);
        const originalIngredientsString = stringifyRecipeIngredients(snapshotRows[rowIndex]?.ingredients);
        const ingredientsDirty = ingredientsString !== originalIngredientsString;
        tr.appendChild(makeEditableCell(ingredientsString, (nextValue) => {
            applyDataMutation((draft) => {
                draft[rowIndex].ingredients = parseRecipeIngredients(nextValue);
            });
            renderGridView();
        }, ingredientsDirty));

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    gridContainerEl.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'grid-table-wrap';
    wrap.appendChild(table);
    gridContainerEl.appendChild(wrap);
}

function renderGridFallback(datasetId) {
    gridContainerEl.innerHTML = `${datasetId} does not support grid mode yet.`;
}

function renderGridView() {
    const datasetId = uiState.currentDatasetId;
    if (datasetId === 'items') {
        renderItemsGrid();
        return;
    }

    if (datasetId === 'recipes') {
        renderRecipesGrid();
        return;
    }

    renderGridFallback(datasetId);
}

function setViewMode(mode, force = false) {
    if (!isViewAllowed(uiState.currentDatasetId, mode) && !force) {
        return;
    }

    if (uiState.currentViewMode === 'raw' && mode !== 'raw') {
        const parseResult = tryApplyRawEditorToData();
        if (!parseResult.ok) {
            setStatus(`Raw JSON parse failed: ${parseResult.error}`, 'error');
            return;
        }
    }

    uiState.currentViewMode = mode;
    renderViewToggle();
    refreshPanelState();

    if (mode === 'form') {
        renderFormView();
    } else if (mode === 'grid') {
        renderGridView();
    } else {
        syncRawEditorFromData();
    }

    uiState.lastValidation = validateDataset(uiState.currentDatasetId, uiState.currentData);
    updateValidationSummary();
}

function renderAll() {
    renderDatasetTabs();
    renderViewToggle();
    refreshPanelState();

    if (uiState.currentViewMode === 'form') {
        renderFormView();
    }
    if (uiState.currentViewMode === 'grid') {
        renderGridView();
    }
    if (uiState.currentViewMode === 'raw') {
        syncRawEditorFromData();
    }

    uiState.lastValidation = validateDataset(uiState.currentDatasetId, uiState.currentData);
    updateValidationSummary();
}

async function loadDatasetList() {
    const data = await fetchJson('/api/datasets');
    uiState.datasets = data.datasets || [];
    datasetSelectEl.innerHTML = uiState.datasets.map((item) => `<option value="${item.id}">${item.id}</option>`).join('');
}

async function loadConfig({ resetView = false } = {}) {
    const datasetId = getSelectedDatasetId();
    uiState.currentDatasetId = datasetId;

    setStatus(`Loading ${datasetId}...`);
    const data = await fetchJson(`/api/datasets/${encodeURIComponent(datasetId)}`);

    uiState.currentData = cloneJson(data.data);
    uiState.lastLoadedData = cloneJson(data.data);

    if (isDungeonDataset()) {
        loadEventInputs(uiState.currentData);
    }

    if (resetView || !isViewAllowed(datasetId, uiState.currentViewMode)) {
        uiState.currentViewMode = getDatasetMeta(datasetId).defaultView;
    }

    setDirtyState(false);
    renderAll();
    setStatus(`${datasetId} loaded`);
}

function computeDiffSummary(prevData, nextData) {
    const changed = [];
    const added = [];
    const removed = [];

    function walk(prevValue, nextValue, path) {
        if (JSON.stringify(prevValue) === JSON.stringify(nextValue)) return;

        const prevIsObject = prevValue && typeof prevValue === 'object';
        const nextIsObject = nextValue && typeof nextValue === 'object';

        if (prevIsObject && nextIsObject && !Array.isArray(prevValue) && !Array.isArray(nextValue)) {
            const keys = new Set([...Object.keys(prevValue), ...Object.keys(nextValue)]);
            keys.forEach((key) => {
                const childPath = path ? `${path}.${key}` : key;
                if (!(key in prevValue)) {
                    added.push(childPath);
                    return;
                }
                if (!(key in nextValue)) {
                    removed.push(childPath);
                    return;
                }
                walk(prevValue[key], nextValue[key], childPath);
            });
            return;
        }

        changed.push(path || '(root)');
    }

    walk(prevData, nextData, '');
    return { changed, added, removed };
}

function previewDiff() {
    if (uiState.currentViewMode === 'raw') {
        const parseResult = tryApplyRawEditorToData();
        if (!parseResult.ok) {
            setStatus(`Preview failed: ${parseResult.error}`, 'error');
            return;
        }
    }

    const diff = computeDiffSummary(uiState.lastLoadedData, uiState.currentData);
    const lines = [
        `[Diff] changed=${diff.changed.length}, added=${diff.added.length}, removed=${diff.removed.length}`,
        ...diff.changed.slice(0, 6).map((path) => `~ ${path}`),
        ...diff.added.slice(0, 4).map((path) => `+ ${path}`),
        ...diff.removed.slice(0, 4).map((path) => `- ${path}`)
    ];
    updateValidationSummary(lines);
    setStatus('Diff preview updated');
}

function revertLocal() {
    uiState.currentData = cloneJson(uiState.lastLoadedData);
    if (isDungeonDataset()) {
        loadEventInputs(uiState.currentData);
    }
    setDirtyState(false);
    renderAll();
    setStatus('Local changes reverted');
}

async function saveConfig() {
    const datasetId = getSelectedDatasetId();

    if (uiState.currentViewMode === 'raw') {
        const parseResult = tryApplyRawEditorToData();
        if (!parseResult.ok) {
            setStatus(`Save failed: ${parseResult.error}`, 'error');
            return;
        }
    }

    uiState.lastValidation = validateDataset(datasetId, uiState.currentData);
    updateValidationSummary();

    if (uiState.lastValidation.errors.length > 0) {
        setStatus('Save blocked by validation errors', 'error');
        return;
    }

    setStatus(`Saving ${datasetId}...`);
    await fetchJson(`/api/datasets/${encodeURIComponent(datasetId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: uiState.currentData })
    });

    uiState.lastLoadedData = cloneJson(uiState.currentData);
    setDirtyState(false);
    setStatus(`${datasetId} saved`);

    if (isDungeonDataset()) {
        await refreshMonitor();
    }

    renderAll();
}

async function resetConfig() {
    const datasetId = getSelectedDatasetId();
    setStatus(`Resetting ${datasetId}...`);
    await fetchJson(`/api/datasets/${encodeURIComponent(datasetId)}/reset`, { method: 'POST' });
    await loadConfig({ resetView: false });
    setStatus(`${datasetId} reset`);
}

async function applyEventOverride() {
    if (!isDungeonDataset()) return;

    setStatus('Applying event override...');
    await fetchJson('/api/event-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            enabled: evtEnabledEl.checked,
            forceDungeonId: evtDungeonIdEl.value.trim() || null
        })
    });

    await loadConfig({ resetView: false });
    setStatus('Event override applied');
}

async function refreshMonitor() {
    setStatus('Refreshing monitor...');
    const data = await fetchJson('/api/monitor');
    monitorEl.textContent = JSON.stringify(data.monitor, null, 2);
    setStatus('Monitor updated');
}

async function onDatasetChange() {
    try {
        await loadConfig({ resetView: true });
    } catch (error) {
        setStatus(`Dataset change failed: ${error.message}`, 'error');
    }
}

datasetSelectEl.addEventListener('change', onDatasetChange);

viewModeToggleEl.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
        const targetMode = button.dataset.viewMode;
        setViewMode(targetMode);
    });
});

document.getElementById('btnLoad').addEventListener('click', async () => {
    try {
        await loadConfig({ resetView: false });
    } catch (error) {
        setStatus(`Load failed: ${error.message}`, 'error');
    }
});

btnSaveEl.addEventListener('click', async () => {
    try {
        await saveConfig();
    } catch (error) {
        setStatus(`Save failed: ${error.message}`, 'error');
    }
});

btnResetEl.addEventListener('click', async () => {
    try {
        await resetConfig();
    } catch (error) {
        setStatus(`Reset failed: ${error.message}`, 'error');
    }
});

document.getElementById('btnApplyEvent').addEventListener('click', async () => {
    try {
        await applyEventOverride();
        await refreshMonitor();
    } catch (error) {
        setStatus(`Event apply failed: ${error.message}`, 'error');
    }
});

document.getElementById('btnMonitor').addEventListener('click', async () => {
    try {
        await refreshMonitor();
    } catch (error) {
        setStatus(`Monitor failed: ${error.message}`, 'error');
    }
});

btnPreviewDiffEl.addEventListener('click', () => {
    previewDiff();
});

btnRevertLocalEl.addEventListener('click', () => {
    revertLocal();
});

editorEl.addEventListener('input', () => {
    if (uiState.currentViewMode !== 'raw') return;
    const parseResult = tryApplyRawEditorToData();
    if (parseResult.ok) {
        uiState.lastValidation = validateDataset(uiState.currentDatasetId, uiState.currentData);
        updateValidationSummary();
        updateDirtyFromState();
        setStatus('Raw JSON updated', uiState.dirty ? 'dirty' : 'info');
    }
});

window.addEventListener('beforeunload', (event) => {
    if (!uiState.dirty) return;
    event.preventDefault();
    event.returnValue = '';
});

(async () => {
    try {
        await loadDatasetList();
        const firstDataset = uiState.datasets[0]?.id;
        if (!firstDataset) {
            setStatus('No datasets available', 'error');
            return;
        }
        datasetSelectEl.value = firstDataset;
        await loadConfig({ resetView: true });
        await refreshMonitor();
    } catch (error) {
        setStatus(`Init failed: ${error.message}`, 'error');
    }
})();
