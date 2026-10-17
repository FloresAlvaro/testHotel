-- ============================================
-- SEED DE DATOS DE PRUEBA - SISTEMA HOTELERO
-- DEMO LOCAL: datos ficticios y credenciales públicas. No usar en producción.
-- Ejecutar DESPUES del esquema y todas las migraciones, solo sobre tablas vacías.
-- Las fechas se calculan en la zona horaria del hotel al cargar la demo.
-- ============================================

BEGIN;
SET LOCAL TIME ZONE 'America/La_Paz';

-- Evitar mezclar una demo con información real o duplicarla al repetir la carga.
LOCK TABLE "user", client, room_type, room, reservation, check_in_log, payment, audit_log IN EXCLUSIVE MODE;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "user") OR EXISTS (SELECT 1 FROM client)
     OR EXISTS (SELECT 1 FROM room_type) OR EXISTS (SELECT 1 FROM room)
     OR EXISTS (SELECT 1 FROM reservation) OR EXISTS (SELECT 1 FROM payment)
     OR EXISTS (SELECT 1 FROM check_in_log) OR EXISTS (SELECT 1 FROM audit_log) THEN
    RAISE EXCEPTION 'La demo requiere tablas vacías. Usa una base separada; no se modificaron datos existentes.';
  END IF;
END $$;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

UPDATE hotel_settings SET hotel_name='Mi hotel',city='La Paz',email='recepcion@hotel.test',phone='+591 2 123 4567',address='Calle Principal 123, Centro',currency='BOB',timezone='America/La_Paz';

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
('101', (SELECT id FROM room_type WHERE name = 'Estándar'), 1, 'reserved'),
('102', (SELECT id FROM room_type WHERE name = 'Estándar'), 1, 'occupied'),   -- tiene check-in activo
('103', (SELECT id FROM room_type WHERE name = 'Estándar'), 1, 'available'),
('104', (SELECT id FROM room_type WHERE name = 'Estándar'), 1, 'maintenance'),
('201', (SELECT id FROM room_type WHERE name = 'Doble'),    2, 'occupied'),   -- tiene check-in activo
('202', (SELECT id FROM room_type WHERE name = 'Doble'),    2, 'reserved'),
('203', (SELECT id FROM room_type WHERE name = 'Familiar'), 2, 'reserved'),
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

-- 2. Entrada realizada hoy (habitación 102)
(CURRENT_DATE, CURRENT_DATE + 2,
 (SELECT id FROM client WHERE document = 'US9988776'),
 (SELECT id FROM room WHERE number = '102'),
 (SELECT id FROM "user" WHERE email = 'recepcion1@hotel.com'),
 120.00, 'checked_in', 'Huésped extranjero'),

-- 3. Salida pendiente hoy (habitación 201)
(CURRENT_DATE - 4, CURRENT_DATE,
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
 180.00, 'checked_out', NULL),

-- 9. Llegada de hoy, lista para realizar check-in
(CURRENT_DATE, CURRENT_DATE + 2,
 (SELECT id FROM client WHERE document = '4455667'),
 (SELECT id FROM room WHERE number = '203'),
 (SELECT id FROM "user" WHERE email = 'recepcion1@hotel.com'),
 240.00, 'confirmed', 'DEMO: llegada de hoy; habitación lista para check-in'),

-- 10. Reserva contigua en 202: muestra disponibilidad sin solapamientos
(CURRENT_DATE + 8, CURRENT_DATE + 10,
 (SELECT id FROM client WHERE document = 'L-998877'),
 (SELECT id FROM room WHERE number = '202'),
 (SELECT id FROM "user" WHERE email = 'recepcion2@hotel.com'),
 180.00, 'confirmed', 'DEMO: entrada el mismo día de la salida de la reserva anterior');

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
 CURRENT_TIMESTAMP,
 NULL,
 'Llegó con retraso'),

