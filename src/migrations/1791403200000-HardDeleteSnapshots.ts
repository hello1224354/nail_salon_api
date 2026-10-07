import { MigrationInterface, QueryRunner } from "typeorm";

export class HardDeleteSnapshots1791403200000 implements MigrationInterface {
    name = "HardDeleteSnapshots1791403200000";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`appointments\` ADD \`customer_full_name\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`appointments\` ADD \`customer_phone\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`appointments\` ADD \`customer_email\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`appointments\` ADD \`staff_full_name\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`appointments\` ADD \`branch_name\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`appointments\` ADD \`branch_address\` varchar(255) NULL`);

        await queryRunner.query(`
            UPDATE \`appointments\` appointment
            INNER JOIN \`users\` customer ON customer.\`id\` = appointment.\`user_id\`
            INNER JOIN \`staffs\` staff ON staff.\`user_id\` = appointment.\`staff_id\`
            INNER JOIN \`users\` staff_user ON staff_user.\`id\` = staff.\`user_id\`
            INNER JOIN \`branches\` branch ON branch.\`id\` = appointment.\`branch_id\`
            SET
                appointment.\`customer_full_name\` = customer.\`full_name\`,
                appointment.\`customer_phone\` = customer.\`phone\`,
                appointment.\`customer_email\` = customer.\`email\`,
                appointment.\`staff_full_name\` = staff_user.\`full_name\`,
                appointment.\`branch_name\` = branch.\`name\`,
                appointment.\`branch_address\` = branch.\`address\`
        `);

        await queryRunner.query(`ALTER TABLE \`appointments\` MODIFY \`customer_full_name\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`appointments\` MODIFY \`customer_phone\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`appointments\` MODIFY \`staff_full_name\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`appointments\` MODIFY \`branch_name\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`appointments\` MODIFY \`branch_address\` varchar(255) NOT NULL`);

        await queryRunner.query(`ALTER TABLE \`appointments\` DROP FOREIGN KEY \`FK_66dee3bea82328659a4db8e54b7\``);
        await queryRunner.query(`ALTER TABLE \`appointments\` DROP FOREIGN KEY \`FK_d211f77ba4a4f32903f0fb73a75\``);
        await queryRunner.query(`ALTER TABLE \`appointments\` DROP FOREIGN KEY \`FK_fc5d925c8972ba27457e23e7c09\``);
        await queryRunner.query(`ALTER TABLE \`appointment_services\` DROP FOREIGN KEY \`FK_923e323e598280a0454e1d1b7cf\``);
        await queryRunner.query(`ALTER TABLE \`appointment_services\` DROP FOREIGN KEY \`FK_5aafcd787c270f1fd2e01376a6b\``);

        await queryRunner.query(`ALTER TABLE \`staff_booking_slots\` DROP FOREIGN KEY \`FK_2d003c22364f21f25dc7cd6dc2e\``);
        await queryRunner.query(`ALTER TABLE \`staff_booking_slots\` ADD CONSTRAINT \`FK_2d003c22364f21f25dc7cd6dc2e\` FOREIGN KEY (\`staff_id\`) REFERENCES \`staffs\`(\`user_id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TABLE \`staffs\` DROP FOREIGN KEY \`FK_7953eac210a0e34a3e82a3c5332\``);
        await queryRunner.query(`ALTER TABLE \`staffs\` ADD CONSTRAINT \`FK_7953eac210a0e34a3e82a3c5332\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TABLE \`services\` DROP FOREIGN KEY \`FK_4f1742f6a88559bd0fab6851170\``);
        await queryRunner.query(`ALTER TABLE \`services\` ADD CONSTRAINT \`FK_4f1742f6a88559bd0fab6851170\` FOREIGN KEY (\`branch_id\`) REFERENCES \`branches\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`is_active\``);
        await queryRunner.query(`ALTER TABLE \`branches\` DROP COLUMN \`is_active\``);
        await queryRunner.query(`ALTER TABLE \`services\` DROP COLUMN \`is_active\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`services\` ADD \`is_active\` tinyint NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE \`branches\` ADD \`is_active\` tinyint NOT NULL DEFAULT 1`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`is_active\` tinyint NOT NULL DEFAULT 1`);

        await queryRunner.query(`ALTER TABLE \`services\` DROP FOREIGN KEY \`FK_4f1742f6a88559bd0fab6851170\``);
        await queryRunner.query(`ALTER TABLE \`services\` ADD CONSTRAINT \`FK_4f1742f6a88559bd0fab6851170\` FOREIGN KEY (\`branch_id\`) REFERENCES \`branches\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TABLE \`staffs\` DROP FOREIGN KEY \`FK_7953eac210a0e34a3e82a3c5332\``);
        await queryRunner.query(`ALTER TABLE \`staffs\` ADD CONSTRAINT \`FK_7953eac210a0e34a3e82a3c5332\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TABLE \`staff_booking_slots\` DROP FOREIGN KEY \`FK_2d003c22364f21f25dc7cd6dc2e\``);
        await queryRunner.query(`ALTER TABLE \`staff_booking_slots\` ADD CONSTRAINT \`FK_2d003c22364f21f25dc7cd6dc2e\` FOREIGN KEY (\`staff_id\`) REFERENCES \`staffs\`(\`user_id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TABLE \`appointment_services\` ADD CONSTRAINT \`FK_5aafcd787c270f1fd2e01376a6b\` FOREIGN KEY (\`service_id\`) REFERENCES \`services\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`appointment_services\` ADD CONSTRAINT \`FK_923e323e598280a0454e1d1b7cf\` FOREIGN KEY (\`appointment_id\`) REFERENCES \`appointments\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`appointments\` ADD CONSTRAINT \`FK_fc5d925c8972ba27457e23e7c09\` FOREIGN KEY (\`branch_id\`) REFERENCES \`branches\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`appointments\` ADD CONSTRAINT \`FK_d211f77ba4a4f32903f0fb73a75\` FOREIGN KEY (\`staff_id\`) REFERENCES \`staffs\`(\`user_id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`appointments\` ADD CONSTRAINT \`FK_66dee3bea82328659a4db8e54b7\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TABLE \`appointments\` DROP COLUMN \`branch_address\``);
        await queryRunner.query(`ALTER TABLE \`appointments\` DROP COLUMN \`branch_name\``);
        await queryRunner.query(`ALTER TABLE \`appointments\` DROP COLUMN \`staff_full_name\``);
        await queryRunner.query(`ALTER TABLE \`appointments\` DROP COLUMN \`customer_email\``);
        await queryRunner.query(`ALTER TABLE \`appointments\` DROP COLUMN \`customer_phone\``);
        await queryRunner.query(`ALTER TABLE \`appointments\` DROP COLUMN \`customer_full_name\``);
    }
}
