<?php
// backend/controllers/auth.php
$input = json_decode(file_get_contents('php://input'), true);
if (empty($input['username']) || empty($input['password'])) {
  http_response_code(400);
  echo json_encode(['error' => 'Username y password son requeridos']);
  error_log('Login fallido: faltan campos');
  exit;
}

$username = substr(trim($input['username']), 0, 50);
$stmt = $pdo->prepare("SELECT id, password, role FROM usuarios WHERE username = ? AND status = 'habilitado'");
$stmt->execute([$username]);
$user = $stmt->fetch();

if (!$user || !password_verify($input['password'], $user['password'])) {
  http_response_code(401);
  echo json_encode(['error' => 'Credenciales inválidas']);
  error_log('Login fallido: credenciales inválidas para ' . $username);
  exit;
}

$_SESSION['user_id'] = $user['id'];
$_SESSION['role'] = $user['role'];

if (!empty($input['remember'])) {
  $token = bin2hex(random_bytes(16));
  $stmt = $pdo->prepare("UPDATE usuarios SET remember_token = ? WHERE id = ?");
  $stmt->execute([$token, $user['id']]);
  setcookie('remember_token', $token, time() + 60 * 60 * 24 * 30, '/', '', false, true);
  error_log('Login con remember: user_id=' . $user['id'] . ', token=' . $token);
}

echo json_encode(['ok' => true, 'role' => $user['role']]);
error_log('Login exitoso: user_id=' . $user['id'] . ', role=' . $user['role']);