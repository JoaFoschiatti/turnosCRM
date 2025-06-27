// public/js/utils/crud.js
window.renderList = async function(endpoint, containerId, tableConfig, actions = []) {
  const container = document.getElementById(containerId);
  try {
    const res = await fetch(`../backend/index.php?ruta=${endpoint}`);
    if (!res.ok) {
      if (res.status === 403) throw new Error('Acceso denegado');
      throw new Error(`Error al obtener ${endpoint}`);
    }
    const items = await res.json();
    if (!items.length) {
      container.innerHTML = `<p class="text-gray-500 italic">No hay ${endpoint} registrados.</p>`;
      return;
    }
    let html = `
      <div class="overflow-x-auto rounded-lg shadow-sm">
        <table class="min-w-full bg-white border border-gray-200">
          <thead class="bg-gray-50">
            <tr>${tableConfig.headers.map(h => `<th class="py-3 px-4 text-left text-sm font-semibold text-gray-700">${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
    `;
    items.forEach(item => {
      html += `<tr class="border-t hover:bg-gray-50">${tableConfig.row(item)}</tr>`;
    });
    html += `</tbody></table></div>`;
    container.innerHTML = html;
    actions.forEach(action => action(items));
  } catch (err) {
    showToast(err.message, 'error');
    container.innerHTML = `<p class="text-red-500">Error al cargar ${endpoint}.</p>`;
  }
};

window.showForm = async function(endpoint, containerId, formConfig, item = null) {
  const modalContainer = document.getElementById(containerId);
  const isEdit = !!item;
  modalContainer.innerHTML = `
    <div class="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded-xl shadow-2xl border border-gray-100 w-full max-w-md">
        <h3 class="text-xl font-bold mb-4 text-blue-700">${isEdit ? 'Editar' : 'Nuevo'} ${formConfig.title}</h3>
        <form id="${endpoint}Form" class="space-y-4">
          ${formConfig.fields.map(field => `
            <${field.type} name="${field.name}" placeholder="${field.placeholder}"
              ${field.type === 'input' ? `type="${field.inputType || 'text'}"` : ''}
              value="${item ? (item[field.name] || '') : ''}"
              class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              ${field.required ? 'required' : ''}></${field.type}>
          `).join('')}
          <div class="flex justify-end gap-3 mt-4">
            <button type="button" id="cancel${endpoint}" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition">Cancelar</button>
            <button type="submit" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">${isEdit ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.getElementById(`cancel${endpoint}`).onclick = () => modalContainer.innerHTML = '';
  document.getElementById(`${endpoint}Form`).onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd);
    try {
      const res = await fetch(`../backend/index.php?ruta=${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: isEdit ? 'update' : 'create', id: item?.id, ...data })
      });
      const result = await res.json();
      if (result.ok) {
        showToast(`${formConfig.title} ${isEdit ? 'actualizado' : 'creado'}`, 'success');
        modalContainer.innerHTML = '';
        formConfig.onSave();
      } else {
        showToast(result.error || `Error al ${isEdit ? 'actualizar' : 'crear'} ${formConfig.title.toLowerCase()}`, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
};

window.deleteItem = async function(endpoint, id, onDelete) {
  try {
    const res = await fetch(`../backend/index.php?ruta=${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id })
    });
    const result = await res.json();
    if (result.ok) {
      showToast('Eliminado exitosamente', 'success');
      onDelete();
    } else {
      showToast(result.error || 'Error al eliminar', 'error');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};