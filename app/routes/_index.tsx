import { Style } from "htmx-router/css";

import { shell } from "./$.tsx";
import { Link } from "../component/link.tsx";

export function loader() {
	return shell(<div>
		<div style={{ display: "flex", gap: "10px", marginBlock: "1em" }}>
			<Link href="/search">
				<button type="button" className="secondary">Search</button>
			</Link>
			<Link href="/rank">
				<button type="button" className="secondary">Rank</button>
			</Link>
		</div>
	</div>, {});
}