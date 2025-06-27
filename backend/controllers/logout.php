<?php
session_start();
if (!empty($_SESSION['user_id'])) {
  $stmt = $pdo->prepare("UPDATE usuarios SET remember_token = NULL WHERE id = ?");
  $stmt->execute([$_SESSION['user_id']]);
}
setcookie('remember_token', '', time() - 3600, '/');
session_unset();
session_destroy();
echo json_encode(['ok' => true]);