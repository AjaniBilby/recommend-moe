import invariant from "tiny-invariant";
import { PrismaClient } from "@db/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

import { InitRoles } from "~/model/role.ts";

import { Singleton } from "~/util/singleton.ts";

const prisma = Singleton("prisma", getClient);

function getClient() {
	const DATABASE_URL = Deno.env.get("DATABASE_URL");
	invariant(typeof DATABASE_URL === "string", "DATABASE_URL env var not set");

	const databaseUrl = new URL(DATABASE_URL);
	console.info(`🔌 setting up prisma client to ${databaseUrl.host}`);

	const adapter = new PrismaPg({ connectionString: databaseUrl.toString() });
	const client = new PrismaClient({ adapter });
	// connect eagerly
	client.$connect();

	setTimeout(Init, 0);

	return client;
}

async function Init() {
	await InitRoles();

	// StartSchedulerService();

	// await TaskMessage("Scheduler", "LOG", `${hostname()} is now listening for tasks`);

	// webpush.setVapidDetails(
	// 	"mailto:xxx@xxx",
	// 	await GetSecret("VAPID_PUBLIC_KEY"),
	// 	await GetSecret("VAPID_PRIVATE_KEY"),
	// );
}

export { prisma };