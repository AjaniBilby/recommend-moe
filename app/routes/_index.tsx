import { Container } from "~/component/container.tsx";
import { Link } from "~/component/link.tsx";

import { shell } from "./$.tsx";

export function loader() {
	return shell(<div>
		<Container>
			<h2>Quick Links</h2>
			<div style={{ display: "flex", gap: "10px" }}>
				<Link href="/search?q=gundam">
					<button type="button" className="secondary">Search</button>
				</Link>
				<Link href="/rank">
					<button type="button" className="secondary">Rank</button>
				</Link>
			</div>
		</Container>
	</div>, {});
}