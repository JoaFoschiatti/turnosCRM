// public/js/appointments.js
// Definir openDB en el ámbito global
window.openDB = function() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('turneroCRMNew', 1);
    request.onupgradeneeded = e => {
      const db = e.target.result;
      db.createObjectStore('pendingAppointments', { keyPath: 'id' });
      db.createObjectStore('pendingDeletes', { keyPath: 'id' });
    };
    request.onsuccess = e => {
      resolve(e.target.result);
    };
    request.onerror = e => reject(e.target.error);
  });
};

// Solo una vez:
let currentTab = "future";

async function loadAppointmentsModule() {
  const container = document.getElementById("viewContainer");
  if (!container) {
    console.error("Elemento viewContainer no encontrado");
    return;
  }
  container.innerHTML = `
    <div class="flex flex-wrap items-center gap-3 mb-6">
      <div class="flex gap-2">
        <button id="tabFuture" class="px-5 py-2 rounded-lg font-semibold bg-blue-600 text-white shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition">
          Próximos
        </button>
        <button id="tabExpired" class="px-5 py-2 rounded-lg font-semibold bg-gray-200 text-gray-700 shadow-md hover:bg-gray-300">
          Vencidos
        </button>
      </div>
      <button id="btnNewTurno" class="btn-custom-primary ml-auto">Nuevo Turno</button>
    </div>
    <h2 class="text-2xl font-bold text-gray-800 mb-4">Turnos</h2>
    <div id="turnosList" class="animate-fade-in">Cargando turnos...</div>
    <div id="modalContainer"></div>
  `;

  document.getElementById("tabFuture").addEventListener("click", () => switchTab("future"));
  document.getElementById("tabExpired").addEventListener("click", () => switchTab("expired"));
  document.getElementById("btnNewTurno").addEventListener("click", () => showTurnoForm());

  await renderAppointmentsList("future");
}

async function fetchAppointments(type) {
  const res = await fetch(`../backend/index.php?ruta=appointments&type=${type}`);
  if (!res.ok) {
    const text = await res.text();
    console.error(`Error en fetchAppointments (status: ${res.status}):`, text);
    throw new Error(`Error al obtener turnos (status: ${res.status}) - ${text.substring(0, 100)}...`);
  }
  const data = await res.json();
  console.log("Datos crudos de fetchAppointments:", data); // Depuración de datos crudos
  const filteredData = data.filter(turno => turno.status === 'habilitado');
  console.log("Datos filtrados por 'habilitado':", filteredData); // Depuración después del filtro
  return filteredData;
}

