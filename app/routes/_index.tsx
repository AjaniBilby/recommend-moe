import { shell } from "~/routes/$.tsx";

import { prisma } from "~/db.server.ts";

export async function loader() {
	console.log(await prisma.user.findMany());

	return shell(<div>hi2</div>, { title: "Test" });
}