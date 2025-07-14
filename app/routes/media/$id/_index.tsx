import { GetMediaScoreHistogram } from "db/sql.ts";
import { RouteContext } from "htmx-router";

import Client from "~/manifest.tsx";
import { Open } from "~/component/link.tsx";

import { MediaSimilarity } from "./similar/_index.tsx";
import { prisma } from "~/db.server.ts";
import { shell } from "~/routes/$.tsx";

export const parameters = { id: Number };
export async function loader({ params }: RouteContext<typeof parameters>) {
	const media = await prisma.media.findUnique({
		where: { id: params.id }
	});
	if (!media) return null;

	const histogram = await prisma.$queryRawTyped(GetMediaScoreHistogram(params.id));

	return shell(<div>
		<h1>{media.title}</h1>

		<div style={{ display: "flex", gap: "10px" }}>
			<div style={{
				aspectRatio: "2/3",
				backgroundImage: `url(/media/${params.id}/cover)`,
				backgroundPosition: "center",
				backgroundSize: "cover",
				height: "200px",
				viewTransitionName: `media-${media.id}`
			}}></div>

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


		<Open href={`/media/${params.id}/similar/chart`}>
			<h3>Similar</h3>
		</Open>
		<MediaSimilarity mediaID={params.id} />
	</div>, { title: media.title, og: {
		image: [{ url: `/media/${params.id}/cover`}]
	} });
}