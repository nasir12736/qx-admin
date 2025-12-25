(async function () {
  'use strict';

  // ===== CONFIG =====
  const CONTROL_URL = "https://raw.githubusercontent.com/YOUR_USER/qx-admin-repo/main/control.json"; // Change YOUR_USER
  const ACCESS_TTL = 10 * 24 * 60 * 60 * 1000; // 10 days

  // ===== Helpers =====
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const generateLocalUID = () => {
    let uid = localStorage.getItem('qx_uid');
    if (!uid) {
      const short = Math.floor(Math.random() * 900000 + 100000);
      uid = 'uid_' + short;
      localStorage.setItem('qx_uid', uid);
    }
    return uid;
  };
  const getAccessKey = uid => `qx_access_expiry_${uid}`;
  const hasAccess = uid => {
    const v = localStorage.getItem(getAccessKey(uid));
    return v && Date.now() < Number(v);
  };
  const saveAccess = uid => {
    const expiry = Date.now() + ACCESS_TTL;
    localStorage.setItem(getAccessKey(uid), String(expiry));
  };

  async function loadControl() {
    try {
      const r = await fetch(CONTROL_URL + '?t=' + Date.now());
      if (!r.ok) throw new Error('fetch failed');
      return await r.json();
    } catch (e) {
      console.warn('Could not load control.json', e);
      return null;
    }
  }

  // ===== Multi-user auth + blocked check =====
  async function auth() {
    const CONTROL = await loadControl();
    const uid = generateLocalUID();

    if (!CONTROL) return { ok: true, uid };

    // ===== Blocked User =====
    if (CONTROL.blocked?.includes(uid)) {
      document.body.innerHTML = `
      <div style="
        position:fixed;top:0;left:0;width:100%;height:100%;
        background:#111;color:#fff;display:flex;align-items:center;justify-content:center;
        font-size:28px;font-family:sans-serif;text-align:center;line-height:1.5;z-index:999999;
      ">
        ❌ You are BLOCKED by Admin.<br>
        Contact Admin:<br>
        <a href="https://wa.me/923341220096" style="color:#0faf59;text-decoration:underline;">WhatsApp</a> |
        <a href="https://t.me/QuotexCoder1" style="color:#0faf59;text-decoration:underline;">Telegram</a>
      </div>`;
      return { ok: false };
    }

    const users = CONTROL.users || {};
    const entry = users[uid];

    // ===== If no password required =====
    if (!CONTROL.password_required) return { ok: true, uid };
    if (hasAccess(uid)) return { ok: true, uid };

    // ===== User not in backend → show UID popup =====
    if (!entry) {
      await new Promise(resolve => {
        if ($('#qx-uid-popup')) return resolve();
        const popupWrap = document.createElement('div');
        popupWrap.id = 'qx-uid-popup';
        popupWrap.style.cssText = `
          position:fixed; top:0; left:0; width:100%; height:100%;
          display:flex; align-items:center; justify-content:center;
          background:rgba(0,0,0,0.7); z-index:999999; backdrop-filter: blur(4px);
        `;
        popupWrap.innerHTML = `
        <style>
          .qx-popup-inner { width:440px; border-radius:16px; background:#fff; padding:25px; text-align:center; font-family:Arial,sans-serif; box-shadow:0 12px 40px rgba(0,0,0,0.5);}
          .qx-popup-inner h2 { margin:0 0 12px; color:#0faf59; font-size:22px; }
          .qx-popup-inner .uid-container { display:flex; justify-content:center; align-items:center; gap:10px; margin-top:10px; }
          .qx-popup-inner .uid-text { font-weight:700; font-size:16px; padding:6px 12px; border:1px solid #ccc; border-radius:8px; background:#f0f0f0; }
          .qx-popup-inner .copy-btn { padding:6px 12px; border:none; border-radius:8px; background:#0077cc; color:#fff; font-weight:700; cursor:pointer; transition:0.2s; }
          .qx-popup-inner .copy-btn:hover { background:#005fa3; transform: scale(1.05); }
          .qx-popup-inner button.close-btn { margin-top:15px; padding:12px 28px; border:none; border-radius:10px; background:#0faf59; color:#fff; font-weight:700; cursor:pointer; font-size:14px; transition:0.2s; }
          .qx-popup-inner button.close-btn:hover { background:#0da84f; transform: scale(1.05); }
        </style>
        <div class="qx-popup-inner">
          <h2>🔑 Your Unique User ID</h2>
          <div class="uid-container">
            <span class="uid-text">${uid}</span>
            <button class="copy-btn">Copy</button>
          </div>
          <p>Send this UID to Admin to get your personal password.</p>
          <button id="qx-popup-close" class="close-btn">Close</button>
        </div>
        `;
        document.body.appendChild(popupWrap);

        popupWrap.querySelector('.copy-btn').addEventListener('click', () => {
          navigator.clipboard.writeText(uid).then(() => {
            popupWrap.querySelector('.copy-btn').textContent = '✅ Copied';
            setTimeout(() => popupWrap.querySelector('.copy-btn').textContent = 'Copy', 1500);
          });
        });

        popupWrap.querySelector('#qx-popup-close').addEventListener('click', () => {
          popupWrap.remove();
          resolve();
        });
      });
      console.log('User UID (send to admin):', uid);
      return { ok: false };
    }

    // ===== User exists → show password popup =====
    return await new Promise(resolve => {
      if ($('#qx-password-popup')) return resolve({ ok: false });
      const popupWrap = document.createElement('div');
      popupWrap.id = 'qx-password-popup';
      popupWrap.style.cssText = `
        position:fixed; top:0; left:0; width:100%; height:100%;
        display:flex; align-items:center; justify-content:center;
        background:rgba(0,0,0,0.7); z-index:999999; backdrop-filter: blur(4px);
      `;
      popupWrap.innerHTML = `
      <style>
        .qx-popup-inner { width:420px; border-radius:16px; background:#fff; padding:25px; text-align:center; font-family:Arial,sans-serif; box-shadow:0 12px 40px rgba(0,0,0,0.5);}
        .qx-popup-inner h2 { margin:0 0 12px; color:#0faf59; font-size:22px; }
        .qx-popup-inner input[type="password"] { width:80%; padding:10px; margin-bottom:12px; border-radius:8px; border:1px solid #ccc; font-size:15px; }
        .qx-popup-inner .btn-row { display:flex; justify-content:center; gap:15px; margin-top:10px; }
        .qx-popup-inner .btn { padding:10px 18px; border:none; border-radius:10px; font-weight:700; cursor:pointer; font-size:14px; transition:0.2s; }
        .qx-popup-inner .btn.submit { background:#0faf59; color:#fff; }
        .qx-popup-inner .btn.cancel { background:#888; color:#fff; }
        .qx-popup-inner .feedback { margin-top:10px; color:#ff3e3e; font-weight:700; }
      </style>
      <div class="qx-popup-inner">
        <h2>🔒 Password Required</h2>
        <p>User: <strong>${entry.name}</strong></p>
        <input type="password" id="qx-pass-input" placeholder="Enter your password" />
        <div class="btn-row">
          <button class="btn submit">Submit</button>
          <button class="btn cancel">Cancel</button>
        </div>
        <div class="feedback" id="qx-pass-feedback"></div>
      </div>
      `;
      document.body.appendChild(popupWrap);

      const input = popupWrap.querySelector('#qx-pass-input');
      const feedback = popupWrap.querySelector('#qx-pass-feedback');

      popupWrap.querySelector('.cancel').addEventListener('click', () => {
        popupWrap.remove();
        resolve({ ok: false });
      });

      popupWrap.querySelector('.submit').addEventListener('click', () => {
        const val = input.value.trim();
        if (!val) { feedback.textContent = 'Password required!'; return; }
        if (val === entry.password) {
          saveAccess(uid);
          feedback.style.color = '#0faf59';
          feedback.textContent = '✅ Access granted for 10 days!';
          setTimeout(() => { popupWrap.remove(); resolve({ ok: true }); }, 800);
        } else {
          feedback.style.color = '#ff3e3e';
          feedback.textContent = '❌ Wrong Password. Contact Admin WT: +923341220096';
        }
      });
    });
  }

  await auth();
})();
