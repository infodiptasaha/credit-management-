/** customer-detail.js */
requireAuth();
initSidebar('customers.html');

const customerId = getParam('id');
if (!customerId) window.location.href = 'customers.html';

let histPage = 1;
const histLimit = 20;

async function loadCustomer() {
  try {
    const data = await api.get(`/customers/${customerId}`);
    const c = data.data;
    document.getElementById('detail-title').textContent = c.name;
    document.title = `${c.name} — Credit Management`;

    const balClass = c.currentBalance > 0 ? 'amount-negative' : c.currentBalance < 0 ? 'amount-positive' : '';
    document.getElementById('customer-info-card').innerHTML = `
      <div class="grid-2">
        <div>
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
            <div style="width:56px;height:56px;border-radius:14px;background:var(--accent-soft);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:1.4rem;font-weight:800">${initials(c.name)}</div>
            <div>
              <h2 style="font-size:1.2rem;font-weight:800">${escapeHtml(c.name)}</h2>
              <span class="badge badge-purple">${escapeHtml(c.customerCode)}</span>
              <span class="badge ${c.status==='active'?'badge-success':'badge-muted'}" style="margin-left:6px">${c.status}</span>
            </div>
          </div>
          <div style="display:grid;gap:10px">
            ${c.phone?`<div><span style="color:var(--text-secondary);font-size:0.8rem">📞 Phone</span><div style="font-weight:500;margin-top:2px">${escapeHtml(c.phone)}</div></div>`:''}
            ${c.email?`<div><span style="color:var(--text-secondary);font-size:0.8rem">✉️ Email</span><div style="font-weight:500;margin-top:2px">${escapeHtml(c.email)}</div></div>`:''}
            ${c.address?`<div><span style="color:var(--text-secondary);font-size:0.8rem">📍 Address</span><div style="font-weight:500;margin-top:2px">${escapeHtml(c.address)}</div></div>`:''}
            ${c.notes?`<div><span style="color:var(--text-secondary);font-size:0.8rem">📝 Notes</span><div style="font-weight:500;margin-top:2px">${escapeHtml(c.notes)}</div></div>`:''}
          </div>
        </div>
        <div style="display:grid;gap:14px;align-content:start">
          <div class="stat-card amber" style="margin:0">
            <div class="stat-icon amber">⚖️</div>
            <div class="stat-value ${balClass}">${formatMoney(c.currentBalance)}</div>
            <div class="stat-label">Current Balance</div>
          </div>
          <div class="stat-card teal" style="margin:0">
            <div class="stat-icon teal">🏦</div>
            <div class="stat-value">${formatMoney(c.creditLimit)}</div>
            <div class="stat-label">Credit Limit</div>
          </div>
          <div style="font-size:0.8rem;color:var(--text-secondary)">
            <div>Added: ${formatDate(c.createdAt)}</div>
            ${c.createdBy?`<div>By: ${escapeHtml(c.createdBy.name||c.createdBy.username||'')}</div>`:''}
          </div>
        </div>
      </div>`;
  } catch(err) {
    document.getElementById('customer-info-card').innerHTML = `<div style="color:var(--danger)">${err.message}</div>`;
  }
}

