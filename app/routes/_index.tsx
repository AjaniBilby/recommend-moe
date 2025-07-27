import { Container } from "~/component/container.tsx";
import { Link, Open } from "~/component/link.tsx";

import { shell } from "./$.tsx";

export function loader() {
	return shell(<div>
		<Container>
			<h2>Quick Links</h2>
			<div style={{ display: "flex", gap: "10px" }}>
				<Link href="/search?q=search">
					<button type="button" className="secondary">Search</button>
				</Link>
				<Link href="/rank">
					<button type="button" className="secondary">Rank</button>
				</Link>
			</div>

			<h2>Authenticate</h2>
			<Open href="/login"><button type="button">Login</button></Open>
		</Container>
	</div>, {});
}