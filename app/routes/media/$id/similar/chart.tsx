import { GetMediaSimilarityHistogram } from "db/sql.ts";
import { RouteContext } from "htmx-router";

import Client from "~/manifest.tsx";
import { Dialog } from "~/component/dialog.tsx";

import { prisma } from "~/db.server.ts";
import { title } from "node:process";

export const parameters = { id: Number };
export async function loader({ params }: RouteContext<typeof parameters>) {

	const media = await prisma.media.findUnique({
		select: { novelty: true },
		where: { id: params.id }
	})

	const histogram = await prisma.$queryRawTyped(GetMediaSimilarityHistogram(params.id));

	return <Dialog>
		<h3 style={{ marginTop: 0 }}>
			Novelty&nbsp;
			<span className="text-muted">{((media?.novelty || 0) * 100).toFixed(2)}%</span>
		</h3>
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
				scales: {
					x: { beginAtZero: true, title: { display: true, text: "Anime" } },
					y: { beginAtZero: true, title: { display: true, text: "Similarity" } }
				},
				plugins: {
					legend: { display: false },
					tooltip: { mode: "y", intersect: false }
				},
				interaction: { intersect: false, mode: 'index' }
			}}
			style={{ width: "500px", height: "500px" }}
		/>
	</Dialog>;
}