import { GetMediaAffinityHash, GetSimilarMedia } from "@db/sql.ts";
import { AssertETagStale } from "htmx-router/response";
import { RouteContext } from "htmx-router";
import { Style } from "htmx-router/css";

import { MediaCard, MediaLoader } from "~/component/media.tsx";

import { SafeQueryInteger } from "~/util/math.ts";
import { ShouldCompute } from "./compute.tsx";
import { prisma } from "~/db.server.ts";

export const parameters = { id: Number };
export async function loader({ request, params, url, headers }: RouteContext<typeof parameters>) {
	const offset = SafeQueryInteger(url.searchParams, "o", 0);
	const prev   = SafeQueryInteger(url.searchParams, "p", 100);

	if (offset !== 0) return await Results(params.id, offset, prev);

	const compute = await ShouldCompute(params.id);
	if (compute) {
		headers.set("Cache-Control", "private, no-cache, no-store");
		return compute;
	}

	AssertETagStale(request, headers, `"${await GetHash(params.id)}"`, { public: true });
	return await Results(params.id, 0, 100);
}



export function MediaSimilarity(props: { mediaID: number }) {
	return <div className={similarityStyle}>
		<MediaLoader href={`/media/${props.mediaID}/similar`} />
	</div>
}


const CHUNK_SIZE = 100;
async function Results(mediaID: number, offset: number, prev: number) {
	const similar = await prisma.$queryRawTyped(GetSimilarMedia(mediaID, offset, CHUNK_SIZE));

	if (similar.length === 0) {
		if (offset === 0) return <div className="muted card" style={{ gridColumn: "1/-1", padding: "var(--radius)"}}>
			This media does not have enough scores in common with other media
		</div>;
		return "";
	}

	const jsx = new Array<JSX.Element>();
	for (const media of similar) {
		const score = Math.floor((media.score || 0)*100);
		if (score !== prev) {
			jsx.push(<div className="line">
				<div className="percent">{score}%</div>
				<hr></hr>
			</div>);
			prev = score;
		}

		jsx.push(<MediaCard media={media} />)
	}

	jsx.push(<MediaLoader href={`/media/${mediaID}/similar?o=${offset+similar.length}&p=${prev}`} />);

	return jsx;
}


async function GetHash(mediaID: number) {
	// only look at the top 100 similarities for a speed boost
	// also if the similarities changed, the top 100 likely did to
	const query = await prisma.$queryRawTyped(GetMediaAffinityHash(mediaID, CHUNK_SIZE));
	if (query[0]?.md5) return query[0]?.md5;

	return "0";
}


export const similarityStyle = new Style("similarity", `
.this {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
	gap: 10px;

	margin-inline: 15px;
	overflow-x: visible;
}

.this .line {
	color: hsl(var(--muted-foreground));
	grid-column: 1/-1;
	display: flex;
	align-items: center;

	position: sticky;
	top: 0;
	z-index: 2;

	margin-inline: -15px;
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
`).name;