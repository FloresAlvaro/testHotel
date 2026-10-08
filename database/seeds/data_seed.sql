-- ============================================
-- SEED DE DATOS DE PRUEBA - SISTEMA HOTELERO
-- Ejecutar DESPUES de crear el esquema
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

-- ============================================
-- USUARIOS (contraseñas con bcrypt, compatible con bcrypt/bcryptjs de Node)
-- admin@hotel.com      -> Admin123!
-- manager@hotel.com    -> Manager123!
-- recepcion1@hotel.com -> Recep123!
-- recepcion2@hotel.com -> Recep123!
-- ============================================
INSERT INTO "user" (name, email, password, role, is_active) VALUES
('Administrador General', 'admin@hotel.com',      crypt('Admin123!',   gen_salt('bf', 10)), 'admin',        TRUE),
('Carlos Mendoza',        'manager@hotel.com',    crypt('Manager123!', gen_salt('bf', 10)), 'manager',      TRUE),
('Lucía Fernández',       'recepcion1@hotel.com', crypt('Recep123!',   gen_salt('bf', 10)), 'receptionist', TRUE),
('Jorge Quispe',          'recepcion2@hotel.com', crypt('Recep123!',   gen_salt('bf', 10)), 'receptionist', TRUE),
('Ana Inactiva',          'inactivo@hotel.com',   crypt('Recep123!',   gen_salt('bf', 10)), 'receptionist', FALSE);

-- ============================================
-- TIPOS DE HABITACION
-- ============================================
INSERT INTO room_type (name, description, price, capacity, amenities, is_active) VALUES
('Estándar', 'Habitación sencilla con cama matrimonial',      60.00,  2, 'WiFi, TV, Baño privado',                        TRUE),
('Doble',    'Habitación con dos camas individuales',         90.00,  2, 'WiFi, TV, Baño privado, Frigobar',              TRUE),
('Familiar', 'Habitación amplia para familias',              120.00,  4, 'WiFi, TV, Baño privado, Frigobar, Sofá cama',   TRUE),
('Suite',    'Suite de lujo con sala y vista panorámica',    180.00,  3, 'WiFi, TV, Jacuzzi, Minibar, Balcón',            TRUE),
('Presidencial (descontinuada)', 'Tipo desactivado para pruebas', 350.00, 4, 'Todo incluido', FALSE);

-- ============================================
-- HABITACIONES
-- ============================================
INSERT INTO room (number, room_type_id, floor, status) VALUES
('101', (SELECT id FROM room_type WHERE name = 'Estándar'), 1, 'available'),
('102', (SELECT id FROM room_type WHERE name = 'Estándar'), 1, 'occupied'),   -- tiene check-in activo
('103', (SELECT id FROM room_type WHERE name = 'Estándar'), 1, 'available'),
('104', (SELECT id FROM room_type WHERE name = 'Estándar'), 1, 'maintenance'),
('201', (SELECT id FROM room_type WHERE name = 'Doble'),    2, 'occupied'),   -- tiene check-in activo
('202', (SELECT id FROM room_type WHERE name = 'Doble'),    2, 'available'),
('203', (SELECT id FROM room_type WHERE name = 'Familiar'), 2, 'available'),
('301', (SELECT id FROM room_type WHERE name = 'Suite'),    3, 'reserved'),
('302', (SELECT id FROM room_type WHERE name = 'Suite'),    3, 'available'),
('303', (SELECT id FROM room_type WHERE name = 'Suite'),    3, 'maintenance');

