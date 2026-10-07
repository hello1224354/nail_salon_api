import mysql from "mysql2/promise";

const AUDIT_RETENTION_DAYS = 90;
const CHALLENGE_RETENTION_DAYS = 7;
const SESSION_RETENTION_DAYS = 30;

function required(name: string) {
    const value = process.env[name];
    if (!value || value.trim().length === 0) {
        throw new Error(`${name} is required`);
    }
    return value.trim();
}

function requiredPort(name: string) {
    const value = Number(required(name));
    if (!Number.isInteger(value) || value <= 0 || value > 65535) {
        throw new Error(`${name} must be a valid TCP port`);
    }
    return value;
}

async function main() {
    const connection = await mysql.createConnection({
        host: required("DB_HOST"),
        port: requiredPort("DB_PORT"),
        user: required("DB_USER"),
        password: required("DB_PASSWORD"),
        database: required("DB_NAME"),
        timezone: "Z",
    });

    try {
        await connection.beginTransaction();

        const [auditResult] = await connection.execute<mysql.ResultSetHeader>(
            `DELETE FROM audit_logs
             WHERE created_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL ${AUDIT_RETENTION_DAYS} DAY)`
        );

        const [passwordResetResult] = await connection.execute<mysql.ResultSetHeader>(
            `DELETE FROM password_reset_challenges
             WHERE expires_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL ${CHALLENGE_RETENTION_DAYS} DAY)
                OR consumed_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL ${CHALLENGE_RETENTION_DAYS} DAY)`
        );

        const [mfaResult] = await connection.execute<mysql.ResultSetHeader>(
            `DELETE FROM login_mfa_challenges
             WHERE expires_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL ${CHALLENGE_RETENTION_DAYS} DAY)
                OR consumed_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL ${CHALLENGE_RETENTION_DAYS} DAY)`
        );

        const [sessionResult] = await connection.execute<mysql.ResultSetHeader>(
            `DELETE FROM refresh_sessions
             WHERE expires_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL ${SESSION_RETENTION_DAYS} DAY)
                OR revoked_at < DATE_SUB(UTC_TIMESTAMP(), INTERVAL ${SESSION_RETENTION_DAYS} DAY)`
        );

        await connection.commit();

        console.log("Retention cleanup completed", {
            audit_logs: auditResult.affectedRows,
            password_reset_challenges: passwordResetResult.affectedRows,
            login_mfa_challenges: mfaResult.affectedRows,
            refresh_sessions: sessionResult.affectedRows,
        });
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        await connection.end();
    }
}

main().catch((error) => {
    console.error("Retention cleanup failed", error);
    process.exit(1);
});