async function renderAppointmentsList(type) {
  const listContainer = document.getElementById("turnosList");
  if (!listContainer) {
    console.error("Elemento turnosList no encontrado");
    return;
  }
  try {
    currentTab = type;
    const turnos = await fetchAppointments(type);
    console.log("Turnos recibidos para renderizar:", turnos);
    if (!turnos.length) {
      listContainer.innerHTML = `<p class="text-gray-500 italic">No hay turnos ${type === "future" ? "próximos" : "vencidos"}.</p>`;
      return;
    }
    // Agrupar turnos por día de la semana
    const groupedByDay = turnos.reduce((acc, turno) => {
      if (!turno.fecha_hora) {
        console.warn("Turno sin fecha_hora:", turno);
        return acc;
      }
      const date = new Date(turno.fecha_hora);
      if (isNaN(date.getTime())) {
        console.error("Fecha inválida en turno:", turno.fecha_hora);
        return acc;
      }
      const dayName = date.toLocaleDateString('es-AR', { weekday: 'long' }).charAt(0).toUpperCase() + date.toLocaleDateString('es-AR', { weekday: 'long' }).slice(1);
      if (!acc[dayName]) acc[dayName] = [];
      acc[dayName].push(turno);
      return acc;
    }, {});
    console.log("Agrupación por día:", groupedByDay);

    let html = `
      <div class="overflow-x-auto rounded-lg shadow-md">
        <table class="min-w-full bg-white border border-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="py-3 px-4 text-sm font-semibold text-gray-700">Día</th>
              <th class="py-3 px-4 text-sm font-semibold text-gray-700">Cliente</th>
              <th class="py-3 px-4 text-sm font-semibold text-gray-700">Servicio</th>
              <th class="py-3 px-4 text-sm font-semibold text-gray-700 text-right">Costo</th>
              <th class="py-3 px-4 text-sm font-semibold text-gray-700">Fecha y Hora</th>
              <th class="py-3 px-4 text-sm font-semibold text-gray-700 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
    `;
    const daysOrder = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    daysOrder.forEach(day => {
      if (groupedByDay[day] && groupedByDay[day].length > 0) {
        groupedByDay[day].forEach(turno => {
          const date = new Date(turno.fecha_hora);
          html += `
            <tr class="border-t hover:bg-gray-50 transition">
              <td class="py-3 px-4">${day}</td>
              <td class="py-3 px-4">${turno.cliente || 'Sin cliente'}</td>
              <td class="py-3 px-4">${turno.servicio || 'Sin servicio'}</td>
              <td class="py-3 px-4 text-right font-mono">$ ${Number(turno.costo || 0).toLocaleString('es-AR')}</td>
              <td class="py-3 px-4">
                ${date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })} 
                ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </td>
              <td class="py-3 px-4 text-center">
                <button data-id="${turno.id}" class="editTurno btn-custom-primary text-sm px-2 py-1">Editar</button>
                <button data-id="${turno.id}" class="deleteTurno ml-2 btn-custom-danger text-sm px-2 py-1">Eliminar</button>
              </td>
            </tr>
          `;
        });
      }
    });
    html += `</tbody></table></div>`;
    listContainer.innerHTML = html;

    document.querySelectorAll(".editTurno").forEach(btn => {
      btn.addEventListener("click", () => {
        const turno = turnos.find(t => t.id == btn.dataset.id);
        showTurnoForm(turno);
      });
    });

    document.querySelectorAll(".deleteTurno").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("¿Eliminar este turno?")) return;
        await window.deleteTurno(btn.dataset.id);
        renderAppointmentsList(currentTab);
      });
    });
  } catch (err) {
    console.error("Error en renderAppointmentsList:", err);
    showToast(err.message, "error");
  }
}

