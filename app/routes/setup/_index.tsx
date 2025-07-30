import { RouteContext } from "htmx-router";

import { Open } from "~/component/link.tsx";
import { Container } from "~/component/container.tsx";

import { shell } from "../$.tsx";

export function loader({ request }: RouteContext) {
	return shell(<Container>
		<h2>Media</h2>
		<Open href="/media/reindex">
			<button type="button">Reindex</button>
		</Open>
	</Container>, {});
}