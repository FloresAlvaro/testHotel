-- Ejecutar justo después de cargar la demo, antes de modificar sus datos.
BEGIN;
SET LOCAL TIME ZONE 'America/La_Paz';
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM "user") <> 7 OR (SELECT COUNT(*) FROM room) <> 10
     OR (SELECT COUNT(*) FROM client) <> 8 OR (SELECT COUNT(*) FROM reservation) <> 11
     OR (SELECT COUNT(*) FROM payment) <> 11 THEN
    RAISE EXCEPTION 'Cantidad de datos de demo inesperada';
  END IF;
  IF (SELECT COUNT(*) FROM "user" WHERE role='customer' AND client_id IS NOT NULL AND is_active=true) <> 2
     OR NOT EXISTS(SELECT 1 FROM "user" u JOIN client c ON c.id=u.client_id JOIN reservation r ON r.client_id=c.id WHERE u.email='customer@hotel.com' AND r.status='confirmed')
     OR NOT EXISTS(SELECT 1 FROM "user" u JOIN client c ON c.id=u.client_id JOIN reservation r ON r.client_id=c.id WHERE u.email='customer2@hotel.com' AND r.status='checked_in') THEN
    RAISE EXCEPTION 'Faltan cuentas y estancias del portal del huésped';
  END IF;
  IF (SELECT COUNT(*) FROM housekeeping_task) <> 3 OR (SELECT COUNT(*) FROM cash_shift) <> 2
     OR (SELECT hotel_name FROM hotel_settings WHERE id=1) <> 'Hotel Central La Paz'
     OR EXISTS(SELECT 1 FROM payment p LEFT JOIN payment_receipt r ON r.payment_id=p.id WHERE p.status IN ('completed','refunded') AND r.id IS NULL) THEN
    RAISE EXCEPTION 'Faltan datos operativos de demostración';
  END IF;
  IF (SELECT COUNT(*) FROM reservation_request WHERE status='pending')<>2
     OR NOT EXISTS(SELECT 1 FROM reservation_request WHERE status='approved' AND reviewed_at IS NOT NULL)
     OR NOT EXISTS(SELECT 1 FROM reservation_request WHERE status='rejected' AND reviewed_at IS NOT NULL)
     OR (SELECT COUNT(DISTINCT status) FROM online_payment WHERE provider='demo')<>3
     OR EXISTS(SELECT 1 FROM online_payment op JOIN "user" u ON u.id=op.user_id JOIN reservation r ON r.id=op.reservation_id WHERE u.client_id IS DISTINCT FROM r.client_id)
     OR EXISTS(SELECT 1 FROM online_payment op LEFT JOIN payment p ON p.id=op.payment_id WHERE op.status='paid' AND (p.id IS NULL OR p.status<>'completed' OR p.amount<>op.amount OR p.reservation_id<>op.reservation_id))
     OR EXISTS(SELECT 1 FROM online_payment WHERE provider<>'demo' OR checkout_url<>'/portal/payments/'||id)
     OR EXISTS(SELECT 1 FROM web_session) OR EXISTS(SELECT 1 FROM user_invitation) OR EXISTS(SELECT 1 FROM password_reset) THEN
    RAISE EXCEPTION 'Escenarios del portal o de pagos en línea inconsistentes';
  END IF;
  IF EXISTS(SELECT 1 FROM reservation r JOIN room rm ON rm.id=r.room_id JOIN room_type rt ON rt.id=rm.room_type_id WHERE r.adults+r.children>rt.capacity)
     OR (SELECT COUNT(DISTINCT status) FROM housekeeping_task)<>3
     OR EXISTS(SELECT 1 FROM housekeeping_task t JOIN room r ON r.id=t.room_id WHERE t.status<>'completed' AND r.status<>'maintenance')
     OR NOT EXISTS(SELECT 1 FROM cash_shift WHERE closed_at IS NULL)
     OR EXISTS(SELECT 1 FROM cash_shift s WHERE s.closed_at IS NOT NULL AND (s.expected_amount<>s.opening_amount+COALESCE((SELECT SUM(amount) FROM cash_movement WHERE shift_id=s.id),0) OR s.counted_amount-s.expected_amount<>-10)) THEN
    RAISE EXCEPTION 'Ocupación, tareas o arqueo inconsistentes';
  END IF;
  IF EXISTS (
    SELECT 1 FROM room rm WHERE rm.status <> CASE
      WHEN rm.status = 'maintenance' THEN 'maintenance'::room_status
      WHEN EXISTS (SELECT 1 FROM reservation r WHERE r.room_id = rm.id AND r.status = 'checked_in') THEN 'occupied'::room_status
      WHEN EXISTS (SELECT 1 FROM reservation r WHERE r.room_id = rm.id AND r.status = 'confirmed' AND r.check_out > CURRENT_DATE) THEN 'reserved'::room_status
      ELSE 'available'::room_status END
  ) THEN RAISE EXCEPTION 'Habitaciones inconsistentes con sus reservas'; END IF;
  IF EXISTS (
    SELECT 1 FROM reservation r JOIN room rm ON rm.id=r.room_id JOIN room_type rt ON rt.id=rm.room_type_id
    WHERE r.total_price <> (r.check_out-r.check_in)*rt.price
  ) THEN RAISE EXCEPTION 'Precios de reservas inconsistentes'; END IF;
  IF EXISTS (
    SELECT 1 FROM reservation r JOIN payment p ON p.reservation_id=r.id
    GROUP BY r.id HAVING COALESCE(SUM(p.amount) FILTER (WHERE p.status IN ('completed','pending')),0) > r.total_price
  ) THEN RAISE EXCEPTION 'Pagos de demo superiores al total'; END IF;
  IF EXISTS (
    SELECT 1 FROM reservation a JOIN reservation b ON a.room_id=b.room_id AND a.id<b.id
    WHERE a.status <> 'cancelled' AND b.status <> 'cancelled'
      AND a.check_in < b.check_out AND a.check_out > b.check_in
  ) THEN RAISE EXCEPTION 'Reservas solapadas'; END IF;
  IF EXISTS (
    SELECT 1 FROM reservation r LEFT JOIN check_in_log l ON l.reservation_id=r.id
    WHERE (r.status='checked_in' AND (l.check_in_time IS NULL OR l.check_out_time IS NOT NULL))
       OR (r.status='checked_out' AND (l.check_in_time IS NULL OR l.check_out_time IS NULL))
       OR (r.status IN ('confirmed','cancelled') AND l.id IS NOT NULL)
  ) THEN RAISE EXCEPTION 'Logs de check-in/out inconsistentes'; END IF;
  IF NOT EXISTS (SELECT 1 FROM reservation WHERE status='confirmed' AND check_in=CURRENT_DATE)
     OR NOT EXISTS (SELECT 1 FROM reservation WHERE status='checked_in' AND check_out=CURRENT_DATE) THEN
    RAISE EXCEPTION 'Faltan llegada y salida del día';
  END IF;
END $$;
SELECT 'Demo verificada' AS resultado;
COMMIT;