async function loadHistory() {
  const start = document.getElementById('filter-start').value;
  const end = document.getElementById('filter-end').value;
  const tbody = document.getElementById('history-table');
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px"><div class="spinner" style="margin:auto"></div></td></tr>';

  try {
    const params = new URLSearchParams({ page: histPage, limit: histLimit });
    if (start) params.append('startDate', start);
    if (end) params.append('endDate', end);
    const data = await api.get(`/customers/${customerId}/history?${params}`);
    const entries = data.data || [];
    const total = data.total || 0;
    const pages = Math.ceil(total / histLimit);

    if (!entries.length) {
      tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><div class="icon">💳</div><h3>No transactions found</h3></div></td></tr>';
    } else {
      tbody.innerHTML = entries.map(e => `
        <tr>
          <td><span style="font-family:monospace;font-size:0.78rem">${escapeHtml(e.transactionNo||'—')}</span></td>
          <td>${formatDate(e.date)}</td>
          <td><span class="badge ${e.type==='credit'?'badge-danger':'badge-success'}">${e.type}</span></td>
          <td class="${e.type==='credit'?'text-danger':'text-success'} font-bold">${formatMoney(e.amount)}</td>
          <td>${formatMoney(e.previousBalance)}</td>
          <td class="${e.newBalance>0?'text-danger':e.newBalance<0?'text-success':''}">${formatMoney(e.newBalance)}</td>
          <td style="max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(e.description||'—')}</td>
          <td>
            <div style="display:flex;gap:4px">
              <button class="btn btn-sm btn-secondary" onclick="editEntry(${JSON.stringify(e).replace(/"/g,'&quot;')})">✏️</button>
              <button class="btn btn-sm btn-danger" onclick="deleteEntry('${e._id}')">🗑</button>
            </div>
          </td>
        </tr>`).join('');
    }

    const pgEl = document.getElementById('history-pagination');
    if (pages <= 1) { pgEl.innerHTML = ''; return; }
    pgEl.innerHTML = `
      <button class="page-btn" ${histPage<=1?'disabled':''} onclick="changeHistPage(${histPage-1})">‹ Prev</button>
      <span class="page-info">Page ${histPage} of ${pages}</span>
      <button class="page-btn" ${histPage>=pages?'disabled':''} onclick="changeHistPage(${histPage+1})">Next ›</button>`;
  } catch(err) {
    tbody.innerHTML = `<tr><td colspan="8" style="color:var(--danger);text-align:center;padding:20px">${err.message}</td></tr>`;
  }
}

function changeHistPage(p) { histPage = p; loadHistory(); }

document.getElementById('btn-filter').addEventListener('click', () => { histPage = 1; loadHistory(); });

// Set today's date as default
document.getElementById('e-date').valueAsDate = new Date();

document.getElementById('btn-add-entry').addEventListener('click', () => {
  document.getElementById('entry-edit-id').value = '';
  document.getElementById('entry-form').reset();
  document.getElementById('e-date').valueAsDate = new Date();
  document.getElementById('entry-modal-title').textContent = 'Add Transaction';
  openModal('entry-modal');
});

function editEntry(e) {
  document.getElementById('entry-edit-id').value = e._id;
  document.getElementById('e-type').value = e.type;
  document.getElementById('e-amount').value = e.amount;
  document.getElementById('e-date').value = e.date ? e.date.slice(0,10) : '';
  document.getElementById('e-desc').value = e.description || '';
  document.getElementById('entry-modal-title').textContent = 'Edit Transaction';
  openModal('entry-modal');
}

async function deleteEntry(id) {
  if (!confirmAction('Delete this transaction? This cannot be undone.')) return;
  try {
    await api.delete(`/credit-entries/${id}`);
    showToast('Transaction deleted', 'success');
    loadHistory();
    loadCustomer();
  } catch(err) { showToast(err.message, 'error'); }
}

document.getElementById('entry-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('entry-save-btn');
  btn.disabled = true;
  const id = document.getElementById('entry-edit-id').value;
  const body = {
    customerId,
    type: document.getElementById('e-type').value,
    amount: parseFloat(document.getElementById('e-amount').value),
    date: document.getElementById('e-date').value,
    description: document.getElementById('e-desc').value.trim(),
  };
  try {
    if (id) { await api.put(`/credit-entries/${id}`, body); showToast('Transaction updated', 'success'); }
    else { await api.post('/credit-entries', body); showToast('Transaction added', 'success'); }
    closeModal('entry-modal');
    loadHistory();
    loadCustomer();
  } catch(err) { showToast(err.message, 'error'); }
  btn.disabled = false;
});

loadCustomer();
loadHistory();
