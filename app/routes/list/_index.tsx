import { GetUserMediaList } from "@db/sql.ts";
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
	headers.set("Cache-Control", "private");
	const userID = await EnforcePermission(request, cookie);

	const offset = SafeQueryInteger(url.searchParams, "o", 0);
	let prev = SafeQueryInteger(url.searchParams, "p", 101);

	const media = await prisma.$queryRawTyped(GetUserMediaList(userID, offset, 100));

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
		jsx.push(<MediaLoader href={`/list?o=${offset + 100}`}/>);
	}

	if (url.searchParams.has("o")) return jsx;

	return shell(<>
		<Container style={{ marginBlock: "1em", display: "flex" }}>
			<div style={{ flexGrow: 1 }}></div>
			<Open href="/list/fetch">
				<IconButton icon={faArrowsRotate}/>
			</Open>

		</Container>
		<div className={`${rankGrid} ${similarityStyle}`}>{jsx}</div>
	</>, { title: `My List`, search: { value: "!list" } });
}