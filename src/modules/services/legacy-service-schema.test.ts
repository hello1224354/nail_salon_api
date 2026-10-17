import assert from "node:assert/strict";
import test from "node:test";
import type { QueryRunner } from "typeorm";
import { RemoveLegacyServiceSchema1791467600000 } from "../../migrations/1791467600000-RemoveLegacyServiceSchema";

test("remove only retired subgroup column and staff skills table", async () => {
    const statements: string[] = [];
    const queryRunner = {
        hasColumn: async (table: string, column: string) =>
            table === "services" && column === "subcategory",
        hasTable: async (table: string) => table === "staff_service_capabilities",
        query: async (sql: string) => { statements.push(sql); },
    } as unknown as QueryRunner;

    await new RemoveLegacyServiceSchema1791467600000().up(queryRunner);
    assert.deepEqual(statements, [
        "ALTER TABLE `services` DROP COLUMN `subcategory`",
        "DROP TABLE `staff_service_capabilities`",
    ]);
});

test("migration tolerates already removed schema objects", async () => {
    const statements: string[] = [];
    const queryRunner = {
        hasColumn: async () => false,
        hasTable: async () => false,
        query: async (sql: string) => { statements.push(sql); },
    } as unknown as QueryRunner;
    await new RemoveLegacyServiceSchema1791467600000().up(queryRunner);
    assert.deepEqual(statements, []);
});
