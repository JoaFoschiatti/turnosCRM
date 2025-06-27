<?php
if (empty($_SESSION['user_id'])) {
  http_response_code(401);
  echo json_encode(['error' => 'No autorizado']);
  exit;
}

$userId = $_SESSION['user_id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $stmt = $pdo->prepare("SELECT id, nombre, descripcion, precio_default FROM servicios WHERE usuario_id = ? AND status = 'habilitado' ORDER BY nombre");
  $stmt->execute([$userId]);
  echo json_encode($stmt->fetchAll());
  exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$action = $input['action'] ?? '';

switch ($action) {
  case 'create':
    if (empty($input['nombre']) || !isset($input['precio_default']) || $input['precio_default'] < 0) {
      http_response_code(400);
      echo json_encode(['error' => 'Nombre requerido y precio no negativo']);
      exit;
    }
    $input['nombre'] = substr(trim($input['nombre']), 0, 100);
    $sql = "INSERT INTO servicios (nombre, descripcion, precio_default, usuario_id) VALUES (?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
      $input['nombre'],
      empty($input['descripcion']) ? null : substr(trim($input['descripcion']), 0, 500),
      $input['precio_default'],
      $userId
    ]);
    echo json_encode(['ok' => true, 'id' => $pdo->lastInsertId()]);
    break;

  case 'update':
    if (empty($input['id']) || empty($input['nombre']) || !isset($input['precio_default']) || $input['precio_default'] < 0) {
      http_response_code(400);
      echo json_encode(['error' => 'Faltan datos requeridos o precio inválido']);
      exit;
    }
    $stmt = $pdo->prepare("SELECT usuario_id FROM servicios WHERE id = ? AND status = 'habilitado'");
    $stmt->execute([$input['id']]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$result || $result['usuario_id'] != $userId) {
      http_response_code(403);
      echo json_encode(['error' => 'No autorizado a modificar este servicio']);
      exit;
    }
    $input['nombre'] = substr(trim($input['nombre']), 0, 100);
    $sql = "UPDATE servicios SET nombre = ?, descripcion = ?, precio_default = ?, modified_at = CURRENT_TIMESTAMP WHERE id = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
      $input['nombre'],
      empty($input['descripcion']) ? null : substr(trim($input['descripcion']), 0, 500),
      $input['precio_default'],
      $input['id']
    ]);
    echo json_encode(['ok' => true]);
    break;

  case 'delete':
    if (empty($input['id'])) {
      http_response_code(400);
      echo json_encode(['error' => 'ID de servicio requerido']);
      exit;
    }
    $stmt = $pdo->prepare("SELECT usuario_id FROM servicios WHERE id = ? AND status = 'habilitado'");
    $stmt->execute([$input['id']]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$result || $result['usuario_id'] != $userId) {
      http_response_code(403);
      echo json_encode(['error' => 'No autorizado a eliminar este servicio']);
      exit;
    }
    $stmt = $pdo->prepare("UPDATE servicios SET status = 'deshabilitado', modified_at = CURRENT_TIMESTAMP WHERE id = ?");
    $stmt->execute([$input['id']]);
    echo json_encode(['ok' => true]);
    break;

  default:
    http_response_code(400);
    echo json_encode(['error' => 'Acción inválida']);
}