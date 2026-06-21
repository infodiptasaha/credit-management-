/** activity-log.js */
requireAuth();
initSidebar('activity-log.html');

let page = 1; const limit = 30;

async function loadLogs() {
  const search = document.getElementById('log-search').value.trim();
  const tbody = document.getElementById('log-table');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px"><div class="spinner" style="margin:auto"></div></td></tr>';
  try {
    const params = new URLSearchParams({ page, limit });
    if (search) params.append('search', search);
    const data = await api.get(`/activity-logs?${params}`);
    const logs = data.data || [];
    const total = data.total || 0;
    const pages = Math.ceil(total / limit);

    if (!logs.length) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><div class="icon">📋</div><h3>No activity logs yet</h3></div></td></tr>';
    } else {
      tbody.innerHTML = logs.map(l => `
        <tr>
          <td style="white-space:nowrap;font-size:0.78rem">${formatDateTime(l.createdAt)}</td>
          <td><span class="badge badge-purple">${escapeHtml(l.username||'system')}</span></td>
          <td>${escapeHtml(l.action||'—')}</td>
          <td><span class="badge badge-muted">${escapeHtml(l.entity||'—')}</span></td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.78rem">${l.details ? JSON.stringify(l.details).slice(0,60)+'...' : '—'}</td>
          <td style="font-family:monospace;font-size:0.78rem">${escapeHtml(l.ip||'—')}</td>
        </tr>`).join('');
    }

    const pgEl = document.getElementById('log-pagination');
    if (pages <= 1) { pgEl.innerHTML = ''; return; }
    pgEl.innerHTML = `
      <button class="page-btn" ${page<=1?'disabled':''} onclick="changePage(${page-1})">‹</button>
      <span class="page-info">Page ${page} of ${pages}</span>
      <button class="page-btn" ${page>=pages?'disabled':''} onclick="changePage(${page+1})">›</button>`;
  } catch(err) {
    tbody.innerHTML = `<tr><td colspan="6" style="color:var(--danger);text-align:center;padding:20px">${err.message}</td></tr>`;
  }
}

function changePage(p) { page = p; loadLogs(); }
document.getElementById('btn-refresh').addEventListener('click', loadLogs);
let st;
document.getElementById('log-search').addEventListener('input', () => { clearTimeout(st); st = setTimeout(() => { page=1; loadLogs(); }, 400); });

loadLogs();
