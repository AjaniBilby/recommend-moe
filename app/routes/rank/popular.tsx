import { RouteContext } from "htmx-router";

import { MediaCard, MediaLoader } from "~/component/media.tsx";

import { SafeQueryInteger } from "~/util/math.ts";
import { similarityStyle } from "../media/$id/similar/_index.tsx";
import { rankGrid } from "./$.tsx";
import { prisma } from "~/db.server.ts";
import { shell } from "./$.tsx";
import { ShortInteger } from "../../util/format/text.ts";

export async function loader({ url }: RouteContext) {
	const cutoff = url.searchParams.has("o")
		? Number(url.searchParams.get("o")) || undefined
		: undefined;
	let prev = url.searchParams.get("p") || "0";

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

		const group = ShortInteger(m.popularity, true);
		if (group !== prev) {
			jsx.push(<div className="line">
				<div className="percent">{group}</div>
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
		jsx.push(<MediaLoader href={`/rank/popular?o=${last}&p=${prev}`}/>);
	}

	if (cutoff) return jsx;

	return shell(
		<div className={`${rankGrid} ${similarityStyle}`}>{jsx}</div>,
		{ title: `Popularity Rank`, search: { value: "!popular" } }
	);
}