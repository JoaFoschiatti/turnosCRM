<?php
// backend/index.php
header('Content-Type: application/json');
require __DIR__ . '/config/database.php';
session_start();

// Logging para depuración
error_log('Session user_id: ' . ($_SESSION['user_id'] ?? 'none') . ', role: ' . ($_SESSION['role'] ?? 'none'));

// Configurar CORS si es necesario
header('Access-Control-Allow-Origin: *'); // Ajustar en producción
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Sanitizar ruta
$path = filter_var($_GET['ruta'] ?? '', FILTER_SANITIZE_STRING);

// Autologin con cookie
if (empty($_SESSION['user_id']) && !empty($_COOKIE['remember_token'])) {
  $stmt = $pdo->prepare("SELECT id, role FROM usuarios WHERE remember_token = ? AND modified_at > DATE_SUB(NOW(), INTERVAL 30 DAY)");
  $stmt->execute([$_COOKIE['remember_token']]);
  if ($u = $stmt->fetch()) {
    $_SESSION['user_id'] = $u['id'];
    $_SESSION['role'] = $u['role'];
    error_log('Autologin exitoso: user_id=' . $u['id'] . ', role=' . $u['role']);
  } else {
    setcookie('remember_token', '', time() - 3600, '/');
    error_log('Autologin fallido: token inválido');
  }
}

switch ($path) {
  case 'login':
    require __DIR__ . '/controllers/auth.php';
    break;
  case 'logout':
    require __DIR__ . '/controllers/logout.php';
    break;
  case 'check':
    if (!empty($_SESSION['user_id'])) {
      echo json_encode(['ok' => true, 'role' => $_SESSION['role'] ?? 'user']);
      error_log('Check exitoso: user_id=' . $_SESSION['user_id'] . ', role=' . ($_SESSION['role'] ?? 'none'));
    } else {
      http_response_code(401);
      echo json_encode(['ok' => false]);
      error_log('Check fallido: no hay sesión');
    }
    break;
  case 'dashboard_stats':
    require_once 'controllers/dashboard_stats.php';
    break;
  case 'appointments':
    require __DIR__ . '/controllers/appointments.php';
    break;
  case 'services':
    require __DIR__ . '/controllers/services.php';
    break;
  case 'clients':
    require __DIR__ . '/controllers/clients.php';
    break;
  case 'users':
    require __DIR__ . '/controllers/users.php';
    break;
  case 'change_password':
    require __DIR__ . '/controllers/change_password.php';
    break;
  default:
    http_response_code(404);
    echo json_encode(['error' => 'Ruta no encontrada']);
}
