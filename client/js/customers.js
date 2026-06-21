/** customers.js */
requireAuth();
initSidebar('customers.html');

let currentPage = 1;
const limit = 20;

async function loadCustomers() {
  const search = document.getElementById('search-input').value.trim();
  const status = document.getElementById('status-filter').value;
  const tbody = document.getElementById('customers-table');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px"><div class="spinner" style="margin:auto"></div></td></tr>';

  try {
    const params = new URLSearchParams({ page: currentPage, limit });
    if (search) params.append('search', search);
    if (status) params.append('status', status);

    const data = await api.get(`/customers?${params}`);
    const customers = data.data || [];
    const total = data.total || 0;
    const pages = data.pages || 1;

    if (!customers.length) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><div class="icon">👥</div><h3>No customers found</h3><p>Add your first customer to get started</p></div></td></tr>';
    } else {
      tbody.innerHTML = customers.map(c => `
        <tr>
          <td><span class="badge badge-purple">${escapeHtml(c.customerCode)}</span></td>
          <td><a href="customer-detail.html?id=${c._id}" style="color:var(--text-primary);text-decoration:none;font-weight:600">${escapeHtml(c.name)}</a></td>
          <td>${escapeHtml(c.phone || '—')}</td>
          <td>${formatMoney(c.creditLimit)}</td>
          <td class="${c.currentBalance > 0 ? 'amount-negative' : c.currentBalance < 0 ? 'amount-positive' : ''}">${formatMoney(c.currentBalance)}</td>
          <td><span class="badge ${c.status === 'active' ? 'badge-success' : 'badge-muted'}">${c.status}</span></td>
          <td>
            <div style="display:flex;gap:6px">
              <a href="customer-detail.html?id=${c._id}" class="btn btn-sm btn-secondary">👁 View</a>
              <button class="btn btn-sm btn-secondary" onclick="editCustomer(${JSON.stringify(c).replace(/"/g,'&quot;')})">✏️</button>
              <button class="btn btn-sm btn-danger" onclick="deleteCustomer('${c._id}','${escapeHtml(c.name)}')">🗑</button>
            </div>
          </td>
        </tr>`).join('');
    }

    // Pagination
    const pgEl = document.getElementById('pagination');
    if (pages <= 1) { pgEl.innerHTML = ''; return; }
    pgEl.innerHTML = `
      <button class="page-btn" ${currentPage<=1?'disabled':''} onclick="changePage(${currentPage-1})">‹ Prev</button>
      <span class="page-info">Page ${currentPage} of ${pages} (${total} total)</span>
      <button class="page-btn" ${currentPage>=pages?'disabled':''} onclick="changePage(${currentPage+1})">Next ›</button>`;
  } catch(err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--danger)">${err.message}</td></tr>`;
  }
}

function changePage(p) { currentPage = p; loadCustomers(); }

// Debounce search
let searchTimer;
document.getElementById('search-input').addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { currentPage = 1; loadCustomers(); }, 400);
});
document.getElementById('status-filter').addEventListener('change', () => { currentPage = 1; loadCustomers(); });
document.getElementById('btn-refresh').addEventListener('click', loadCustomers);

// Add customer
document.getElementById('btn-add-customer').addEventListener('click', () => {
  document.getElementById('edit-id').value = '';
  document.getElementById('customer-form').reset();
  document.getElementById('modal-title').textContent = 'Add Customer';
  document.getElementById('save-btn').textContent = 'Save Customer';
  openModal('customer-modal');
});

// Edit
function editCustomer(c) {
  document.getElementById('edit-id').value = c._id;
  document.getElementById('f-name').value = c.name || '';
  document.getElementById('f-phone').value = c.phone || '';
  document.getElementById('f-email').value = c.email || '';
  document.getElementById('f-limit').value = c.creditLimit || 0;
  document.getElementById('f-address').value = c.address || '';
  document.getElementById('f-status').value = c.status || 'active';
  document.getElementById('f-notes').value = c.notes || '';
  document.getElementById('modal-title').textContent = 'Edit Customer';
  document.getElementById('save-btn').textContent = 'Update Customer';
  openModal('customer-modal');
}

// Delete
async function deleteCustomer(id, name) {
  if (!confirmAction(`Delete customer "${name}"? This cannot be undone.`)) return;
  try {
    await api.delete(`/customers/${id}`);
    showToast('Customer deleted successfully', 'success');
    loadCustomers();
  } catch(err) { showToast(err.message, 'error'); }
}

// Save form
document.getElementById('customer-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('save-btn');
  btn.disabled = true;
  const id = document.getElementById('edit-id').value;
  const body = {
    name: document.getElementById('f-name').value.trim(),
    phone: document.getElementById('f-phone').value.trim(),
    email: document.getElementById('f-email').value.trim(),
    creditLimit: parseFloat(document.getElementById('f-limit').value) || 0,
    address: document.getElementById('f-address').value.trim(),
    status: document.getElementById('f-status').value,
    notes: document.getElementById('f-notes').value.trim(),
  };
  try {
    if (id) { await api.put(`/customers/${id}`, body); showToast('Customer updated', 'success'); }
    else { await api.post('/customers', body); showToast('Customer added', 'success'); }
    closeModal('customer-modal');
    loadCustomers();
  } catch(err) { showToast(err.message, 'error'); }
  btn.disabled = false;
});

loadCustomers();
