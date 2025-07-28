import { GetMediaScoreHistogram } from "@db/sql.ts";
import { RouteContext } from "htmx-router";

import Client from "~/manifest.tsx";
import { LazyLoad, Link, Open } from "~/component/link.tsx";
import { Container } from "~/component/container.tsx";

import { MediaSimilarity } from "./similar/_index.tsx";
import { ShortInteger } from "~/util/format/text.ts";
import { prisma } from "~/db.server.ts";
import { shell } from "~/routes/$.tsx";

export const parameters = { id: Number };
export async function loader({ params }: RouteContext<typeof parameters>) {
	const media = await prisma.media.findUnique({
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

	const histogram = await prisma.$queryRawTyped(GetMediaScoreHistogram(params.id));

	return shell(<>
		<Container style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "10px 20px" }}>
			<div style={{ gridColumn: "1/-1", marginBottom: 0 }}>
				<h1 style={{ marginBlock: "15px 0" }}>{media.title}</h1>
				{titles.map(t => <div key={t.type} className="muted-text">{t.title}</div>)}
			</div>

			<div className="on-hover on-hover-scale" style={{
				aspectRatio: "2/3",
				backgroundImage: `url(/media/${params.id}/cover)`,
				backgroundPosition: "center",
				backgroundSize: "cover",
				height: "200px",
				viewTransitionName: `media-${media.id}`,
				justifySelf: "center"
			}}></div>
			<div style={{ display: "flex", gap: "10px" }}>
				<Client.Chart
					type="bar"
					data={{
						labels: histogram.map(x => x.bucket),
						datasets: [{
							data: histogram.map(x => x.frequency)
						}]
					}}
					options={{
						responsive: true,
						maintainAspectRatio: false,
						indexAxis: "y",
						scales: { x: { beginAtZero: true, title: { display: false } } },
						plugins: {
							legend: { display: false },
							tooltip: { mode: "y", intersect: false }
						},
						interaction: { intersect: false, mode: 'index' }
					}}
					style={{ width: "500px", height: "100px" }}
				/>
			</div>

			<div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0 10px", alignContent: "flex-start" }}>
				{ media.popularRank && <Link className="contents" href="/rank/popular">
					<div>Popularity</div>
					<div className="text-muted text-right" title={`#${media.popularRank}`}>{ShortInteger(media.popularity || 0)}</div>
				</Link>}

				{ media.scoreRank && <Link className="contents" href="/rank/score">
					<div>Score</div>
					<div className="text-muted text-right" title={`#${media.scoreRank}`}>{((media.score || 0)*100).toFixed(2)}%</div>
				</Link>}

				{ media.novelty && <Open className="contents" href={`/media/${params.id}/similar/chart`} title="How uniquely this show is scored">
					<div>Novelty</div>
					<div className="text-muted text-right">{(media.novelty*100).toFixed(2)}%</div>
				</Open>}

				<hr style={{ gridColumn: "1/-1", marginBlock: "10px" }}></hr>

				<Link className="contents" href="/list">
					<div>My Score</div>
					<div
						className="text-muted text-right"
						hx-trigger="load"
						hx-target="this"
						hx-get={`/media/${params.id}/score`}
						hx-swap="innerHTML"
					></div>
				</Link>

				<Link className="contents" href="/everything" title="Predicted Score">
					<div>Affinity</div>
					<div
						className="text-muted text-right"
						hx-trigger="load"
						hx-target="this"
						hx-get={`/media/${params.id}/affinity`}
						hx-swap="innerHTML"
					></div>
				</Link>
			</div>

			<div>
				<p style={{ whiteSpace: "pre", textWrap: "wrap", marginTop: 0 }}>{media.description}</p>
				{sources.map(s => <a key={s.type} href={`https://myanimelist.net/anime/${s.id}`} target="_blank">
					Read More
				</a>)}
			</div>
		</Container>


		<Open href={`/media/${params.id}/similar/chart`}>
			<h3>Similar</h3>
		</Open>
		<MediaSimilarity mediaID={params.id} />
	</>, { title, og: {
		image: [{ url: `/media/${params.id}/cover`}]
	} });
}