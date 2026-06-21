# Credit Management System — Deployment & Setup Guide

Welcome to the **Credit Management System** setup and deployment guide. This project is divided into two parts:
1. **Frontend**: Plain HTML + CSS + JS (No build required, fully static).
2. **Backend**: Express.js + MongoDB API server.

---

## 💻 1. Local Setup

### Backend Setup
1. Open your terminal and navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install the backend dependencies:
   ```bash
   npm install
   ```
3. Configure your Environment Variables by renaming/creating a `.env` file in the `server/` directory (a pre-configured one is provided):
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=*
   NODE_ENV=development
   ```
4. Start the server in development mode:
   ```bash
   npm run dev
   ```
   The backend will be running at `http://localhost:5000`.

### Frontend Setup
No build step or server is required for the frontend. You can run it locally in one of two ways:
* **Option A (Recommended)**: Use a local development server extension like **Live Server** in VS Code to open the root folder and browse to `client/login.html`.
* **Option B**: Open [client/login.html](client/login.html) directly in any web browser.

---

## 🚀 2. Frontend Deployment

### Vercel Deployment (Recommended)
You can deploy the frontend directly from your GitHub repository to Vercel:
1. Import the repository in your [Vercel Dashboard](https://vercel.com).
2. **Configuration Options**:
   * **Automatic (Using root vercel.json)**: Keep the Root Directory as the root of the repository. The pre-configured [vercel.json](vercel.json) in the root will automatically redirect all traffic to the `client/` folder while maintaining clean URLs.
   * **Manual (Recommended)**: Set the **Root Directory** settings to `client` in the Vercel project setup page.
3. Deploy! Vercel will instantly host your static site.

### GitHub Pages Deployment
1. Push your repository to GitHub.
2. Go to your repository **Settings** -> **Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Choose the `main` (or `master`) branch and the `/ (root)` folder, then click **Save**.
5. The root [index.html](index.html) will automatically redirect visitors to the `client/` folder, loading the login interface.

---

## 🔌 3. Connecting Frontend to Production Backend

Once you deploy your backend to production (e.g. Render, Railway, or Heroku):
1. Open the [client/js/api.js](client/js/api.js) file.
2. Locate the `API_BASE` configuration at the top:
   ```javascript
   const API_BASE = window.location.hostname === 'localhost'
     ? 'http://localhost:5000/api'
     : 'https://your-backend.onrender.com/api'; // ← Update this URL
   ```
3. Replace `https://your-backend.onrender.com/api` with your live backend API URL.
4. Save and deploy the frontend changes.