-- ============================================
-- CLIENTES
-- ============================================
INSERT INTO client (name, document, document_type, email, phone, address, city, country, nationality, date_of_birth, gender, emergency_contact, emergency_phone, notes, is_active) VALUES
('María González',   '1234567',   'cedula',   'maria.gonzalez@mail.com',  '+59170000001', 'Av. Arce 123',      'La Paz',     'Bolivia',   'Boliviana',   '1990-03-15', 'F', 'Pedro González', '+59170000011', 'Cliente frecuente',  TRUE),
('John Smith',       'US9988776', 'passport', 'john.smith@mail.com',      '+15550000002', '45 Main St',        'Miami',      'EE.UU.',    'Estadounidense','1985-07-22','M', 'Jane Smith',    '+15550000012', NULL,                TRUE),
('Pedro Ramírez',    '7654321',   'cedula',   'pedro.ramirez@mail.com',   '+59170000003', 'Calle Murillo 56',  'La Paz',     'Bolivia',   'Boliviana',   '1978-11-02', 'M', 'Rosa Ramírez',   '+59170000013', 'Prefiere pisos altos', TRUE),
('Sofía Martínez',   '4455667',   'cedula',   'sofia.martinez@mail.com',  '+59170000004', 'Zona Sur 789',      'La Paz',     'Bolivia',   'Boliviana',   '1995-01-30', 'F', 'Luis Martínez',  '+59170000014', NULL,                TRUE),
('Hans Müller',      'DE1122334', 'passport', 'hans.muller@mail.com',     '+49150000005', 'Hauptstr. 10',      'Berlín',     'Alemania',  'Alemana',     '1970-09-09', 'M', 'Anna Müller',    '+49150000015', 'Alergia a los frutos secos', TRUE),
('Camila Rojas',     'L-998877',  'license',  'camila.rojas@mail.com',    '+59170000006', 'Av. Busch 321',     'Cochabamba', 'Bolivia',   'Boliviana',   '2000-05-18', 'F', NULL,             NULL,           NULL,                TRUE),
('Diego Torrez',     '3322110',   'cedula',   NULL,                       '+59170000007', NULL,                'Santa Cruz', 'Bolivia',   'Boliviana',   '1988-12-12', 'M', NULL,             NULL,           'Sin correo (prueba de email NULL)', TRUE),
('Cliente Inactivo', '0000001',   'other',    'inactivo@mail.com',        NULL,           NULL,                NULL,         NULL,        NULL,          NULL,         NULL,NULL,             NULL,           'Cliente desactivado para pruebas', FALSE);

-- ============================================
-- RESERVAS
-- (el EXCLUDE evita solapamientos en la misma habitación salvo canceladas)
-- ============================================
INSERT INTO reservation (check_in, check_out, client_id, room_id, user_id, total_price, status, notes) VALUES
-- 1. Ya finalizada (hace 10 días)
(CURRENT_DATE - 10, CURRENT_DATE - 7,
 (SELECT id FROM client WHERE document = '1234567'),
 (SELECT id FROM room WHERE number = '101'),
 (SELECT id FROM "user" WHERE email = 'recepcion1@hotel.com'),
 180.00, 'checked_out', 'Estadía completada sin novedades'),

-- 2. En curso (habitación 102)
(CURRENT_DATE - 2, CURRENT_DATE + 2,
 (SELECT id FROM client WHERE document = 'US9988776'),
 (SELECT id FROM room WHERE number = '102'),
 (SELECT id FROM "user" WHERE email = 'recepcion1@hotel.com'),
 240.00, 'checked_in', 'Huésped extranjero'),

-- 3. En curso (habitación 201)
(CURRENT_DATE - 1, CURRENT_DATE + 3,
 (SELECT id FROM client WHERE document = '7654321'),
 (SELECT id FROM room WHERE number = '201'),
 (SELECT id FROM "user" WHERE email = 'recepcion2@hotel.com'),
 360.00, 'checked_in', NULL),

-- 4. Confirmada a futuro
(CURRENT_DATE + 5, CURRENT_DATE + 8,
 (SELECT id FROM client WHERE document = '4455667'),
 (SELECT id FROM room WHERE number = '202'),
 (SELECT id FROM "user" WHERE email = 'recepcion2@hotel.com'),
 270.00, 'confirmed', 'Solicita cama extra'),

-- 5. Confirmada, misma habitación 101 pero fechas distintas a la #1
(CURRENT_DATE + 1, CURRENT_DATE + 3,
 (SELECT id FROM client WHERE document = '1234567'),
 (SELECT id FROM room WHERE number = '101'),
 (SELECT id FROM "user" WHERE email = 'recepcion1@hotel.com'),
 120.00, 'confirmed', 'Cliente frecuente'),

