import { CSSProperties, ReactNode } from "react";
import { CSSProperties, ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { RouteContext } from "htmx-router";
import { faXmark } from "@fortawesome/free-solid-svg-icons";


export function ErrorDialog(props: {
	children: React.ReactNode,
	style?: CSSProperties
}) {
	return <div className="card" style={{
		whiteSpace: "pre-wrap",
		padding: "1rem",
		color: "hsl(var(--destructive))",
		...props.style
	}}>{props.children}</div>;
}

export function Dialog(props: { children: ReactNode, revalidate?: boolean, style?: CSSProperties } & JSX.IntrinsicElements["div"]) {
	const { revalidate, children, style, ...rest } = props;

	const action = revalidate ? "/revalidate" : "/empty";
	return <div className="dp-group" style={{
		display: "flex",
		alignItems: "center",
		justifyContent: "center",

		backgroundColor: "var(--backdrop)",
		position: "fixed",
		inset: "0",

		fontSize: "1rem",

		zIndex: "10",
	}}
		hx-target="this" {...rest} hx-get={action} hx-swap="outerHTML"
		hx-trigger="keyup[key=='Escape'] from:body"
	>
		<div style={{
			position: "relative",
			backgroundColor: "hsl(var(--popover))",
			borderRadius: "var(--radius)",
			color: "hsl(var(--popover-foreground))",

			overflowY: "auto",
			maxHeight: "90vh",

			maxWidth: "90vw",
			padding: "1.5rem",
			...style
		}}>
			<FontAwesomeIcon
				style={{
					position: "absolute",
					top: "1em",
					right: "1em",

					cursor: "pointer",

					color: "hsl(var(--muted-foreground))",
					height: "18px",
				}}
				icon={faXmark}
				hx-get={action}
				hx-trigger="click"
			/>
			{children}
		</div>
	</div>
}