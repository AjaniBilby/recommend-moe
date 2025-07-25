import { RouteContext } from "htmx-router";
import { RankMedia } from "@db/sql.ts";

import { prisma } from "~/db.server.ts";

import { shell } from "~/routes/$.tsx";

export function loader() {
	return shell(<div>
		<form method="POST"
			hx-post=""
			hx-trigger="submit"
			hx-target="#output"
		>
			<button type="submit">Compute</button>
		</form>

		<div id="output"></div>

	</div>, {});
}


export async function action({ headers }: RouteContext) {
	await prisma.$queryRawTyped(RankMedia());

	return <div className="muted-card">Done</div>;
}