<?php
// backend/controllers/change_password.php
if (empty($_SESSION['user_id'])) {
  http_response_code(401);
  echo json_encode(['error' => 'No autenticado']);
  exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (empty($input['current_password']) || empty($input['new_password'])) {
  http_response_code(400);
  echo json_encode(['error' => 'Faltan contraseñas']);
  exit;
}

if (strlen($input['new_password']) < 8) {
  http_response_code(400);
  echo json_encode(['error' => 'La nueva contraseña debe tener al menos 8 caracteres']);
  exit;
}

try {
  $stmt = $pdo->prepare("SELECT password FROM usuarios WHERE id = ?");
  $stmt->execute([$_SESSION['user_id']]);
  $user = $stmt->fetch();

  if (!$user || !password_verify($input['current_password'], $user['password'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Contraseña actual incorrecta']);
    exit;
  }

  $stmt = $pdo->prepare("UPDATE usuarios SET password = ?, remember_token = NULL WHERE id = ?");
  $stmt->execute([
    password_hash($input['new_password'], PASSWORD_DEFAULT),
    $_SESSION['user_id']
  ]);

  setcookie('remember_token', '', time() - 3600, '/');
  echo json_encode(['ok' => true]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => 'Error al cambiar contraseña']);
}