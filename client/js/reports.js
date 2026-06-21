/** reports.js */
requireAuth();
initSidebar('reports.html');

let reportData = [];

async function loadCustomers() {
  try {
    const data = await api.get('/customers?limit=500');
    const sel = document.getElementById('r-customer');
    (data.data||[]).forEach(c => {
      const o = document.createElement('option');
      o.value = c._id; o.textContent = `${c.name} (${c.customerCode})`;
      sel.appendChild(o);
    });
  } catch(e) {}
}

document.getElementById('btn-generate-report').addEventListener('click', async () => {
  const customerId = document.getElementById('r-customer').value;
  const start = document.getElementById('r-start').value;
  const end = document.getElementById('r-end').value;

  try {
    const params = new URLSearchParams();
    if (customerId) params.append('customerId', customerId);
    if (start) params.append('startDate', start);
    if (end) params.append('endDate', end);

    const data = await api.get(`/reports/summary?${params}`);
    const s = data.data || data;
    reportData = s.entries || s.transactions || [];

    document.getElementById('report-results').style.display = 'block';

    const totalCredit = reportData.filter(e=>e.type==='credit').reduce((a,e)=>a+e.amount,0);
    const totalDebit = reportData.filter(e=>e.type==='debit').reduce((a,e)=>a+e.amount,0);

    document.getElementById('report-stats').innerHTML = `
      <div class="stat-card purple"><div class="stat-icon purple">📋</div><div class="stat-value">${reportData.length}</div><div class="stat-label">Total Transactions</div></div>
      <div class="stat-card rose"><div class="stat-icon rose">💸</div><div class="stat-value">${formatMoney(totalCredit)}</div><div class="stat-label">Total Credit Given</div></div>
      <div class="stat-card teal"><div class="stat-icon teal">💰</div><div class="stat-value">${formatMoney(totalDebit)}</div><div class="stat-label">Total Received</div></div>
      <div class="stat-card amber"><div class="stat-icon amber">⚖️</div><div class="stat-value">${formatMoney(totalCredit-totalDebit)}</div><div class="stat-label">Net Outstanding</div></div>`;

    document.getElementById('report-table').innerHTML = !reportData.length
      ? '<tr><td colspan="7"><div class="empty-state"><div class="icon">📊</div><h3>No data for this period</h3></div></td></tr>'
      : reportData.map(e => `
          <tr>
            <td>${escapeHtml(e.customerId?.name||'—')}</td>
            <td style="font-family:monospace;font-size:0.78rem">${escapeHtml(e.transactionNo||'—')}</td>
            <td>${formatDate(e.date)}</td>
            <td><span class="badge ${e.type==='credit'?'badge-danger':'badge-success'}">${e.type}</span></td>
            <td class="${e.type==='credit'?'text-danger':'text-success'} font-bold">${formatMoney(e.amount)}</td>
            <td>${formatMoney(e.newBalance)}</td>
            <td>${escapeHtml(e.description||'—')}</td>
          </tr>`).join('');
  } catch(err) {
    showToast(err.message || 'Failed to generate report', 'error');
  }
});

// CSV Export
document.getElementById('btn-export-csv').addEventListener('click', () => {
  if (!reportData.length) { showToast('Generate a report first', 'warning'); return; }
  const rows = [['Customer','Txn #','Date','Type','Amount','Balance','Description']];
  reportData.forEach(e => rows.push([
    e.customerId?.name||'', e.transactionNo||'', formatDate(e.date),
    e.type, e.amount, e.newBalance, e.description||''
  ]));
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], {type:'text/csv'}));
  a.download = `report-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
});

loadCustomers();
