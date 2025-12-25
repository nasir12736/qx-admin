(async function(){
  const CONTROL_URL = './control.json';
  let CONTROL = await fetch(CONTROL_URL).then(r => r.json());
  const tbody = document.querySelector('#users-table tbody');

  function render() {
    tbody.innerHTML = '';
    Object.entries(CONTROL.users).forEach(([uid,u]) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${uid}</td>
        <td>${u.name}</td>
        <td>${u.password}</td>
        <td>${u.max_devices}</td>
        <td>${CONTROL.blocked.includes(uid) ? '✅' : ''}</td>
        <td>
          <button class="block" data-action="block" data-uid="${uid}">Block</button>
          <button class="unblock" data-action="unblock" data-uid="${uid}">Unblock</button>
        </td>`;
      tbody.appendChild(tr);
    });
  }

  tbody.addEventListener('click', e => {
    const btn = e.target;
    const uid = btn.dataset.uid;
    if (!uid) return;

    if (btn.dataset.action === 'block') {
      if (!CONTROL.blocked.includes(uid)) CONTROL.blocked.push(uid);
    }
    else if (btn.dataset.action === 'unblock') {
      CONTROL.blocked = CONTROL.blocked.filter(b => b !== uid);
    }

    render();
    alert('✅ Done! Now commit control.json to GitHub to update backend.');
  });

  render();
})();
