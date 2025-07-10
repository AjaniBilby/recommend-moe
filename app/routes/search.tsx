import { RouteContext } from "htmx-router";

import { MediaCard } from "~/component/media.tsx";

import { prisma } from "~/db.server.ts";
import { shell } from "~/routes/$.tsx";

export async function loader({ request, url, headers }: RouteContext) {
	const query = url.searchParams.get('q')?.toLowerCase() || "";

	if (request.headers.get("hx-target") != "search-results") return shell(<div className="wrapper">
		<h1>Search</h1>

		<form
			style={{ marginTop: "1em", display: "flex", alignItems: "center", gap: "10px" }}
			hx-trigger="input changed delay:400ms, submit, change"
			hx-target="#search-results"
			hx-replace-url="true"
			hx-swap="innerHTML show:none transition:true"
		>
			<input type="search"
				name="q" placeholder="Search..."
				defaultValue={query}
				autoCorrect="off" autoCapitalize="off" autoComplete="off"
				autoFocus
			></input>
			<div className="text-muted" style={{
				fontStyle: "italic",
				fontSize: ".8em"
			}}>name</div>
		</form>

		<div id="search-results" style={{
			marginTop: "1em",
			display: "grid",
			gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
			gap: "10px",
		}}>
			{await Search(query)}
		</div>

	</div>, { title: "Search" });

	// headers.set("Cache-Control", "private, max-age=30");
	return await Search(query);
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