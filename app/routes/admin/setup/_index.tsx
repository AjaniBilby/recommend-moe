import { CSSProperties } from "react";

import { Container } from "~/component/container.tsx";

import { shell } from "../../$.tsx";

export function loader() {
	return shell(<Container>
		<h2>Media</h2>
		<form style={gridStyle} hx-post="/admin/setup/media" hx-trigger="submit"
			hx-encoding="multipart/form-data"
			hx-target="#setup-media" hx-swap="innerHTML"
			hx-ext="hx-stream" hx-stream="on"
		>
			<button type="submit" className="secondary">Import</button>
			<div id="setup-media">
			</div>
		</form>

		<h2>Users</h2>
		<form style={gridStyle} hx-post="/admin/setup/user" hx-trigger="submit"
			hx-encoding="multipart/form-data"
			hx-target="#setup-user" hx-swap="innerHTML"
			hx-ext="hx-stream" hx-stream="on"
		>
			<button type="submit" className="secondary">Import</button>
			<div id="setup-user">
				<input type="file" name="file"></input>
			</div>
		</form>

		<h2>Scores</h2>
		<div style={gridStyle}>
			<button type="button" className="secondary"
				hx-post="/admin/setup/score"
				hx-ext="hx-stream"
				hx-swap="innerHTML"
				hx-stream="on"
				hx-target="#setup-score"
			>Import</button>
			<div id="setup-score"></div>
		</div>
	</Container>, { search: { value: "!admin"}});
}

const gridStyle: CSSProperties = {
	display: "grid",
	gridTemplateColumns: "auto 1fr",
	gap: "10px",
	alignItems: "center"
};