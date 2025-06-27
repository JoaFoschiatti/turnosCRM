// public/js/auth.js
document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const remember = document.getElementById('remember').checked;

  try {
    const res = await fetch('/turneroCRMNew/backend/index.php?ruta=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, remember })
    });
    const data = await res.json();
    if (data.ok) {
      showToast('¡Bienvenido!', 'success');
      window.location.href = 'app.html'; // Redirigir siempre a app.html
    } else {
      showToast(data.error || 'Error al entrar', 'error');
    }
  } catch (err) {
    showToast('Error de conexión', 'error');
  }
});