async function renderAppointmentsList(type) {
  const listContainer = document.getElementById("turnosList");
  if (!listContainer) {
    console.error("Elemento turnosList no encontrado");
    return;
  }
  try {
    currentTab = type;
    const turnos = await fetchAppointments(type);
    console.log("Turnos recibidos para renderizar:", turnos);
    if (!turnos.length) {
      listContainer.innerHTML = `<p class="text-gray-500 italic">No hay turnos ${type === "future" ? "próximos" : "vencidos"}.</p>`;
      return;
    }
    // Agrupar turnos por día de la semana
    const groupedByDay = turnos.reduce((acc, turno) => {
      if (!turno.fecha_hora) {
        console.warn("Turno sin fecha_hora:", turno);
        return acc;
      }
      const date = new Date(turno.fecha_hora);
      if (isNaN(date.getTime())) {
        console.error("Fecha inválida en turno:", turno.fecha_hora);
        return acc;
      }
      const dayName = date.toLocaleDateString('es-AR', { weekday: 'long' }).charAt(0).toUpperCase() + date.toLocaleDateString('es-AR', { weekday: 'long' }).slice(1);
      if (!acc[dayName]) acc[dayName] = [];
      acc[dayName].push(turno);
      return acc;
    }, {});
    console.log("Agrupación por día:", groupedByDay);

    let html = `
      <div class="overflow-x-auto rounded-lg shadow-md">
        <table class="min-w-full bg-white border border-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="py-3 px-4 text-sm font-semibold text-gray-700">Día</th>
              <th class="py-3 px-4 text-sm font-semibold text-gray-700">Cliente</th>
              <th class="py-3 px-4 text-sm font-semibold text-gray-700">Servicio</th>
              <th class="py-3 px-4 text-sm font-semibold text-gray-700 text-right">Costo</th>
              <th class="py-3 px-4 text-sm font-semibold text-gray-700">Fecha y Hora</th>
              <th class="py-3 px-4 text-sm font-semibold text-gray-700 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
    `;
    const daysOrder = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    daysOrder.forEach(day => {
      if (groupedByDay[day] && groupedByDay[day].length > 0) {
        groupedByDay[day].forEach(turno => {
          const date = new Date(turno.fecha_hora);
          html += `
            <tr class="border-t hover:bg-gray-50 transition">
              <td class="py-3 px-4">${day}</td>
              <td class="py-3 px-4">${turno.cliente || 'Sin cliente'}</td>
              <td class="py-3 px-4">${turno.servicio || 'Sin servicio'}</td>
              <td class="py-3 px-4 text-right font-mono">$ ${Number(turno.costo || 0).toLocaleString('es-AR')}</td>
              <td class="py-3 px-4">
                ${date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })} 
                ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </td>
              <td class="py-3 px-4 text-center">
                <button data-id="${turno.id}" class="editTurno btn-custom-primary text-sm px-2 py-1">Editar</button>
                <button data-id="${turno.id}" class="deleteTurno ml-2 btn-custom-danger text-sm px-2 py-1">Eliminar</button>
              </td>
            </tr>
          `;
        });
      }
    });
    html += `</tbody></table></div>`;
    listContainer.innerHTML = html;

    document.querySelectorAll(".editTurno").forEach(btn => {
      btn.addEventListener("click", () => {
        const turno = turnos.find(t => t.id == btn.dataset.id);
        showTurnoForm(turno);
      });
    });

    document.querySelectorAll(".deleteTurno").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!confirm("¿Eliminar este turno?")) return;
        await window.deleteTurno(btn.dataset.id);
        renderAppointmentsList(currentTab);
      });
    });
  } catch (err) {
    console.error("Error en renderAppointmentsList:", err);
    showToast(err.message, "error");
  }
}

function switchTab(type) {
  const tabFuture = document.getElementById("tabFuture");
  const tabExpired = document.getElementById("tabExpired");
  if (!tabFuture || !tabExpired) {
    console.error("Elementos tabFuture o tabExpired no encontrados");
    return;
  }
  tabFuture.className = type === "future"
    ? "px-5 py-2 rounded-lg font-semibold bg-blue-600 text-white shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition"
    : "px-5 py-2 rounded-lg font-semibold bg-gray-200 text-gray-700 shadow-md hover:bg-gray-300";
  tabExpired.className = type === "expired"
    ? "px-5 py-2 rounded-lg font-semibold bg-blue-600 text-white shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition"
    : "px-5 py-2 rounded-lg font-semibold bg-gray-200 text-gray-700 shadow-md hover:bg-gray-300";
  renderAppointmentsList(type);
}

