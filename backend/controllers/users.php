<?php
if (empty($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
  http_response_code(403);
  echo json_encode(['error' => 'Solo admin']);
  exit;
}

try {
  switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
      $stmt = $pdo->query("SELECT id, username, nombre, role, status FROM usuarios");
      echo json_encode($stmt->fetchAll());
      break;
    case 'POST':
      $input = json_decode(file_get_contents('php://input'), true);
      $action = $input['action'] ?? '';
      if ($action === 'create') {
        if (empty($input['username']) || empty($input['password']) || empty($input['role']) || !in_array($input['role'], ['admin', 'user'])) {
          http_response_code(400);
          echo json_encode(['error' => 'Faltan campos o rol inválido']);
          exit;
        }
        if (strlen($input['password']) < 8) {
          http_response_code(400);
          echo json_encode(['error' => 'La contraseña debe tener al menos 8 caracteres']);
          exit;
        }
        $stmt = $pdo->prepare("INSERT INTO usuarios (username, password, nombre, role, status) VALUES (?, ?, ?, ?, 'habilitado')");
        $stmt->execute([
          $input['username'],
          password_hash($input['password'], PASSWORD_DEFAULT),
          $input['nombre'] ?? null,
          $input['role']
        ]);
        echo json_encode(['ok' => true]);
      } elseif ($action === 'update') {
        if (empty($input['id']) || empty($input['username']) || empty($input['role']) || !in_array($input['role'], ['admin', 'user'])) {
          http_response_code(400);
          echo json_encode(['error' => 'Faltan campos o rol inválido']);
          exit;
        }
        if ($input['id'] == $_SESSION['user_id'] && $input['role'] !== 'admin') {
          http_response_code(403);
          echo json_encode(['error' => 'No puedes cambiar tu propio rol']);
          exit;
        }
        $set = "username = ?, nombre = ?, role = ?";
        $params = [$input['username'], $input['nombre'], $input['role']];
        if (!empty($input['password'])) {
          if (strlen($input['password']) < 8) {
            http_response_code(400);
            echo json_encode(['error' => 'La contraseña debe tener al menos 8 caracteres']);
            exit;
          }
          $set .= ", password = ?";
          $params[] = password_hash($input['password'], PASSWORD_DEFAULT);
        }
        $params[] = $input['id'];
        $stmt = $pdo->prepare("UPDATE usuarios SET $set WHERE id = ?");
        $stmt->execute($params);
        echo json_encode(['ok' => true]);
      } elseif ($action === 'delete') {
        if (empty($input['id'])) {
          http_response_code(400);
          echo json_encode(['error' => 'Falta id']);
          exit;
        }
        if ($input['id'] == $_SESSION['user_id']) {
          http_response_code(403);
          echo json_encode(['error' => 'No puedes deshabilitarte a ti mismo']);
          exit;
        }
        $stmt = $pdo->prepare("UPDATE usuarios SET status='deshabilitado' WHERE id = ?");
        $stmt->execute([$input['id']]);
        echo json_encode(['ok' => true]);
      } else {
        http_response_code(400);
        echo json_encode(['error' => 'Acción no válida']);
      }
      break;
  }
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => $e->getMessage()]);
}