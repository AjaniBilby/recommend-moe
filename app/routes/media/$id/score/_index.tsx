import { GetMediaScoreHistogram } from "@db/sql.ts";
import { RouteContext } from "htmx-router";

import Client from "~/manifest.tsx";
import { Dialog } from "~/component/dialog.tsx";
import { Link } from "~/component/link.tsx";

import { prisma } from "~/db.server.ts";

export const parameters = { id: Number };
export async function loader({ params }: RouteContext<typeof parameters>) {
	const histogram = await prisma.$queryRawTyped(GetMediaScoreHistogram(params.id));

	return <Dialog>
		<h2 style={{ marginTop: "0" }}>Score Distribution</h2>
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
			style={{ width: "500px", height: "400px" }}
		/>
		<div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
			<Link href="/rank/score">
				<button type="button" className="secondary">Ranking</button>
			</Link>
		</div>
	</Dialog>;
}