import { PrismaClient, Prisma } from "@prisma/client";

declare global {
	namespace PrismaJson {
		type Attributes = Record<string, string>;
	}
}

export {};