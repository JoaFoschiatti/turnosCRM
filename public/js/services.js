// public/js/services.js
async function loadServicesModule() {
  const container = document.getElementById('viewContainer');
  container.innerHTML = `
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Servicios</h2>
      <button id="btnNewService" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition">Nuevo Servicio</button>
    </div>
    <div id="servicesList" class="animate-fade-in">Cargando servicios…</div>
    <div id="modalContainer"></div>
  `;
  document.getElementById('btnNewService').addEventListener('click', () => showServiceForm());
  await renderServicesList();
}

async function renderServicesList() {
  const tableConfig = {
    headers: ['Nombre', 'Precio', 'Acciones'],
    row: s => `
      <td class="py-3 px-4">${s.nombre}</td>
      <td class="py-3 px-4 text-right font-mono">$ ${Number(s.precio_default).toLocaleString('es-AR')}</td>
      <td class="py-3 px-4 text-center">
        <button data-id="${s.id}" class="editService bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm transition">Editar</button>
        <button data-id="${s.id}" class="deleteService ml-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm transition">Eliminar</button>
      </td>
    `
  };
  window.renderList('services', 'servicesList', tableConfig, [
    items => {
      document.querySelectorAll('.editService').forEach(btn => {
        btn.addEventListener('click', () => {
          const service = items.find(x => x.id == btn.dataset.id);
          showServiceForm(service);
        });
      });
      document.querySelectorAll('.deleteService').forEach(btn => {
        btn.addEventListener('click', () => {
          if (confirm('¿Deseas eliminar este servicio?')) {
            window.deleteItem('services', btn.dataset.id, renderServicesList);
          }
        });
      });
    }
  ]);
}

function showServiceForm(service = null) {
  const formConfig = {
    title: 'Servicio',
    fields: [
      { name: 'nombre', placeholder: 'Nombre', type: 'input', required: true },
      { name: 'descripcion', placeholder: 'Descripción', type: 'textarea' },
      { name: 'precio_default', placeholder: 'Precio', type: 'input', inputType: 'number', required: true }
    ],
    onSave: renderServicesList
  };
  window.showForm('services', 'modalContainer', formConfig, service);
}

window.loadServicesModule = loadServicesModule;