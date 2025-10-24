// ---- elements
const $ = (s, r=document) => r.querySelector(s);
const log = $('#log');
const formSend = $('#send');
const inputMsg = $('#msg');
const nameInput = $('#name');
const statusEl = $('#status');

let ws;
let reconnectTimer;
let currentName;
// Stable session id per browser
let sid = localStorage.getItem('gddSid');
if (!sid) {
    sid = (crypto.randomUUID ? crypto.randomUUID()
        : Math.random().toString(36).slice(2) + Date.now().toString(36));
    localStorage.setItem('gddSid', sid);
}
let intentionalClose = false;  // set true when we close on purpose (e.g., name change)
let firstOpen = true;          // only show "joined" once per page load

// ---- ui helpers
function addLine(text, cls='') {
    const div = document.createElement('div');
    div.className = `line ${cls}`;
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
}
function setStatus(online) {
    statusEl.textContent = online ? '● online' : '● offline';
    statusEl.classList.toggle('online', online);
    statusEl.classList.toggle('offline', !online);
    formSend.querySelector('button').disabled = !online;
    inputMsg.disabled = !online;
}

// ---- name handling (no popup)
function loadName() {
    const saved = localStorage.getItem('gddName') || '';
    nameInput.value = saved;
    currentName = saved || 'anon';
}
function saveName() {
    const n = nameInput.value.trim().slice(0,24) || 'anon';
    localStorage.setItem('gddName', n);
    currentName = n;
}

// ---- ws helpers
function wsURL(name) {
    const proto = location.protocol === 'https:' ? 'wss://' : 'ws://';
    return `${proto}${location.host}/ws/chat?name=${encodeURIComponent(name)}&sid=${encodeURIComponent(sid)}`;
}

function connect() {
    clearTimeout(reconnectTimer);
    const url = wsURL(currentName);
    ws = new WebSocket(url);

    ws.addEventListener('open', () => {
        setStatus(true);
        // Only say "joined" on the very first connection this page load
        if (firstOpen) {
            addLine(`You joined as ${currentName}`, 'sys');
            firstOpen = false;
        }
        // reset the flag after a successful open
        intentionalClose = false;
    });

    ws.addEventListener('message', (e) => {
        const text = String(e.data);
        if (text.startsWith(currentName + ':')) addLine(text, 'me');
        else addLine(text);
    });

    ws.addEventListener('close', () => {
        setStatus(false);
        // If we closed intentionally (e.g., renaming), don't log "reconnecting…"
        if (!intentionalClose) {
            // Keep this silent or add a very small status if you want
            // addLine('Disconnected — reconnecting…', 'sys');
        }
        reconnectTimer = setTimeout(connect, 1500);
    });

    ws.addEventListener('error', () => {
        // errors will lead to close; keep UI calm
    });
}

// ---- events
formSend.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = inputMsg.value.trim();
    if (!v || !ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(v);
    inputMsg.value = '';
});

$('#profile').addEventListener('submit', (e) => e.preventDefault());

// Change name inline → save + reconnect (no spam)
nameInput.addEventListener('change', () => {
    saveName();
    addLine(`Renamed to ${currentName}`, 'sys');
    if (ws && ws.readyState === WebSocket.OPEN) {
        intentionalClose = true;
        ws.close();        // will reconnect with the new name
    } else {
        connect();
    }
});

// Close cleanly when navigating away (lets server broadcast "left the chat")
window.addEventListener('beforeunload', () => {
    intentionalClose = true;
    try { ws && ws.close(); } catch {}
});

// ---- init
loadName();
setStatus(false);
connect();
