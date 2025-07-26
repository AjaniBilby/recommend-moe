import { RouteContext } from "htmx-router";

export function loader({ cookie }: RouteContext) {
	return <div>
		<a href="/login/mal" target="_blank">
			<button type="button">Login</button>
		</a>
	</div>;
}