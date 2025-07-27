import { ApplyMetaDefaults } from "htmx-router/shell";
import { ReactNode } from "react";
import { Style } from "htmx-router/css";

import { Container } from "~/component/container.tsx";
import { Tabs } from "~/component/input/tabs.tsx";

import { shell as inherit } from "../$.tsx";

type Options = Parameters<typeof inherit>[1] & { nav?: ReactNode };
export function shell(inner: JSX.Element, options: Options) {
	ApplyMetaDefaults(options, { title: "Rank" });

	return inherit(<>
		<Container style={{
			display: "flex", alignItems: "center",
		}}>
			<Tabs options={[
				{ name: "Score", href: "/rank/score" },
				{ name: "Popularity", href: "/rank/popular" },
				{ name: "Novelty", href: "/rank/novel" }
			]} />
			<div style={{ flexGrow: 1 }}></div>
			{options.nav}
		</Container>
		{inner}
	</>, options)
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