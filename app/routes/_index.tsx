import { AssertETagStale } from "htmx-router/response";
import { RouteContext } from "htmx-router";

import { LazyLoad, Link } from "~/component/link.tsx";
import { Container } from "~/component/container.tsx";

import COMMIT from "../../COMMIT?raw" with { type: "text" };
import { GettingStarted } from "./getting-started.tsx";
import { TIME_SCALE } from "~/util/time.ts";
import { shell } from "./$.tsx";

const commit = COMMIT.replaceAll(/[^0-9A-Za-z]/g, "");

export function loader({ request, headers }: RouteContext) {
	AssertETagStale(request, headers, commit, { public: true, revalidate: 15*TIME_SCALE.minute/TIME_SCALE.second });

	return shell(<Container>
		<h2>Getting Started</h2>
		<LazyLoad href="/getting-started">
			<GettingStarted progress={-1} />
		</LazyLoad>

		<h2>Quick Links</h2>
		<div style={{ display: "flex", gap: "10px" }}>
			<Link href="/search">
				<button type="button" className="secondary">Search</button>
			</Link>
			<Link href="/rank">
				<button type="button" className="secondary">Rank</button>
			</Link>
		</div>
	</Container>, {});
}