/**
 * auth.js — Login page logic
 */
redirectIfLoggedIn();

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const errorEl = document.getElementById('login-error');
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Signing in...';
  errorEl.classList.remove('show');

  try {
    const data = await api.post('/auth/login', { username, password });
    if (data && data.success) {
      token.set(data.token);
      currentUser.set(data.user);
      window.location.href = 'dashboard.html';
    } else {
      throw new Error(data?.message || 'Login failed');
    }
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.add('show');
    btn.disabled = false;
    btn.innerHTML = 'Sign In';
  }
});
