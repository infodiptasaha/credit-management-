/**
 * api.js — Shared API helper for Credit Management System
 * Handles auth token, base URL, and all fetch calls
 */

const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : 'https://credit-management-djsu.onrender.com/api';

// ── Token management ──────────────────────────────────────────
const token = {
  get: () => localStorage.getItem('cm_token'),
  set: (t) => localStorage.setItem('cm_token', t),
  remove: () => localStorage.removeItem('cm_token'),
};

const currentUser = {
  get: () => { try { return JSON.parse(localStorage.getItem('cm_user')); } catch { return null; } },
  set: (u) => localStorage.setItem('cm_user', JSON.stringify(u)),
  remove: () => localStorage.removeItem('cm_user'),
};

// ── Check auth on every protected page ───────────────────────
function requireAuth() {
  if (!token.get()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function redirectIfLoggedIn() {
  if (token.get()) {
    window.location.href = 'dashboard.html';
  }
}

// ── Core fetch wrapper ────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const t = token.get();
  if (t) headers['Authorization'] = `Bearer ${t}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (err) {
    throw new Error('Cannot connect to server. Please check backend is running.');
  }

  let data;
  try { data = await res.json(); } catch { data = {}; }

  if (res.status === 401) {
    token.remove();
    currentUser.remove();
    window.location.href = 'login.html';
    return;
  }

  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

const api = {
  get: (path) => apiFetch(path),
  post: (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => apiFetch(path, { method: 'DELETE' }),
};

// ── Toast notifications ───────────────────────────────────────
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || '💬'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(40px)'; toast.style.transition = '0.3s'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// ── Modal helpers ─────────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

// ── Formatting helpers ────────────────────────────────────────
function formatMoney(v, currency = 'BDT') {
  if (v === null || v === undefined) return '—';
  const n = Number(v);
  return `৳ ${Math.abs(n).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Sidebar & mobile menu ─────────────────────────────────────
function initSidebar(activeHref) {
  // Set active nav item
  document.querySelectorAll('.nav-item').forEach(el => {
    if (el.getAttribute('href') === activeHref) el.classList.add('active');
  });

  // Populate user info
  const user = currentUser.get();
  if (user) {
    const nameEl = document.getElementById('sidebar-username');
    const roleEl = document.getElementById('sidebar-role');
    const avatarEl = document.getElementById('sidebar-avatar');
    if (nameEl) nameEl.textContent = user.name || user.username;
    if (roleEl) roleEl.textContent = user.role || 'user';
    if (avatarEl) avatarEl.textContent = initials(user.name || user.username);
  }

  // Mobile toggle
  const toggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('show');
    });
    if (overlay) overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('show');
    });
  }

  // Logout
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      token.remove();
      currentUser.remove();
      window.location.href = 'login.html';
    });
  }
}

// ── Confirm dialog (simple) ───────────────────────────────────
function confirmAction(message) {
  return window.confirm(message);
}

// ── URL param helper ──────────────────────────────────────────
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}
