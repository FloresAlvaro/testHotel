-- ============================================
-- CREAR TIPOS ENUM PRIMERO
-- ============================================

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE user_role AS ENUM ('admin', 'receptionist', 'manager');
CREATE TYPE room_status AS ENUM ('available', 'occupied', 'maintenance', 'reserved');
CREATE TYPE reservation_status AS ENUM ('confirmed', 'checked_in', 'checked_out', 'cancelled');
CREATE TYPE payment_type AS ENUM ('full', 'partial', 'advance');
CREATE TYPE payment_method AS ENUM ('cash', 'credit_card', 'debit_card', 'transfer', 'check');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE document_type AS ENUM ('cedula', 'passport', 'license', 'other');

-- ============================================
-- CREAR FUNCIÓN PARA ACTUALIZAR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TABLA DE USUARIOS (EMPLEADOS DEL HOTEL)
-- ============================================

CREATE TABLE "user" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'receptionist',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_email ON "user"(email);
CREATE INDEX idx_user_role ON "user"(role);

CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "user"
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLA DE CLIENTES (HUESPEDES)
-- ============================================

CREATE TABLE client (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    document VARCHAR(50) NOT NULL UNIQUE,
    document_type document_type NOT NULL DEFAULT 'cedula',
    email VARCHAR(200) UNIQUE,
    phone VARCHAR(20),
    address VARCHAR(300),
    city VARCHAR(100),
    country VARCHAR(100),
    nationality VARCHAR(100),
    date_of_birth DATE,
    gender CHAR(1),
    emergency_contact VARCHAR(200),
    emergency_phone VARCHAR(20),
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_client_email ON client(email);
CREATE INDEX idx_client_document ON client(document);
CREATE INDEX idx_client_name ON client(name);
CREATE INDEX idx_client_active ON client(is_active);

CREATE TRIGGER update_client_updated_at BEFORE UPDATE ON client
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLA DE TIPOS DE HABITACION
-- ============================================

CREATE TABLE room_type (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    capacity INT NOT NULL DEFAULT 2 CHECK (capacity > 0),
    amenities VARCHAR(500),
    image VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_room_type_active ON room_type(is_active);

CREATE TRIGGER update_room_type_updated_at BEFORE UPDATE ON room_type
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLA DE HABITACIONES
-- ============================================

CREATE TABLE room (
    id SERIAL PRIMARY KEY,
    number VARCHAR(20) NOT NULL UNIQUE,
    room_type_id INT NOT NULL,
    floor INT CHECK (floor >= 0),
    status room_status NOT NULL DEFAULT 'available',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_type_id) REFERENCES room_type(id) ON DELETE RESTRICT
);

CREATE INDEX idx_room_status ON room(status);
CREATE INDEX idx_room_floor ON room(floor);
CREATE INDEX idx_room_type ON room(room_type_id);
CREATE INDEX idx_room_number ON room(number);

CREATE TRIGGER update_room_updated_at BEFORE UPDATE ON room
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLA DE RESERVAS
-- ============================================

CREATE TABLE reservation (
    id SERIAL PRIMARY KEY,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    client_id INT NOT NULL,
    room_id INT NOT NULL,
    user_id INT NOT NULL,
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    status reservation_status NOT NULL DEFAULT 'confirmed',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES client(id) ON DELETE RESTRICT,
    FOREIGN KEY (room_id) REFERENCES room(id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE RESTRICT,
    CONSTRAINT check_dates CHECK (check_in < check_out)
);

CREATE INDEX idx_reservation_check_in ON reservation(check_in);
CREATE INDEX idx_reservation_check_out ON reservation(check_out);
CREATE INDEX idx_reservation_status ON reservation(status);
CREATE INDEX idx_reservation_client ON reservation(client_id);
CREATE INDEX idx_reservation_room ON reservation(room_id);
CREATE INDEX idx_reservation_user ON reservation(user_id);

CREATE TRIGGER update_reservation_updated_at BEFORE UPDATE ON reservation
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE reservation
ADD CONSTRAINT reservation_no_room_overlap
EXCLUDE USING gist (
    room_id WITH =,
    daterange(check_in, check_out, '[)') WITH &&
)
WHERE (status <> 'cancelled');

-- ============================================
-- TABLA DE CHECK-IN / CHECK-OUT LOG
-- ============================================

CREATE TABLE check_in_log (
    id SERIAL PRIMARY KEY,
    reservation_id INT NOT NULL,
    user_id INT NOT NULL,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reservation_id) REFERENCES reservation(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE RESTRICT
);

CREATE INDEX idx_check_in_log_reservation ON check_in_log(reservation_id);
CREATE INDEX idx_check_in_log_user ON check_in_log(user_id);
CREATE INDEX idx_check_in_log_check_in_time ON check_in_log(check_in_time);

CREATE TRIGGER update_check_in_log_updated_at BEFORE UPDATE ON check_in_log
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE UNIQUE INDEX idx_one_checkin_per_reservation
ON check_in_log(reservation_id)
WHERE check_in_time IS NOT NULL;

ALTER TABLE check_in_log
ADD CONSTRAINT check_checkout_after_checkin
CHECK (
    check_out_time IS NULL
    OR (check_in_time IS NOT NULL AND check_out_time >= check_in_time)
);

-- ============================================
-- TABLA DE PAGOS
-- ============================================

CREATE TABLE payment (
    id SERIAL PRIMARY KEY,
    reservation_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    type payment_type NOT NULL DEFAULT 'full',
    method payment_method NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending',
    transaction_id VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reservation_id) REFERENCES reservation(id) ON DELETE CASCADE
);

CREATE INDEX idx_payment_status ON payment(status);
CREATE INDEX idx_payment_reservation ON payment(reservation_id);
CREATE INDEX idx_payment_created_at ON payment(created_at);
CREATE INDEX idx_payment_method ON payment(method);

CREATE TRIGGER update_payment_updated_at BEFORE UPDATE ON payment
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLA DE AUDITORIA
-- ============================================

CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id INT,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_table ON audit_log(table_name);
CREATE INDEX idx_audit_log_action ON audit_log(action);

-- ============================================
-- VISTAS UTILES
-- ============================================

CREATE VIEW active_reservations AS
SELECT
    r.id as reservation_id,
    r.check_in,
    r.check_out,
    c.name as client_name,
    c.document,
    c.phone,
    c.email,
    rm.number as room_number,
    rt.name as room_type,
    rt.price,
    r.total_price,
    r.status,
    u.name as receptionist_name
FROM reservation r
JOIN client c ON r.client_id = c.id
JOIN room rm ON r.room_id = rm.id
JOIN room_type rt ON rm.room_type_id = rt.id
JOIN "user" u ON r.user_id = u.id
WHERE r.status IN ('confirmed', 'checked_in')
ORDER BY r.check_in ASC;

CREATE VIEW available_rooms AS
SELECT
    rm.id,
    rm.number,
    rt.name as room_type,
    rt.price,
    rt.capacity,
    rt.amenities,
    rm.floor,
    rm.status
FROM room rm
JOIN room_type rt ON rm.room_type_id = rt.id
WHERE rm.status = 'available'
ORDER BY rm.floor, rm.number;

CREATE VIEW current_occupancy AS
SELECT
    rm.number as room_number,
    rt.name as room_type,
    rm.floor,
    rm.status,
    CASE
        WHEN rm.status = 'occupied' THEN c.name
        ELSE 'Disponible'
    END as guest_name,
    CASE
        WHEN rm.status = 'occupied' THEN r.check_out
        ELSE NULL
    END as check_out_date
FROM room rm
JOIN room_type rt ON rm.room_type_id = rt.id
LEFT JOIN reservation r ON rm.id = r.room_id AND r.status = 'checked_in'
LEFT JOIN client c ON r.client_id = c.id
ORDER BY rm.floor, rm.number;

CREATE VIEW monthly_revenue AS
WITH payment_totals AS (
    SELECT
        reservation_id,
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) AS payments_completed
    FROM payment
    GROUP BY reservation_id
)
SELECT
    DATE_TRUNC('month', r.created_at)::DATE as month,
    COUNT(r.id) as total_reservations,
    SUM(r.total_price) as total_revenue,
    AVG(r.total_price) as avg_price,
    COALESCE(SUM(pt.payments_completed), 0) as payments_completed
