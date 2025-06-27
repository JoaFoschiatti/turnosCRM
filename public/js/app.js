// public/js/app.js
(async function () {
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      const res = await fetch('../backend/index.php?ruta=check');
      const data = await res.json();
      console.log('Respuesta de check:', data);
      if (!res.ok || !data.ok) {
        console.log('Sesión no válida, redirigiendo a index.html');
        window.location.href = 'index.html';
        return;
      }

      const btnUsers = document.getElementById('btnUsers');
      if (data.role === 'admin') {
        console.log('Usuario admin detectado, mostrando btnUsers');
        btnUsers.classList.remove('hidden');
        btnUsers.addEventListener('click', () => {
          if (typeof window.loadUsersModule === 'function') {
            window.loadUsersModule();
          } else {
            console.error('loadUsersModule no definido');
            showToast('Módulo de usuarios no disponible', 'error');
          }
        });
      } else {
        console.log('Usuario no admin, ocultando btnUsers');
        btnUsers.classList.add('hidden');
      }

      document.getElementById('btnLogout').addEventListener('click', async () => {
        await fetch('../backend/index.php?ruta=logout');
        window.location.href = 'index.html';
      });

      document.getElementById('btnChangePwd').addEventListener('click', () => {
        const modal = document.createElement('div');
        modal.innerHTML = `
          <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div class="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md border border-gray-100">
              <h3 class="text-xl font-bold mb-4 text-blue-700">Cambiar Contraseña</h3>
              <form id="changePwdForm" class="space-y-4">
                <input type="password" name="current_password" placeholder="Contraseña actual" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition" required>
                <input type="password" name="new_password" placeholder="Nueva contraseña" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition" required>
                <input type="password" name="confirm_password" placeholder="Confirmar nueva contraseña" class="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 transition" required>
                <div class="flex justify-end gap-3">
                  <button type="button" id="cancelPwd" class="btn-secondary">Cancelar</button>
                  <button type="submit" class="btn-primary">Guardar</button>
                </div>
              </form>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('cancelPwd').onclick = () => document.body.removeChild(modal);
        document.getElementById('changePwdForm').onsubmit = async e => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const data = Object.fromEntries(fd);
          if (data.new_password !== data.confirm_password) {
            showToast('Las contraseñas nuevas no coinciden', 'error');
            return;
          }
          if (data.new_password.length < 8) {
            showToast('La nueva contraseña debe tener al menos 8 caracteres', 'error');
            return;
          }
          try {
            const res = await fetch('../backend/index.php?ruta=change_password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                current_password: data.current_password,
                new_password: data.new_password
              })
            });
            const result = await res.json();
            if (result.ok) {
              showToast('Contraseña cambiada exitosamente', 'success');
              document.body.removeChild(modal);
            } else {
              showToast(result.error || 'Error al cambiar contraseña', 'error');
            }
          } catch (err) {
            showToast('Error de conexión', 'error');
          }
        };
      });

      document.getElementById('btnDashboard').addEventListener('click', () => {
        if (typeof window.loadDashboardModule === 'function') {
          window.loadDashboardModule();
        } else {
          showToast('Módulo de dashboard no disponible', 'error');
        }
      });
      document.getElementById('btnServices').addEventListener('click', () => {
        if (typeof window.loadServicesModule === 'function') {
          window.loadServicesModule();
        } else {
          showToast('Módulo de servicios no disponible', 'error');
        }
      });
      document.getElementById('btnClients').addEventListener('click', () => {
        if (typeof window.loadClientsModule === 'function') {
          window.loadClientsModule();
        } else {
          showToast('Módulo de clientes no disponible', 'error');
        }
      });
      document.getElementById('btnTurnos').addEventListener('click', () => {
        if (typeof window.loadAppointmentsModule === 'function') {
          window.loadAppointmentsModule();
        } else {
          showToast('Módulo de turnos no disponible', 'error');
        }
      });

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', event => {
          if (event.data.action === 'sync-appointments') {
            if (typeof window.syncPendingAppointments === 'function') {
              window.syncPendingAppointments();
            } else {
              console.error('syncPendingAppointments no definido');
            }
          }
        });
      }

      console.log('Cargando dashboard inicial');
      if (typeof window.loadDashboardModule === 'function') {
        window.loadDashboardModule();
      } else {
        showToast('Módulo de dashboard no disponible', 'error');
      }
    } catch (err) {
      console.error('Error al verificar sesión:', err);
      showToast('Error al verificar sesión: ' + err.message, 'error');
    }
  });
})();