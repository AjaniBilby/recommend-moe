import invariant from "tiny-invariant";
import { Prisma } from "@prisma/client";
import { PrismaClient } from '../build/prisma/index';
import { hostname } from "os";

// import { StartSchedulerService } from "~/procedure/scheduler.server";
import { Singleton } from "~/util/singleton";

const prisma = Singleton("prisma", getClient);

function getClient() {
	const DATABASE_URL = process.env.DATABASE_URL;
	invariant(typeof DATABASE_URL === "string", "DATABASE_URL env var not set");

	const databaseUrl = new URL(DATABASE_URL);
	console.info(`🔌 setting up prisma client to ${databaseUrl.host}`);
	// NOTE: during development if you change anything in this function, remember
	// that this only runs once per server restart and won't automatically be
	// re-run per request like everything else is. So if you need to change
	// something in this file, you'll need to manually restart the server.
	const client = new PrismaClient({
		// log: ['query', 'info', 'warn', 'error'],
		datasources: {
			db: {
				url: databaseUrl.toString(),
			},
		},
	});
	// connect eagerly
	client.$connect();

	setTimeout(Init, 0);

	return client;
}

// temporary fix
import * as runtime from "@prisma/client/runtime/library";
export const Decimal = runtime.Decimal;
export const sql = {
	join: runtime.join,
	str:  runtime.sqltag,
}

export { prisma };