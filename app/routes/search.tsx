import { RouteContext } from "htmx-router";
import { MakeStatus } from "htmx-router/status";
import { redirect } from "htmx-router/response";

import { Vector, Vectorize } from "~/model/embedding.ts";

import { MediaCard } from "~/component/media.tsx";

import { Float32ArrayDot } from "~/util/math.ts";
import { Singleton } from "~/util/singleton.ts";
import { prisma } from "~/db.server.ts";
import { shell } from "~/routes/$.tsx";

export async function loader({ url, headers }: RouteContext) {
	const query = url.searchParams.get('q')?.toLowerCase().slice(0, 250) || "";
	if (query === "" && url.searchParams.has("q")) return redirect("/", MakeStatus("Permanent Redirect"));

	if (query.startsWith("!")) {
		const command = await Bangs(query.slice(1));
		if (command) return redirect(command, MakeStatus("Permanent Redirect"));
	}

	const results = await Search(query);

	return shell(<div id="search-results" style={{
		marginTop: "1em",
		display: "grid",
		gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
		gap: "10px",
	}}>
		{results.map(media => <MediaCard key={media.id} media={media} />)}
	</div>, {
		title: query ? `Search - ${query}` : "Search",
		search: { value: query, focus: query === "" }
	});
}


async function Search(search: string) {
	if (search === "") return [];

	return await prisma.$queryRaw<{ id: number, title: string, icon: string }[]>`
		SELECT *
		FROM "Media"
		ORDER BY similarity("title", ${search}) desc
		LIMIT 50
	`;
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
	"everything"  : "/everything",
	"list"        : "/list",
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