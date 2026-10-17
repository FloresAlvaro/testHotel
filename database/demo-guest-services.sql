-- Complemento idempotente para una DEMO existente: no cambia el nombre ni las credenciales.
BEGIN;
UPDATE hotel_settings SET email=CASE WHEN email='' THEN 'recepcion@hotel.test' ELSE email END,phone=CASE WHEN phone='' THEN '+591 70000000 (demo)' ELSE phone END,address=CASE WHEN address='' THEN 'Dirección de ejemplo 123' ELSE address END,city=CASE WHEN city='' THEN 'Ciudad de ejemplo' ELSE city END WHERE id=1;
UPDATE hotel_settings SET description='Template de hospitalidad: una estancia cómoda con atención cercana. Personaliza esta descripción, el contacto y las fotografías antes de publicar.',request_notice_hours=24,deposit_percent=30,payment_due_hours=24,version=version+1 WHERE id=1 AND description='';
INSERT INTO reservation(check_in,check_out,client_id,room_id,user_id,total_price,notes)
SELECT CURRENT_DATE+20,CURRENT_DATE+22,u.client_id,rm.id,a.id,rt.price*2,'DEMO: gestión de reserva desde el portal'
FROM room rm JOIN room_type rt ON rt.id=rm.room_type_id CROSS JOIN "user" u CROSS JOIN "user" a
WHERE u.email='customer@hotel.com' AND a.email='admin@hotel.com' AND rm.status<>'maintenance' AND rt.is_active
AND NOT EXISTS(SELECT 1 FROM housekeeping_task t WHERE t.room_id=rm.id AND t.status<>'completed')
AND NOT EXISTS(SELECT 1 FROM reservation r WHERE r.room_id=rm.id AND r.status<>'cancelled' AND r.check_in<CURRENT_DATE+22 AND r.check_out>CURRENT_DATE+20)
AND NOT EXISTS(SELECT 1 FROM reservation WHERE notes='DEMO: gestión de reserva desde el portal') ORDER BY rm.id LIMIT 1;
INSERT INTO reservation_request(reservation_id,client_id,kind,reason)
SELECT r.id,r.client_id,'cancel','Solicitud ficticia para demostrar la revisión del hotel.' FROM reservation r JOIN client c ON c.id=r.client_id JOIN "user" u ON u.client_id=c.id
WHERE u.email='customer@hotel.com' AND r.status='confirmed' AND r.check_in>CURRENT_DATE+1 AND NOT EXISTS(SELECT 1 FROM reservation_request q WHERE q.reservation_id=r.id) ORDER BY r.id LIMIT 1;
INSERT INTO email_outbox(recipient,subject,body,event_key) SELECT email,'Demo: nuevos servicios disponibles','Mensaje de demostración: puedes consultar tus solicitudes, simular pagos y recuperar el acceso desde el portal. Este mensaje se captura en el buzón local.','demo:guest-services' FROM "user" WHERE email='customer@hotel.com' ON CONFLICT DO NOTHING;
UPDATE hotel_settings SET cover_image='/images/demo-bedroom.webp' WHERE id=1 AND cover_image='';
UPDATE room_type SET image_url='/images/demo-bedroom.webp' WHERE name='Estándar' AND image_url='';
UPDATE reservation r SET adults=LEAST(2,rt.capacity),children=CASE WHEN rt.capacity>=4 THEN 1 ELSE 0 END,arrival_time='16:00' FROM room rm JOIN room_type rt ON rt.id=rm.room_type_id WHERE r.room_id=rm.id AND r.notes='DEMO: gestión de reserva desde el portal';
COMMIT;
