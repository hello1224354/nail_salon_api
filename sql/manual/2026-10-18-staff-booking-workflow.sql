-- Run manually in Railway MySQL Console BEFORE deploying the new API.
-- No TypeORM migration and no schema/table changes for custom services.
-- Take a database backup and verify the schema with SHOW CREATE TABLE first.

ALTER TABLE appointment_staff_assignments
    ADD COLUMN started_at DATETIME(3) NULL DEFAULT NULL;

ALTER TABLE appointments
    MODIFY COLUMN status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')
    NOT NULL DEFAULT 'pending';

CREATE TABLE appointment_transfer_requests (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    appointment_id VARCHAR(36) NOT NULL,
    from_staff_id VARCHAR(36) NOT NULL,
    to_staff_id VARCHAR(36) NOT NULL,
    from_staff_name VARCHAR(255) NOT NULL,
    to_staff_name VARCHAR(255) NOT NULL,
    status ENUM('pending','accepted','declined','canceled','expired') NOT NULL,
    reserved_start DATETIME(3) NOT NULL,
    reserved_end DATETIME(3) NOT NULL,
    scheduled_start DATETIME(3) NOT NULL,
    scheduled_end DATETIME(3) NOT NULL,
    expires_at DATETIME(3) NOT NULL,
    decided_at DATETIME(3) NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    KEY IDX_transfer_target_status_expiry (to_staff_id, status, expires_at),
    KEY IDX_transfer_appointment_status (appointment_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify after executing:
-- SHOW COLUMNS FROM appointment_staff_assignments LIKE 'started_at';
-- SHOW COLUMNS FROM appointments LIKE 'status';
-- SHOW CREATE TABLE appointment_transfer_requests;
