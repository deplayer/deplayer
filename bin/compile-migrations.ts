import { readMigrationFiles } from "drizzle-orm/migrator"
import { join } from 'path'
import fs from 'fs';

const migrations = readMigrationFiles({ migrationsFolder: "./drizzle/" })

const filePath = join("src", "services", "database", "migrations.json")

fs.writeFileSync(filePath, JSON.stringify(migrations))

console.log("Migrations compiled!")
