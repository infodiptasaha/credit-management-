/** transactions.js */
requireAuth();
initSidebar('transactions.html');

let page = 1; const limit = 20;

async function loadTxns() {
  const search = document.getElementById('txn-search').value.trim();
  const type = document.getElementById('txn-type').value;
  const start = document.getElementById('txn-start').value;
  const end = document.getElementById('txn-end').value;
  const tbody = document.getElementById('txn-table');
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px"><div class="spinner" style="margin:auto"></div></td></tr>';

  try {
    const params = new URLSearchParams({ page, limit });
    if (search) params.append('search', search);
    if (type) params.append('type', type);
    if (start) params.append('startDate', start);
    if (end) params.append('endDate', end);

    const data = await api.get(`/credit-entries?${params}`);
    const entries = data.data || [];
    const total = data.total || 0;
    const pages = Math.ceil(total / limit);

    if (!entries.length) {
      tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><div class="icon">💰</div><h3>No transactions found</h3></div></td></tr>';
    } else {
      tbody.innerHTML = entries.map(e => `
        <tr>
          <td><span style="font-family:monospace;font-size:0.78rem">${escapeHtml(e.transactionNo||'—')}</span></td>
          <td><a href="customer-detail.html?id=${e.customerId?._id||e.customerId}" style="color:var(--accent);text-decoration:none">${escapeHtml(e.customerId?.name||'—')}</a></td>
          <td>${formatDate(e.date)}</td>
          <td><span class="badge ${e.type==='credit'?'badge-danger':'badge-success'}">${e.type}</span></td>
          <td class="${e.type==='credit'?'text-danger':'text-success'} font-bold">${formatMoney(e.amount)}</td>
          <td class="${e.newBalance>0?'text-danger':e.newBalance<0?'text-success':''}">${formatMoney(e.newBalance)}</td>
          <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(e.description||'—')}</td>
          <td>
            <div style="display:flex;gap:4px">
              <button class="btn btn-sm btn-secondary" onclick="editTxn(${JSON.stringify(e).replace(/"/g,'&quot;')})">✏️</button>
              <button class="btn btn-sm btn-danger" onclick="deleteTxn('${e._id}')">🗑</button>
            </div>
          </td>
        </tr>`).join('');
    }

    const pgEl = document.getElementById('txn-pagination');
    if (pages <= 1) { pgEl.innerHTML = ''; return; }
    pgEl.innerHTML = `
      <button class="page-btn" ${page<=1?'disabled':''} onclick="changePage(${page-1})">‹</button>
      <span class="page-info">Page ${page} of ${pages} (${total})</span>
      <button class="page-btn" ${page>=pages?'disabled':''} onclick="changePage(${page+1})">›</button>`;
  } catch(err) {
    tbody.innerHTML = `<tr><td colspan="8" style="color:var(--danger);text-align:center;padding:20px">${err.message}</td></tr>`;
  }
}

function changePage(p) { page = p; loadTxns(); }

let searchTimer;
document.getElementById('txn-search').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { page=1; loadTxns(); }, 400); });
document.getElementById('btn-filter').addEventListener('click', () => { page=1; loadTxns(); });

// Load customers for dropdown
async function loadCustomerList() {
  try {
    const data = await api.get('/customers?limit=500');
    const sel = document.getElementById('t-customer');
    (data.data||[]).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c._id;
      opt.textContent = `${c.name} (${c.customerCode})`;
      sel.appendChild(opt);
    });
  } catch(e) {}
}

document.getElementById('btn-add-txn').addEventListener('click', () => {
  document.getElementById('txn-edit-id').value = '';
  document.getElementById('txn-form').reset();
  document.getElementById('t-date').valueAsDate = new Date();
  document.getElementById('txn-modal-title').textContent = 'Add Transaction';
  openModal('txn-modal');
});

function editTxn(e) {
  document.getElementById('txn-edit-id').value = e._id;
  document.getElementById('t-customer').value = e.customerId?._id || e.customerId;
  document.getElementById('t-type').value = e.type;
  document.getElementById('t-amount').value = e.amount;
  document.getElementById('t-date').value = e.date?.slice(0,10) || '';
  document.getElementById('t-desc').value = e.description || '';
  document.getElementById('txn-modal-title').textContent = 'Edit Transaction';
  openModal('txn-modal');
}

async function deleteTxn(id) {
  if (!confirmAction('Delete this transaction?')) return;
  try {
    await api.delete(`/credit-entries/${id}`);
    showToast('Deleted', 'success');
    loadTxns();
  } catch(err) { showToast(err.message, 'error'); }
}

document.getElementById('txn-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('txn-save-btn');
  btn.disabled = true;
  const id = document.getElementById('txn-edit-id').value;
  const body = {
    customerId: document.getElementById('t-customer').value,
    type: document.getElementById('t-type').value,
    amount: parseFloat(document.getElementById('t-amount').value),
    date: document.getElementById('t-date').value,
    description: document.getElementById('t-desc').value.trim(),
  };
  try {
    if (id) { await api.put(`/credit-entries/${id}`, body); showToast('Updated', 'success'); }
    else { await api.post('/credit-entries', body); showToast('Added', 'success'); }
    closeModal('txn-modal');
    loadTxns();
  } catch(err) { showToast(err.message, 'error'); }
  btn.disabled = false;
});

loadCustomerList();
loadTxns();
