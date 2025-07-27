import { RouteContext } from "htmx-router";

import { MediaCard, MediaLoader } from "~/component/media.tsx";

import { SafeQueryInteger } from "~/util/math.ts";
import { similarityStyle } from "../media/$id/similar/_index.tsx";
import { rankGrid } from "./$.tsx";
import { prisma } from "~/db.server.ts";
import { shell } from "./$.tsx";

export async function loader({ url }: RouteContext) {
	const cutoff = url.searchParams.has("o")
		? Number(url.searchParams.get("o")) || undefined
		: undefined;
	let prev = SafeQueryInteger(url.searchParams, "p", Number.MAX_SAFE_INTEGER);

	const media = await prisma.media.findMany({
		select: { id: true, title: true, icon: true, popularity: true, popularRank: true },
		where: {
			popularRank: { not: null },
			popularity: cutoff ? { lt: cutoff } : undefined
		},
		orderBy: { popularRank: "asc" },
		take: 100
	});


	const jsx = new Array<JSX.Element>();
	for (const m of media) {
		if (!m.popularity) continue;
		let group = Math.floor(m.popularity / 1000);
		if (group > 25) group = Math.floor(group / 5) * 5;

		if (group !== prev) {
			jsx.push(<div className="line">
				<div className="percent">{group}k</div>
				<hr></hr>
			</div>);
			prev = group;
		}

		jsx.push(<MediaCard media={m}>
			<div className="text-mono violet rank">#{m.popularRank}</div>
			<div className="text-mono violet tally on-hover-show">{m.popularity}</div>
		</MediaCard>);
	}

	if (media.length > 0) {
		const last = media[media.length-1].popularity;
		jsx.push(<MediaLoader href={`/rank/popular?o=${last}`}/>);
	}

	if (cutoff) return jsx;

	return shell(
		<div className={`${rankGrid} ${similarityStyle}`}>{jsx}</div>,
		{ title: `Popularity Rank`, search: { value: "!popular" } }
	);
}