-- Reserva #3 (201, checked_in)
((SELECT r.id FROM reservation r JOIN room rm ON rm.id = r.room_id WHERE rm.number = '201' AND r.status = 'checked_in'),
 (SELECT id FROM "user" WHERE email = 'recepcion2@hotel.com'),
 (CURRENT_DATE - 4)::timestamp + interval '13 hours',
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
 20.00, 'partial', 'credit_card', 'pending', 'TXN-0002', 'Saldo por cobrar'),

-- Reserva 201 en curso: pago completo por transferencia
((SELECT r.id FROM reservation r JOIN room rm ON rm.id = r.room_id WHERE rm.number = '201' AND r.status = 'checked_in'),
 360.00, 'full', 'transfer', 'completed', 'TRF-9001', NULL),

-- Reserva 202 futura: adelanto con tarjeta de débito
((SELECT r.id FROM reservation r JOIN room rm ON rm.id = r.room_id WHERE rm.number = '202' AND r.status = 'confirmed' AND r.check_in = CURRENT_DATE + 5),
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
 180.00, 'full', 'credit_card', 'completed', 'TXN-0005', NULL),

-- Llegada de hoy: adelanto completado y saldo para practicar un cobro
((SELECT r.id FROM reservation r JOIN room rm ON rm.id = r.room_id WHERE rm.number = '203' AND r.status = 'confirmed'),
 60.00, 'advance', 'cash', 'completed', 'DEMO-203-ADVANCE', 'Adelanto de la llegada de hoy'),
((SELECT r.id FROM reservation r JOIN room rm ON rm.id = r.room_id WHERE rm.number = '203' AND r.status = 'confirmed'),
 180.00, 'partial', 'cash', 'pending', 'DEMO-203-BALANCE', 'Saldo: completar desde Pagos');

-- Fechas de creación coherentes con las operaciones de demostración.
UPDATE reservation SET created_at = LEAST(check_in::timestamp, CURRENT_TIMESTAMP),
  updated_at = CURRENT_TIMESTAMP;
UPDATE payment p SET created_at = CASE
  WHEN r.status = 'checked_out' THEN r.check_out::timestamp + interval '10 hours'
  WHEN p.status = 'refunded' THEN CURRENT_TIMESTAMP - interval '1 day'
  ELSE CURRENT_TIMESTAMP END,
  updated_at = CURRENT_TIMESTAMP
FROM reservation r WHERE p.reservation_id = r.id;

-- Alinear estados con la misma regla del backend; conservar mantenimiento.
UPDATE room rm SET status = CASE
  WHEN rm.status = 'maintenance' THEN 'maintenance'::room_status
  WHEN EXISTS (SELECT 1 FROM reservation r WHERE r.room_id = rm.id AND r.status = 'checked_in') THEN 'occupied'::room_status
  WHEN EXISTS (SELECT 1 FROM reservation r WHERE r.room_id = rm.id AND r.status = 'confirmed' AND r.check_out > CURRENT_DATE) THEN 'reserved'::room_status
  ELSE 'available'::room_status END;

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

-- Los pagos históricos se fecharon arriba: reconstruir sus comprobantes con la instantánea final del seed.
DELETE FROM payment_receipt;
INSERT INTO payment_receipt(payment_id,number,snapshot,issued_at)
SELECT p.id,'REC-'||lpad(p.id::text,8,'0'),jsonb_build_object('hotel',to_jsonb(s)-'version','payment',to_jsonb(p),'client_name',c.name,'room_number',rm.number,'reservation_id',r.id,'historical',true),p.created_at
FROM payment p JOIN reservation r ON r.id=p.reservation_id JOIN client c ON c.id=r.client_id JOIN room rm ON rm.id=r.room_id CROSS JOIN hotel_settings s
WHERE p.status IN ('completed','refunded');
UPDATE cash_movement m SET created_at=p.created_at FROM payment p WHERE p.id=m.payment_id;