FROM reservation r
LEFT JOIN payment_totals pt ON r.id = pt.reservation_id
WHERE r.status != 'cancelled'
GROUP BY DATE_TRUNC('month', r.created_at)
ORDER BY month DESC;

CREATE VIEW guest_checkin_history AS
SELECT
    c.id as client_id,
    c.name as client_name,
    c.document,
    r.check_in,
    r.check_out,
    rm.number as room_number,
    rt.name as room_type,
    cil.check_in_time,
    cil.check_out_time,
    r.total_price,
    r.status
FROM check_in_log cil
JOIN reservation r ON cil.reservation_id = r.id
JOIN client c ON r.client_id = c.id
JOIN room rm ON r.room_id = rm.id
JOIN room_type rt ON rm.room_type_id = rt.id
ORDER BY cil.check_in_time DESC;

CREATE VIEW receptionist_activity AS
SELECT
    u.name as receptionist_name,
    COUNT(r.id) as total_reservations,
    COUNT(CASE WHEN r.status = 'checked_in' THEN 1 END) as active_checkins,
    COUNT(CASE WHEN r.status = 'checked_out' THEN 1 END) as completed_checkins,
    COUNT(CASE WHEN r.status = 'cancelled' THEN 1 END) as cancelled_reservations,
    SUM(r.total_price) as total_revenue
FROM "user" u
LEFT JOIN reservation r ON u.id = r.user_id
WHERE u.role = 'receptionist'
GROUP BY u.id, u.name
ORDER BY total_reservations DESC;
