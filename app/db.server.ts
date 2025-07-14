import invariant from "tiny-invariant";
import { PrismaClient } from "db/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

import { Singleton } from "~/util/singleton.ts";

const prisma = Singleton("prisma", getClient);

function getClient() {
	const DATABASE_URL = Deno.env.get("DATABASE_URL");
	invariant(typeof DATABASE_URL === "string", "DATABASE_URL env var not set");

	const databaseUrl = new URL(DATABASE_URL);
	console.info(`🔌 setting up prisma client to ${databaseUrl.host}`);

	const adapter = new PrismaPg({ connectionString: databaseUrl.toString() });
	const client = new PrismaClient({ adapter });
	// connect eagerly1
	client.$connect();

	return client;
}

export { prisma };