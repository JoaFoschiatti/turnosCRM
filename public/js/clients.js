// public/js/clients.js
async function loadClientsModule() {
  const container = document.getElementById('viewContainer');
  container.innerHTML = `
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Clientes</h2>
      <button id="btnNewClient" class="btn-custom-primary">Nuevo Cliente</button>
    </div>
    <div id="clientsList" class="animate-fade-in">Cargando clientes…</div>
    <div id="modalContainer"></div>
  `;
  document.getElementById('btnNewClient').addEventListener('click', () => showClientForm());
  await renderClientsList();
}

async function renderClientsList() {
  const tableConfig = {
    headers: ['Nombre', 'Celular', 'Acciones'],
    row: c => `
      <td class="py-3 px-4">${c.nombre}</td>
      <td class="py-3 px-4">${c.celular || '-'}</td>
      <td class="py-3 px-4 text-center">
        <button data-id="${c.id}" class="editClient btn-custom-primary text-sm px-2 py-1">Editar</button>
        <button data-id="${c.id}" class="deleteClient ml-2 btn-custom-danger text-sm px-2 py-1">Eliminar</button>
      </td>
    `
  };
  window.renderList('clients', 'clientsList', tableConfig, [
    items => {
      document.querySelectorAll('.editClient').forEach(btn => {
        btn.addEventListener('click', () => {
          const client = items.find(x => x.id == btn.dataset.id);
          showClientForm(client);
        });
      });
      document.querySelectorAll('.deleteClient').forEach(btn => {
        btn.addEventListener('click', () => {
          if (confirm('¿Deseas eliminar este cliente?')) {
            window.deleteItem('clients', btn.dataset.id, renderClientsList);
          }
        });
      });
    }
  ]);
}

function showClientForm(client = null) {
  const formConfig = {
    title: 'Cliente',
    fields: [
      { name: 'nombre', placeholder: 'Nombre', type: 'input', required: true },
      { name: 'celular', placeholder: 'Celular', type: 'input', inputType: 'tel' }
    ],
    onSave: renderClientsList
  };
  window.showForm('clients', 'modalContainer', formConfig, client);
}

window.loadClientsModule = loadClientsModule;