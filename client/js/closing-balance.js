/** closing-balance.js */
requireAuth();
initSidebar('closing-balance.html');

async function loadCB() {
  const start = document.getElementById('cb-start').value;
  const end = document.getElementById('cb-end').value;
  const tbody = document.getElementById('cb-table');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px"><div class="spinner" style="margin:auto"></div></td></tr>';
  try {
    const params = new URLSearchParams();
    if (start) params.append('startDate', start);
    if (end) params.append('endDate', end);
    const data = await api.get(`/closing-balance?${params}`);
    const rows = data.data || [];
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><div class="icon">🔴</div><h3>No closing balances generated</h3></div></td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td><a href="customer-detail.html?id=${r.customerId?._id||r.customerId}" style="color:var(--accent);text-decoration:none;font-weight:600">${escapeHtml(r.customerId?.name||'—')}</a></td>
        <td>${formatDate(r.date)}</td>
        <td>${formatMoney(r.openingBalance)}</td>
        <td class="text-danger">${formatMoney(r.totalCredits)}</td>
        <td class="text-success">${formatMoney(r.totalDebits)}</td>
        <td class="${r.closingBalance>0?'text-danger':'text-success'} font-bold">${formatMoney(r.closingBalance)}</td>
        <td>${escapeHtml(r.generatedBy?.name||r.generatedBy?.username||'—')}</td>
      </tr>`).join('');
  } catch(err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color:var(--danger);text-align:center;padding:20px">${err.message}</td></tr>`;
  }
}

async function loadCustomers() {
  try {
    const data = await api.get('/customers?limit=500');
    const sel = document.getElementById('cb-customer');
    (data.data||[]).forEach(c => {
      const o = document.createElement('option');
      o.value = c._id; o.textContent = `${c.name} (${c.customerCode})`;
      sel.appendChild(o);
    });
  } catch(e) {}
}

document.getElementById('btn-generate').addEventListener('click', () => {
  document.getElementById('cb-form').reset();
  document.getElementById('cb-date').valueAsDate = new Date();
  openModal('cb-modal');
});

document.getElementById('btn-filter').addEventListener('click', loadCB);
document.getElementById('btn-refresh').addEventListener('click', loadCB);

document.getElementById('cb-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = {
    customerId: document.getElementById('cb-customer').value,
    date: document.getElementById('cb-date').value,
  };
  try {
    await api.post('/closing-balance', body);
    showToast('Closing balance generated', 'success');
    closeModal('cb-modal'); loadCB();
  } catch(err) { showToast(err.message, 'error'); }
});

loadCustomers();
loadCB();