async function showTurnoForm(turno = null) {
  const isEdit = !!turno;
  const [clientes, servicios] = await Promise.all([
    fetch("../backend/index.php?ruta=clients").then(r => r.json()),
    fetch("../backend/index.php?ruta=services").then(r => r.json())
  ]);
  const modal = document.getElementById("modalContainer");
  if (!modal) {
    console.error("Elemento modalContainer no encontrado");
    return;
  }

  modal.innerHTML = `
    <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-xl shadow-2xl border border-gray-100 w-full max-w-md">
        <h3 class="text-xl font-bold mb-4 text-blue-700">${isEdit ? "Editar Turno" : "Nuevo Turno"}</h3>
        <form id="turnoForm" class="space-y-4">
          <input type="hidden" id="turno_id" name="id" value="${turno?.id || ''}">
          <input type="text" id="in-nombre-cliente"
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
            placeholder="Nombre completo del cliente" value="${turno?.cliente || ''}" required>
          <input type="hidden" id="cliente_id" name="cliente_id" value="${turno?.cliente_id || ''}">
          <select name="servicio_id" id="sel-servicio"
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" required>
            <option value="">Seleccionar servicio</option>
            ${servicios.map(s => `<option value="${s.id}" data-precio="${s.precio_default}" ${turno?.servicio_id == s.id ? "selected" : ""}>${s.nombre}</option>`).join("")}
          </select>
          <input type="text" name="costo" id="in-costo" placeholder="Costo"
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" value="${turno ? Number(turno.costo).toLocaleString('es-AR') : ''}" required>
          <input type="text" name="fecha_hora" id="in-fecha"
            placeholder="Seleccionar fecha y hora"
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" value="${turno?.fecha_hora || ''}" required>
          <input type="text" name="observaciones"
            placeholder="Observaciones (opcional)"
            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" value="${turno?.observaciones || ''}" maxlength="100">
          <div class="flex justify-end gap-3 mt-4">
            <button type="button" id="cancelTurno" class="btn-secondary">Cancelar</button>
            <button type="submit" class="btn-primary">${isEdit ? "Guardar" : "Crear"}</button>
          </div>
        </form>
      </div>
    </div>
  `;

  if (typeof flatpickr !== "undefined") {
    flatpickr("#in-fecha", {
      enableTime: true,
      dateFormat: "Y-m-d H:i",
      locale: flatpickr.l10ns.es || flatpickr.l10ns["es"], // Fallback para locale
      minDate: isEdit ? null : "today"
    });
  }

  const cancelButton = document.getElementById("cancelTurno");
  if (cancelButton) {
    cancelButton.onclick = () => { modal.innerHTML = ""; };
  }

  const inputNombre = document.getElementById("in-nombre-cliente");
  const hiddenId = document.getElementById("cliente_id");
  if (inputNombre && hiddenId) {
    inputNombre.addEventListener("input", function () {
      const val = this.value.trim().toLowerCase();
      const match = clientes.find(c => c.nombre.toLowerCase() === val);
      hiddenId.value = match ? match.id : "";
    });
  }

  const selectServicio = document.getElementById("sel-servicio");
  if (selectServicio) {
    selectServicio.addEventListener("change", function () {
      const selectedService = servicios.find(s => s.id == this.value);
      if (selectedService && document.getElementById("in-costo")) {
        document.getElementById("in-costo").value = Number(selectedService.precio_default).toLocaleString("es-AR");
      }
    });
  }

  const form = document.getElementById("turnoForm");
  if (form) {
    form.onsubmit = async e => {
      e.preventDefault();
      const nombre = inputNombre.value.trim();
      let cliente_id = hiddenId.value;
      let nuevoCliente = null;

      if (!cliente_id) {
        nuevoCliente = await pedirNumeroCelular(nombre);
        if (nuevoCliente && nuevoCliente.id) {
          cliente_id = nuevoCliente.id;
          hiddenId.value = cliente_id; // Asegurar que se actualice
        } else {
          showToast("No se pudo registrar el cliente. Verifica el número.", "error");
          return;
        }
      }

      const fd = new FormData(e.target);
      const data = Object.fromEntries(fd.entries());
      data.cliente_id = cliente_id;
      data.costo = String(data.costo).replace(/\./g, "").replace(",", ".");

      try {
        await window.saveTurno(data, isEdit);
        modal.innerHTML = "";
        renderAppointmentsList(currentTab);
      } catch (err) {
        showToast(err.message, "error");
      }
    };
  }
}
function pedirNumeroCelular(nombre) {
  return new Promise(resolve => {
    const pop = document.createElement("div");
    pop.innerHTML = `
      <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-xs border border-gray-100">
          <h3 class="text-lg font-bold mb-2 text-blue-700">Registrar nuevo cliente</h3>
          <p class="mb-2 text-gray-600">Nuevo cliente: <b>${nombre}</b></p>
          <input id="nuevo-cel" class="w-full mb-4 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" placeholder="Número de celular" maxlength="20" required>
          <div class="flex justify-end gap-2">
            <button id="nuevo-cancelar" class="btn-secondary">Cancelar</button>
            <button id="nuevo-confirmar" class="btn-primary">Registrar</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(pop);

    document.getElementById("nuevo-cancelar").onclick = () => {
      document.body.removeChild(pop);
      resolve(null);
    };
    document.getElementById("nuevo-confirmar").onclick = async () => {
      const celular = document.getElementById("nuevo-cel").value.trim();
      if (!celular) {
        showToast("Ingrese un número de celular.", "error");
        return;
      }
      try {
        const res = await fetch("../backend/index.php?ruta=clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "create", nombre, celular })
        });
        const nuevo = await res.json();
        console.log("Respuesta del backend al crear cliente:", nuevo);
        if (!res.ok || !nuevo || !nuevo.id) {
          showToast(nuevo.error || "Error al registrar el cliente. Verifica con el administrador.", "error");
          resolve(null);
        } else {
          document.body.removeChild(pop);
          resolve({ id: nuevo.id, nombre, celular });
        }
      } catch (err) {
        showToast("Error de conexión al registrar el cliente: " + err.message, "error");
        resolve(null);
      }
    };
  });
}

function pedirNumeroCelular(nombre) {
  return new Promise(resolve => {
    const pop = document.createElement("div");
    pop.innerHTML = `
      <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-xs border border-gray-100">
          <h3 class="text-lg font-bold mb-2 text-blue-700">Registrar nuevo cliente</h3>
          <p class="mb-2 text-gray-600">Nuevo cliente: <b>${nombre}</b></p>
          <input id="nuevo-cel" class="w-full mb-4 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" placeholder="Número de celular" maxlength="20" required>
          <div class="flex justify-end gap-2">
            <button id="nuevo-cancelar" class="btn-secondary">Cancelar</button>
            <button id="nuevo-confirmar" class="btn-primary">Registrar</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(pop);

    document.getElementById("nuevo-cancelar").onclick = () => {
      document.body.removeChild(pop);
      resolve(null);
    };
    document.getElementById("nuevo-confirmar").onclick = async () => {
      const celular = document.getElementById("nuevo-cel").value.trim();
      if (!celular) {
        showToast("Ingrese un número de celular.", "error");
        return;
      }
      try {
        const res = await fetch("../backend/index.php?ruta=clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "create", nombre, celular })
        });
        const nuevo = await res.json();
        console.log("Respuesta del backend al crear cliente:", nuevo);
        if (!res.ok || !nuevo || !nuevo.id) {
          showToast(nuevo.error || "Error al registrar el cliente. Verifica con el administrador.", "error");
          resolve(null);
        } else {
          document.body.removeChild(pop);
          resolve({ id: nuevo.id, nombre, celular });
        }
      } catch (err) {
        showToast("Error de conexión al registrar el cliente: " + err.message, "error");
        resolve(null);
      }
    };
  });
}

