import { CSSProperties } from "react";
import { Style } from "htmx-router/css";

import { SegmentArray } from "~/util/array.ts";

const tabs = new Style("tabs", `
.this {
	display: flex;
	align-items: stretch;
	margin-top: .5em;
	flex-wrap: wrap;
	gap: .5em 0;
}

.this a {
	display: flex;
	align-items: center;

	color: hsl(var(--muted-foreground));

	border-radius: calc(var(--radius) - 4px) calc(var(--radius) - 4px) 0 0;
	padding: .375em .75em;
	text-decoration: none;
	user-select: none;

	transition-property: background-color color;
	transition-duration: .2s;
}

.this a[data-selected] {
	background-color: hsl(var(--background));
	color: hsl(var(--foreground));
}
`);

type Option = {
	name: string,
	href: string
};
export function Tabs(props: {
	options: Array<Option | "gap" | null>
	bottomed?: boolean
	style?: CSSProperties
}) {
	const options = props.options.filter(x => x !== null);

	const source = "{let matching = null;\n"
		+ "for (const node of document.currentScript.parentElement.querySelectorAll('a')){\n"
		+ 'const href = node.getAttribute("href");\n'
		+ 'if (!location.pathname.startsWith(href)) continue;\n'
		+ 'if (matching) {\n'
		+ 'const prev = matching.getAttribute("href");\n'
		+ 'if (prev.length > href.length) continue;\n'
		+ '}\n'
		+ 'matching = node;\n'
		+ "}\n"
		+ 'if (matching) matching.setAttribute("data-selected", "true");}';

	const chunks: Option[][] = SegmentArray(options, "gap");
	const skipLine = chunks.length > 1 ? chunks.length-1 : -1;

	return <div
		className={tabs.name}
		style={props.style}
		hx-target="body" hx-swap="innerHTML"
	>
		{chunks.map((options, x) =>
			<TabsChunk
				key={x}
				options={options}
				bottomed={props.bottomed}
				tail={props.bottomed ? x != skipLine : false}
			/>
		)}
		<script dangerouslySetInnerHTML={{ __html: source }}></script>
	</div>
}

function TabsChunk(props: {
	options:  Option[],
	bottomed?: boolean
	tail: boolean
}) {
	return <div style={{ display: "flex", flexGrow: props.tail ? 1 : undefined }}>
		<div style={{
			display: "flex",

			backgroundColor: "hsl(var(--muted))",

			borderRadius: props.bottomed
				? "var(--radius) var(--radius) 0 0"
				: "var(--radius)",

			padding: props.bottomed ? "4px 4px 0 4px" : "4px"
		}}>
			{props.options.map((opt, i) =>
				<a
					key={i}
					href={opt.href}
					hx-replace-url="true"
				>{opt.name}</a>
			)}
		</div>
		{ props.tail && <hr style={{
			margin: "auto 0 0 0",
			height: "2px",
			minWidth: "5px",
			flexGrow: 1,
			backgroundColor: "hsl(var(--muted))"
		}}></hr> }
	</div>
}