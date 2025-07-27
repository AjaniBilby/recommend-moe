import { // @ts-types="react"
CSSProperties, ReactNode } from "react";

export function Container(props: { style?: CSSProperties, children: ReactNode }) {
	return <div style={{ display: "flex", justifyContent: "center" }}>
		<div style={{ maxWidth: "var(--max-width)", width: "100%", ...props.style }}>{props.children}</div>
	</div>
}