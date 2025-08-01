import { LazyLoad, Link } from "~/component/link.tsx";
import { Container } from "~/component/container.tsx";

import { GettingStarted } from "./getting-started.tsx";
import { shell } from "./$.tsx";

export function loader() {
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