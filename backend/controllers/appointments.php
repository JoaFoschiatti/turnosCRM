<?php
if (empty($_SESSION['user_id'])) {
  http_response_code(401);
  echo json_encode(['error' => 'No autenticado']);
  exit;
}

$userId = $_SESSION['user_id'];
$role = $_SESSION['role'] ?? 'user';
$now = date('Y-m-d H:i:s');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $type = $_GET['type'] ?? 'future';
  $whereClauses = [];
  if ($role !== 'admin') {
    $whereClauses[] = "t.usuario_id = ?";
  }
  $whereClauses[] = "t.status = 'habilitado'";
  $whereClause = !empty($whereClauses) ? 'WHERE ' . implode(' AND ', $whereClauses) : '';
  if ($type === 'expired') {
    $sql = "
      SELECT t.id, c.id AS cliente_id, c.nombre AS cliente, s.id AS servicio_id, s.nombre AS servicio,
             t.costo, t.fecha_hora, t.observaciones, t.status
      FROM turnos t
      JOIN clientes c ON t.cliente_id = c.id
      JOIN servicios s ON t.servicio_id = s.id
      $whereClause
      AND t.fecha_hora <= DATE_SUB(?, INTERVAL 1 HOUR)
      ORDER BY t.fecha_hora DESC
    ";
    $params = ($role === 'admin') ? [$now] : [$userId, $now];
  } else {
    $sql = "
      SELECT t.id, c.id AS cliente_id, c.nombre AS cliente, s.id AS servicio_id, s.nombre AS servicio,
             t.costo, t.fecha_hora, t.observaciones, t.status
      FROM turnos t
      JOIN clientes c ON t.cliente_id = c.id
      JOIN servicios s ON t.servicio_id = s.id
      $whereClause
      AND t.fecha_hora > DATE_SUB(?, INTERVAL 1 HOUR)
      ORDER BY t.fecha_hora ASC
    ";
    $params = ($role === 'admin') ? [$now] : [$userId, $now];
  }
  try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    echo json_encode($stmt->fetchAll());
  } catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error en la base de datos: ' . $e->getMessage()]);
  }
  exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

switch ($action) {
  case 'create':
    foreach (['cliente_id', 'servicio_id', 'costo', 'fecha_hora'] as $f) {
      if (empty($input[$f])) {
        http_response_code(400);
        echo json_encode(['error' => "Falta $f"]);
        exit;
      }
    }
    if ($input['costo'] <= 0) {
      http_response_code(400);
      echo json_encode(['error' => 'Costo debe ser positivo']);
      exit;
    }
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM turnos WHERE usuario_id = ? AND fecha_hora = ? AND status = 'habilitado'");
    $stmt->execute([$userId, $input['fecha_hora']]);
    if ($stmt->fetchColumn() > 0) {
      http_response_code(409);
      echo json_encode(['error' => 'Ya existe un turno en esa fecha/hora']);
      exit;
    }
    $stmt = $pdo->prepare("
      INSERT INTO turnos (cliente_id, servicio_id, costo, fecha_hora, observaciones, usuario_id, status)
      VALUES (?, ?, ?, ?, ?, ?, 'habilitado')
    ");
    $stmt->execute([
      $input['cliente_id'],
      $input['servicio_id'],
      $input['costo'],
      $input['fecha_hora'],
      empty($input['observaciones']) ? null : substr(trim($input['observaciones']), 0, 500),
      $userId
    ]);
    echo json_encode(['ok' => true, 'id' => $pdo->lastInsertId()]);
    break;

  case 'update':
    foreach (['id', 'cliente_id', 'servicio_id', 'costo', 'fecha_hora'] as $f) {
      if (empty($input[$f])) {
        http_response_code(400);
        echo json_encode(['error' => "Falta $f"]);
        exit;
      }
    }
    if ($input['costo'] <= 0) {
      http_response_code(400);
      echo json_encode(['error' => 'Costo debe ser positivo']);
      exit;
    }
    $stmt = $pdo->prepare("SELECT usuario_id FROM turnos WHERE id = ? AND status = 'habilitado'");
    $stmt->execute([$input['id']]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$result || ($role !== 'admin' && $result['usuario_id'] != $userId)) {
      http_response_code(403);
      echo json_encode(['error' => 'No autorizado a modificar este turno']);
      exit;
    }
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM turnos WHERE usuario_id = ? AND fecha_hora = ? AND id != ? AND status = 'habilitado'");
    $stmt->execute([$userId, $input['fecha_hora'], $input['id']]);
    if ($stmt->fetchColumn() > 0) {
      http_response_code(409);
      echo json_encode(['error' => 'Ya existe un turno en esa fecha/hora']);
      exit;
    }
    $stmt = $pdo->prepare("
      UPDATE turnos
      SET cliente_id = ?, servicio_id = ?, costo = ?, fecha_hora = ?, observaciones = ?, modified_at = CURRENT_TIMESTAMP
      WHERE id = ?
    ");
    $stmt->execute([
      $input['cliente_id'],
      $input['servicio_id'],
      $input['costo'],
      $input['fecha_hora'],
      empty($input['observaciones']) ? null : substr(trim($input['observaciones']), 0, 500),
      $input['id']
    ]);
    echo json_encode(['ok' => true]);
    break;

  case 'delete':
    if (empty($input['id'])) {
      http_response_code(400);
      echo json_encode(['error' => 'ID requerido']);
      exit;
    }
    if ($role === 'admin') {
      $stmt = $pdo->prepare("UPDATE turnos SET status = 'deshabilitado', modified_at = CURRENT_TIMESTAMP WHERE id = ?");
    } else {
      $stmt = $pdo->prepare("UPDATE turnos SET status = 'deshabilitado', modified_at = CURRENT_TIMESTAMP WHERE id = ? AND usuario_id = ?");
      $params = [$input['id'], $userId];
    }
    $stmt->execute($params ?? [$input['id']]);
    echo json_encode(['ok' => true]);
    break;

  default:
    http_response_code(400);
    echo json_encode(['error' => 'Acción inválida']);
}