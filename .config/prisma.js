import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
	schema: "../prisma",
	migrations: {
		path: "../prisma/migrations",
	},
	views: {
		path: path.join("prisma", "views"),
	},
	typedSql: {
		path: "../prisma/sql",
	}
});
