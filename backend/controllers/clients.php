<?php
if (empty($_SESSION['user_id'])) {
  http_response_code(401);
  echo json_encode(['error' => 'No autenticado']);
  exit;
}

switch ($_SERVER['REQUEST_METHOD']) {
  case 'GET':
    if ($_SESSION['role'] === 'admin') {
      $stmt = $pdo->query("SELECT id, usuario_id, nombre, celular, created_at, modified_at, status FROM clientes WHERE status = 'habilitado'");
      echo json_encode($stmt->fetchAll());
    } else {
      $stmt = $pdo->prepare("SELECT id, nombre, celular, created_at, modified_at, status FROM clientes WHERE usuario_id = ? AND status = 'habilitado'");
      $stmt->execute([$_SESSION['user_id']]);
      echo json_encode($stmt->fetchAll());
    }
    break;

  case 'POST':
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    if ($action === 'create') {
      if (empty($input['nombre'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Falta nombre']);
        exit;
      }
      $input['nombre'] = substr(trim($input['nombre']), 0, 100);
      if (!empty($input['celular']) && !is_numeric($input['celular'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Celular debe contener solo números']);
        exit;
      }
      $stmt = $pdo->prepare("INSERT INTO clientes (nombre, celular, usuario_id, status) VALUES (?, ?, ?, 'habilitado')");
      $stmt->execute([
        $input['nombre'],
        $input['celular'] ?? null,
        $_SESSION['user_id']
      ]);
      echo json_encode(['ok' => true, 'id' => $pdo->lastInsertId()]);
    } elseif ($action === 'update') {
      if (empty($input['id']) || empty($input['nombre'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Faltan campos']);
        exit;
      }
      $input['nombre'] = substr(trim($input['nombre']), 0, 100);
      if (!empty($input['celular']) && !is_numeric($input['celular'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Celular debe contener solo números']);
        exit;
      }
      if ($_SESSION['role'] === 'admin') {
        $stmt = $pdo->prepare("UPDATE clientes SET nombre = ?, celular = ? WHERE id = ? AND status = 'habilitado'");
        $stmt->execute([
          $input['nombre'],
          $input['celular'] ?? null,
          $input['id']
        ]);
      } else {
        $stmt = $pdo->prepare("UPDATE clientes SET nombre = ?, celular = ? WHERE id = ? AND usuario_id = ? AND status = 'habilitado'");
        $stmt->execute([
          $input['nombre'],
          $input['celular'] ?? null,
          $input['id'],
          $_SESSION['user_id']
        ]);
      }
      echo json_encode(['ok' => true]);
    } elseif ($action === 'delete') {
      if (empty($input['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Falta id']);
        exit;
      }
      if ($_SESSION['role'] === 'admin') {
        $stmt = $pdo->prepare("UPDATE clientes SET status = 'deshabilitado' WHERE id = ?");
        $stmt->execute([$input['id']]);
      } else {
        $stmt = $pdo->prepare("UPDATE clientes SET status = 'deshabilitado' WHERE id = ? AND usuario_id = ?");
        $stmt->execute([$input['id'], $_SESSION['user_id']]);
      }
      echo json_encode(['ok' => true]);
    } else {
      http_response_code(400);
      echo json_encode(['error' => 'Acción no válida']);
    }
    break;
}