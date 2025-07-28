import { GetMediaScoreHistogram } from "@db/sql.ts";
import { RouteContext } from "htmx-router";

import Client from "~/manifest.tsx";
import { Link, Open } from "~/component/link.tsx";
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

	const histogram = await prisma.$queryRawTyped(GetMediaScoreHistogram(params.id));

	return shell(<>
		<Container style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "10px" }}>
			<h1 style={{ gridColumn: "1/-1", marginBottom: 0 }}>{media.title}</h1>

			<div style={{
				aspectRatio: "2/3",
				backgroundImage: `url(/media/${params.id}/cover)`,
				backgroundPosition: "center",
				backgroundSize: "cover",
				height: "200px",
				viewTransitionName: `media-${media.id}`
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

			<div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0 10px"}}>
				{ media.popularRank && <Link className="contents" href="/rank/popular">
					<div>Popularity</div>
					<div className="text-muted" title={`#${media.popularRank}`}>{ShortInteger(media.popularity || 0)}</div>
				</Link>}
				{ media.scoreRank && <Link className="contents" href="/rank/score">
					<div>Score</div>
					<div className="text-muted" title={`#${media.scoreRank}`}>{((media.score || 0)*100).toFixed(2)}%</div>
				</Link>}
				{ media.novelty && <Open className="contents" href={`/media/${params.id}/similar/chart`}>
					<div>Novelty</div>
					<div className="text-muted">{(media.novelty*100).toFixed(2)}%</div>
				</Open>}
			</div>
		</Container>


		<Open href={`/media/${params.id}/similar/chart`}>
			<h3>Similar</h3>
		</Open>
		<MediaSimilarity mediaID={params.id} />
	</>, { title: media.title, og: {
		image: [{ url: `/media/${params.id}/cover`}]
	} });
}