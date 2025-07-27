import { faArrowDownShortWide, faArrowUpWideShort } from "@fortawesome/free-solid-svg-icons/index.js";
import { RouteContext } from "htmx-router";

import { MediaCard, MediaLoader } from "~/component/media.tsx";
import { IconButton } from "~/component/form.tsx";
import { Link } from "~/component/link.tsx";

import { similarityStyle } from "../media/$id/similar/_index.tsx";
import { SafeQueryInteger } from "~/util/math.ts";
import { rankGrid } from "./$.tsx";
import { prisma } from "~/db.server.ts";
import { shell } from "./$.tsx";

export async function loader({ url }: RouteContext) {
	const direction = url.searchParams.has("asc") ? "asc" : "desc";
	const offset = SafeQueryInteger(url.searchParams, "o", 0);
	let prev = SafeQueryInteger(url.searchParams, "p", 100);

	const media = await prisma.media.findMany({
		select:  { id: true, title: true, icon: true, novelty: true, scoreRank: true },
		orderBy: { novelty: direction },
		skip: offset,
		take: 100
	});


	const jsx = new Array<JSX.Element>();
	for (const m of media) {
		if (!m.novelty) continue;
		m.novelty *= 100;
		const novelty = Math.floor(m.novelty);

		if (novelty !== prev) {
			jsx.push(<div className="line">
				<div className="percent">{novelty}%</div>
				<hr></hr>
			</div>);
			prev = novelty;
		}

		jsx.push(<MediaCard media={m}>
			<div className="text-mono violet tally on-hover-show">{m.novelty.toFixed(3)}%</div>
		</MediaCard>);
	}

	if (media.length > 0) {
		let href = `/rank/novel?o=${offset + 100}&p=${prev}`;
		if (direction === "asc") href += "&asc";

		jsx.push(<MediaLoader href={href}/>);
	}

	if (url.searchParams.has("o")) return jsx;

	const nav = <Link href={direction === "asc" ? "?" : "?asc"}>
		<IconButton icon={direction === "asc" ? faArrowDownShortWide : faArrowUpWideShort}/>
	</Link>;

	return shell(
		<div className={`${rankGrid} ${similarityStyle}`}>{jsx}</div>,
		{ title: `Score Rank`, nav, search: { value: "!novel", focus: true } }
	);
}