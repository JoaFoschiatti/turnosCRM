<?php
// backend/controllers/dashboard_stats.php
if (empty($_SESSION['user_id'])) {
  http_response_code(401);
  echo json_encode(['error' => 'No autenticado']);
  exit;
}

$userId = $_SESSION['user_id'];
$role = $_SESSION['role'] ?? 'user';

try {
  $stats = [
    'todayAppointments' => 0,
    'totalRevenue' => 0,
    'activeClients' => 0
  ];

  // Turnos de hoy
  $whereUser = ($role === 'admin') ? '' : 'WHERE usuario_id = ?';
  $sql = "SELECT COUNT(*) FROM turnos $whereUser AND DATE(fecha_hora) = CURDATE() AND status = 'habilitado'";
  $stmt = $pdo->prepare($sql);
  if ($role === 'admin') {
    $stmt->execute();
  } else {
    $stmt->execute([$userId]);
  }
  $stats['todayAppointments'] = $stmt->fetchColumn();

  // Ingresos totales
  $sql = "SELECT SUM(costo) FROM turnos $whereUser AND status = 'habilitado'";
  $stmt = $pdo->prepare($sql);
  if ($role === 'admin') {
    $stmt->execute();
  } else {
    $stmt->execute([$userId]);
  }
  $stats['totalRevenue'] = $stmt->fetchColumn() ?: 0;

  // Clientes activos
  $sql = "SELECT COUNT(*) FROM clientes $whereUser AND status = 'habilitado'";
  $stmt = $pdo->prepare($sql);
  if ($role === 'admin') {
    $stmt->execute();
  } else {
    $stmt->execute([$userId]);
  }
  $stats['activeClients'] = $stmt->fetchColumn();

  echo json_encode($stats);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => 'Error en la base de datos: ' . $e->getMessage()]);
}