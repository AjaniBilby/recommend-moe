import { FillMediaAffinity, UpdateMediaStaleAffinity, GetSimilarMedia } from "@prisma/sql.ts";
import { RouteContext } from "htmx-router";
import { Style } from "htmx-router/css";

import { MediaCard } from "~/component/media.tsx";

import { SafeQueryInteger } from "~/util/math.ts";
import { prisma } from "~/db.server.ts";

export const parameters = { id: Number };
export async function loader({ params, url }: RouteContext<typeof parameters>) {
	const offset = SafeQueryInteger(url.searchParams, "o", 0);
	let prev = SafeQueryInteger(url.searchParams, "p", 100);

	if (offset === 0) await Init(params.id);

	const similar = await prisma.$queryRawTyped(GetSimilarMedia(params.id, offset, 100));

	const jsx = new Array<JSX.Element>();
	for (const media of similar) {
		const score = Math.floor(media.score*100);
		if (score !== prev) {
			jsx.push(<div className="line">
				<div className="percent">{score}%</div>
				<hr></hr>
			</div>);
			prev = score;
		}

		jsx.push(<MediaCard media={media} />)
	}

	if (similar.length !== 0) jsx.push(
		<Loader href={`/media/${params.id}/similar?o=${offset+similar.length}&p=${prev}`} />
	);

	return jsx;
}


export function MediaSimilarity(props: { mediaID: number }) {
	return <div className={similarityStyle}>
		<Loader href={`/media/${props.mediaID}/similar`} />
	</div>
}

function Loader(props: { href: string }) {
	return <div className="contents" hx-target="this" hx-swap="outerHTML">
		<div
			className="skeleton"
			hx-get={props.href}
			hx-trigger="intersect once"
		></div>
		{SimilaritySkeleton}
	</div>
}


async function Init(mediaID: number) {
	let stale = await CountStale(mediaID);
	if (stale == 0) {
		await prisma.$queryRawTyped(FillMediaAffinity(mediaID));
		stale = await CountStale(mediaID);
		console.log(stale, "new");
	} else console.log(stale, "stale");


	stale = await CountStale(mediaID);
	if (stale < 1) return;

	await prisma.$queryRawTyped(UpdateMediaStaleAffinity(mediaID));
}

function CountStale(mediaID: number) {
	return prisma.mediaAffinity.count({
		where: {
			OR: [{ aID: mediaID }, { bID: mediaID }],
			stale: true
		}
	})
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
const SimilaritySkeleton = <div className="contents" dangerouslySetInnerHTML={{ __html: skeleton }}></div>;