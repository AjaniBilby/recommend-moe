import { ApplyMetaDefaults, ShellOptions } from "htmx-router/shell";
import { Style } from "htmx-router/css";

import { Link } from "~/component/link.tsx";

import { shell as inherit } from "../$.tsx";


export function shell(inner: JSX.Element, options: Parameters<typeof inherit>[1]) {
	ApplyMetaDefaults(options, { title: "Rank" });

	options.nav ||= <>
		<Link href="/rank/score">
			<button type="button" className="secondary">Score</button>
		</Link>
		<Link href="/rank/popular">
			<button type="button" className="secondary">Popularity</button>
		</Link>
		<Link href="/rank/novel">
			<button type="button" className="secondary">Novelty</button>
		</Link>
	</>

	return inherit(inner, options)
}


export const rankGrid = new Style("rank-grid", `
.this {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
	gap: 10px;
}

.this .rank, .this .tally {
	position: absolute;
	padding: calc(var(--radius) / 2);
}

.this .rank {
	top: 0; left: 0;
	border-radius: 0 0 var(--radius) 0;
}

.this .tally {
	bottom: 0; left: 0;
	border-radius: 0 var(--radius) 0 0;
}`).name;