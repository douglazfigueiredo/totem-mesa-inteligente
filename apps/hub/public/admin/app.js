// Hub admin SPA — vanilla JS, sem build step.
const SECRET_KEY = 'tm-hub-admin-secret';

const $ = (sel) => document.querySelector(sel);

function getSecret() {
  return sessionStorage.getItem(SECRET_KEY);
}
function setSecret(v) {
  sessionStorage.setItem(SECRET_KEY, v);
}
function clearSecret() {
  sessionStorage.removeItem(SECRET_KEY);
}

async function api(path, opts = {}) {
  const secret = getSecret();
  const res = await fetch(path, {
    ...opts,
    headers: {
      ...(opts.body ? { 'content-type': 'application/json' } : {}),
      ...(secret ? { 'x-admin-secret': secret } : {}),
      ...(opts.headers ?? {}),
    },
  });
  if (res.status === 401) {
    clearSecret();
    showLogin();
    throw new Error('unauthorized');
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

function showLogin() {
  $('#login-view').hidden = false;
  $('#dashboard-view').hidden = true;
  $('#logout-btn').hidden = true;
  $('#secret-input').focus();
}
function showDashboard() {
  $('#login-view').hidden = true;
  $('#dashboard-view').hidden = false;
  $('#logout-btn').hidden = false;
}

function fmtUptime(sec) {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}h ${m}m`;
}

function fmtSince(ms) {
  if (!ms) return 'nunca';
  const diff = Date.now() - ms;
  if (diff < 60_000) return 'agora';
  if (diff < 3600_000) return `há ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `há ${Math.floor(diff / 3600_000)} h`;
  return new Date(ms).toLocaleString('pt-BR');
}

async function loadStatus() {
  try {
    const [health, cloud] = await Promise.all([
      fetch('/health').then((r) => r.json()),
      api('/admin/cloud/status'),
    ]);

    $('#kv-version').textContent = health.version ?? '—';
    $('#kv-uptime').textContent = fmtUptime(health.uptimeSec ?? 0);
    $('#kv-orders').textContent = String(health.db?.ordersCount ?? 0);
    $('#kv-outbox').textContent = String(health.outbox?.pending ?? 0);

    const pairedEl = $('#kv-paired');
    if (cloud.paired) {
      pairedEl.textContent = 'sim';
      pairedEl.className = 'badge paired';
      $('#kv-tenant').textContent = cloud.tenantNome ?? '—';
      $('#kv-cloud-url').textContent = cloud.cloudBaseUrl ?? '—';
      $('#kv-last-sync').textContent = fmtSince(cloud.lastSyncAt);
    } else {
      pairedEl.textContent = 'não';
      pairedEl.className = 'badge unpaired';
      $('#kv-tenant').textContent = '—';
      $('#kv-cloud-url').textContent = '—';
      $('#kv-last-sync').textContent = '—';
    }

    $('#conn-indicator').className = 'conn ok';
  } catch (err) {
    $('#conn-indicator').className = 'conn bad';
    if (err.message !== 'unauthorized') {
      console.error(err);
    }
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const secret = $('#secret-input').value.trim();
  if (!secret) return;
  setSecret(secret);
  $('#login-error').hidden = true;
  try {
    // Valida com endpoint que requer admin
    await api('/admin/cloud/status');
    showDashboard();
    loadStatus();
    setInterval(loadStatus, 10_000);
  } catch {
    $('#login-error').textContent = 'admin secret inválido';
    $('#login-error').hidden = false;
  }
}

async function handlePair(e) {
  e.preventDefault();
  const role = $('#pair-role').value;
  $('#pair-error').hidden = true;
  $('#pair-result').hidden = true;
  try {
    const res = await api('/admin/pairing-codes', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
    $('#pair-code').textContent = res.code;
    const expiresMin = Math.max(
      0,
      Math.round((res.expiresAt - Date.now()) / 60_000),
    );
    $('#pair-meta').textContent = `${role} · expira em ${expiresMin} min`;
    $('#pair-result').hidden = false;
  } catch (err) {
    $('#pair-error').textContent = err.message;
    $('#pair-error').hidden = false;
  }
}

function handleLogout() {
  clearSecret();
  showLogin();
}

// Wiring
$('#login-form').addEventListener('submit', handleLogin);
$('#pair-form').addEventListener('submit', handlePair);
$('#logout-btn').addEventListener('click', handleLogout);
$('#refresh-btn').addEventListener('click', loadStatus);

// Auto-login se já tinha secret
if (getSecret()) {
  showDashboard();
  loadStatus();
  setInterval(loadStatus, 10_000);
} else {
  showLogin();
}
