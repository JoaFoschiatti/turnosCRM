// public/js/dashboard.js
async function loadDashboardModule() {
  const container = document.getElementById('viewContainer');
  container.innerHTML = `
    <h2 class="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <div class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all">
        <h3 class="text-lg font-semibold text-gray-700">Turnos de Hoy</h3>
        <p id="todayAppointments" class="text-3xl font-bold text-blue-600 mt-2">Cargando...</p>
      </div>
      <div class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all">
        <h3 class="text-lg font-semibold text-gray-700">Ingresos Totales</h3>
        <p id="totalRevenue" class="text-3xl font-bold text-blue-600 mt-2">Cargando...</p>
      </div>
      <div class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all">
        <h3 class="text-lg font-semibold text-gray-700">Clientes Activos</h3>
        <p id="activeClients" class="text-3xl font-bold text-blue-600 mt-2">Cargando...</p>
      </div>
    </div>
    <div class="mt-6">
      <h3 class="text-lg font-semibold text-gray-700 mb-3">Turnos Próximos</h3>
      <div id="upcomingAppointments" class="overflow-x-auto rounded-lg shadow-md animate-fade-in">Cargando...</div>
    </div>
    <div class="mt-6">
      <h3 class="text-lg font-semibold text-gray-700 mb-3">Turnos Pendientes de Sincronización</h3>
      <div id="pendingAppointments" class="overflow-x-auto rounded-lg shadow-md animate-fade-in">Cargando...</div>
    </div>
  `;

  try {
    const statsRes = await fetch('../backend/index.php?ruta=dashboard_stats');
    if (!statsRes.ok) throw new Error('Error al obtener estadísticas');
    const stats = await statsRes.json();
    document.getElementById('todayAppointments').textContent = stats.todayAppointments;
    document.getElementById('totalRevenue').textContent = `$ ${Number(stats.totalRevenue).toLocaleString('es-AR')}`;
    document.getElementById('activeClients').textContent = stats.activeClients;

    const appointmentsRes = await fetch('../backend/index.php?ruta=appointments&type=future');
    if (!appointmentsRes.ok) throw new Error('Error al obtener turnos');
    const appointments = await appointmentsRes.json();
    const listContainer = document.getElementById('upcomingAppointments');
    if (!appointments.length) {
      listContainer.innerHTML = '<p class="text-gray-500 italic">No hay turnos próximos.</p>';
    } else {
      // Agrupar turnos por día de la semana
      const groupedByDay = appointments.reduce((acc, turno) => {
        const date = new Date(turno.fecha_hora);
        if (isNaN(date.getTime())) {
          console.warn("Fecha inválida en turno:", turno.fecha_hora);
          return acc;
        }
        const dayName = date.toLocaleDateString('es-AR', { weekday: 'long' }).charAt(0).toUpperCase() + date.toLocaleDateString('es-AR', { weekday: 'long' }).slice(1);
        if (!acc[dayName]) acc[dayName] = [];
        acc[dayName].push(turno);
        return acc;
      }, {});

      let html = `
        <table class="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead class="bg-gray-50">
            <tr>
              <th class="py-3 px-4 text-sm font-semibold text-gray-700">Día</th>
              <th class="py-3 px-4 text-sm font-semibold text-gray-700">Cliente</th>
              <th class="py-3 px-4 text-sm font-semibold text-gray-700">Servicio</th>
              <th class="py-3 px-4 text-sm font-semibold text-gray-700 text-right">Costo</th>
              <th class="py-3 px-4 text-sm font-semibold text-gray-700">Fecha y Hora</th>
            </tr>
          </thead>
          <tbody>
      `;
      const daysOrder = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
      daysOrder.forEach(day => {
        if (groupedByDay[day]) {
          groupedByDay[day].forEach(turno => {
            const date = new Date(turno.fecha_hora);
            html += `
              <tr class="border-t hover:bg-gray-50 transition">
                <td class="py-3 px-4">${day}</td>
                <td class="py-3 px-4">${turno.cliente}</td>
                <td class="py-3 px-4">${turno.servicio}</td>
                <td class="py-3 px-4 text-right font-mono">$ ${Number(turno.costo).toLocaleString('es-AR')}</td>
                <td class="py-3 px-4">
                  ${date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })} 
                  ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </td>
              </tr>
            `;
          });
        }
      });
      html += `</tbody></table>`;
      listContainer.innerHTML = html;
    }

    const db = await window.openDB();
    const tx = db.transaction(['pendingAppointments', 'pendingDeletes'], 'readonly');
    const apptStore = tx.objectStore('pendingAppointments');
    const deleteStore = tx.objectStore('pendingDeletes');
    const pendingAppts = await new Promise((resolve, reject) => {
      const request = apptStore.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const pendingDeletes = await new Promise((resolve, reject) => {
      const request = deleteStore.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const pendingContainer = document.getElementById('pendingAppointments');
    if (!pendingAppts.length && !pendingDeletes.length) {
      pendingContainer.innerHTML = '<p class="text-gray-500 italic">No hay turnos pendientes de sincronización.</p>';
      return;
    }
    let html = `
      <table class="min-w-full bg-white border border-gray-200 rounded-lg">
        <thead class="bg-gray-50">
          <tr>
            <th class="py-3 px-4 text-sm font-semibold text-gray-700">Acción</th>
            <th class="py-3 px-4 text-sm font-semibold text-gray-700">Cliente</th>
            <th class="py-3 px-4 text-sm font-semibold text-gray-700">Fecha y Hora</th>
          </tr>
        </thead>
        <tbody>
    `;
    pendingAppts.forEach(appt => {
      const date = new Date(appt.fecha_hora || appt.createdAt);
      html += `
        <tr class="border-t hover:bg-gray-50 transition">
          <td class="py-3 px-4">${appt.action === 'update' ? 'Actualizar' : 'Crear'}</td>
          <td class="py-3 px-4">${appt.cliente_id || 'Nuevo'}</td>
          <td class="py-3 px-4">
            ${date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })} 
            ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
          </td>
        </tr>
      `;
    });
    pendingDeletes.forEach(del => {
      html += `
        <tr class="border-t hover:bg-gray-50 transition">
          <td class="py-3 px-4">Eliminar</td>
          <td class="py-3 px-4">-</td>
          <td class="py-3 px-4">${new Date(del.createdAt).toLocaleDateString('es-AR')}</td>
        </tr>
      `;
    });
    html += `</tbody></table>`;
    pendingContainer.innerHTML = html;
  } catch (err) {
    showToast(err.message, 'error');
  }
}

window.loadDashboardModule = loadDashboardModule;