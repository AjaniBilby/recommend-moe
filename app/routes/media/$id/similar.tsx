import { RouteContext } from "htmx-router";

import { Link } from "~/component/link.tsx";

import { prisma } from "~/db.server.ts";

export const parameters = { id: Number };
export async function loader({ params }: RouteContext<typeof parameters>) {
	const media = await prisma.media.findUnique({
		where: { id: params.id }
	});
	if (!media) return null;

	const similar = await prisma.$queryRaw<{ id: number, title: string, icon: string }[]>`
		WITH "affinity" AS (
			SELECT b."mediaID", 1.0-AVG(ABS(a."score" - b."score")) as "affinity", COUNT(*) as "overlap"
			FROM "UserMediaScore" a
			INNER JOIN "UserMediaScore" b ON a."userID" = b."userID" and a."mediaID" != b."mediaID"
			WHERE a."mediaID" = ${params.id} and a."score" != 0 and b."score" != 0
			GROUP BY b."mediaID"
			HAVING COUNT(*) > 10
			ORDER BY "affinity" desc
			LIMIT 500
		)

		SELECT m.*, a.*
		FROM "affinity" a
		INNER JOIN "Media" m ON a."mediaID" = m."id"
		ORDER BY a."affinity" desc
	`;


	const jsx = new Array<JSX.Element>();
	let prev = 0;
	for (const media of similar) {
		const affinity = Math.floor(media.affinity*100);
		if (affinity !== prev) {
			jsx.push(<div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", gap: "10px" }} className="muted-text">
				<div>{affinity}%</div>
				<hr style={{ margin: 0, flexGrow: 1 }}></hr>
			</div>);
			prev = affinity;
		}

		jsx.push(<Link href={`/media/${media.id}`}>
			<div style={{
				aspectRatio: "2/3",
				backgroundImage: `url(/media/${media.id}/cover)`,
				backgroundPosition: "center",
				backgroundSize: "cover",
				position: "relative"
			}}></div>
			<div style={{ textAlign: "center" }}>{media.title}</div>
		</Link>)
	}

	return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "10px" }}>
		{jsx}
	</div>
}