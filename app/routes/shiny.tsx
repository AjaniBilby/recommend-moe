import { GetShinyMedia } from "@db/sql.ts";
import { RouteContext } from "htmx-router";

import { MediaCard, MediaLoader } from "~/component/media.tsx";

import { similarityStyle } from "./media/$id/similar/_index.tsx";
import { SafeQueryInteger } from "~/util/math.ts";
import { rankGrid } from "./rank/$.tsx";
import { prisma } from "~/db.server.ts";
import { shell } from "./$.tsx";
import { Container } from "../component/container.tsx";

export async function loader({ url }: RouteContext) {

	const offset = SafeQueryInteger(url.searchParams, "o", 0);
	let prev = SafeQueryInteger(url.searchParams, "p", 100);

	const media = await prisma.$queryRawTyped(GetShinyMedia(offset, 100));

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
			<div className="text-mono violet tally on-hover-show">{m.score.toFixed(3)}%</div>
		</MediaCard>);
	}

	if (media.length > 0) {
		jsx.push(<MediaLoader href={`/shiny?o=${offset + 100}`}/>);
	}

	if (url.searchParams.has("o")) return jsx;

	return shell(<>
		<Container style={{ marginTop: "1em" }}>
			<div className="muted rounded text-mono">Shiny = Score &times; Novelty</div>
		</Container>
		<div className={`${rankGrid} ${similarityStyle}`}>{jsx}</div>
	</>,{ title: `Shiny Recommendations`, search: { value: "!shiny" } });
}