import { RouteContext } from "htmx-router";

import { MediaCard, MediaLoader } from "~/component/media.tsx";

import { similarityStyle } from "../media/$id/similar/_index.tsx";
import { SafeQueryInteger } from "~/util/math.ts";
import { rankGrid } from "./$.tsx";
import { prisma } from "~/db.server.ts";
import { shell } from "./$.tsx";

export async function loader({ url }: RouteContext) {
	const offset = SafeQueryInteger(url.searchParams, "o", 0);
	let prev = SafeQueryInteger(url.searchParams, "p", 100);

	const media = await prisma.media.findMany({
		select: { id: true, title: true, icon: true, score: true, scoreRank: true },
		where: {
			scoreRank: { gt: offset }
		},
		orderBy: { scoreRank: "asc" },
		take: 100
	});


	const jsx = new Array<JSX.Element>();
	for (const m of media) {
		if (!m.score) continue;
		m.score *= 100;
		const score = Math.floor(m.score);

		if (score !== prev) {
			jsx.push(<div className="line">
				<div className="percent">{score}%</div>
				<hr></hr>
			</div>);
			prev = score;
		}

		jsx.push(<MediaCard media={m}>
			<div className="text-mono violet rank">#{m.scoreRank}</div>
			<div className="text-mono violet tally on-hover-show">{m.score.toFixed(3)}%</div>
		</MediaCard>);
	}

	if (media.length > 0) {
		const last = media[media.length-1].scoreRank;
		jsx.push(<MediaLoader href={`/rank/score?o=${last}`}/>);
	}

	if (url.searchParams.has("o")) return jsx;

	return shell(<div>
		<h1>Score</h1>

		<div className={`${rankGrid} ${similarityStyle}`}>{jsx}</div>
	</div>, { title: `Score Rank` });
}