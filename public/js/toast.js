// public/js/toast.js
function showToast(message, type = 'info') {
  const bg = {
    success: 'linear-gradient(to right, #00b09b, #96c93d)',
    error:   'linear-gradient(to right, #e74c3c, #c0392b)',
    info:    'linear-gradient(to right, #3498db, #2980b9)'
  }[type] || bg.info;

  Toastify({
    text: message,
    duration: 3000,
    gravity: 'top',
    position: 'right',
    style: { background: bg },
  }).showToast();
}
