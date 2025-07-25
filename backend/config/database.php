<?php
// backend/config/database.php
$host = getenv('DB_HOST') ?: '127.0.0.1';
$db = getenv('DB_NAME') ?: 'turneroCRMNew';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASS') ?: '';
$dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
$options = [
  PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
  PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

try {
  $pdo = new PDO($dsn, $user, $pass, $options);
  $pdo->exec("SET time_zone = '-03:00';"); // Zona horaria ajustada
} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode(['error' => 'Error de conexión: ' . $e->getMessage()]);
  exit;
}