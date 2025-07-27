import { RouteContext } from "htmx-router";
import { MakeStatus } from "htmx-router/status";
import { redirect } from "htmx-router/response";

import { Vector, Vectorize } from "~/model/embedding.ts";

import { MediaCard } from "~/component/media.tsx";

import { Float32ArrayDot } from "~/util/math.ts";
import { prisma } from "~/db.server.ts";
import { shell } from "~/routes/$.tsx";
import { Singleton } from "../util/singleton.ts";

export async function loader({ request, url, headers }: RouteContext) {
	const query = url.searchParams.get('q')?.toLowerCase() || "";
	if (query === "") return redirect("/", MakeStatus("Permanent Redirect"));

	if (query.startsWith("!")) {
		const command = await Bangs(query.slice(1));
		if (command) return redirect(command, MakeStatus("Permanent Redirect"));
	}

	return shell(<div id="search-results" style={{
		marginTop: "1em",
		display: "grid",
		gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
		gap: "10px",
	}}>
		{await Search(query)}
	</div>, { title: "Search", search: { value: query, focus: true } });
}


async function Search(query: string) {
	if (query === "") return "";

	const results = await prisma.$queryRaw<{ id: number, title: string, icon: string }[]>`
		SELECT *
		FROM "Media"
		ORDER BY similarity("title", ${query}) desc
		LIMIT 50
	`;

	return <>
		{results.map(media => <MediaCard key={media.id} media={media} />)}
	</>
}


const commands = {
	"me"          : "/me",
	"rank"        : "/rank",
	"novel"       : "/rank/novel",
	"original"    : "/rank/novel",
	"unique"      : "/rank/novel",
	"common"      : "/rank/novel?asc",
	"normal"      : "/rank/novel?asc",
	"popular"     : "/rank/popular",
	"score"       : "/rank/score",
	"quality"     : "/rank/score",
}
type Command = keyof typeof commands;
const index = await Singleton("command-vectors", () => Vectorize(Object.keys(commands) as Command[]));
async function Bangs(search: string) {
	if (search in commands) return commands[search as Command];

	const query = await Vector(search);

	let score = 0;
	let best: string | null = null;
	for (const [ key, vector ] of index.entries()) {
		const quality = Float32ArrayDot(query, vector);
		if (quality < 0.5) continue;
		if (quality < score) continue;

		score = quality;
		best = commands[key];
	}

	return best;
}