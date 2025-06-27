-- Crear base de datos
CREATE DATABASE IF NOT EXISTS `turneroCRMNew`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;
USE `turneroCRMNew`;

-- Tabla usuarios
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `remember_token` VARCHAR(100),
  `role` ENUM('admin','user') NOT NULL DEFAULT 'user',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` ENUM('habilitado','deshabilitado') NOT NULL DEFAULT 'habilitado'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla servicios
CREATE TABLE IF NOT EXISTS `servicios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `descripcion` TEXT,
  `precio_default` DECIMAL(10,2),
  `usuario_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` ENUM('habilitado','deshabilitado') NOT NULL DEFAULT 'habilitado',
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla clientes
CREATE TABLE IF NOT EXISTS `clientes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `usuario_id` INT NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `celular` VARCHAR(20),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` ENUM('habilitado','deshabilitado') NOT NULL DEFAULT 'habilitado',
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- Tabla turnos
CREATE TABLE IF NOT EXISTS `turnos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `cliente_id` INT NOT NULL,
  `servicio_id` INT NOT NULL,
  `costo` DECIMAL(10,2) NOT NULL,
  `fecha_hora` DATETIME NOT NULL,
  `observaciones` TEXT,
  `usuario_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `modified_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  FOREIGN KEY (`servicio_id`) REFERENCES `servicios`(`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  UNIQUE KEY `unq_usuario_fecha` (`usuario_id`,`fecha_hora`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE INDEX idx_fecha_hora ON turnos (fecha_hora);