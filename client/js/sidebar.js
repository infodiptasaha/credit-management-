/**
 * sidebar.js — Injects the shared sidebar + topbar HTML into the page
 * Call: injectSidebar('dashboard.html', 'Dashboard', 'Overview of your data')
 */
function getSidebarHTML() {
  return `
  <div class="sidebar-overlay" id="sidebar-overlay"></div>
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-logo">
      <div class="logo-icon">💳</div>
      <div>
        <div class="logo-text">CreditManager</div>
        <div class="logo-sub">Professional Edition</div>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-label">Main</div>
      <a class="nav-item" href="dashboard.html"><span class="nav-icon">📊</span>Dashboard</a>
      <a class="nav-item" href="customers.html"><span class="nav-icon">👥</span>Customers</a>
      <a class="nav-item" href="transactions.html"><span class="nav-icon">💰</span>Transactions</a>

      <div class="nav-section-label">Balances</div>
      <a class="nav-item" href="opening-balance.html"><span class="nav-icon">🟢</span>Opening Balance</a>
      <a class="nav-item" href="closing-balance.html"><span class="nav-icon">🔴</span>Closing Balance</a>

      <div class="nav-section-label">Reports</div>
      <a class="nav-item" href="reports.html"><span class="nav-icon">📈</span>Reports</a>
      <a class="nav-item" href="activity-log.html"><span class="nav-icon">📋</span>Activity Log</a>

      <div class="nav-section-label">Admin</div>
      <a class="nav-item" href="users.html"><span class="nav-icon">👤</span>User Management</a>
      <a class="nav-item" href="settings.html"><span class="nav-icon">⚙️</span>Settings</a>
    </nav>
    <div class="sidebar-footer">
      <div class="user-info">
        <div class="user-avatar" id="sidebar-avatar">U</div>
        <div>
          <div class="user-name" id="sidebar-username">User</div>
          <div class="user-role" id="sidebar-role">viewer</div>
        </div>
      </div>
      <button class="btn-logout" id="btn-logout">🚪 Sign Out</button>
    </div>
  </aside>`;
}

function getTopbarHTML(title, subtitle) {
  return `
  <header class="topbar">
    <div>
      <button class="menu-toggle" id="menu-toggle" style="display:none">☰</button>
      <div class="topbar-title">${title}</div>
      <div class="topbar-subtitle">${subtitle}</div>
    </div>
    <div class="topbar-right" id="topbar-right"></div>
  </header>`;
}

function injectLayout(activeHref, title, subtitle) {
  // Build layout shell
  document.body.innerHTML = `
    <div id="toast-container"></div>
    <div class="app-layout">
      ${getSidebarHTML()}
      <div class="main-content">
        ${getTopbarHTML(title, subtitle)}
        <div class="page-body" id="page-body"></div>
      </div>
    </div>
  ` + document.body.innerHTML;
  initSidebar(activeHref);
}
