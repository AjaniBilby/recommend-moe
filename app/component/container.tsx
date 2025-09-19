import { CSSProperties, ReactNode } from "react";

export function Container(props: { className?: string, style?: CSSProperties, children: ReactNode }) {
	return <div style={{ display: "flex", justifyContent: "center" }}>
		<div className={props.className} style={{ maxWidth: "var(--max-width)", width: "100%", ...props.style }}>{props.children}</div>
	</div>
}