/** settings.js */
requireAuth();
initSidebar('settings.html');

const user = currentUser.get();

// Show user info
if (user) {
  document.getElementById('s-username').textContent = user.username || user.name;
  document.getElementById('s-role').textContent = user.role;
  document.getElementById('profile-section').innerHTML = `
    <div class="form-row">
      <div><span style="color:var(--text-secondary);font-size:0.8rem">Full Name</span><div style="font-weight:600;margin-top:4px">${escapeHtml(user.name||'')}</div></div>
      <div><span style="color:var(--text-secondary);font-size:0.8rem">Username</span><div style="font-weight:600;margin-top:4px">${escapeHtml(user.username||'')}</div></div>
      <div><span style="color:var(--text-secondary);font-size:0.8rem">Email</span><div style="font-weight:600;margin-top:4px">${escapeHtml(user.email||'')}</div></div>
      <div><span style="color:var(--text-secondary);font-size:0.8rem">Role</span><div style="margin-top:4px"><span class="badge ${user.role==='admin'?'badge-danger':user.role==='operator'?'badge-warning':'badge-muted'}">${user.role}</span></div></div>
    </div>`;
}

// Load saved API URL
const savedUrl = localStorage.getItem('cm_api_url');
if (savedUrl) document.getElementById('s-api-url').value = savedUrl;

document.getElementById('btn-save-api').addEventListener('click', () => {
  const url = document.getElementById('s-api-url').value.trim();
  if (url) localStorage.setItem('cm_api_url', url);
  else localStorage.removeItem('cm_api_url');
  showToast('API URL saved. Reload the page to apply.', 'success');
});

// Check API health
async function checkHealth() {
  try {
    const data = await api.get('/health');
    document.getElementById('api-status').innerHTML = '<span class="badge badge-success">✅ Online</span>';
  } catch {
    document.getElementById('api-status').innerHTML = '<span class="badge badge-danger">❌ Offline</span>';
  }
}
checkHealth();

// Change password
document.getElementById('pwd-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('pwd-btn');
  const newPwd = document.getElementById('s-new-pwd').value;
  const confirmPwd = document.getElementById('s-confirm-pwd').value;
  if (newPwd !== confirmPwd) { showToast('New passwords do not match', 'error'); return; }
  btn.disabled = true;
  try {
    await api.put('/auth/change-password', {
      currentPassword: document.getElementById('s-cur-pwd').value,
      newPassword: newPwd,
    });
    showToast('Password updated successfully!', 'success');
    document.getElementById('pwd-form').reset();
  } catch(err) { showToast(err.message, 'error'); }
  btn.disabled = false;
});
