import { extractColors } from "extract-colors";
import { Jimp } from "jimp";
import { RouteContext } from "htmx-router";
import { Style } from "htmx-router/css";

import { Link, Open } from "~/component/link.tsx";
import { Container } from "~/component/container.tsx";

import { COLOUR_EMBEDDINGS } from "~/util/color.ts";
import { MediaSimilarity } from "./similar/_index.tsx";
import { Float32ArrayDot } from "~/util/math.ts";
import { ShortInteger } from "~/util/format/text.ts";
import { prisma } from "~/db.server.ts";
import { shell } from "~/routes/$.tsx";

export const parameters = { id: Number };
export async function loader({ params, headers }: RouteContext<typeof parameters>) {
	const media = await prisma.media.findUnique({
		select: {
			id: true, title: true, description: true,
			popularRank: true, popularity: true,
			scoreRank: true, score: true,
			novelty: true
		},
		where: { id: params.id }
	});
	if (!media) return null;

	const sources = await prisma.externalMedia.findMany({
		select:  { type: true, id: true },
		where:   { mediaID: params.id },
		orderBy: { type: "asc" }
	});

	const titles = await prisma.mediaTitle.findMany({
		select:  { type: true, title: true },
		where:   { mediaID: params.id, type: { not: "Default" } },
		orderBy: { type: "asc" }
	});

	const title = titles.find(x => x.type === "English")?.title || media.title;

	const color = await SemanticColor(params.id);

	headers.set("Cache-Control", "public");
	return shell(<>
		<Container>
			<div className={mediaStyle.name} style={{ "--local-color": `hsl(var(--${color}))` } as Record<string, string>}>
				<div className={`title ${color}`}>
					<h1>{media.title}</h1>
					<div>
						{titles.map(t => <div key={t.type} title={t.type}>{t.title}</div>)}
					</div>
				</div>

				<div className="attributes">
					<div className="cover" style={{
						viewTransitionName: `media-${media.id}`,
						backgroundImage: `url(/media/${params.id}/cover)`,
					}}></div>

					<div className="default grid">
						<Link className="contents" href="/rank/popular">
							<div>Popularity</div>
							{ media.popularRank
								? <div className="text-muted text-right" title={`#${media.popularRank}`}>{ShortInteger(media.popularity || 0)}</div>
								: blanker
							}
						</Link>

						<Open className="contents" href={`/media/${params.id}/score`}>
							<div>Score</div>
							{ media.scoreRank
								? <div className="text-muted text-right" title={`#${media.scoreRank}`}>{((media.score || 0)*100).toFixed(2)}%</div>
								: blanker
							}
						</Open>

						<Open className="contents" href={`/media/${params.id}/similar/chart`} title="How uniquely this show is scored">
							<div>Novelty</div>
							{ media.novelty
								? <div className="text-muted text-right">{(media.novelty*100).toFixed(2)}%</div>
								: blanker
							}
						</Open>
					</div>

					<div className="default grid" style={{ marginTop: 0 }}>
						<Link className="contents" href="/list">
							<div>My Score</div>
							<div
								className="text-muted text-right"
								hx-trigger="load"
								hx-target="this"
								hx-get={`/media/${params.id}/score/@me`}
								hx-swap="innerHTML"
							></div>
						</Link>

						<Link className="contents" href="/everything" title="Predicted Score">
							<div>Affinity</div>
							<div
								className="text-muted text-right"
								hx-trigger="load"
								hx-target="this"
								hx-get={`/media/${params.id}/affinity/@me`}
								hx-swap="innerHTML"
							></div>
						</Link>
					</div>
				</div>

				<div className="body">
					<div>
						<p style={{ whiteSpace: "pre", textWrap: "wrap", marginTop: 0 }}>{media.description}</p>
						{sources.map(s => <a key={s.type} href={`https://myanimelist.net/anime/${s.id}`} target="_blank">
							Read More
						</a>)}
					</div>
				</div>
			</div>
		</Container>


		<Open href={`/media/${params.id}/similar/chart`}>
			<h3 style={{ marginTop: ".5em" }}>Similar</h3>
		</Open>
		<MediaSimilarity mediaID={params.id} />
	</>, { title, og: {
		image: [{ url: `/media/${params.id}/cover`}]
	} });
}

const blanker = <div className="text-muted text-right" title="Not yet calculated">&mdash; %</div>;


const mediaStyle = new Style("media-layout", `
.this {
	display: grid;
	grid-template-columns: auto 1fr;

	margin-top: 15px;

	border-radius: var(--radius);

	--local-color: #000;
}

.this .title {
	grid-column: 1/-1;
	padding: 10px;

	display: flex;
	justify-content: space-between;
	align-items: center;

	background-color: var(--local-color);
	border-radius: var(--radius) var(--radius) 0 0;
}

.this .title h1 {
	margin: 0;
}

.this .attributes {
	background-color: var(--local-color);

	border-radius: 0 0 0 var(--radius);
}

.this .attributes > .cover {
	aspect-ratio: 2/3;
	background-position: center;
	background-size: cover;
}

.this .attributes > .grid {
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 0 10px;
	align-content: flex-start;

	margin: 10px;

	padding: var(--radius);
	border-radius: calc(var(--radius) - 3px);
}

.this .body {
	display: flex;
	align-items: center;

	flex-grow: 1;
	padding: var(--radius) calc(2 * var(--radius));

	border: 3px solid var(--local-color);
	border-left: none;
	border-top: none;

	border-radius: 0 0 var(--radius) 0;
}
`);





async function SemanticColor(mediaID: number) {
	const embedding = await prisma.$queryRaw<{ embedding: string }[]>`
		SELECT "embedding"
		FROM "MediaEmbedding"
		WHERE "mediaID" = ${mediaID} and "type" = 'Description';
	`;
	if (embedding.length < 1) return "magenta";

	const query = JSON.parse(embedding[0].embedding);
	let score = 0;
	let color = "magenta";
	for (const [key, vector] of COLOUR_EMBEDDINGS) {
		const s = Float32ArrayDot(query, vector);
		if (s < score) continue;

		color = key;
		score = s;
	}

	return color;
}

/**
 * Colour extraction is unstable because jimp doesn't support webp
 * @deprecated
 */
async function GetColour(url: string | null) {
	if (!url) return "#000000";

	if (url.startsWith("https://myanimelist.cdn-dena.com/")) url = "https://cdn.myanimelist.net/"+url.slice("https://myanimelist.cdn-dena.com/".length)

	try {
		const data = await Jimp.read(url);
		const colors = await extractColors({ data: [...data.bitmap.data], width: data.width, height: data.height });
		return colors[1].hex;
	} catch (e) {
		console.error(e);
		return "#000000";
	}
}