-- Operación de muestra: limpieza, mantenimiento y un arqueo cerrado sin cobros.
INSERT INTO housekeeping_task(room_id,kind,title,notes,assigned_to,created_by)
SELECT r.id,CASE WHEN r.number='104' THEN 'cleaning' ELSE 'maintenance' END,
 CASE WHEN r.number='104' THEN 'Preparar habitación para la próxima llegada' ELSE 'Revisar aire acondicionado' END,
 'Tarea ficticia de demostración',u.id,a.id FROM room r CROSS JOIN "user" u CROSS JOIN "user" a
 WHERE r.number IN ('104','303') AND u.email='recepcion1@hotel.com' AND a.email='admin@hotel.com';
INSERT INTO cash_shift(user_id,opening_amount,currency,closed_at,counted_amount,expected_amount,notes,closed_by,summary)
SELECT id,100,'BOB',now(),100,100,'Arqueo de demostración sin movimientos',id,'[]'::jsonb FROM "user" WHERE email='manager@hotel.com';
-- Cuentas de huéspedes: identidades separadas para comprobar aislamiento del portal.
-- customer@hotel.com / Customer123!  -> María González (reservas futura e histórica).
-- customer2@hotel.com / Customer123! -> John Smith (estancia activa).
INSERT INTO "user"(name,email,password,role,client_id,is_active)
SELECT c.name,d.email,crypt('Customer123!',gen_salt('bf',10)),'customer',c.id,true
FROM (VALUES ('1234567','customer@hotel.com'),('US9988776','customer2@hotel.com')) AS d(document,email)
JOIN client c ON c.document=d.document;

UPDATE hotel_settings SET description='Template de hospitalidad: una estancia cómoda con atención cercana. Personaliza esta descripción, el contacto y las fotografías antes de publicar.',request_notice_hours=24,deposit_percent=30,payment_due_hours=24 WHERE id=1;
INSERT INTO reservation(check_in,check_out,client_id,room_id,user_id,total_price,notes)
SELECT CURRENT_DATE+20,CURRENT_DATE+22,u.client_id,rm.id,a.id,rt.price*2,'DEMO: gestión de reserva desde el portal'
FROM room rm JOIN room_type rt ON rt.id=rm.room_type_id CROSS JOIN "user" u CROSS JOIN "user" a
WHERE u.email='customer@hotel.com' AND a.email='admin@hotel.com' AND rm.status<>'maintenance' AND rt.is_active
AND NOT EXISTS(SELECT 1 FROM housekeeping_task t WHERE t.room_id=rm.id AND t.status<>'completed')
AND NOT EXISTS(SELECT 1 FROM reservation r WHERE r.room_id=rm.id AND r.status<>'cancelled' AND r.check_in<CURRENT_DATE+22 AND r.check_out>CURRENT_DATE+20)
AND NOT EXISTS(SELECT 1 FROM reservation WHERE notes='DEMO: gestión de reserva desde el portal') ORDER BY rm.id LIMIT 1;
INSERT INTO reservation_request(reservation_id,client_id,kind,reason) SELECT r.id,r.client_id,'cancel','Solicitud ficticia para demostrar la revisión del hotel.' FROM reservation r JOIN "user" u ON u.client_id=r.client_id WHERE u.email='customer@hotel.com' AND r.status='confirmed' AND r.check_in>CURRENT_DATE+1 ORDER BY r.id LIMIT 1;

UPDATE hotel_settings SET cover_image='/images/demo-bedroom.webp' WHERE id=1 AND cover_image='';
UPDATE room_type SET image_url='/images/demo-bedroom.webp' WHERE name='Estándar' AND image_url='';
UPDATE reservation r SET adults=LEAST(2,rt.capacity),children=CASE WHEN rt.capacity>=4 THEN 1 ELSE 0 END,arrival_time='16:00' FROM room rm JOIN room_type rt ON rt.id=rm.room_type_id WHERE r.room_id=rm.id AND r.notes='DEMO: gestión de reserva desde el portal';
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