-- 6. Cancelada (misma habitación 102 y fechas que no chocan con la #2)
(CURRENT_DATE + 5, CURRENT_DATE + 7,
 (SELECT id FROM client WHERE document = '3322110'),
 (SELECT id FROM room WHERE number = '102'),
 (SELECT id FROM "user" WHERE email = 'recepcion1@hotel.com'),
 120.00, 'cancelled', 'Canceló por cambio de planes'),

-- 7. Confirmada a futuro (suite)
(CURRENT_DATE + 10, CURRENT_DATE + 15,
 (SELECT id FROM client WHERE document = 'DE1122334'),
 (SELECT id FROM room WHERE number = '301'),
 (SELECT id FROM "user" WHERE email = 'recepcion2@hotel.com'),
 900.00, 'confirmed', 'Viaje de negocios'),

-- 8. Finalizada hace 20 días
(CURRENT_DATE - 20, CURRENT_DATE - 17,
 (SELECT id FROM client WHERE document = 'L-998877'),
 (SELECT id FROM room WHERE number = '103'),
 (SELECT id FROM "user" WHERE email = 'recepcion1@hotel.com'),
 180.00, 'checked_out', NULL);

-- ============================================
-- CHECK-IN / CHECK-OUT LOG
-- ============================================
INSERT INTO check_in_log (reservation_id, user_id, check_in_time, check_out_time, notes) VALUES
-- Reserva #1 (101, checked_out)
((SELECT r.id FROM reservation r JOIN room rm ON rm.id = r.room_id WHERE rm.number = '101' AND r.status = 'checked_out'),
 (SELECT id FROM "user" WHERE email = 'recepcion1@hotel.com'),
 (CURRENT_DATE - 10)::timestamp + interval '14 hours',
 (CURRENT_DATE - 7)::timestamp  + interval '11 hours',
 'Check-in y check-out normales'),

-- Reserva #2 (102, checked_in, sin check-out aún)
((SELECT r.id FROM reservation r JOIN room rm ON rm.id = r.room_id WHERE rm.number = '102' AND r.status = 'checked_in'),
 (SELECT id FROM "user" WHERE email = 'recepcion1@hotel.com'),
 (CURRENT_DATE - 2)::timestamp + interval '15 hours',
 NULL,
 'Llegó con retraso'),

-- Reserva #3 (201, checked_in)
((SELECT r.id FROM reservation r JOIN room rm ON rm.id = r.room_id WHERE rm.number = '201' AND r.status = 'checked_in'),
 (SELECT id FROM "user" WHERE email = 'recepcion2@hotel.com'),
 (CURRENT_DATE - 1)::timestamp + interval '13 hours',
 NULL,
 NULL),

-- Reserva #8 (103, checked_out)
((SELECT r.id FROM reservation r JOIN room rm ON rm.id = r.room_id WHERE rm.number = '103' AND r.status = 'checked_out'),
 (SELECT id FROM "user" WHERE email = 'recepcion1@hotel.com'),
 (CURRENT_DATE - 20)::timestamp + interval '16 hours',
 (CURRENT_DATE - 17)::timestamp + interval '10 hours',
 NULL);

-- ============================================
-- PAGOS (cubre todos los estados, tipos y métodos)
-- ============================================
INSERT INTO payment (reservation_id, amount, type, method, status, transaction_id, notes) VALUES
-- Reserva 101 finalizada: pago completo
((SELECT r.id FROM reservation r JOIN room rm ON rm.id = r.room_id WHERE rm.number = '101' AND r.status = 'checked_out'),
 180.00, 'full', 'cash', 'completed', NULL, 'Pago en efectivo al check-out'),

-- Reserva 102 en curso: adelanto completado + saldo pendiente
((SELECT r.id FROM reservation r JOIN room rm ON rm.id = r.room_id WHERE rm.number = '102' AND r.status = 'checked_in'),
 100.00, 'advance', 'credit_card', 'completed', 'TXN-0001', 'Adelanto'),
((SELECT r.id FROM reservation r JOIN room rm ON rm.id = r.room_id WHERE rm.number = '102' AND r.status = 'checked_in'),
 140.00, 'partial', 'credit_card', 'pending', 'TXN-0002', 'Saldo por cobrar'),

-- Reserva 201 en curso: pago completo por transferencia
((SELECT r.id FROM reservation r JOIN room rm ON rm.id = r.room_id WHERE rm.number = '201' AND r.status = 'checked_in'),
 360.00, 'full', 'transfer', 'completed', 'TRF-9001', NULL),

-- Reserva 202 futura: adelanto con tarjeta de débito
((SELECT r.id FROM reservation r JOIN room rm ON rm.id = r.room_id WHERE rm.number = '202' AND r.status = 'confirmed'),
 100.00, 'advance', 'debit_card', 'completed', 'TXN-0003', NULL),

-- Reserva 101 futura: pago fallido
((SELECT r.id FROM reservation r JOIN room rm ON rm.id = r.room_id WHERE rm.number = '101' AND r.status = 'confirmed'),
 50.00, 'advance', 'credit_card', 'failed', 'TXN-0004', 'Tarjeta rechazada'),

-- Reserva cancelada: adelanto reembolsado
((SELECT r.id FROM reservation r JOIN room rm ON rm.id = r.room_id WHERE rm.number = '102' AND r.status = 'cancelled'),
 60.00, 'advance', 'cash', 'refunded', NULL, 'Reembolso por cancelación'),

-- Suite futura: adelanto pendiente (cheque)
((SELECT r.id FROM reservation r JOIN room rm ON rm.id = r.room_id WHERE rm.number = '301' AND r.status = 'confirmed'),
 200.00, 'advance', 'check', 'pending', 'CHK-5501', 'Cheque por depositar'),

-- Reserva 103 finalizada
((SELECT r.id FROM reservation r JOIN room rm ON rm.id = r.room_id WHERE rm.number = '103' AND r.status = 'checked_out'),
 180.00, 'full', 'credit_card', 'completed', 'TXN-0005', NULL);

-- ============================================
-- AUDITORIA (ejemplos)
-- ============================================
INSERT INTO audit_log (user_id, action, table_name, record_id, old_value, new_value, ip_address) VALUES
((SELECT id FROM "user" WHERE email = 'admin@hotel.com'),
 'CREATE', 'room_type', (SELECT id FROM room_type WHERE name = 'Suite'),
 NULL, '{"name":"Suite","price":180}'::jsonb, '192.168.1.10'),
((SELECT id FROM "user" WHERE email = 'recepcion1@hotel.com'),
 'UPDATE', 'room', (SELECT id FROM room WHERE number = '102'),
 '{"status":"available"}'::jsonb, '{"status":"occupied"}'::jsonb, '192.168.1.21'),
((SELECT id FROM "user" WHERE email = 'recepcion2@hotel.com'),
 'LOGIN', 'user', (SELECT id FROM "user" WHERE email = 'recepcion2@hotel.com'),
 NULL, NULL, '192.168.1.22');

COMMIT;

-- ============================================
-- CONSULTAS PARA VERIFICAR
-- ============================================
-- SELECT * FROM active_reservations;
-- SELECT * FROM available_rooms;
-- SELECT * FROM current_occupancy;
-- SELECT * FROM monthly_revenue;
-- SELECT * FROM guest_checkin_history;
-- SELECT * FROM receptionist_activity;

-- ============================================
-- PRUEBAS DE RESTRICCIONES (cada una debe FALLAR)
-- ============================================
-- 1) Solapamiento en la habitación 102 (choca con la reserva en curso):
-- INSERT INTO reservation (check_in, check_out, client_id, room_id, user_id, total_price)
-- VALUES (CURRENT_DATE, CURRENT_DATE + 1,
--   (SELECT id FROM client WHERE document='1234567'),
--   (SELECT id FROM room WHERE number='102'),
--   (SELECT id FROM "user" WHERE email='recepcion1@hotel.com'), 60);
--
-- 2) Fechas invertidas (check_in >= check_out):
-- INSERT INTO reservation (check_in, check_out, client_id, room_id, user_id, total_price)
-- VALUES (CURRENT_DATE + 3, CURRENT_DATE + 2, 1, 3, 1, 60);
--
-- 3) Documento duplicado:
-- INSERT INTO client (name, document) VALUES ('Duplicado', '1234567');
--
-- 4) Segundo check-in para la misma reserva:
-- INSERT INTO check_in_log (reservation_id, user_id, check_in_time)
-- SELECT reservation_id, user_id, CURRENT_TIMESTAMP FROM check_in_log LIMIT 1;
--
-- 5) Pago con monto 0:
-- INSERT INTO payment (reservation_id, amount, method) VALUES (1, 0, 'cash');