/** users.js */
requireAuth();
initSidebar('users.html');

async function loadUsers() {
  const tbody = document.getElementById('users-table');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px"><div class="spinner" style="margin:auto"></div></td></tr>';
  try {
    const data = await api.get('/users');
    const users = data.data || [];
    if (!users.length) {
      tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><div class="icon">👤</div><h3>No users found</h3></div></td></tr>';
    } else {
      tbody.innerHTML = users.map(u => `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:34px;height:34px;border-radius:50%;background:var(--accent-soft);color:var(--accent);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.78rem;flex-shrink:0">${initials(u.name)}</div>
              <span style="font-weight:600">${escapeHtml(u.name)}</span>
            </div>
          </td>
          <td style="font-family:monospace">${escapeHtml(u.username)}</td>
          <td>${escapeHtml(u.email)}</td>
          <td><span class="badge ${u.role==='admin'?'badge-danger':u.role==='operator'?'badge-warning':'badge-muted'}">${u.role}</span></td>
          <td><span class="badge ${u.isActive?'badge-success':'badge-muted'}">${u.isActive?'Active':'Inactive'}</span></td>
          <td style="font-size:0.8rem">${u.lastLogin?formatDateTime(u.lastLogin):'Never'}</td>
          <td>
            <div style="display:flex;gap:4px">
              <button class="btn btn-sm btn-secondary" onclick="editUser(${JSON.stringify(u).replace(/"/g,'&quot;')})">✏️</button>
              <button class="btn btn-sm btn-danger" onclick="deleteUser('${u._id}','${escapeHtml(u.name)}')">🗑</button>
            </div>
          </td>
        </tr>`).join('');
    }
  } catch(err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color:var(--danger);text-align:center;padding:20px">${err.message}</td></tr>`;
  }
}

document.getElementById('btn-add-user').addEventListener('click', () => {
  document.getElementById('u-edit-id').value = '';
  document.getElementById('user-form').reset();
  document.getElementById('user-modal-title').textContent = 'Add User';
  document.getElementById('u-save-btn').textContent = 'Save User';
  document.getElementById('pwd-hint').style.display = 'none';
  document.getElementById('u-password').required = true;
  openModal('user-modal');
});

function editUser(u) {
  document.getElementById('u-edit-id').value = u._id;
  document.getElementById('u-name').value = u.name;
  document.getElementById('u-username').value = u.username;
  document.getElementById('u-email').value = u.email;
  document.getElementById('u-password').value = '';
  document.getElementById('u-role').value = u.role;
  document.getElementById('u-status').value = String(u.isActive);
  document.getElementById('user-modal-title').textContent = 'Edit User';
  document.getElementById('u-save-btn').textContent = 'Update User';
  document.getElementById('pwd-hint').style.display = 'inline';
  document.getElementById('u-password').required = false;
  openModal('user-modal');
}

async function deleteUser(id, name) {
  if (!confirmAction(`Delete user "${name}"?`)) return;
  try { await api.delete(`/users/${id}`); showToast('User deleted','success'); loadUsers(); }
  catch(err) { showToast(err.message,'error'); }
}

document.getElementById('user-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('u-save-btn');
  btn.disabled = true;
  const id = document.getElementById('u-edit-id').value;
  const body = {
    name: document.getElementById('u-name').value.trim(),
    username: document.getElementById('u-username').value.trim(),
    email: document.getElementById('u-email').value.trim(),
    role: document.getElementById('u-role').value,
    isActive: document.getElementById('u-status').value === 'true',
  };
  const pwd = document.getElementById('u-password').value;
  if (pwd) body.password = pwd;
  try {
    if (id) { await api.put(`/users/${id}`, body); showToast('User updated','success'); }
    else { await api.post('/users', body); showToast('User created','success'); }
    closeModal('user-modal'); loadUsers();
  } catch(err) { showToast(err.message,'error'); }
  btn.disabled = false;
});

loadUsers();
