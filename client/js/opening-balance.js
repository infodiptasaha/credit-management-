/** opening-balance.js */
requireAuth();
initSidebar('opening-balance.html');

async function loadOB() {
  const search = document.getElementById('ob-search').value.trim();
  const tbody = document.getElementById('ob-table');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px"><div class="spinner" style="margin:auto"></div></td></tr>';
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    const data = await api.get(`/opening-balance?${params}`);
    const rows = data.data || [];
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><div class="icon">🟢</div><h3>No opening balances set</h3></div></td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td><a href="customer-detail.html?id=${r.customerId?._id||r.customerId}" style="color:var(--accent);text-decoration:none;font-weight:600">${escapeHtml(r.customerId?.name||'—')}</a></td>
        <td><span class="badge badge-purple">${escapeHtml(r.customerId?.customerCode||'—')}</span></td>
        <td class="font-bold amount-neutral">${formatMoney(r.amount)}</td>
        <td>${formatDate(r.date)}</td>
        <td>${escapeHtml(r.remarks||'—')}</td>
        <td>${escapeHtml(r.setBy?.name||r.setBy?.username||'—')}</td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="editOB(${JSON.stringify(r).replace(/"/g,'&quot;')})">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="deleteOB('${r._id}')">🗑</button>
        </td>
      </tr>`).join('');
  } catch(err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color:var(--danger);text-align:center;padding:20px">${err.message}</td></tr>`;
  }
}

async function loadCustomers() {
  try {
    const data = await api.get('/customers?limit=500');
    const sel = document.getElementById('ob-customer');
    (data.data||[]).forEach(c => {
      const o = document.createElement('option');
      o.value = c._id; o.textContent = `${c.name} (${c.customerCode})`;
      sel.appendChild(o);
    });
  } catch(e) {}
}

document.getElementById('btn-add-ob').addEventListener('click', () => {
  document.getElementById('ob-edit-id').value = '';
  document.getElementById('ob-form').reset();
  document.getElementById('ob-date').valueAsDate = new Date();
  document.getElementById('ob-modal-title').textContent = 'Set Opening Balance';
  openModal('ob-modal');
});

document.getElementById('btn-refresh').addEventListener('click', loadOB);
let st;
document.getElementById('ob-search').addEventListener('input', () => { clearTimeout(st); st = setTimeout(loadOB, 400); });

function editOB(r) {
  document.getElementById('ob-edit-id').value = r._id;
  document.getElementById('ob-customer').value = r.customerId?._id||r.customerId;
  document.getElementById('ob-amount').value = r.amount;
  document.getElementById('ob-date').value = r.date?.slice(0,10)||'';
  document.getElementById('ob-remarks').value = r.remarks||'';
  document.getElementById('ob-modal-title').textContent = 'Edit Opening Balance';
  openModal('ob-modal');
}

async function deleteOB(id) {
  if (!confirmAction('Delete this opening balance?')) return;
  try { await api.delete(`/opening-balance/${id}`); showToast('Deleted','success'); loadOB(); }
  catch(err) { showToast(err.message,'error'); }
}

document.getElementById('ob-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('ob-edit-id').value;
  const body = {
    customerId: document.getElementById('ob-customer').value,
    amount: parseFloat(document.getElementById('ob-amount').value),
    date: document.getElementById('ob-date').value,
    remarks: document.getElementById('ob-remarks').value.trim(),
  };
  try {
    if (id) { await api.put(`/opening-balance/${id}`, body); showToast('Updated','success'); }
    else { await api.post('/opening-balance', body); showToast('Saved','success'); }
    closeModal('ob-modal'); loadOB();
  } catch(err) { showToast(err.message,'error'); }
});

loadCustomers();
loadOB();
