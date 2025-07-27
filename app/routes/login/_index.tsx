import { Dialog } from "~/component/dialog.tsx";

export function loader() {
	return <Dialog>
		<h2 style={{ marginTop: "-10px", marginBottom: "20px", textAlign: "center" }}>Login</h2>

		<a href="/login/mal">
			<button type="button">MyAnimeList</button>
		</a>
	</Dialog>;
}