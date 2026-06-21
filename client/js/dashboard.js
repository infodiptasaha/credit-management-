/** dashboard.js */
requireAuth();
initSidebar('dashboard.html');

document.getElementById('dash-date').textContent = new Date().toLocaleDateString('en-GB', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });

async function loadDashboard() {
  try {
    const data = await api.get('/dashboard');
    const s = data.data || data;

    document.getElementById('stat-customers').textContent = s.totalCustomers ?? '—';
    document.getElementById('stat-credit').textContent = formatMoney(s.totalCredit ?? s.totalCredits ?? 0);
    document.getElementById('stat-debit').textContent = formatMoney(s.totalDebit ?? s.totalDebits ?? 0);
    document.getElementById('stat-outstanding').textContent = formatMoney(s.totalOutstanding ?? s.outstandingBalance ?? 0);

    // Recent transactions
    const txns = s.recentTransactions || [];
    const txEl = document.getElementById('recent-transactions');
    if (!txns.length) {
      txEl.innerHTML = '<div class="empty-state"><div class="icon">💸</div><h3>No transactions yet</h3></div>';
    } else {
      txEl.innerHTML = `<div class="table-wrapper"><table>
        <thead><tr><th>Customer</th><th>Type</th><th>Amount</th><th>Date</th></tr></thead>
        <tbody>${txns.map(t => `
          <tr>
            <td>${escapeHtml(t.customerId?.name || '—')}</td>
            <td><span class="badge ${t.type==='credit'?'badge-danger':'badge-success'}">${t.type}</span></td>
            <td class="${t.type==='credit'?'text-danger':'text-success'}">${formatMoney(t.amount)}</td>
            <td>${formatDate(t.date)}</td>
          </tr>`).join('')}
        </tbody></table></div>`;
    }

    // Top customers
    const custs = s.topCustomers || [];
    const cEl = document.getElementById('top-customers');
    if (!custs.length) {
      cEl.innerHTML = '<div class="empty-state"><div class="icon">👥</div><h3>No customers yet</h3></div>';
    } else {
      cEl.innerHTML = custs.map((c, i) => `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
          <div style="width:28px;height:28px;border-radius:50%;background:var(--accent-soft);color:var(--accent);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.78rem">${i+1}</div>
          <div style="flex:1">
            <div style="font-weight:600;font-size:0.875rem">${escapeHtml(c.name)}</div>
            <div style="font-size:0.75rem;color:var(--text-secondary)">${c.customerCode||''}</div>
          </div>
          <div class="${c.currentBalance>0?'amount-negative':'amount-positive'}">${formatMoney(c.currentBalance)}</div>
        </div>`).join('');
    }
  } catch(err) {
    showToast(err.message, 'error');
  }
}

loadDashboard();
