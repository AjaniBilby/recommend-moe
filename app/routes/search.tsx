import { SearchMediaSemantic, SearchMediaTrigram } from "@db/sql.ts";
import { RouteContext } from "htmx-router";
import { MakeStatus } from "htmx-router/status";
import { redirect } from "htmx-router/response";

import { Vector, Vectorize } from "~/model/embedding.ts";

import { NamedSwitch } from "~/component/input/switch.tsx";
import { Container } from "~/component/container.tsx";
import { MediaCard } from "~/component/media.tsx";

import { Float32ArrayDot } from "~/util/math.ts";
import { Singleton } from "~/util/singleton.ts";
import { prisma } from "~/db.server.ts";
import { shell } from "~/routes/$.tsx";

export async function loader({ url }: RouteContext) {
	const query = url.searchParams.get('q')?.toLowerCase().slice(0, 250) || "";
	if (query === "" && url.searchParams.has("q")) return redirect("/", MakeStatus("Permanent Redirect"));

	const semantic = url.searchParams.get("search-mode")?.toString() === "s";

	if (query.startsWith("!")) {
		const command = await Bangs(query.slice(1));
		if (command) return redirect(command, MakeStatus("Permanent Redirect"));
	}

	const results = await Search(query, semantic);

	return shell(<>

		<Container style={{ marginTop: "1em" }}>
			<form hx-trigger="change" hx-include="[name=q]" hx-swap="innerHTML transition:true">
				<NamedSwitch name="search-mode" options={[
					{ name: "Semantic", value: "s", title: "Search based on English meaning" },
					{ name: "Text",     value: "t", title: "Search based on text similarity" }
				]} defaultValue={ semantic ? "s" : "t" } />
			</form>
		</Container>

		<div id="search-results" style={{
			marginTop: "1em",
			display: "grid",
			gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
			paddingInline: "15px",
			paddingBottom: "80px",
			gap: "10px",
		}}>
			{results.map(media => <MediaCard key={media.id} media={media} />)}
		</div>
	</>, {
		title: query ? `Search - ${query}` : "Search",
		search: { value: query, focus: query === "" }
	});
}


async function Search(search: string, semantic = true) {
	if (search === "") return [];

	if (semantic) return await prisma.$queryRawTyped(SearchMediaSemantic([...await Vector(search)]));

	return await prisma.$queryRawTyped(SearchMediaTrigram(search));
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
	"admin"       : "/admin",
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