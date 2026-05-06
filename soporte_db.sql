CREATE DATABASE soporte_db ;
USE soporte_db  ;

CREATE TABLE  usuarios(
id_usuario INT PRIMARY KEY auto_increment,
nombre VARCHAR (100) NOT NULL,
email VARCHAR (150) NOT NULL UNIQUE,
password_hash VARCHAR(255) NOT NULL,
rol VARCHAR (10) NOT NULL default 'cliente',
fecha_registro DATETIME default current_timestamp
);

CREATE TABLE categorias(
id_categoria INT AUTO_INCREMENT PRIMARY KEY,
nombre VARCHAR(100) NOT NULL,
descripcion TEXT
);

CREATE TABLE tickets(
id_ticket INT AUTO_INCREMENT PRIMARY KEY,
asunto VARCHAR(200) NOT NULL,
descripcion TEXT NOT NULL,
estado VARCHAR(20) NOT NULL DEFAULT 'nuevo',
fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
fecha_cierre DATETIME,
id_cliente INT NOT NULL,
id_agente INT,
id_categoria INT NOT NULL,
FOREIGN KEY (id_cliente) REFERENCES usuarios(id_usuario),
FOREIGN KEY (id_agente) REFERENCES usuarios(id_usuario),
FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
);


CREATE TABLE comentarios(
id_comentario INT AUTO_INCREMENT PRIMARY KEY,
mensaje TEXT NOT NULL,
fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
id_ticket INT NOT NULL,
id_usuario INT NOT NULL,
FOREIGN KEY (id_ticket) REFERENCES tickets(id_ticket),
FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE TABLE historial_estados(
id_historial INT AUTO_INCREMENT PRIMARY KEY,
estado_anterior VARCHAR(20),
estado_nuevo VARCHAR(20) NOT NULL,
fecha_cambio DATETIME DEFAULT CURRENT_TIMESTAMP,
id_ticket INT NOT NULL,
FOREIGN KEY (id_ticket) REFERENCES tickets(id_ticket)
);

-- tigger
CREATE TRIGGER after_ticket_estado
AFTER UPDATE ON tickets
FOR EACH ROW
INSERT INTO historial_estados (estado_anterior, estado_nuevo, id_ticket)
VALUES (OLD.estado, NEW.estado, NEW.id_ticket);

-- Datos de prueba
-- Insertar categorias
INSERT INTO categorias (nombre, descripcion) VALUES
('Hardware', 'Problemas con equipos físicos'),
('Software', 'Problemas con programas o aplicaciones'),
('Red', 'Problemas de conectividad o internet'),
('Acceso', 'Problemas de login o permisos');

-- Insertar usuarios
INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
('Juan García', 'juan@mail.com', '1234', 'cliente'),
('María López', 'maria@mail.com', '1234', 'cliente'),
('Luis Soporte', 'luis@mail.com', '1234', 'agente'),
('Ana Agente', 'ana@mail.com', '1234', 'agente');

-- Insertar tickets
INSERT INTO tickets (asunto, descripcion, estado, id_cliente, id_agente, id_categoria) VALUES
('Wi-Fi no funciona', 'No puedo conectarme a la red', 'nuevo', 1, 3, 3),
('Error de inicio de sesión', 'No puedo entrar al sistema', 'en_progreso', 2, 4, 4),
('Reembolso de compra', 'Necesito reembolso del pedido', 'cerrado', 1, 3, 2),
('Pantalla rota', 'La pantalla de mi laptop está dañada', 'nuevo', 2, NULL, 1);

-- Insertar comentarios
INSERT INTO comentarios (mensaje, id_ticket, id_usuario) VALUES
('Estamos revisando su caso', 1, 3),
('¿Puede decirnos qué error aparece?', 2, 4),
('Ya procesamos el reembolso', 3, 3),
('Por favor acérquese al sector técnico', 4, 4);

-- ejemplos de transaccion
-- Esta crea un ticket y si algo falla, deshace todo. Ejecutá esto:

START TRANSACTION;
INSERT INTO tickets (asunto, descripcion, estado, id_cliente, id_agente, id_categoria)
VALUES ('Problema de red', 'No hay internet', 'nuevo', 1, 3, 3);
INSERT INTO comentarios (mensaje, id_ticket, id_usuario)
VALUES ('Ticket recibido', LAST_INSERT_ID(), 3);
COMMIT;
SELECT * FROM tickets ORDER BY id_ticket DESC LIMIT 1;
SELECT * FROM comentarios ORDER BY id_comentario DESC LIMIT 1;