function pedirNumeroCelular(nombre) {
  return new Promise(resolve => {
    const pop = document.createElement("div");
    pop.innerHTML = `
      <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div class="bg-white rounded-xl shadow-2xl p-6 w-full max-w-xs border border-gray-100">
          <h3 class="text-lg font-bold mb-2 text-blue-700">Registrar nuevo cliente</h3>
          <p class="mb-2 text-gray-600">Nuevo cliente: <b>${nombre}</b></p>
          <input id="nuevo-cel" class="w-full mb-4 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition" placeholder="Número de celular (mínimo 1 dígito)" maxlength="20" required>
          <div class="flex justify-end gap-2">
            <button id="nuevo-cancelar" class="btn-secondary">Cancelar</button>
            <button id="nuevo-confirmar" class="btn-primary">Registrar</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(pop);

    document.getElementById("nuevo-cancelar").onclick = () => {
      document.body.removeChild(pop);
      resolve(null);
    };
    document.getElementById("nuevo-confirmar").onclick = async () => {
      const celular = document.getElementById("nuevo-cel").value.trim();
      if (!celular || celular.length < 1) {
        showToast("Ingrese al menos 1 dígito para el número de celular.", "error");
        return;
      }
      try {
        const res = await fetch("../backend/index.php?ruta=clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "create", nombre, celular })
        });
        const nuevo = await res.json();
        console.log("Respuesta del backend al crear cliente:", nuevo);
        if (!res.ok || !nuevo || !nuevo.id) {
          showToast(nuevo.error || "Error al registrar el cliente. Verifica con el administrador.", "error");
          resolve(null);
        } else {
          document.body.removeChild(pop);
          resolve({ id: nuevo.id, nombre, celular });
        }
      } catch (err) {
        showToast("Error de conexión al registrar el cliente: " + err.message, "error");
        resolve(null);
      }
    };
  });
}

async function saveTurno(data, isEdit) {
  try {
    const db = await window.openDB();
    if (!navigator.onLine && !isEdit) {
      const tx = db.transaction('pendingAppointments', 'readwrite');
      const store = tx.objectStore('pendingAppointments');
      const id = Date.now().toString();
      await store.put({ ...data, id, createdAt: new Date().toISOString(), action: 'create' });
      showToast('Turno guardado localmente. Se sincronizará cuando estés online', 'info');
      return;
    }
    if (!navigator.onLine && isEdit) {
      const tx = db.transaction('pendingAppointments', 'readwrite');
      const store = tx.objectStore('pendingAppointments');
      await store.put({ ...data, createdAt: new Date().toISOString(), action: 'update' });
      showToast('Turno actualizado localmente. Se sincronizará cuando estés online', 'info');
      return;
    }

    const res = await fetch('../backend/index.php?ruta=appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: isEdit ? 'update' : 'create', ...data })
    });
    const result = await res.json();
    if (!result.ok) {
      throw new Error(result.error || `Error al ${isEdit ? 'actualizar' : 'guardar'} turno`);
    }
    showToast(`Turno ${isEdit ? 'actualizado' : 'guardado'}`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteTurno(id) {
  try {
    const db = await window.openDB();
    if (!navigator.onLine) {
      const tx = db.transaction('pendingDeletes', 'readwrite');
      const store = tx.objectStore('pendingDeletes');
      await store.put({ id, createdAt: new Date().toISOString() });
      showToast('Eliminación guardada localmente. Se sincronizará cuando estés online', 'info');
      return;
    }

    const res = await fetch('../backend/index.php?ruta=appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id })
    });
    const text = await res.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error("Respuesta no válida del backend:", text);
      throw new Error("Error en la respuesta del servidor. Verifica con el administrador.");
    }
    if (!result.ok) {
      throw new Error(result.error || 'Error al eliminar turno');
    }
    showToast('Turno eliminado', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function syncPendingAppointments() {
  if (!navigator.onLine) return;
  const db = await window.openDB();
  const tx = db.transaction(['pendingAppointments', 'pendingDeletes'], 'readwrite');
  const apptStore = tx.objectStore('pendingAppointments');
  const deleteStore = tx.objectStore('pendingDeletes');

  const pendingAppts = await new Promise((resolve, reject) => {
    const request = apptStore.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  for (const appt of pendingAppts) {
    try {
      const res = await fetch('../backend/index.php?ruta=appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: appt.action, ...appt })
      });
      const result = await res.json();
      if (result.ok) {
        const deleteTx = db.transaction('pendingAppointments', 'readwrite');
        await deleteTx.objectStore('pendingAppointments').delete(appt.id);
        showToast(`Turno ${appt.action === 'update' ? 'actualizado' : 'creado'} sincronizado`, 'success');
      }
    } catch (err) {
      console.error('Error al sincronizar turno:', err);
    }
  }

  const pendingDeletes = await new Promise((resolve, reject) => {
    const request = deleteStore.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  for (const del of pendingDeletes) {
    try {
      const res = await fetch('../backend/index.php?ruta=appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: del.id })
      });
      const result = await res.json();
      if (result.ok) {
        const deleteTx = db.transaction('pendingDeletes', 'readwrite');
        await deleteTx.objectStore('pendingDeletes').delete(del.id);
        showToast('Eliminación sincronizada', 'success');
      }
    } catch (err) {
      console.error('Error al sincronizar eliminación:', err);
    }
  }
}

window.loadAppointmentsModule = loadAppointmentsModule;