import { CSSProperties } from "react";

import { Container } from "~/component/container.tsx";

import { shell } from "../$.tsx";

export function loader() {
	return shell(<Container>
		<h2>Media</h2>
		<div style={gridStyle}>
			<button type="button" className="secondary"
				hx-put="/media/reindex"
				hx-ext="hx-stream"
				hx-swap="innerHTML"
				hx-stream="on"
				hx-target="#media-reindex"
			>Re-Index</button>
			<div id="media-reindex"></div>
		</div>

		<h2>Similarity</h2>
		<div style={gridStyle}>
			<button type="button" className="secondary"
				hx-put="/admin/similar/connect"
				hx-ext="hx-stream"
				hx-swap="innerHTML"
				hx-stream="on"
				hx-target="#similar-connect"
			>Connect</button>
			<div id="similar-connect"></div>

			<button type="button" className="secondary"
				hx-put="/admin/similar/process"
				hx-ext="hx-stream"
				hx-swap="innerHTML"
				hx-stream="on"
				hx-target="#similar-process"
			>Process</button>
			<div id="similar-process"></div>
		</div>

		<h2>Novelty</h2>
		<div style={gridStyle}>
			<button type="button" className="secondary"
				hx-put="/admin/novelty/init"
				hx-ext="hx-stream"
				hx-swap="innerHTML"
				hx-stream="on"
				hx-target="#novelty-init"
			>Setup</button>
			<div id="novelty-init"></div>

			<button type="button" className="secondary"
				hx-put="/admin/novelty/process"
				hx-ext="hx-stream"
				hx-swap="innerHTML"
				hx-stream="on"
				hx-target="#novelty-process"
			>Process</button>
			<div id="novelty-process"></div>

			<button type="button" className="secondary"
				hx-put="/admin/novelty/commit"
			>Commit</button>
		</div>
	</Container>, { search: { value: "!admin"}});
}

const gridStyle: CSSProperties = {
	display: "grid",
	gridTemplateColumns: "auto 1fr",
	gap: "10px",
	alignItems: "center"
};