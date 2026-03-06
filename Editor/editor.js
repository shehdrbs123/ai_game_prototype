const statusEl = document.getElementById('status');
const editorEl = document.getElementById('configEditor');
const monitorEl = document.getElementById('monitorBox');
const evtEnabledEl = document.getElementById('evtEnabled');
const evtDungeonIdEl = document.getElementById('evtDungeonId');

function setStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.style.color = isError ? '#fca5a5' : '#93c5fd';
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok || data.ok === false) {
        throw new Error(data.error || `HTTP ${response.status}`);
    }
    return data;
}

function loadEventInputs(config) {
    evtEnabledEl.checked = Boolean(config?.eventOverrides?.enabled);
    evtDungeonIdEl.value = config?.eventOverrides?.forceDungeonId || '';
}

async function loadConfig() {
    setStatus('Loading config...');
    const data = await fetchJson('/editor/api/config');
    editorEl.value = JSON.stringify(data.config, null, 4);
    loadEventInputs(data.config);
    setStatus('Config loaded');
}

async function saveConfig() {
    setStatus('Saving config...');
    const config = JSON.parse(editorEl.value);
    await fetchJson('/editor/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
    });
    setStatus('Config saved');
}

async function resetConfig() {
    setStatus('Resetting to template...');
    await fetchJson('/editor/api/config/reset', { method: 'POST' });
    await loadConfig();
    setStatus('Template restored');
}

async function applyEventOverride() {
    setStatus('Applying event override...');
    await fetchJson('/editor/api/event-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            enabled: evtEnabledEl.checked,
            forceDungeonId: evtDungeonIdEl.value.trim() || null
        })
    });
    await loadConfig();
    setStatus('Event override applied');
}

async function refreshMonitor() {
    setStatus('Refreshing monitor...');
    const data = await fetchJson('/editor/api/monitor');
    monitorEl.textContent = JSON.stringify(data.monitor, null, 2);
    setStatus('Monitor updated');
}

document.getElementById('btnLoad').addEventListener('click', async () => {
    try {
        await loadConfig();
    } catch (error) {
        setStatus(`Load failed: ${error.message}`, true);
    }
});

document.getElementById('btnSave').addEventListener('click', async () => {
    try {
        await saveConfig();
        await refreshMonitor();
    } catch (error) {
        setStatus(`Save failed: ${error.message}`, true);
    }
});

document.getElementById('btnReset').addEventListener('click', async () => {
    try {
        await resetConfig();
        await refreshMonitor();
    } catch (error) {
        setStatus(`Reset failed: ${error.message}`, true);
    }
});

document.getElementById('btnApplyEvent').addEventListener('click', async () => {
    try {
        await applyEventOverride();
        await refreshMonitor();
    } catch (error) {
        setStatus(`Event apply failed: ${error.message}`, true);
    }
});

document.getElementById('btnMonitor').addEventListener('click', async () => {
    try {
        await refreshMonitor();
    } catch (error) {
        setStatus(`Monitor failed: ${error.message}`, true);
    }
});

(async () => {
    try {
        await loadConfig();
        await refreshMonitor();
    } catch (error) {
        setStatus(`Init failed: ${error.message}`, true);
    }
})();
