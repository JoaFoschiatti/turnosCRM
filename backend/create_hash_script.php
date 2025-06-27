<?php
require __DIR__.'/config/database.php';

$username = 'admin';
$password = 'MiContraseñaSegura';
$role     = 'admin';

// Genera el hash
$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $pdo->prepare("INSERT INTO usuarios (username, password, role) VALUES (?, ?, ?)");
try {
  $stmt->execute([$username, $hash, $role]);
  echo "Usuario '$username' creado correctamente.";
} catch (PDOException $e) {
  echo "Error al crear usuario: " . $e->getMessage();
}
