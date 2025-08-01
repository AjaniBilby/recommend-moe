import { GetMediaRecommendation } from "@db/sql.ts";
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons/index.js";
import { RouteContext } from "htmx-router";

import { EnforcePermission } from "~/model/permission.ts";

import { MediaCard, MediaLoader } from "~/component/media.tsx";
import { IconButton } from "~/component/form.tsx";
import { Container } from "~/component/container.tsx";
import { Open } from "~/component/link.tsx";

import { similarityStyle } from "../media/$id/similar/_index.tsx";
import { SafeQueryInteger } from "~/util/math.ts";
import { rankGrid } from "../rank/$.tsx";
import { prisma } from "~/db.server.ts";
import { shell } from "../$.tsx";

export async function loader({ request, url, cookie, headers }: RouteContext) {
	headers.set("Cache-Control", "private, no-store");
	const userID = await EnforcePermission(request, cookie);

	const offset = SafeQueryInteger(url.searchParams, "o", 0);
	let prev = SafeQueryInteger(url.searchParams, "p", 100);

	const novelty = Number(url.searchParams.get("novelty")) || 0;

	const media = await prisma.$queryRawTyped(GetMediaRecommendation(userID, novelty, offset, 100));

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
		jsx.push(<MediaLoader href={`/everything?o=${offset + 100}&novelty=${novelty}`}/>);
	}

	if (url.searchParams.has("o")) return jsx;

	return shell(<>
		<Container style={{ marginBlock: "1em", display: "flex", alignItems: "center", gap: "20px" }}>
			<div style={{ flexGrow: 1 }}></div>

			<form hx-trigger="change" className="muted rounded" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
				<b>Novelty</b>
				<input type="range" name="novelty"
					min="0" max="1" step="any"
					defaultValue={novelty}
					style={{ paddingBlock: "0" }}
				></input>
			</form>

			<Open href="/everything/index">
				<IconButton icon={faArrowsRotate}/>
			</Open>

		</Container>
		<div className={`${rankGrid} ${similarityStyle}`}>{jsx}</div>
	</>, { title: `Recommend Everything`, search: { value: "!everything" } });
}