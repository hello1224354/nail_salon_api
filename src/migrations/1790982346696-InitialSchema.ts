import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1790982346696 implements MigrationInterface {
    name = 'InitialSchema1790982346696'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`full_name\` varchar(255) NOT NULL, \`phone\` varchar(255) NOT NULL, \`email\` varchar(255) NULL, \`password_hash\` varchar(255) NOT NULL, \`role\` enum ('admin', 'staff', 'customer') NOT NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_a000cca60bcf04454e72769949\` (\`phone\`), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`branches\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`address\` varchar(255) NOT NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`staffs\` (\`user_id\` varchar(255) NOT NULL, \`branch_id\` int NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`user_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`appointments\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`staff_id\` varchar(255) NOT NULL, \`branch_id\` int NOT NULL, \`start_time\` datetime NOT NULL, \`end_time\` datetime NOT NULL, \`actual_started_at\` datetime(3) NULL, \`actual_completed_at\` datetime(3) NULL, \`status\` enum ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'pending', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`IDX_appointments_staff_start\` (\`staff_id\`, \`start_time\`), INDEX \`IDX_appointments_user_start\` (\`user_id\`, \`start_time\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`appointment_services\` (\`appointment_id\` varchar(255) NOT NULL, \`service_id\` varchar(255) NOT NULL, \`service_name\` varchar(255) NOT NULL, \`price\` int NOT NULL, \`duration_minutes\` int NOT NULL, PRIMARY KEY (\`appointment_id\`, \`service_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`services\` (\`id\` varchar(36) NOT NULL, \`branch_id\` int NOT NULL, \`name\` varchar(255) NOT NULL, \`price\` int NOT NULL, \`duration_minutes\` int NOT NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`staff_booking_slots\` (\`staff_id\` varchar(255) NOT NULL, \`slot_start\` datetime NOT NULL, PRIMARY KEY (\`staff_id\`, \`slot_start\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`audit_logs\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`user_role\` enum ('admin', 'staff', 'customer') NOT NULL, \`method\` varchar(10) NOT NULL, \`path\` varchar(2048) NOT NULL, \`status_code\` int NOT NULL, \`request_id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`staffs\` ADD CONSTRAINT \`FK_7953eac210a0e34a3e82a3c5332\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`staffs\` ADD CONSTRAINT \`FK_746a55cdb6e2dd9f2e865f947ad\` FOREIGN KEY (\`branch_id\`) REFERENCES \`branches\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`appointments\` ADD CONSTRAINT \`FK_66dee3bea82328659a4db8e54b7\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`appointments\` ADD CONSTRAINT \`FK_d211f77ba4a4f32903f0fb73a75\` FOREIGN KEY (\`staff_id\`) REFERENCES \`staffs\`(\`user_id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`appointments\` ADD CONSTRAINT \`FK_fc5d925c8972ba27457e23e7c09\` FOREIGN KEY (\`branch_id\`) REFERENCES \`branches\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`appointment_services\` ADD CONSTRAINT \`FK_923e323e598280a0454e1d1b7cf\` FOREIGN KEY (\`appointment_id\`) REFERENCES \`appointments\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`appointment_services\` ADD CONSTRAINT \`FK_5aafcd787c270f1fd2e01376a6b\` FOREIGN KEY (\`service_id\`) REFERENCES \`services\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`services\` ADD CONSTRAINT \`FK_4f1742f6a88559bd0fab6851170\` FOREIGN KEY (\`branch_id\`) REFERENCES \`branches\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`staff_booking_slots\` ADD CONSTRAINT \`FK_2d003c22364f21f25dc7cd6dc2e\` FOREIGN KEY (\`staff_id\`) REFERENCES \`staffs\`(\`user_id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`staff_booking_slots\` DROP FOREIGN KEY \`FK_2d003c22364f21f25dc7cd6dc2e\``);
        await queryRunner.query(`ALTER TABLE \`services\` DROP FOREIGN KEY \`FK_4f1742f6a88559bd0fab6851170\``);
        await queryRunner.query(`ALTER TABLE \`appointment_services\` DROP FOREIGN KEY \`FK_5aafcd787c270f1fd2e01376a6b\``);
        await queryRunner.query(`ALTER TABLE \`appointment_services\` DROP FOREIGN KEY \`FK_923e323e598280a0454e1d1b7cf\``);
        await queryRunner.query(`ALTER TABLE \`appointments\` DROP FOREIGN KEY \`FK_fc5d925c8972ba27457e23e7c09\``);
        await queryRunner.query(`ALTER TABLE \`appointments\` DROP FOREIGN KEY \`FK_d211f77ba4a4f32903f0fb73a75\``);
        await queryRunner.query(`ALTER TABLE \`appointments\` DROP FOREIGN KEY \`FK_66dee3bea82328659a4db8e54b7\``);
        await queryRunner.query(`ALTER TABLE \`staffs\` DROP FOREIGN KEY \`FK_746a55cdb6e2dd9f2e865f947ad\``);
        await queryRunner.query(`ALTER TABLE \`staffs\` DROP FOREIGN KEY \`FK_7953eac210a0e34a3e82a3c5332\``);
        await queryRunner.query(`DROP TABLE \`audit_logs\``);
        await queryRunner.query(`DROP TABLE \`staff_booking_slots\``);
        await queryRunner.query(`DROP TABLE \`services\``);
        await queryRunner.query(`DROP TABLE \`appointment_services\``);
        await queryRunner.query(`DROP INDEX \`IDX_appointments_user_start\` ON \`appointments\``);
        await queryRunner.query(`DROP INDEX \`IDX_appointments_staff_start\` ON \`appointments\``);
        await queryRunner.query(`DROP TABLE \`appointments\``);
        await queryRunner.query(`DROP TABLE \`staffs\``);
        await queryRunner.query(`DROP TABLE \`branches\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP INDEX \`IDX_a000cca60bcf04454e72769949\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }

}
