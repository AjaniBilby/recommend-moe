import { RouteContext } from "htmx-router";
import { Style } from "htmx-router/css";

import { MediaCard } from "~/component/media.tsx";

import { prisma } from "~/db.server.ts";

export const parameters = { id: Number };
export async function loader({ params }: RouteContext<typeof parameters>) {
	const media = await prisma.media.findUnique({
		where: { id: params.id }
	});
	if (!media) return null;

	const similar = await prisma.$queryRaw<{ id: number, title: string, icon: string }[]>`
		WITH "affinity" AS (
			SELECT b."mediaID", 1.0-AVG(ABS(a."score" - b."score")) as "affinity"
			FROM "UserMediaScore" a
			INNER JOIN "UserMediaScore" b ON a."userID" = b."userID" and a."mediaID" != b."mediaID"
			WHERE a."mediaID" = ${params.id} and a."score" != 0 and b."score" != 0
			GROUP BY b."mediaID"
			HAVING COUNT(*) > 100 and 1.0-AVG(ABS(a."score" - b."score")) > 0.7
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
			jsx.push(<div className="line">
				<div className="percent">{affinity}%</div>
				<hr></hr>
			</div>);
			prev = affinity;
		}

		jsx.push(<MediaCard media={media} />)
	}

	return <div className={similarityStyle}>
		{jsx}
	</div>
}




const similarityStyle = new Style("similarity", `
.this {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
	gap: 10px;
}

.this .line {
	color: hsl(var(--muted-foreground));
	grid-column: 1/-1;
	display: flex;
	align-items: center;

	position: sticky;
	top: 0;
	z-index: 2;
}
.this .line .percent {
	background-color: hsl(var(--background));
	border-radius: 0 0 var(--radius) 0;
	padding-bottom: 4px;
	padding-right: 10px;
}
.this .line hr {
	margin: 0;
	margin-top: -4px;
	flex-grow: 1;
}

.this .skeleton {
	display: block;
	aspect-ratio: 2/3;
	height: unset !important;
}
`).name;

const skeleton = `<div class="skeleton"></div>`.repeat(5);
export const SimilaritySkeleton = <div className={similarityStyle} dangerouslySetInnerHTML={{ __html: skeleton }}></div>;