// public/js/users.js
async function loadUsersModule() {
  const c = document.getElementById('viewContainer');
  c.innerHTML = `
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Usuarios</h2>
      <button id="btnNewUser" class="btn-custom-primary">Nuevo Usuario</button>
    </div>
    <div id="usersList" class="animate-fade-in">Cargando usuarios…</div>
    <div id="modalContainer"></div>
  `;
  document.getElementById('btnNewUser').onclick = () => showUserForm();
  try {
    await renderUsersList();
  } catch (err) {
    showToast('Error al cargar usuarios: ' + err.message, 'error');
    document.getElementById('usersList').innerHTML = '<p class="text-red-500">Error al cargar usuarios.</p>';
  }
}

async function renderUsersList() {
  const tableConfig = {
    headers: ['Usuario', 'Nombre', 'Rol', 'Estado', 'Acción'],
    row: u => `
      <td class="py-3 px-4">${u.username}</td>
      <td class="py-3 px-4">${u.nombre ?? '-'}</td>
      <td class="py-3 px-4 text-center">${u.role}</td>
      <td class="py-3 px-4 text-center">${u.status}</td>
      <td class="py-3 px-4 text-center">
        <button data-id="${u.id}" class="editUser btn-custom-primary text-sm px-2 py-1">Editar</button>
        <button data-id="${u.id}" class="delUser ml-2 btn-custom-danger text-sm px-2 py-1">Eliminar</button>
      </td>
    `
  };
  window.renderList('users', 'usersList', tableConfig, [
    items => {
      document.querySelectorAll('.editUser').forEach(btn => {
        btn.addEventListener('click', () => {
          const user = items.find(x => x.id == btn.dataset.id);
          showUserForm(user);
        });
      });
      document.querySelectorAll('.delUser').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (confirm('¿Eliminar usuario?')) {
            await window.deleteItem('users', btn.dataset.id, renderUsersList);
          }
        });
      });
    }
  ]);
}

function showUserForm(user = null) {
  const m = document.getElementById('modalContainer');
  m.innerHTML = `
    <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-xl shadow-2xl border border-gray-100 w-full max-w-md">
        <h3 class="text-xl font-bold mb-4 text-blue-700">${user ? "Editar Usuario" : "Nuevo Usuario"}</h3>
        <form id="userForm" class="space-y-4">
          <input name="username" placeholder="Usuario" required class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
            value="${user?.username ?? ''}">
          <input name="nombre" placeholder="Nombre" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
            value="${user?.nombre ?? ''}">
          <input name="password" placeholder="Contraseña ${user ? '(dejar vacío para no cambiar)' : ''}" type="password" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition">
          <select name="role" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" required>
            <option value="">Rol</option>
            <option value="admin" ${user?.role == 'admin' ? 'selected' : ''}>admin</option>
            <option value="user" ${user?.role == 'user' ? 'selected' : ''}>user</option>
          </select>
          <div class="flex justify-end gap-3 mt-4">
            <button type="button" id="cancelUser" class="btn-custom-secondary">Cancelar</button>
            <button type="submit" class="btn-custom-primary">${user ? "Guardar" : "Crear"}</button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.getElementById('cancelUser').onclick = () => m.innerHTML = '';
  document.getElementById('userForm').onsubmit = async e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    try {
      if (!user) await window.createUser(f); else await window.updateUser(user.id, f);
      m.innerHTML = '';
      renderUsersList();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
}

async function createUser(data) {
  const res = await fetch('../backend/index.php?ruta=users', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'create', ...data })
  });
  const r = await res.json();
  if (!r.ok) throw new Error(r.error || 'Error al crear usuario');
}

async function updateUser(id, data) {
  const res = await fetch('../backend/index.php?ruta=users', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', id, ...data })
  });
  const r = await res.json();
  if (!r.ok) throw new Error(r.error || 'Error al actualizar usuario');
}

async function deleteUser(id) {
  const res = await fetch('../backend/index.php?ruta=users', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete', id })
  });
  const r = await res.json();
  if (!r.ok) throw new Error(r.error || 'Error al eliminar usuario');
}

window.loadUsersModule = loadUsersModule;